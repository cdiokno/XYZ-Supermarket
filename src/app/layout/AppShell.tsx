import { Suspense } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router";
import { Button } from "@/shared/ui/button";
import { Toaster } from "@/shared/ui/sonner";
import { getNavItems, Sidebar } from "@/features/navigation/Sidebar";
import { useStore } from "@/app/providers/store-provider";
import { useAuth } from "@/app/providers/auth-provider";

function RouteFallback() {
  return (
    <div className="rounded-3xl bg-white border border-black/5 shadow-sm px-6 py-5 text-center">
      <p className="tracking-tight">Loading feature...</p>
    </div>
  );
}

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, syncing, loadError, hasSupabaseConfig } = useStore();
  const { currentUser, loading: authLoading } = useAuth();
  const isSettingsRoute = location.pathname === "/settings" || location.pathname.startsWith("/settings/");
  const navItems = getNavItems(true);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f2f2f7] grid place-items-center p-6">
        <div className="rounded-3xl bg-white border border-black/5 shadow-sm px-6 py-5 text-center">
          <p className="tracking-tight">Loading account data...</p>
          <p className="text-muted-foreground mt-1">Connecting to Supabase</p>
        </div>
        <Toaster position="top-right" />
      </div>
    );
  }

  if (!currentUser && isSettingsRoute) {
    return (
      <div className="min-h-screen bg-[#f2f2f7]">
        <main className="p-4 sm:p-8">
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </main>
        <Toaster position="top-right" />
      </div>
    );
  }

  if (!currentUser && !isSettingsRoute) {
    return <Navigate to="/settings" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f2f2f7] grid place-items-center p-6">
        <div className="rounded-3xl bg-white border border-black/5 shadow-sm px-6 py-5 text-center">
          <p className="tracking-tight">Loading supermarket data...</p>
          <p className="text-muted-foreground mt-1">Connecting to Supabase</p>
        </div>
        <Toaster position="top-right" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f2f7] flex">
      <Sidebar currentPath={location.pathname} onNavigate={navigate} navItems={navItems} />

      <div className="flex-1 min-w-0 flex flex-col">
        <main className="flex-1 p-4 pb-28 md:p-8 md:pb-8">
          {loadError && (
            <div className="mb-4 rounded-2xl border border-[#ff3b30]/20 bg-[#ff3b30]/10 px-4 py-3 text-[#9f1d17]">
              {loadError}
            </div>
          )}
          {!hasSupabaseConfig && (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
              Supabase env vars are missing, so the app is running in local in-memory mode (seeded on startup).
            </div>
          )}
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </main>

        <nav className="md:hidden fixed left-1/2 -translate-x-1/2 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-30 w-[calc(100%-1.5rem)] max-w-md rounded-full border border-black/10 bg-white/90 backdrop-blur-2xl shadow-[0_12px_30px_rgba(0,0,0,0.12)] px-2 py-1.5">
          <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}>
            {navItems.map((item) => {
              const active = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
              return (
                <Button
                  key={item.key}
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={item.label}
                  title={item.label}
                  onClick={() => navigate(item.path)}
                  className={`mx-auto h-10 w-10 rounded-full ${
                    active ? "bg-[#007AFF] text-white hover:bg-[#0051D5]" : "text-[#1a1a1a] hover:bg-black/5"
                  }`}
                >
                  <item.icon className="size-5" />
                </Button>
              );
            })}
          </div>
        </nav>
      </div>

      {syncing && (
        <div className="fixed bottom-4 right-4 rounded-full bg-white border border-black/5 shadow-sm px-4 py-2 text-muted-foreground">
          Syncing...
        </div>
      )}
      <Toaster position="top-right" />
    </div>
  );
}
