import { isRouteErrorResponse, useNavigate, useRouteError } from "react-router";
import { Button } from "@/shared/ui/button";

function getErrorMessage(error: unknown) {
  if (isRouteErrorResponse(error)) {
    return error.statusText || `Request failed with status ${error.status}`;
  }

  if (error instanceof Error) {
    if (error.message.includes("Failed to fetch dynamically imported module")) {
      return "This screen could not be loaded. The app server may have restarted or gone offline.";
    }

    return error.message;
  }

  return "Something went wrong while loading this screen.";
}

export function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();
  const message = getErrorMessage(error);

  return (
    <div className="min-h-screen bg-[#f2f2f7] p-4 sm:p-8">
      <div className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-xl place-items-center">
        <div className="w-full rounded-3xl border border-black/5 bg-white p-6 text-center">
          <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-[#e5f0ff] text-[#007AFF]">
            !
          </div>
          <h1 className="text-xl tracking-tight">Screen did not load</h1>
          <p className="mt-2 text-muted-foreground">{message}</p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button type="button" className="h-11 rounded-xl bg-[#007AFF] hover:bg-[#0051D5]" onClick={() => window.location.reload()}>
              Reload screen
            </Button>
            <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => navigate("/settings", { replace: true })}>
              Go to login
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
