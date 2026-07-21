import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const target = isAuthenticated ? "/dashboard" : "/login";

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[#f4f6f9] p-4">
      <Card className="w-full max-w-lg border-0 bg-white shadow-sm">
        <CardContent className="py-8 text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#3b6fe0] text-white">
            <Shield className="h-7 w-7" />
          </div>

          <h1 className="mb-2 text-4xl font-bold text-[#0e1c3d]">404</h1>
          <h2 className="mb-4 text-xl font-semibold text-[#0e1c3d]">Page introuvable</h2>

          <p className="mb-8 text-[#6b7688]">
            Cette adresse n'existe pas ou a ete remplacee par un nouveau parcours QARA.
          </p>

          <Button onClick={() => setLocation(target)}>
            {isAuthenticated ? "Retour dashboard" : "Retour connexion"}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
