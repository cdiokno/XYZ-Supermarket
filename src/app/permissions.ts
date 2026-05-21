import type { UserRole } from "@/app/roles";

export type AppView = "dashboard" | "pos" | "inventory" | "purchase-orders" | "reports" | "history" | "settings";

const ROLE_VIEW_ACCESS: Record<UserRole, readonly AppView[]> = {
  admin: ["dashboard", "pos", "inventory", "purchase-orders", "reports", "history", "settings"],
  cashier: ["dashboard", "pos", "history", "settings"],
  inventory_clerk: ["dashboard", "inventory", "purchase-orders", "settings"],
};

export function canAccessView(role: UserRole, view: AppView) {
  return ROLE_VIEW_ACCESS[role].includes(view);
}

export function canManagePurchaseOrders(role: UserRole) {
  return role === "admin";
}

export function canReceivePurchaseOrders(role: UserRole) {
  return role === "admin" || role === "inventory_clerk";
}
