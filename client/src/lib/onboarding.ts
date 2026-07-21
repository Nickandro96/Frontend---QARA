export type ActiveReferential =
  | "mdr"
  | "ivdr"
  | "fda-qmsr"
  | "mdsap"
  | "iso-13485"
  | "iso-14971"
  | "iso-9001";

type OnboardingState = {
  referentials: ActiveReferential[];
  economicRole?: string;
  markets: string[];
  completedAt?: string;
};

const STORAGE_KEY = "qara:onboarding";

const DEFAULT_STATE: OnboardingState = {
  referentials: [],
  markets: [],
};

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function readOnboardingState(): OnboardingState {
  if (typeof window === "undefined") return DEFAULT_STATE;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<OnboardingState>;

    return {
      referentials: asStringArray(parsed.referentials) as ActiveReferential[],
      economicRole: typeof parsed.economicRole === "string" ? parsed.economicRole : undefined,
      markets: asStringArray(parsed.markets),
      completedAt: typeof parsed.completedAt === "string" ? parsed.completedAt : undefined,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveOnboardingState(next: OnboardingState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function getActiveReferentials(profile: unknown): string[] {
  const value = profile as Record<string, unknown> | null | undefined;
  const fromProfile = [
    ...asStringArray(value?.activeFrameworks),
    ...asStringArray(value?.activeReferentials),
    ...asStringArray(value?.referentials),
  ];

  if (fromProfile.length > 0) return fromProfile;
  return readOnboardingState().referentials;
}

export function hasActiveReferential(profile: unknown) {
  return getActiveReferentials(profile).length > 0;
}
