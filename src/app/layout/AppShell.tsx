import { Suspense } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { Button } from "@/shared/ui/button";
import { Toaster } from "@/shared/ui/sonner";
import { navItems, Sidebar } from "@/features/navigation/Sidebar";
import { useStore } from "@/app/providers/store-provider";

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
      <Sidebar currentPath={location.pathname} onNavigate={navigate} />

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="md:hidden border-b border-black/5 bg-white/80 backdrop-blur-xl p-3 flex gap-2 overflow-x-auto sticky top-0 z-20">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Button
                key={item.key}
                size="sm"
                variant={active ? "default" : "outline"}
                onClick={() => navigate(item.path)}
                className="rounded-full"
              >
                <item.icon className="size-4 mr-1" />
                {item.label}
              </Button>
            );
          })}
        </header>

        <main className="flex-1 p-4 md:p-8">
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
