import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Loader2, Shield } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { sanitizeReturnTo } from "@/lib/session";
import { trpc } from "@/lib/trpc";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { refresh } = useAuth();
  const [, navigate] = useLocation();

  const loginMutation = trpc.system.login.useMutation({
    onSuccess: () => {
      refresh().then(() => {
        const params = new URLSearchParams(window.location.search);
        navigate(sanitizeReturnTo(params.get("returnTo")));
      });
    },
    onError: (err: { message?: string }) => {
      setError(err.message || "Une erreur est survenue");
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    loginMutation.mutate({ email, password });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f6f9] p-4">
      <Card className="w-full max-w-md border-0 shadow-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#3b6fe0] text-white">
            <Shield className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Se connecter</CardTitle>
          <CardDescription>Accedez a votre espace QARA</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Adresse email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="jean@exemple.fr"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Mot de passe
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Votre mot de passe"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            <div className="text-right">
              <Link href="/forgot-password" className="text-sm font-medium text-[#3b6fe0] hover:underline">
                Mot de passe oublie ?
              </Link>
            </div>

            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>
            ) : null}

            {loginMutation.error ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {loginMutation.error.message}
              </div>
            ) : null}

            <Button type="submit" className="w-full py-6 text-lg font-semibold" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Connexion...
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>

          <div className="mt-6 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">ou</span>
              </div>
            </div>

            <div>
              <p className="mb-3 text-center text-sm text-gray-600">Pas encore de compte ?</p>
              <Link href="/signup">
                <Button variant="outline" className="w-full">
                  S'inscrire
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            <p>Connexion securisee par session QARA.</p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
