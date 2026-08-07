import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Shield } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const requestReset = trpc.system.requestPasswordReset.useMutation({
    onSuccess: () => setSent(true),
    onError: () => setError("Impossible d'envoyer le lien pour le moment. Réessayez plus tard."),
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSent(false);
    requestReset.mutate({ email: email.trim() });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f6f9] p-4">
      <Card className="w-full max-w-md border-0 shadow-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#3b6fe0] text-white">
            <Shield className="h-6 w-6" />
          </div>
          <CardTitle>Reinitialiser le mot de passe</CardTitle>
          <CardDescription>Indiquez votre email et nous vous enverrons les instructions.</CardDescription>
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
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="vous@entreprise.com"
                required
              />
            </div>

            {sent ? (
              <div className="rounded-md border border-blue-100 bg-blue-50 p-3 text-sm text-[#2558c7]">
                Si un compte existe pour cet email, un lien de reinitialisation sera envoye.
              </div>
            ) : null}

            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>
            ) : null}

            <Button type="submit" className="w-full" disabled={requestReset.isPending}>
              {requestReset.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {requestReset.isPending ? "Envoi..." : "Envoyer le lien"}
            </Button>
            <Link href="/login">
              <Button type="button" variant="ghost" className="w-full">
                Retour connexion
              </Button>
            </Link>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

