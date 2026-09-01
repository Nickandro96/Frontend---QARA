import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Loader2, Shield } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Checkbox } from "@/components/ui/checkbox";

const AUTH_REFRESH_TIMEOUT_MS = 1500;

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    company: "",
    role: "",
    phone: "",
    cguAccepted: false,
    marketingConsent: false,
  });
  const [error, setError] = useState("");
  const { refresh } = useAuth();
  const [, navigate] = useLocation();

  const registerMutation = trpc.system.register.useMutation({
    onSuccess: () => {
      void Promise.race([
        refresh(),
        new Promise((resolve) => window.setTimeout(resolve, AUTH_REFRESH_TIMEOUT_MS)),
      ])
        .catch(() => undefined)
        .finally(() => {
          navigate("/onboarding");
        });
    },
    onError: (err: { message?: string }) => {
      setError(err.message || "Une erreur est survenue");
    },
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (formData.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caracteres");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    registerMutation.mutate({
      email: formData.email,
      name: formData.name,
      password: formData.password,
      company: formData.company,
      role: formData.role,
      phone: formData.phone,
      cguAccepted: formData.cguAccepted as true,
      marketingConsent: formData.marketingConsent,
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f6f9] p-4">
      <Card className="w-full max-w-md border-0 shadow-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#3b6fe0] text-white">
            <Shield className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Creer un compte</CardTitle>
          <CardDescription>Rejoignez votre espace QARA</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Nom complet *
              </label>
              <Input id="name" name="name" placeholder="Ex: Jean Dupont" value={formData.name} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Adresse email *
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="jean@exemple.fr"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Mot de passe *
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Minimum 6 caracteres"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirmer le mot de passe *
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirmez votre mot de passe"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="company" className="text-sm font-medium">
                Entreprise
              </label>
              <Input id="company" name="company" placeholder="Ex: Acme Corp" value={formData.company} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium">
                Role
              </label>
              <Select value={formData.role} onValueChange={(value) => setFormData((previous) => ({ ...previous, role: value }))}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Selectionnez votre role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fabricant">Fabricant</SelectItem>
                  <SelectItem value="importateur">Importateur</SelectItem>
                  <SelectItem value="distributeur">Distributeur</SelectItem>
                  <SelectItem value="consultant">Consultant</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">
                Telephone
              </label>
              <Input id="phone" name="phone" type="tel" placeholder="+33 6 12 34 56 78" value={formData.phone} onChange={handleChange} />
            </div>

            <label className="flex items-start gap-3 text-sm leading-5">
              <Checkbox
                checked={formData.cguAccepted}
                onCheckedChange={(checked) => setFormData((previous) => ({ ...previous, cguAccepted: checked === true }))}
                aria-required="true"
              />
              <span>J'accepte les <Link href="/cgu" className="text-[#2558c7] underline">Conditions Générales d'Utilisation</Link> et la <Link href="/politique-confidentialite" className="text-[#2558c7] underline">Politique de confidentialité</Link> de QARA. *</span>
            </label>
            <label className="flex items-start gap-3 text-sm leading-5">
              <Checkbox
                checked={formData.marketingConsent}
                onCheckedChange={(checked) => setFormData((previous) => ({ ...previous, marketingConsent: checked === true }))}
              />
              <span>J'accepte de recevoir des communications commerciales de QARA (optionnel).</span>
            </label>

            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>
            ) : null}

            {registerMutation.error ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {registerMutation.error.message}
              </div>
            ) : null}

            <Button type="submit" className="w-full py-6 text-lg font-semibold" disabled={registerMutation.isPending || !formData.cguAccepted}>
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creation du compte...
                </>
              ) : (
                "S'inscrire"
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
              <p className="mb-3 text-center text-sm text-gray-600">Deja un compte ?</p>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Se connecter
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
