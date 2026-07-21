import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Shield } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSent(true);
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

            <Button type="submit" className="w-full">
              Envoyer le lien
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
