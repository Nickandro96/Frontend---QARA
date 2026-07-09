export type PlanId = "free" | "pro";

export type PlanCapability =
  | "canUseAudits"
  | "canViewReports"
  | "canExportReports"
  | "canUseClassification"
  | "canUseFDA"
  | "canUseVeille"
  | "canUseAI"
  | "canUseActionPlan";

export type PlanMatrix = {
  label: string;
  maxReferentiels: number;
} & Record<PlanCapability, boolean>;

export const PLAN_MATRIX: Record<PlanId, PlanMatrix> = {
  free: {
    label: "Plan Free",
    maxReferentiels: 1,
    canUseAudits: true,
    canViewReports: true,
    canExportReports: false,
    canUseClassification: false,
    canUseFDA: false,
    canUseVeille: false,
    canUseAI: false,
    canUseActionPlan: true,
  },
  pro: {
    label: "Plan Pro",
    maxReferentiels: Number.POSITIVE_INFINITY,
    canUseAudits: true,
    canViewReports: true,
    canExportReports: true,
    canUseClassification: true,
    canUseFDA: true,
    canUseVeille: true,
    canUseAI: false,
    canUseActionPlan: true,
  },
};

const PRO_ALIASES = new Set([
  "pro",
  "professional",
  "professionnel",
  "expert",
  "enterprise",
  "entreprise",
  "premium",
  "paid",
]);

function readString(value: unknown, key: string): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const raw = record[key];
  return typeof raw === "string" ? raw : undefined;
}

export function normalizePlan(plan: unknown): PlanId {
  const value = typeof plan === "string" ? plan.trim().toLowerCase() : "";
  if (PRO_ALIASES.has(value)) return "pro";
  return "free";
}

export function getPlanFromProfile(profile: unknown): PlanId {
  return normalizePlan(
    readString(profile, "subscriptionTier") ||
      readString(profile, "subscriptionPlan") ||
      readString(profile, "plan") ||
      readString(profile, "tier"),
  );
}

export function isAdminUser(user: unknown, profile?: unknown): boolean {
  const role =
    readString(user, "role") ||
    readString(profile, "role") ||
    readString((user as Record<string, unknown> | undefined)?.profile, "role");
  return role?.toLowerCase() === "admin";
}

export function getPlanLabel(profileOrPlan: unknown): string {
  const plan =
    typeof profileOrPlan === "string" ? normalizePlan(profileOrPlan) : getPlanFromProfile(profileOrPlan);
  return PLAN_MATRIX[plan].label;
}

export function canUseCapability(
  profile: unknown,
  capability: PlanCapability,
  user?: unknown,
): boolean {
  if (isAdminUser(user, profile)) return true;
  return PLAN_MATRIX[getPlanFromProfile(profile)][capability];
}

export function getRequiredPlanLabel(capability: PlanCapability): string {
  if (PLAN_MATRIX.free[capability]) return PLAN_MATRIX.free.label;
  return PLAN_MATRIX.pro.label;
}

export function getMaxReferentiels(profile: unknown): number {
  return PLAN_MATRIX[getPlanFromProfile(profile)].maxReferentiels;
}
