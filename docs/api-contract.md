# Mesh console API contract (fixture stage — Phase 0)

Base (local backend): `http://<host>:5180`. All responses JSON.
Status model mirrors the three read paths (mirror / registry / local);
each source reports `state: live | stale | offline` — the UI renders
honestly from these, never inventing data.

- `GET /health` → `{"ok": true, "service": "mesh-console-backend", "ts": "<utc>"}`
- `GET /api/status` → `{"nodes": [{"name": "...", "lan": "...", "overlay": "...", "updated_utc": "..."}], "sources": {"mirror": "offline", "registry": "offline", "local": "live"}}`
- `GET /api/recover-log?lines=N` → `{"lines": ["..."]}` (tail of mesh recover log; fixture text at Phase 0)
- `GET /api/bench` → `{"runs": [{"ts": "...", "probes": [{"plane": "overlay", "rtt_ms": 0.0}]}]}` (last 10 rows of `bench.jsonl`; fixture shape when absent)
- `GET /api/actions` → `{"actions": []}` (REQUIRES `Authorization: Bearer $MESH_CONSOLE_TOKEN`; 401 without token configured or on mismatch)
- `GET /api/security/fingerprints` → host SSH cert parse status + SHA-256/mode/mtime of inventoried paths (metadata only — values never leave the host)
- `GET /api/security/secrets-inventory` → per-path `{path, mode, mtime_utc}` or `{present: false}` (names only — the S0 inventory, machine-readable)
