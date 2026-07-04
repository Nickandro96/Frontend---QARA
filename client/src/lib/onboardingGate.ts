import { trpc } from "@/lib/trpc";

/**
 * Redirection post-authentification tenant compte du gate d'onboarding
 * (SPEC-onboarding-ecrans.md, "Le gate d'onboarding") : si le périmètre de
 * l'utilisateur n'est pas complet, on l'envoie configurer son audit avant le
 * dashboard. Partagé par Login.tsx et Register.tsx.
 */
export async function redirectAfterAuth(utils: ReturnType<typeof trpc.useUtils>, navigate: (path: string) => void) {
  try {
    const status = await utils.onboarding.getGateStatus.fetch();
    navigate(status.onboardingComplete ? "/" : "/onboarding");
  } catch {
    // Si le statut d'onboarding est indisponible (ex. backend momentanément
    // injoignable), ne pas bloquer la connexion : direction le dashboard.
    navigate("/");
  }
}
