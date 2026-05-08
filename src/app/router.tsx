import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router";
import { AppShell } from "@/app/layout/AppShell";

const DashboardPage = lazy(() => import("@/features/dashboard"));
const PosPage = lazy(() => import("@/features/pos"));
const InventoryPage = lazy(() => import("@/features/inventory"));
const PurchaseOrdersPage = lazy(() => import("@/features/purchase-orders"));
const HistoryPage = lazy(() => import("@/features/history"));
const ReportsPage = lazy(() => import("@/features/reports"));

export const appRouter = createBrowserRouter([
  {
    path: "/",
    Component: AppShell,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <DashboardPage />,
      },
      {
        path: "pos",
        element: <PosPage />,
      },
      {
        path: "inventory",
        element: <InventoryPage />,
      },
      {
        path: "purchase-orders",
        element: <PurchaseOrdersPage />,
      },
      {
        path: "po",
        element: <Navigate to="/purchase-orders" replace />,
      },
      {
        path: "history",
        element: <HistoryPage />,
      },
      {
        path: "reports",
        element: <ReportsPage />,
      },
      {
        path: "*",
        element: <Navigate to="/dashboard" replace />,
      },
    ],
  },
]);
