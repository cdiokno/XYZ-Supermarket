
# XYZ Supermarket

Vite + React supermarket dashboard backed by Supabase.

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

`.env.local` is configured for the `XYZ Supermarket` Supabase project. Use `.env.example` as the template for other environments.

## Supabase

The backend schema is in `supabase/migrations/20260507033636_init_xyz_supermarket_backend.sql`.

It creates:

- `products`
- `cashiers`
- `sales`
- `sale_items`
- `purchase_orders`
- `product-images` storage bucket
- RPC functions for checkout and receiving purchase orders

The current case-study app does not include user authentication, so write policies are intentionally open for the public Vite client. Add Supabase Auth and role-based RLS before using this with real store data.

## Vercel

`vercel.json` is configured for a Vite SPA build:

```bash
npm run build
```

Set the same Supabase env vars in Vercel Project Settings for Production, Preview, and Development.
