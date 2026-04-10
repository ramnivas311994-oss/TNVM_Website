# Security rules — read before any auth/form/API work

## Must-do on every feature

### Forms
- Validate on SERVER with Zod — never trust client input
- Sanitise all string inputs (trim, max length)
- Rate-limit /register and /contact (max 5 req/min per IP)

### Auth
- Never store passwords — Supabase handles this
- Always check session server-side in Server Components
- Admin check: if (profile.role !== 'admin') redirect('/') 

### API routes
- Verify stripe-signature header on /api/stripe/webhook
- Never expose secret keys — use process.env.VARIABLE_NAME
- Return generic errors to client — log details server-side only

### Database
- RLS must be ON for every table — verify in Supabase dashboard
- Use Supabase client (parameterised) — never raw SQL strings
- Admin-only tables: donations, contact_messages, notifications

### File uploads
- Validate MIME type: allow only image/jpeg, image/png, image/webp
- Max file size: 5 MB — reject before uploading to Cloudinary
- Generate a UUID filename — never use the original filename

### Environment variables (required in .env.local)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       ← server only, never NEXT_PUBLIC_
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=              ← server only
CLOUDINARY_API_SECRET=           ← server only
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=               ← server only
STRIPE_WEBHOOK_SECRET=           ← server only
ONESIGNAL_APP_ID=
ONESIGNAL_REST_API_KEY=          ← server only
