import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Loader2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation } from "wouter";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { refresh } = useAuth();
  const [, navigate] = useLocation(); // Initialize navigate
  
  const loginMutation = trpc.system.login.useMutation({
    onSuccess: () => {
      refresh().then(() => {
        navigate("/");
      });
    },
    onError: (err) => {
      setError(err.message || "Une erreur est survenue");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password) {
      setError("Veuillez remplir tous les champs");
      return;
    }
    
    loginMutation.mutate({ email, password });
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
          <CardTitle className="text-2xl font-bold">Se connecter</CardTitle>
          <CardDescription>
            Accédez à votre plateforme MDR Compliance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Adresse email</label>
              <Input
                id="email"
                type="email"
                placeholder="jean@exemple.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Mot de passe</label>
              <Input
                id="password"
                type="password"
                placeholder="Votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded">
                {error}
              </div>
            )}

            {loginMutation.error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded">
                {loginMutation.error.message}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full py-6 text-lg font-semibold" 
              disabled={loginMutation.isPending}
            >
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
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">ou</span>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 text-center mb-3">
                Pas encore de compte ?
              </p>
              <Link href="/register">
                <Button variant="outline" className="w-full">
                  S'inscrire
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            <p>Ce mode de connexion est autonome et ne dépend pas de Manus OAuth.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
