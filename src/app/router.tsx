import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router";
import { AppShell } from "@/app/layout/AppShell";
import { RouteErrorBoundary } from "@/app/RouteErrorBoundary";
import { RequireViewAccess } from "@/app/RequireViewAccess";

const DashboardPage = lazy(() => import("@/features/dashboard"));
const PosPage = lazy(() => import("@/features/pos"));
const InventoryPage = lazy(() => import("@/features/inventory"));
const PurchaseOrdersPage = lazy(() => import("@/features/purchase-orders"));
const HistoryPage = lazy(() => import("@/features/history"));
const ReportsPage = lazy(() => import("@/features/reports"));
const SettingsPage = lazy(() => import("@/features/settings"));
const LoginPage = lazy(() => import("@/features/login"));

export const appRouter = createBrowserRouter([
  {
    path: "/",
    Component: AppShell,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: (
          <RequireViewAccess view="dashboard">
            <DashboardPage />
          </RequireViewAccess>
        ),
      },
      {
        path: "pos",
        element: (
          <RequireViewAccess view="pos">
            <PosPage />
          </RequireViewAccess>
        ),
      },
      {
        path: "inventory",
        element: (
          <RequireViewAccess view="inventory">
            <InventoryPage />
          </RequireViewAccess>
        ),
      },
      {
        path: "purchase-orders",
        element: (
          <RequireViewAccess view="purchase-orders">
            <PurchaseOrdersPage />
          </RequireViewAccess>
        ),
      },
      {
        path: "po",
        element: <Navigate to="/purchase-orders" replace />,
      },
      {
        path: "history",
        element: (
          <RequireViewAccess view="history">
            <HistoryPage />
          </RequireViewAccess>
        ),
      },
      {
        path: "reports",
        element: (
          <RequireViewAccess view="reports">
            <ReportsPage />
          </RequireViewAccess>
        ),
      },
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "settings",
        element: (
          <RequireViewAccess view="settings">
            <SettingsPage />
          </RequireViewAccess>
        ),
      },
      {
        path: "*",
        element: <Navigate to="/dashboard" replace />,
      },
    ],
  },
]);
