# Repository Guidelines

## Project Structure & Module Organization
Backend services live in `backend/`, a Flask API split into `app/agents`, `app/models`, `app/routes`, `app/services`, and `app/utils`. Tests sit in `app/tests/`; migrations and helper scripts live in `migrations/` and `scripts/`. The React client lives in `frontend/` with feature code in `src/` and static assets in `public/`. Deployment assets stay in `deploy/`, `render.yaml`, and `build-for-deployment.sh`, while snapshots sit in `database_backups/` and design docs in `docs/` and `spec/`.

## Build, Test, and Development Commands
- `cd backend && flask run` (or `python app.py`) boots the API once `FLASK_APP=app.py` and env vars are exported.
- `cd backend && flask db migrate -m "brief message" && flask db upgrade` manages schema changes.
- `cd backend && pytest` executes the suite with coverage defined in `pytest.ini`.
- `cd frontend && npm start` serves the SPA; `npm run build` emits the production bundle.
- `./build-for-deployment.sh` drives Render deployments; run it after tests and migrations pass.

## Coding Style & Naming Conventions
Format Python with Black (`black app/`) and lint using Flake8 (`flake8 app/`); keep modules and functions snake_case, SQLAlchemy models PascalCase, and constants uppercase. React components stay in PascalCase under `src/components`, hooks remain camelCase in `src/hooks`, and shared utilities belong in `src/utils`. Prefer Tailwind utility classes to custom CSS and avoid committing generated artifacts.

## Testing Guidelines
Pytest discovers `test_*.py` files, `Test*` classes, and `test_*` functions; markers `unit`, `integration`, and `api` exist for scope control. Review the `htmlcov/` report produced by `pytest` to keep coverage visible. Frontend tests rely on React Testing Library via `npm test`; colocate specs as `*.test.tsx` next to the component they verify.

## Commit & Pull Request Guidelines
History follows Conventional Commits (e.g., `fix(deployment): guard migration conflicts`); use the `<type>(<scope>): <summary>` pattern and group related changes. Include updated tests, migrations, or seed scripts whenever behavior shifts. Pull requests should describe intent, call out major changes, link related issues, and attach screenshots or API samples for UI or contract updates.

## Environment & Secrets
Start from `backend/.env.example`, supplying `SECRET_KEY`, `JWT_SECRET_KEY`, and a Postgres `DATABASE_URL`; never commit the filled file. Refresh items in `database_backups/` responsibly and scrub sensitive data before sharing. Document new agent or integration settings in `backend/docs/` while storing secrets in a managed vault.
