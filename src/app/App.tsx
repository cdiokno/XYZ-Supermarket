import { RouterProvider } from "react-router";
import { appRouter } from "@/app/router";
import { StoreProvider } from "@/app/providers/store-provider";

export default function App() {
  return (
    <StoreProvider>
      <RouterProvider router={appRouter} />
    </StoreProvider>
  );
}
