import { Toaster } from "@/shared/ui/sonner";
import { Skeleton } from "@/shared/ui/skeleton";

const navSkeletonItems = Array.from({ length: 7 });
const metricSkeletonItems = Array.from({ length: 6 });
const listSkeletonItems = Array.from({ length: 5 });
const compactListSkeletonItems = Array.from({ length: 4 });
const chartBarSkeletonItems = [64, 42, 78, 52, 88, 66, 74];

function SidebarSkeleton() {
  return (
    <div className="hidden h-screen shrink-0 p-3 md:block" style={{ width: 280 }} aria-hidden="true">
      <aside className="flex h-full flex-col overflow-hidden rounded-[28px] border border-black/5 bg-white/70 backdrop-blur-2xl">
        <div className="flex items-center gap-3 px-5 pb-4 pt-5">
          <Skeleton className="size-11 shrink-0 rounded-2xl" />
          <Skeleton className="h-5 w-36 rounded-full" />
        </div>

        <nav className="mt-2 flex-1 space-y-2 px-3">
          {navSkeletonItems.map((_, index) => (
            <div key={index} className="flex h-11 items-center gap-3 rounded-full px-5">
              <Skeleton className="size-5 shrink-0 rounded-full" />
              <Skeleton className="h-4 w-28 rounded-full" />
            </div>
          ))}
        </nav>
      </aside>
    </div>
  );
}

function MobileHeaderSkeleton() {
  return (
    <div className="mb-5 flex items-center gap-3 md:hidden" aria-hidden="true">
      <Skeleton className="size-11 rounded-2xl" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-5 w-40 rounded-full" />
        <Skeleton className="h-3 w-28 rounded-full" />
      </div>
    </div>
  );
}

function MobileNavSkeleton() {
  return (
    <nav className="fixed bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] left-1/2 z-30 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 rounded-full border border-black/10 bg-white/90 px-2 py-1.5 backdrop-blur-2xl md:hidden" aria-hidden="true">
      <div className="grid grid-cols-7 gap-0.5">
        {navSkeletonItems.map((_, index) => (
          <div key={index} className="grid h-10 place-items-center">
            <Skeleton className="size-7 rounded-full" />
          </div>
        ))}
      </div>
    </nav>
  );
}

function CardShell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-black/5 bg-white p-4 ${className}`}>
      {children}
    </div>
  );
}

export function LoginPageSkeleton() {
  return (
    <div className="flex min-h-[calc(100dvh-3rem)] items-center justify-center p-2 sm:p-4" aria-hidden="true">
      <div className="w-full max-w-md rounded-3xl border border-black/5 bg-white p-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-4 w-64 max-w-full rounded-full" />
        </div>

        <div className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-20 rounded-full" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-20 rounded-full" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton({ compact = false, showMobileHeader = true }: { compact?: boolean; showMobileHeader?: boolean }) {
  return (
    <div className="space-y-5" aria-hidden="true">
      {showMobileHeader && <MobileHeaderSkeleton />}

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-36 rounded-full" />
          <Skeleton className="h-4 w-52 rounded-full" />
        </div>
        <Skeleton className="h-7 w-32 shrink-0 rounded-full" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {metricSkeletonItems.map((_, index) => (
          <CardShell key={index} className="min-h-28">
            <div className="flex h-full items-center justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-3">
                <Skeleton className="h-3.5 w-24 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="size-9 shrink-0 rounded-2xl" />
            </div>
          </CardShell>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <CardShell className="xl:col-span-2">
          <Skeleton className="mb-6 h-5 w-40 rounded-full" />
          <div className="flex h-64 items-end gap-3 sm:h-72">
            {chartBarSkeletonItems.map((height, index) => (
              <div key={index} className="flex flex-1 flex-col items-center justify-end gap-3">
                <Skeleton className="w-full rounded-t-xl" style={{ height: `${height}%` }} />
                <Skeleton className="h-3 w-8 rounded-full" />
              </div>
            ))}
          </div>
        </CardShell>

        <CardShell>
          <Skeleton className="mb-5 h-5 w-44 rounded-full" />
          <div className="space-y-4">
            {listSkeletonItems.map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-7 shrink-0 rounded-full" />
                  <Skeleton className="size-11 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-4/5 rounded-full" />
                    <Skeleton className="h-3 w-3/5 rounded-full" />
                  </div>
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </CardShell>
      </div>

      {!compact && (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {compactListSkeletonItems.slice(0, 3).map((_, cardIndex) => (
              <CardShell key={cardIndex}>
                <Skeleton className="mb-5 h-5 w-40 rounded-full" />
                <div className="space-y-3">
                  {compactListSkeletonItems.map((__, rowIndex) => (
                    <div key={rowIndex} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                      <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4 rounded-full" />
                        <Skeleton className="h-3 w-1/2 rounded-full" />
                      </div>
                      <Skeleton className="h-6 w-16 shrink-0 rounded-full" />
                    </div>
                  ))}
                </div>
              </CardShell>
            ))}
          </div>

          <CardShell>
            <Skeleton className="mb-5 h-5 w-44 rounded-full" />
            <div className="space-y-3">
              {listSkeletonItems.map((_, index) => (
                <div key={index} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                  <div className="min-w-0 space-y-2">
                    <Skeleton className="h-4 w-4/5 rounded-full" />
                    <Skeleton className="h-3 w-3/5 rounded-full" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
              ))}
            </div>
          </CardShell>
        </>
      )}
    </div>
  );
}

export function AppLoadingSkeleton({
  label,
  includeToaster = true,
}: {
  label: string;
  includeToaster?: boolean;
}) {
  return (
    <div className="min-h-screen bg-[#f2f2f7] flex" role="status" aria-live="polite" aria-busy="true" aria-label={label}>
      <SidebarSkeleton />

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 p-4 pb-28 md:p-8 md:pb-8">
          <DashboardSkeleton />
        </main>
        <MobileNavSkeleton />
      </div>

      {includeToaster && <Toaster position="top-right" />}
    </div>
  );
}
