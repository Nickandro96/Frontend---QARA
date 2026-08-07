Exit code: 0
Wall time: 2.7 seconds
Output:
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Loader2, Shield } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function ResetPassword() {
  const token = new URLSearchParams(window.location.search).get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const resetPassword = trpc.system.resetPassword.useMutation({
    onSuccess: () => setDone(true),
    onError: (mutationError: { message?: string }) =>
      setError(mutationError.message || "Impossible de réinitialiser le mot de passe."),
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!token) return setError("Le lien de réinitialisation est incomplet.");
    if (password.length < 6) return setError("Le mot de passe doit contenir au moins 6 caractères.");
    if (password !== confirmation) return setError("Les mots de passe ne correspondent pas.");
    resetPassword.mutate({ token, password });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f6f9] p-4">
      <Card className="w-full max-w-md border-0 shadow-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#3b6fe0] text-white">
            <Shield className="h-6 w-6" />
          </div>
          <CardTitle>Choisir un nouveau mot de passe</CardTitle>
          <CardDescription>Ce lien est valable 30 minutes et ne peut être utilisé qu'une fois.</CardDescription>
        </CardHeader>
        <CardContent>
          {done ? (
            <div className="space-y-4">
              <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                Votre mot de passe a été réinitialisé.
              </div>
              <Link href="/login"><Button className="w-full">Se connecter</Button></Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">Nouveau mot de passe</label>
                <Input id="password" type="password" autoComplete="new-password" value={password}
                  onChange={(event) => setPassword(event.target.value)} required minLength={6} />
              </div>
              <div className="space-y-2">
                <label htmlFor="confirmation" className="text-sm font-medium">Confirmer le mot de passe</label>
                <Input id="confirmation" type="password" autoComplete="new-password" value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)} required minLength={6} />
              </div>
              {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div> : null}
              <Button type="submit" className="w-full" disabled={!token || resetPassword.isPending}>
                {resetPassword.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {resetPassword.isPending ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
              </Button>
              {!token ? <p className="text-sm text-red-600">Ce lien ne contient aucun jeton de réinitialisation.</p> : null}
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

