import { RouterProvider } from "react-router";
import { appRouter } from "@/app/router";
import { StoreProvider } from "@/app/providers/store-provider";
import { AuthProvider } from "@/app/providers/auth-provider";

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <RouterProvider router={appRouter} />
      </StoreProvider>
    </AuthProvider>
  );
}
