export const USER_ROLES = ["admin", "cashier", "inventory_clerk"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrator",
  cashier: "Cashier",
  inventory_clerk: "Inventory Clerk",
};

const ROLE_ORDER: Record<UserRole, number> = {
  admin: 0,
  inventory_clerk: 1,
  cashier: 2,
};

export function isUserRole(role: unknown): role is UserRole {
  return typeof role === "string" && USER_ROLES.includes(role as UserRole);
}

export function getRoleSortIndex(role: UserRole) {
  return ROLE_ORDER[role];
}
