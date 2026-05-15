import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type UserRole = "admin" | "cashier";

export type AuthAccount = {
  username: string;
  name: string;
  password: string;
  role: UserRole;
  profileImage: string;
};

export type AuthUser = Omit<AuthAccount, "password">;

type AuthContextValue = {
  currentUser: AuthUser | null;
  accounts: AuthAccount[];
  isAdmin: boolean;
  login: (username: string, password: string) => { ok: true } | { ok: false; message: string };
  logout: () => void;
  addCashierAccount: (account: { name: string; username: string; password: string }) => { ok: true } | { ok: false; message: string };
  updateCurrentAccount: (payload: {
    name: string;
    username: string;
    profileImage: string;
    currentPassword?: string;
    newPassword?: string;
    confirmNewPassword?: string;
  }) => { ok: true } | { ok: false; message: string };
};

const ACCOUNT_STORAGE_KEY = "xyz-supermarket-accounts";
const SESSION_STORAGE_KEY = "xyz-supermarket-session";

const defaultAdmin: AuthAccount = {
  username: "admin",
  name: "Administrator",
  password: "admin123",
  role: "admin",
  profileImage: "",
};

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
      .filter((account): account is AuthAccount => Boolean(account?.username && account?.name && account?.password && account?.role))
      .map(normalizeAccount);

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

function readSessionUser(accounts: AuthAccount[]): AuthUser | null {
  if (typeof window === "undefined") return null;
  const username = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!username) return null;

  const account = accounts.find((candidate) => candidate.username.toLowerCase() === username.toLowerCase());
  if (!account) return null;

  const { password: _password, ...user } = account;
  return user;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<AuthAccount[]>(() => readAccounts());
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => readSessionUser(readAccounts()));

  const login: AuthContextValue["login"] = (usernameInput, password) => {
    const username = usernameInput.trim();
    if (!username || !password) {
      return { ok: false, message: "Enter username and password." };
    }

    const account = accounts.find((candidate) => candidate.username.toLowerCase() === username.toLowerCase());
    if (!account || account.password !== password) {
      return { ok: false, message: "Invalid username or password." };
    }

    const { password: _password, ...user } = account;
    setCurrentUser(user);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SESSION_STORAGE_KEY, user.username);
    }
    return { ok: true };
  };

  const logout = () => {
    setCurrentUser(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  };

  const addCashierAccount: AuthContextValue["addCashierAccount"] = ({ name, username, password }) => {
    const trimmedName = name.trim();
    const trimmedUsername = username.trim();

    if (!trimmedName || !trimmedUsername || !password) {
      return { ok: false, message: "Complete all cashier account fields." };
    }

    if (accounts.some((account) => account.username.toLowerCase() === trimmedUsername.toLowerCase())) {
      return { ok: false, message: "Username already exists." };
    }

    if (accounts.some((account) => account.name.toLowerCase() === trimmedName.toLowerCase())) {
      return { ok: false, message: "Cashier name already has an account." };
    }

    const nextAccounts = [
      ...accounts,
      {
        name: trimmedName,
        username: trimmedUsername,
        password,
        role: "cashier",
        profileImage: "",
      },
    ];

    setAccounts(nextAccounts);
    saveAccounts(nextAccounts);
    return { ok: true };
  };

  const updateCurrentAccount: AuthContextValue["updateCurrentAccount"] = ({
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

    const activeIndex = accounts.findIndex(
      (account) => account.username.toLowerCase() === currentUser.username.toLowerCase()
    );
    if (activeIndex < 0) {
      return { ok: false, message: "Could not find your account." };
    }

    const hasUsernameConflict = accounts.some(
      (account, index) => index !== activeIndex && account.username.toLowerCase() === trimmedUsername.toLowerCase()
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
      if (accounts[activeIndex].password !== normalizedCurrentPassword) {
        return { ok: false, message: "Current password is incorrect." };
      }
      if (normalizedNewPassword !== normalizedConfirmNewPassword) {
        return { ok: false, message: "New passwords do not match." };
      }
      if (normalizedNewPassword === normalizedCurrentPassword) {
        return { ok: false, message: "New password must be different from current password." };
      }
    }

    const updatedAccount: AuthAccount = {
      ...accounts[activeIndex],
      name: trimmedName,
      username: trimmedUsername,
      profileImage: profileImage || "",
      password: wantsPasswordChange ? normalizedNewPassword : accounts[activeIndex].password,
    };

    const nextAccounts = accounts.map((account, index) => (index === activeIndex ? updatedAccount : account));
    setAccounts(nextAccounts);
    saveAccounts(nextAccounts);

    const { password: _password, ...user } = updatedAccount;
    setCurrentUser(user);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SESSION_STORAGE_KEY, user.username);
    }

    return { ok: true };
  };

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      accounts,
      isAdmin: currentUser?.role === "admin",
      login,
      logout,
      addCashierAccount,
      updateCurrentAccount,
    }),
    [accounts, currentUser]
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
