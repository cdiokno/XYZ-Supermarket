
# XYZ Supermarket

Vite + React supermarket dashboard backed by Supabase.

## Architecture

The app is organized by concern:

- `src/app`: app shell, router, and providers
- `src/features`: route-level feature modules
- `src/domain`: business types, seed data, and format helpers
- `src/services`: Supabase client and data access layer
- `src/shared`: reusable UI primitives and shared components

Route-level code splitting is enabled through lazy-loaded feature routes:

- `/dashboard`
- `/pos`
- `/inventory`
- `/purchase-orders`
- `/history`
- `/reports`

## Local Development

```bash
npm install
npm run dev
```

The app reads Supabase config from:

```bash
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

The app also accepts:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## Supabase

The backend schema is versioned in `supabase/migrations`.

It creates:

- `products`
- `cashiers`
- `sales`
- `sale_items`
- `purchase_orders`
- private cashier/admin account records exposed through Supabase RPCs
- `product-images` storage bucket
- RPC functions for login, cashier account creation, checkout, deletes, PO receive, and undo receive

The current case-study app uses Supabase RPCs for demo account login and cashier account persistence. Store-data write policies are intentionally open for the public Vite client. Add Supabase Auth and role-based RLS before using this with real store data.

## Vercel

`vercel.json` is configured for a Vite SPA build:

```bash
npm run build
```

Set the same Supabase env vars in Vercel Project Settings for Production, Preview, and Development.
