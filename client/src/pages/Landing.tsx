import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { Link } from "wouter";

export default function Landing() {
  // TODO(design): landing definitive a venir.
  return (
    <main className="min-h-screen bg-[#f4f6f9] text-[#0e1c3d]">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#3b6fe0] text-white">
              <Shield className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-wide">QARA</span>
          </div>
          <nav className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost">Connexion</Button>
            </Link>
            <Link href="/signup">
              <Button>Creer un compte</Button>
            </Link>
          </nav>
        </header>

        <section className="flex flex-1 items-center">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#3b6fe0]">
              Compliance medical devices
            </p>
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
              QARA structure vos audits, referentiels et plans d'action qualite-reglementaire.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#5d6a7d]">
              Une plateforme de travail pour piloter MDR, IVDR, FDA, ISO et veille reglementaire sans disperser les preuves.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login">
                <Button size="lg">Connexion</Button>
              </Link>
              <Link href="/signup">
                <Button size="lg" variant="outline">
                  Creer un compte
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
