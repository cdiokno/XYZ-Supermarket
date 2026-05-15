import { getSupabaseClient, hasSupabaseConfig } from "@/services/supabase";
import type { Database } from "@/services/supabase/database.types";

export type BackendUserRole = "admin" | "cashier";

export type BackendAuthAccount = {
  username: string;
  name: string;
  role: BackendUserRole;
  profileImage: string;
};

type AccountRow = Database["public"]["Functions"]["list_app_accounts"]["Returns"][number];

function mapAccount(row: AccountRow): BackendAuthAccount {
  return {
    username: row.username,
    name: row.name,
    role: row.role as BackendUserRole,
    profileImage: row.profile_image || "",
  };
}

function getAuthErrorMessage(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String(error.message)
        : "";

  if (message.includes("Could not find the function public.") || message.includes("function public.") || message.includes("schema cache")) {
    return "The Supabase account backend is not installed yet. Apply the latest Supabase migration and try again.";
  }

  return message || "Unexpected Supabase account error.";
}

function firstAccount(data: AccountRow[] | null): BackendAuthAccount {
  const account = data?.[0];
  if (!account) throw new Error("Invalid username or password.");
  return mapAccount(account);
}

export async function fetchBackendAccounts() {
  if (!hasSupabaseConfig) return [];

  const client = getSupabaseClient();
  const { data, error } = await client.rpc("list_app_accounts");

  if (error) throw new Error(getAuthErrorMessage(error));
  return ((data || []) as AccountRow[]).map(mapAccount);
}

export async function loginBackendAccount(username: string, password: string) {
  const client = getSupabaseClient();
  const { data, error } = await client.rpc("login_app_account", {
    p_password: password,
    p_username: username,
  });

  if (error) throw new Error(getAuthErrorMessage(error));
  return firstAccount(data as AccountRow[] | null);
}

export async function createBackendCashierAccount(account: { name: string; username: string; password: string }) {
  const client = getSupabaseClient();
  const { data, error } = await client.rpc("create_cashier_account", {
    p_name: account.name,
    p_password: account.password,
    p_username: account.username,
  });

  if (error) throw new Error(getAuthErrorMessage(error));
  return firstAccount(data as AccountRow[] | null);
}

export async function updateBackendAccount(payload: {
  currentUsername: string;
  name: string;
  username: string;
  profileImage: string;
  currentPassword?: string;
  newPassword?: string;
}) {
  const client = getSupabaseClient();
  const { data, error } = await client.rpc("update_app_account", {
    p_current_password: payload.currentPassword || null,
    p_current_username: payload.currentUsername,
    p_name: payload.name,
    p_new_password: payload.newPassword || null,
    p_profile_image: payload.profileImage || "",
    p_username: payload.username,
  });

  if (error) throw new Error(getAuthErrorMessage(error));
  return firstAccount(data as AccountRow[] | null);
}
