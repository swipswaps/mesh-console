# Mesh Console

Public status UI for the Nebula mesh (GitHub Pages) + optional local
Docker backend for advanced features. **No secrets live in this repo** —
not in code, config, or history. Reads come from world-readable or
user-scoped sources; writes ride memory-only credentials or
node-initiated polling.

- Live site: https://swipswaps.github.io/mesh-console/
- API contract: `docs/api-contract.md`
- Local backend: `docker compose up -d` → http://127.0.0.1:5180/health
