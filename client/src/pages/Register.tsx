import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Loader2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    company: "",
    role: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const { refresh } = useAuth();
  
  const registerMutation = trpc.system.register.useMutation({
    onSuccess: () => {
      refresh().then(() => {
        window.location.href = "/";
      });
    },
    onError: (err) => {
      setError(err.message || "Une erreur est survenue");
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      role: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (formData.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
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
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Créer un compte</CardTitle>
          <CardDescription>
            Rejoignez la plateforme MDR Compliance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">Nom complet *</label>
              <Input
                id="name"
                name="name"
                placeholder="Ex: Jean Dupont"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Adresse email *</label>
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
              <label htmlFor="password" className="text-sm font-medium">Mot de passe *</label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Minimum 6 caractères"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">Confirmer le mot de passe *</label>
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
              <label htmlFor="company" className="text-sm font-medium">Entreprise</label>
              <Input
                id="company"
                name="company"
                placeholder="Ex: Acme Corp"
                value={formData.company}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium">Rôle</label>
              <Select value={formData.role} onValueChange={handleRoleChange}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Sélectionnez votre rôle" />
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
              <label htmlFor="phone" className="text-sm font-medium">Téléphone</label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+33 6 12 34 56 78"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded">
                {error}
              </div>
            )}

            {registerMutation.error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded">
                {registerMutation.error.message}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full py-6 text-lg font-semibold" 
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Création du compte...
                </>
              ) : (
                "S'inscrire"
              )}
            </Button>
          </form>

          <div className="mt-6 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">ou</span>
              </div>
            </div>

            <Link href="/login">
              <Button variant="outline" className="w-full">
                Déjà inscrit ? Se connecter
              </Button>
            </Link>
          </div>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            <p>En créant un compte, vous acceptez nos conditions d'utilisation.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
