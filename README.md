# Mesh Console

Public status UI for the Nebula mesh (GitHub Pages) + optional local
Docker backend for advanced features. **No secrets live in this repo** —
not in code, config, or history. Reads come from world-readable or
user-scoped sources; writes ride memory-only credentials or
node-initiated polling.

- Live site: https://swipswaps.github.io/mesh-console/
- User guide (with screenshots): `docs/user-guide.md`
- API contract: `docs/api-contract.md`
- Local backend: `docker compose up -d` → http://127.0.0.1:5180/health
  (loopback-only by default; bearer-gated `/api/actions` via
  `MESH_CONSOLE_TOKEN`, unset = 401 fail-closed)

## Security model (enforced)

- Reads (`/health`, `/api/*` except actions) expose operational state
  only: recover tail, bench rows, cert parse status, file
  names+modes+mtimes+hashes. A value-shaped string in any response is
  a bug — assert its absence before every release.
- The container mounts host paths **read-only, public data only**:
  mesh state dir + host SSH *certificate*. `api.env`, private keys,
  and CA keys are never mounted, never read, never returned —
  host-audited instead (session log), by design.
- `/api/actions` requires `Authorization: Bearer $MESH_CONSOLE_TOKEN`;
  no token configured ⇒ 401 on every call. Token travels via `env_file`
  (0600, gitignored), never CLI/env-visible, never in this repo.
- Frontend: no token storage (memory only), no secret rendering;
  SecurityPanel shows names+modes, never values.
