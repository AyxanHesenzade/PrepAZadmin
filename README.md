# PrepAZ Admin

React (Vite) panel for the PrepAZ questions: list, filter, edit, activate, add, upload images.
Talks to Supabase with the signed-in admin's own session; Row Level Security (`is_admin()`, migration 005) decides what is allowed.

## Run
```
npm install
copy .env.example .env.local     # fill VITE_SUPABASE_URL and VITE_SUPABASE_KEY (public publishable key only)
npm run dev                      # http://localhost:5173
npm test                         # vitest
npm run lint
```

## Rules
- Never put the `service_role` key here. Only the public URL and publishable key.
- Admins are rows in the `admins` table, added by hand in the Supabase SQL Editor.
- The Users tab needs `supabase/admin_list_users.sql`, run once in the Supabase SQL Editor.
- Questions are never deleted: set them passive (`is_active = false`).
- New questions start passive. Code is `KIM-0001`-style (first 3 letters of the subject slug).
- Texts live in `src/lib/strings.js`, database calls in `src/lib/questions.js`.
