# Mesh console API contract (fixture stage — Phase 0)

Base (local backend): `http://<host>:5180`. All responses JSON.
Status model mirrors the three read paths (mirror / registry / local);
each source reports `state: live | stale | offline` — the UI renders
honestly from these, never inventing data.

- `GET /health` → `{"ok": true, "service": "mesh-console-backend", "ts": "<utc>"}`
- `GET /api/status` → `{"nodes": [{"name": "...", "lan": "...", "overlay": "...", "updated_utc": "..."}], "sources": {"mirror": "offline", "registry": "offline", "local": "live"}}`
- `GET /api/recover-log?lines=N` → `{"lines": ["..."]}` (tail of mesh recover log; fixture text at Phase 0)
- `GET /api/bench` → `{"runs": [{"ts": "...", "probes": [{"plane": "overlay", "rtt_ms": 0.0}]}]}` (fixture shape of bench.jsonl)
- `GET /api/actions` → `{"actions": []}` (empty until Phase 3; allow-list only, bearer-gated then)
