export type PlanTier = "free" | "pro" | "expert" | "entreprise";

export type PlanCapabilities = {
  maxReferentiels: number;
  canUseClassification: boolean;
  canUseFDA: boolean;
  canUseVeille: boolean;
  canExportReports: boolean;
  canUseAI: boolean;
};

// Free : 1 referentiel, audits + score, rapport a l'ecran sans export,
// pas de classification/FDA/veille/IA.
const FREE_CAPABILITIES: PlanCapabilities = {
  maxReferentiels: 1,
  canUseClassification: false,
  canUseFDA: false,
  canUseVeille: false,
  canExportReports: false,
  canUseAI: false,
};

// Pro : tout, sauf l'IA qui reste desactivee tant que la cle API serveur
// n'est pas branchee (jamais de cle en dur dans le code).
const PRO_CAPABILITIES: PlanCapabilities = {
  maxReferentiels: Infinity,
  canUseClassification: true,
  canUseFDA: true,
  canUseVeille: true,
  canExportReports: true,
  canUseAI: false,
};

export const PLAN_LABELS: Record<PlanTier, string> = {
  free: "Plan Free",
  pro: "Plan Pro",
  expert: "Plan Expert",
  entreprise: "Plan Entreprise",
};

export function normalizePlanTier(value: unknown): PlanTier {
  const normalized = typeof value === "string" ? value.toLowerCase() : "free";
  if (normalized === "pro" || normalized === "expert" || normalized === "entreprise") {
    return normalized;
  }
  return "free";
}

export function getPlanCapabilities(tier: unknown): PlanCapabilities {
  return normalizePlanTier(tier) === "free" ? FREE_CAPABILITIES : PRO_CAPABILITIES;
}

export function getPlanLabel(tier: unknown): string {
  return PLAN_LABELS[normalizePlanTier(tier)];
}

type ProfileLike = { subscriptionTier?: unknown } | null | undefined;
type UserLike = { role?: unknown } | null | undefined;

export function getPlanCapabilitiesFromProfile(profile: ProfileLike): PlanCapabilities {
  return getPlanCapabilities(profile?.subscriptionTier);
}

/**
 * Point d'entree unique pour verifier une capacite : les administrateurs
 * conservent l'acces complet historique, tous les autres suivent la matrice
 * du plan de leur profil.
 */
export function hasCapability(
  capability: keyof Omit<PlanCapabilities, "maxReferentiels">,
  profile: ProfileLike,
  user?: UserLike
): boolean {
  if (user?.role === "admin") return true;
  return getPlanCapabilitiesFromProfile(profile)[capability];
}

export function getMaxReferentiels(profile: ProfileLike, user?: UserLike): number {
  if (user?.role === "admin") return Infinity;
  return getPlanCapabilitiesFromProfile(profile).maxReferentiels;
}
