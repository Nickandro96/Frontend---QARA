import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Loader2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const { refresh } = useAuth();
  
  const loginMutation = trpc.system.devLogin.useMutation({
    onSuccess: () => {
      // Rafraîchir l'état d'authentification et rediriger
      refresh().then(() => {
        window.location.href = "/";
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;
    loginMutation.mutate({ email, name });
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
          <CardTitle className="text-2xl font-bold">Connexion Locale</CardTitle>
          <CardDescription>
            Accédez à votre plateforme MDR Compliance en toute autonomie.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">Nom complet</label>
              <Input
                id="name"
                placeholder="Ex: Jean Dupont"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
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
          <div className="mt-6 text-center text-xs text-muted-foreground">
            <p>Ce mode de connexion est autonome et ne dépend pas de Manus OAuth.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
