# XYZ Supermarket Project Guidelines

## Code Style
- Keep components focused and split large files by feature concern.
- Prefer TypeScript-safe changes and avoid `any` unless unavoidable.
- Preserve existing app architecture in `src/app`, `src/features`, `src/domain`, `src/services`, and `src/shared`.

## UI and UX
- Prioritize legible operational dashboards for cashiers, inventory staff, and managers.
- Use clear labels and status indicators for stock, sales, and purchase order actions.
- Keep layouts responsive for common laptop and tablet widths.

## Data and Safety
- Treat Supabase writes as production-like operations and avoid destructive changes by default.
- Keep environment-variable usage consistent with `VITE_*` and `NEXT_PUBLIC_*` fallbacks.
