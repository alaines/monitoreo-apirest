Environment files

- Do NOT commit `apps/backend/.env.local`. It contains local secrets and is ignored by the repository `.gitignore`.
- Use `apps/backend/.env.example` as a template to create your local `.env.local`.

Example:

cp apps/backend/.env.example apps/backend/.env.local
# then edit `apps/backend/.env.local` and add real credentials
