import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuth } from "@/app/providers/auth-provider";
import { AppLoadingSkeleton } from "@/app/layout/AppLoadingSkeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Button } from "@/shared/ui/button";

export default function LoginPage() {
  const navigate = useNavigate();
  const { currentUser, login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    if (currentUser) {
      navigate("/dashboard", { replace: true });
    }
  }, [currentUser, navigate]);

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

  if (loggingIn || currentUser) {
    return (
      <div className="fixed inset-0 z-50">
        <AppLoadingSkeleton label="Signing in" includeToaster={false} />
      </div>
    );
  }

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
