"""Mesh console backend (fixture stage). Serves docs/api-contract.md shapes."""
import datetime
from flask import Flask, jsonify, request

app = Flask(__name__)


def utcnow() -> str:
    return datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')


@app.get('/health')
def health():
    return jsonify(ok=True, service='mesh-console-backend', ts=utcnow())


@app.get('/api/status')
def status():
    return jsonify(nodes=[], sources={'mirror': 'offline', 'registry': 'offline', 'local': 'live'})


@app.get('/api/recover-log')
def recover_log():
    lines = max(1, min(int(request.args.get('lines', 20)), 200))
    return jsonify(lines=['fixture: no recover log wired (Phase 1)'][:lines])


@app.get('/api/bench')
def bench():
    return jsonify(runs=[{'ts': utcnow(), 'probes': [{'plane': 'overlay', 'rtt_ms': 0.0}]}])


@app.get('/api/actions')
def actions():
    return jsonify(actions=[])


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5180)
