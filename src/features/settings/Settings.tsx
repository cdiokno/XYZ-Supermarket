import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuth } from "@/app/providers/auth-provider";
import { useStore } from "@/app/providers/store-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Button } from "@/shared/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { ImagePlus, Trash2 } from "lucide-react";

function toInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() || "")
    .join("");
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.readAsDataURL(file);
  });
}

export function Settings() {
  const navigate = useNavigate();
  const { currentUser, isAdmin, login, logout, accounts, addCashierAccount, deleteAccount, updateCurrentAccount } = useAuth();
  const { addCashier } = useStore();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [cashierName, setCashierName] = useState("");
  const [cashierUsername, setCashierUsername] = useState("");
  const [cashierPassword, setCashierPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileUsername, setProfileUsername] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);
  const [deletingAccountUsername, setDeletingAccountUsername] = useState("");

  const cashierAccounts = useMemo(() => accounts.filter((account) => account.role === "cashier"), [accounts]);

  useEffect(() => {
    if (!currentUser) return;
    setProfileName(currentUser.name);
    setProfileUsername(currentUser.username);
    setProfileImage(currentUser.profileImage || "");
  }, [currentUser]);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedUsername = username.trim();
    setLoggingIn(true);
    const result = await login(trimmedUsername, password);

    if (!result.ok) {
      setLoggingIn(false);
      toast.error(result.message);
      return;
    }

    toast.success("Logged in successfully.");
    setUsername("");
    setPassword("");

    navigate("/dashboard", { replace: true });
  };

  const handleAddCashierAccount = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = cashierName.trim();
    const trimmedUsername = cashierUsername.trim();
    const hasName = accounts.some((account) => account.name.toLowerCase() === trimmedName.toLowerCase());
    const hasUsername = accounts.some((account) => account.username.toLowerCase() === trimmedUsername.toLowerCase());

    if (!trimmedName || !trimmedUsername || !cashierPassword) {
      toast.error("Complete all cashier account fields.");
      return;
    }
    if (hasName) {
      toast.error("Cashier name already has an account.");
      return;
    }
    if (hasUsername) {
      toast.error("Username already exists.");
      return;
    }

    setSubmitting(true);

    try {
      const result = await addCashierAccount({
        name: trimmedName,
        username: trimmedUsername,
        password: cashierPassword,
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      await addCashier(trimmedName);
      toast.success("Cashier account added.");
      setCashierName("");
      setCashierUsername("");
      setCashierPassword("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add cashier account.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleProfileImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploadingProfileImage(true);
    try {
      const image = await fileToDataUrl(file);
      setProfileImage(image);
      toast.success("Profile photo uploaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload profile photo.");
    } finally {
      setUploadingProfileImage(false);
    }
  };

  const handleProfileUpdate = async (event: FormEvent) => {
    event.preventDefault();
    setUpdatingProfile(true);

    try {
      const result = await updateCurrentAccount({
        name: profileName,
        username: profileUsername,
        profileImage,
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      toast.success("Profile updated.");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePasswordChange = async (event: FormEvent) => {
    event.preventDefault();
    setChangingPassword(true);

    try {
      const result = await updateCurrentAccount({
        name: profileName,
        username: profileUsername,
        profileImage,
        currentPassword,
        newPassword,
        confirmNewPassword,
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      toast.success("Password changed.");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteCashierAccount = async (targetUsername: string, targetName: string) => {
    const confirmed = window.confirm(`Delete cashier account for ${targetName} (@${targetUsername})? This cannot be undone.`);
    if (!confirmed) return;

    setDeletingAccountUsername(targetUsername.toLowerCase());
    try {
      const result = await deleteAccount(targetUsername);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success("Cashier account deleted.");
    } finally {
      setDeletingAccountUsername("");
    }
  };

  if (loggingIn) {
    return (
      <div className="min-h-[calc(100dvh-3rem)] flex items-center justify-center p-2 sm:p-4">
        <Card className="w-full max-w-md rounded-3xl border-black/5 shadow-sm">
          <CardHeader>
            <CardTitle>Signing in...</CardTitle>
            <CardDescription>Taking you to dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" className="w-full h-11 rounded-xl bg-[#007AFF] hover:bg-[#0051D5]" disabled>
              Signing in...
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-[calc(100dvh-3rem)] flex items-center justify-center p-2 sm:p-4">
        <Card className="w-full max-w-md rounded-3xl border-black/5 shadow-sm">
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>Sign in to continue to XYZ Supermarket.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleLogin}>
              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="h-11 rounded-xl border-black/20 ring-1 ring-black/10"
                  autoComplete="username"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-11 rounded-xl border-black/20 ring-1 ring-black/10"
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full h-11 rounded-xl bg-[#007AFF] hover:bg-[#0051D5]">
                Continue
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border-black/5 shadow-sm">
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Account controls and access.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="tracking-tight">{currentUser.name}</p>
            <p className="text-sm text-muted-foreground">@{currentUser.username} · {currentUser.role}</p>
          </div>
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => {
              logout();
              navigate("/settings", { replace: true });
            }}
          >
            Log out
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-black/5 shadow-sm">
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
          <CardDescription>Update your profile details and password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleProfileUpdate}>
            <div className="flex flex-wrap items-center gap-4">
              <Avatar className="size-16 border border-black/10">
                <AvatarImage src={profileImage || ""} alt={profileName || profileUsername} className="object-cover" />
                <AvatarFallback>{toInitials(profileName || profileUsername || "User") || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-4 h-10 rounded-xl bg-[#007AFF] text-white cursor-pointer hover:bg-[#0051D5] transition">
                  <ImagePlus className="size-4" />
                  {uploadingProfileImage ? "Uploading..." : "Upload Photo"}
                  <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageUpload} disabled={uploadingProfileImage} />
                </label>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-xl"
                  onClick={() => setProfileImage("")}
                  disabled={!profileImage}
                >
                  Remove
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="profile-name">Name</Label>
                <Input
                  id="profile-name"
                  value={profileName}
                  onChange={(event) => setProfileName(event.target.value)}
                  className="h-11 rounded-xl border-black/20 ring-1 ring-black/10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-username">Username</Label>
                <Input
                  id="profile-username"
                  value={profileUsername}
                  onChange={(event) => setProfileUsername(event.target.value)}
                  className="h-11 rounded-xl border-black/20 ring-1 ring-black/10"
                />
              </div>
            </div>

            <Button type="submit" className="h-11 rounded-xl bg-[#007AFF] hover:bg-[#0051D5]" disabled={updatingProfile || uploadingProfileImage}>
              {updatingProfile ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-black/5 shadow-sm">
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Enter your current password, then your new password twice.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handlePasswordChange}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className="h-11 rounded-xl border-black/20 ring-1 ring-black/10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="h-11 rounded-xl border-black/20 ring-1 ring-black/10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(event) => setConfirmNewPassword(event.target.value)}
                  className="h-11 rounded-xl border-black/20 ring-1 ring-black/10"
                />
              </div>
            </div>

            <Button type="submit" className="h-11 rounded-xl bg-[#007AFF] hover:bg-[#0051D5]" disabled={changingPassword}>
              {changingPassword ? "Saving..." : "Change Password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isAdmin && (
        <>
          <Card className="rounded-3xl border-black/5 shadow-sm">
            <CardHeader>
              <CardTitle>Add Cashier Account</CardTitle>
              <CardDescription>Create cashier credentials for login and POS tracking.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid grid-cols-1 md:grid-cols-3 gap-3" onSubmit={handleAddCashierAccount}>
                <div className="space-y-1.5">
                  <Label htmlFor="cashier-name">Cashier Name</Label>
                  <Input
                    id="cashier-name"
                    value={cashierName}
                    onChange={(event) => setCashierName(event.target.value)}
                    placeholder="e.g. Carlos M."
                    className="h-11 rounded-xl border-black/20 ring-1 ring-black/10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cashier-username">Username</Label>
                  <Input
                    id="cashier-username"
                    value={cashierUsername}
                    onChange={(event) => setCashierUsername(event.target.value)}
                    placeholder="e.g. carlos"
                    className="h-11 rounded-xl border-black/20 ring-1 ring-black/10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cashier-password">Password</Label>
                  <Input
                    id="cashier-password"
                    type="password"
                    value={cashierPassword}
                    onChange={(event) => setCashierPassword(event.target.value)}
                    placeholder="Set password"
                    className="h-11 rounded-xl border-black/20 ring-1 ring-black/10"
                  />
                </div>
                <div className="md:col-span-3">
                  <Button type="submit" className="h-11 rounded-xl bg-[#007AFF] hover:bg-[#0051D5]" disabled={submitting}>
                    {submitting ? "Saving..." : "Add Cashier"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-black/5 shadow-sm">
            <CardHeader>
              <CardTitle>Cashier Accounts</CardTitle>
              <CardDescription>{cashierAccounts.length} account(s)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {cashierAccounts.length === 0 && <p className="text-muted-foreground">No cashier accounts yet.</p>}
              {cashierAccounts.map((account) => (
                <div key={account.username} className="rounded-2xl border border-black/5 p-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="tracking-tight">{account.name}</p>
                    <p className="text-muted-foreground">@{account.username}</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => void handleDeleteCashierAccount(account.username, account.name)}
                    disabled={deletingAccountUsername === account.username.toLowerCase()}
                  >
                    <Trash2 className="size-4" />
                    {deletingAccountUsername === account.username.toLowerCase() ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
