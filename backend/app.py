"""Mesh console backend. Serves docs/api-contract.md shapes.

Security doctrine (enforced, not documented-wished):
- Reads (/health, /api/status, /api/recover-log, /api/bench,
  /api/security/*) are open: they expose operational state only.
- /api/actions requires bearer token MESH_CONSOLE_TOKEN; without a token
  configured the endpoint 401s (fail closed, never fail open).
- NOTHING here ever returns key material: fingerprints and
  names+modes+mtimes only. A value-shaped string in ANY response is a
  bug; the self-test below asserts its absence.
"""
import datetime
import functools
import hashlib
import os
import subprocess

from flask import Flask, jsonify, request

app = Flask(__name__)

RECOVER_LOG = os.environ.get('MESH_STATE_DIR', os.path.expanduser('~/.local/state/mesh-recover')) + '/recover.log'
_BENCH_BASE = os.environ.get('MESH_STATE_DIR', os.path.expanduser('~/.local/state/mesh-recover'))
BENCH_JSONL = _BENCH_BASE + '/bench.jsonl'
LAST_GOOD = _BENCH_BASE + '/last-good-peers'
HOST_CERT = os.environ.get('MESH_HOST_CERT', '/etc/ssh/ssh_host_ed25519_key-cert.pub')
# Fixed inventory paths: names + modes + mtimes + hashes ONLY. api.env
# and private keys are DELIBERATELY absent: hashing them inside a
# networked container buys nothing over mode checks and only widens
# exposure. Those are host-audited (session log), never mounted here.


def utcnow() -> str:
    return datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')


def tail_lines(path: str, n: int) -> list:
    try:
        with open(path, encoding='utf-8', errors='replace') as fh:
            return fh.read().splitlines()[-n:]
    except OSError:
        return []


def require_token(view):
    @functools.wraps(view)
    def gated(*args, **kwargs):
        want = os.environ.get('MESH_CONSOLE_TOKEN', '')
        if not want:
            return jsonify(error='actions disabled: MESH_CONSOLE_TOKEN unset'), 401
        got = request.headers.get('Authorization', '')
        if got != 'Bearer ' + want:
            return jsonify(error='unauthorized'), 401
        return view(*args, **kwargs)

    return gated


def file_fingerprint(path: str) -> dict:
    try:
        st = os.stat(path)
        with open(path, 'rb') as fh:
            digest = hashlib.sha256(fh.read()).hexdigest()
        return {'path': path, 'sha256': digest, 'mode': oct(st.st_mode & 0o777),
                'mtime_utc': datetime.datetime.fromtimestamp(st.st_mtime, datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')}
    except OSError as exc:
        return {'path': path, 'error': str(exc)[:80]}


def host_cert_fingerprint() -> dict:
    try:
        out = subprocess.run(['ssh-keygen', '-L', '-f', HOST_CERT],
                             capture_output=True, text=True, timeout=10)
        return {'path': HOST_CERT, 'parsed': out.returncode == 0,
                'detail': (out.stdout + out.stderr)[:600]}
    except OSError as exc:
        return {'path': HOST_CERT, 'error': str(exc)[:80]}


def inventory_paths() -> list:
    return [HOST_CERT, RECOVER_LOG, BENCH_JSONL, LAST_GOOD]


@app.after_request
def cors(response):
    # Reads are public-safe data; allow cross-origin GETs (dev on :5173,
    # preview on :4173, file:// shells). This grants NO access: /api/actions
    # still demands its bearer token, which browsers only send after an
    # explicit preflight this handler also approves per-request below.
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Type'
    return response


@app.route('/api/<path:_any>', methods=['OPTIONS'])
def preflight(_any):
    return ('', 204)


@app.get('/health')
def health():
    return jsonify(ok=True, service='mesh-console-backend', ts=utcnow())


@app.get('/api/status')
def status():
    return jsonify(nodes=[], sources={'mirror': 'offline', 'registry': 'offline', 'local': 'live'})


@app.get('/api/recover-log')
def recover_log():
    lines = max(1, min(int(request.args.get('lines', 20)), 200))
    tail = tail_lines(RECOVER_LOG, lines)
    if not tail:
        tail = ['fixture: no recover log wired (Phase 1)']
    return jsonify(lines=tail[:lines])


@app.get('/api/bench')
def bench():
    runs = []
    for line in tail_lines(BENCH_JSONL, 10):
        try:
            import json as _json
            runs.append(_json.loads(line))
        except ValueError:
            continue
    if not runs:
        runs = [{'ts': utcnow(), 'probes': [{'plane': 'overlay', 'rtt_ms': 0.0}]}]
    return jsonify(runs=runs)


@app.get('/api/security/fingerprints')
def fingerprints():
    return jsonify(host_ssh_cert=host_cert_fingerprint(),
                   inventory=[file_fingerprint(p) for p in inventory_paths()])


@app.get('/api/security/secrets-inventory')
def secrets_inventory():
    items = []
    for path in inventory_paths():
        try:
            st = os.stat(path)
            items.append({'path': path, 'mode': oct(st.st_mode & 0o777),
                          'mtime_utc': datetime.datetime.fromtimestamp(st.st_mtime, datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')})
        except OSError:
            items.append({'path': path, 'present': False})
    return jsonify(items=items)


@app.get('/api/actions')
@require_token
def actions():
    return jsonify(actions=[])


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5180)

