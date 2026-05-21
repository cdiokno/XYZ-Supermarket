import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createBackendAccount, deleteBackendAccount, fetchBackendAccounts, loginBackendAccount, updateBackendAccount } from "@/services/auth";
import { hasSupabaseConfig } from "@/services/supabase";
import { getRoleSortIndex, isUserRole, type UserRole } from "@/app/roles";

export type { UserRole };

export type AuthAccount = {
  username: string;
  name: string;
  password?: string;
  role: UserRole;
  profileImage: string;
};

export type AuthUser = Omit<AuthAccount, "password">;

type AuthResult = { ok: true } | { ok: false; message: string };

type AuthContextValue = {
  currentUser: AuthUser | null;
  accounts: AuthAccount[];
  loading: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<AuthResult>;
  logout: () => void;
  addAccount: (account: { name: string; username: string; password: string; role: UserRole }) => Promise<AuthResult>;
  deleteAccount: (username: string) => Promise<AuthResult>;
  updateCurrentAccount: (payload: {
    name: string;
    username: string;
    profileImage: string;
    currentPassword?: string;
    newPassword?: string;
    confirmNewPassword?: string;
  }) => Promise<AuthResult>;
};

const ACCOUNT_STORAGE_KEY = "xyz-supermarket-accounts";
const SESSION_STORAGE_KEY = "xyz-supermarket-session";

const defaultAdmin: AuthAccount = {
  username: "admin",
  name: "Administrator",
  password: "admin",
  role: "admin",
  profileImage: "",
};

function toAuthUser(account: AuthAccount): AuthUser {
  const { password: _password, ...user } = account;
  return user;
}

function sortAccounts(accounts: AuthAccount[]) {
  return [...accounts].sort((a, b) => getRoleSortIndex(a.role) - getRoleSortIndex(b.role) || a.name.localeCompare(b.name));
}

function upsertAccount(accounts: AuthAccount[], account: AuthAccount) {
  const exists = accounts.some((candidate) => candidate.username.toLowerCase() === account.username.toLowerCase());
  const next = exists
    ? accounts.map((candidate) => (candidate.username.toLowerCase() === account.username.toLowerCase() ? account : candidate))
    : [...accounts, account];

  return sortAccounts(next);
}

function normalizeAccount(account: AuthAccount): AuthAccount {
  return {
    username: account.username.trim(),
    name: account.name.trim(),
    password: account.password,
    role: account.role,
    profileImage: typeof account.profileImage === "string" ? account.profileImage : "",
  };
}

function readAccounts() {
  if (typeof window === "undefined") return [defaultAdmin];
  const raw = window.localStorage.getItem(ACCOUNT_STORAGE_KEY);

  if (!raw) {
    const initial = [defaultAdmin];
    window.localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }

  try {
    const parsed = JSON.parse(raw) as AuthAccount[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      window.localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify([defaultAdmin]));
      return [defaultAdmin];
    }

    const normalized = parsed
      .filter(
        (account): account is AuthAccount =>
          Boolean(account?.username && account?.name && account?.password && isUserRole(account?.role))
      )
      .map(normalizeAccount)
      .map((account) =>
        account.username.toLowerCase() === "admin" && account.role === "admin" && account.password === "admin123"
          ? { ...account, password: "admin" }
          : account
      );

    if (!normalized.some((account) => account.role === "admin")) {
      const withAdmin = [defaultAdmin, ...normalized];
      window.localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(withAdmin));
      return withAdmin;
    }

    return normalized;
  } catch {
    const fallback = [defaultAdmin];
    window.localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(fallback));
    return fallback;
  }
}

function saveAccounts(accounts: AuthAccount[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(accounts));
}

function readSessionUsername() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(SESSION_STORAGE_KEY) || "";
}

function saveSessionUsername(username: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_STORAGE_KEY, username);
}

function clearSessionUsername() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

function readSessionUser(accounts: AuthAccount[]): AuthUser | null {
  const username = readSessionUsername();
  if (!username) return null;

  const account = accounts.find((candidate) => candidate.username.toLowerCase() === username.toLowerCase());
  return account ? toAuthUser(account) : null;
}

function messageFromError(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected account error.";
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<AuthAccount[]>(() => (hasSupabaseConfig ? [] : readAccounts()));
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => (hasSupabaseConfig ? null : readSessionUser(readAccounts())));
  const [loading, setLoading] = useState(hasSupabaseConfig);

  useEffect(() => {
    if (!hasSupabaseConfig) return;

    let cancelled = false;

    async function loadBackendAccounts() {
      setLoading(true);
      try {
        const backendAccounts = await fetchBackendAccounts();
        if (cancelled) return;

        const nextAccounts = sortAccounts(backendAccounts);
        const sessionUsername = readSessionUsername();
        const sessionAccount = nextAccounts.find((account) => account.username.toLowerCase() === sessionUsername.toLowerCase());

        setAccounts(nextAccounts);
        setCurrentUser(sessionAccount ? toAuthUser(sessionAccount) : null);
        if (!sessionAccount) clearSessionUsername();
      } catch {
        if (cancelled) return;
        setAccounts([]);
        setCurrentUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadBackendAccounts();

    return () => {
      cancelled = true;
    };
  }, []);

  const login: AuthContextValue["login"] = async (usernameInput, password) => {
    const username = usernameInput.trim();
    if (!username || !password) {
      return { ok: false, message: "Enter username and password." };
    }

    if (hasSupabaseConfig) {
      try {
        const account = await loginBackendAccount(username, password);
        setCurrentUser(account);
        saveSessionUsername(account.username);
        setAccounts((current) => upsertAccount(current, account));
        return { ok: true };
      } catch (error) {
        return { ok: false, message: messageFromError(error) };
      }
    }

    const account = accounts.find((candidate) => candidate.username.toLowerCase() === username.toLowerCase());
    if (!account || account.password !== password) {
      return { ok: false, message: "Invalid username or password." };
    }

    const user = toAuthUser(account);
    setCurrentUser(user);
    saveSessionUsername(user.username);
    return { ok: true };
  };

  const logout = () => {
    setCurrentUser(null);
    clearSessionUsername();
  };

  const addAccount: AuthContextValue["addAccount"] = async ({ name, username, password, role }) => {
    if (currentUser?.role !== "admin") {
      return { ok: false, message: "Only administrators can create accounts." };
    }

    const trimmedName = name.trim();
    const trimmedUsername = username.trim();

    if (!trimmedName || !trimmedUsername || !password) {
      return { ok: false, message: "Complete all account fields." };
    }

    if (!isUserRole(role)) {
      return { ok: false, message: "Select a valid account role." };
    }

    if (accounts.some((account) => account.username.toLowerCase() === trimmedUsername.toLowerCase())) {
      return { ok: false, message: "Username already exists." };
    }

    if (accounts.some((account) => account.name.toLowerCase() === trimmedName.toLowerCase())) {
      return { ok: false, message: "Staff name already has an account." };
    }

    if (hasSupabaseConfig) {
      try {
        const createdAccount = await createBackendAccount({
          adminUsername: currentUser.username,
          name: trimmedName,
          username: trimmedUsername,
          password,
          role,
        });

        setAccounts((current) => upsertAccount(current, createdAccount));
        return { ok: true };
      } catch (error) {
        return { ok: false, message: messageFromError(error) };
      }
    }

    const nextAccounts = sortAccounts([
      ...accounts,
      {
        name: trimmedName,
        username: trimmedUsername,
        password,
        role,
        profileImage: "",
      },
    ]);

    setAccounts(nextAccounts);
    saveAccounts(nextAccounts);
    return { ok: true };
  };

  const updateCurrentAccount: AuthContextValue["updateCurrentAccount"] = async ({
    name,
    username,
    profileImage,
    currentPassword,
    newPassword,
    confirmNewPassword,
  }) => {
    if (!currentUser) {
      return { ok: false, message: "No active session." };
    }

    const trimmedName = name.trim();
    const trimmedUsername = username.trim();
    const normalizedCurrentPassword = (currentPassword || "").trim();
    const normalizedNewPassword = (newPassword || "").trim();
    const normalizedConfirmNewPassword = (confirmNewPassword || "").trim();

    if (!trimmedName || !trimmedUsername) {
      return { ok: false, message: "Name and username are required." };
    }

    const hasUsernameConflict = accounts.some(
      (account) =>
        account.username.toLowerCase() !== currentUser.username.toLowerCase() &&
        account.username.toLowerCase() === trimmedUsername.toLowerCase()
    );
    if (hasUsernameConflict) {
      return { ok: false, message: "Username already exists." };
    }

    const wantsPasswordChange =
      normalizedCurrentPassword.length > 0 || normalizedNewPassword.length > 0 || normalizedConfirmNewPassword.length > 0;
    if (wantsPasswordChange) {
      if (!normalizedCurrentPassword || !normalizedNewPassword || !normalizedConfirmNewPassword) {
        return { ok: false, message: "Enter current password and type the new password twice." };
      }
      if (normalizedNewPassword !== normalizedConfirmNewPassword) {
        return { ok: false, message: "New passwords do not match." };
      }
      if (normalizedNewPassword === normalizedCurrentPassword) {
        return { ok: false, message: "New password must be different from current password." };
      }
    }

    if (hasSupabaseConfig) {
      try {
        const updatedAccount = await updateBackendAccount({
          currentUsername: currentUser.username,
          name: trimmedName,
          username: trimmedUsername,
          profileImage,
          currentPassword: wantsPasswordChange ? normalizedCurrentPassword : undefined,
          newPassword: wantsPasswordChange ? normalizedNewPassword : undefined,
        });

        setAccounts((current) => upsertAccount(current, updatedAccount));
        setCurrentUser(updatedAccount);
        saveSessionUsername(updatedAccount.username);
        return { ok: true };
      } catch (error) {
        return { ok: false, message: messageFromError(error) };
      }
    }

    const activeIndex = accounts.findIndex((account) => account.username.toLowerCase() === currentUser.username.toLowerCase());
    if (activeIndex < 0) {
      return { ok: false, message: "Could not find your account." };
    }

    if (wantsPasswordChange && accounts[activeIndex].password !== normalizedCurrentPassword) {
      return { ok: false, message: "Current password is incorrect." };
    }

    const updatedAccount: AuthAccount = {
      ...accounts[activeIndex],
      name: trimmedName,
      username: trimmedUsername,
      profileImage: profileImage || "",
      password: wantsPasswordChange ? normalizedNewPassword : accounts[activeIndex].password,
    };

    const nextAccounts = sortAccounts(accounts.map((account, index) => (index === activeIndex ? updatedAccount : account)));
    setAccounts(nextAccounts);
    saveAccounts(nextAccounts);

    const user = toAuthUser(updatedAccount);
    setCurrentUser(user);
    saveSessionUsername(user.username);

    return { ok: true };
  };

  const deleteAccount: AuthContextValue["deleteAccount"] = async (usernameInput) => {
    if (!currentUser) {
      return { ok: false, message: "No active session." };
    }

    if (currentUser.role !== "admin") {
      return { ok: false, message: "Only administrators can delete accounts." };
    }

    const username = usernameInput.trim().toLowerCase();
    if (!username) {
      return { ok: false, message: "Select an account to delete." };
    }

    if (username === currentUser.username.toLowerCase()) {
      return { ok: false, message: "You cannot delete your own account." };
    }

    const targetAccount = accounts.find((account) => account.username.toLowerCase() === username);
    if (!targetAccount) {
      return { ok: false, message: "Account not found." };
    }

    if (hasSupabaseConfig) {
      try {
        await deleteBackendAccount({
          adminUsername: currentUser.username,
          targetUsername: targetAccount.username,
        });

        setAccounts((current) => current.filter((account) => account.username.toLowerCase() !== username));
        return { ok: true };
      } catch (error) {
        return { ok: false, message: messageFromError(error) };
      }
    }

    const nextAccounts = accounts.filter((account) => account.username.toLowerCase() !== username);
    setAccounts(nextAccounts);
    saveAccounts(nextAccounts);
    return { ok: true };
  };

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      accounts,
      loading,
      isAdmin: currentUser?.role === "admin",
      login,
      logout,
      addAccount,
      deleteAccount,
      updateCurrentAccount,
    }),
    [accounts, currentUser, loading]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
