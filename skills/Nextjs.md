# Next.js 14 conventions for TNVM

## App Router rules
- Server Components by default (no 'use client' unless needed)
- Add 'use client' only for: useState, useEffect, onClick, forms
- Use loading.tsx for every page that fetches data
- Use error.tsx for every route group

## Page template (Server Component)
export default async function EventsPage() {
  const events = await getEvents()  // fetch in server component
  return <EventList events={events} />
}

## Form pattern (with Zod + Server Action)
'use server'
import { z } from 'zod'
const schema = z.object({ name: z.string().min(2).max(100) })
export async function submitForm(formData: FormData) {
  const result = schema.safeParse(Object.fromEntries(formData))
  if (!result.success) return { error: result.error.flatten() }
  // save to Supabase...
}

## i18n pattern
// Use useTranslations in client, getTranslations in server
import { useTranslations } from 'next-intl'
const t = useTranslations('home')
// messages/en.json: { "home": { "welcome": "Welcome to TNVM" } }
// messages/ta.json: { "home": { "welcome": "TNVM-க்கு வரவேற்கிறோம்" } }

## Tailwind mobile-first
// Always write mobile first:
className="text-sm md:text-base lg:text-lg"
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

## Component naming
- UI primitives → /components/ui/Button.tsx
- Page sections → /components/[page]/HeroSection.tsx
- Admin widgets → /components/admin/MemberTable.tsx