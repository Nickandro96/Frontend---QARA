export type ActiveReferential =
  | "mdr"
  | "ivdr"
  | "fda-qmsr"
  | "mdsap"
  | "iso-13485"
  | "iso-14971"
  | "iso-9001";

export type ReferentialKind = "primary" | "transverse";

export type ReferentialCatalogItem = {
  id: ActiveReferential;
  kind: ReferentialKind;
  label: string;
  title: string;
  description: string;
};

export const REFERENTIAL_CATALOG: ReferentialCatalogItem[] = [
  { id: "mdr", kind: "primary", label: "MDR", title: "MDR 2017/745", description: "Reglement (UE) 2017/745" },
  { id: "ivdr", kind: "primary", label: "IVDR", title: "IVDR 2017/746", description: "Reglement (UE) 2017/746" },
  { id: "fda-qmsr", kind: "primary", label: "FDA", title: "FDA QMSR", description: "Qualite et voie US" },
  { id: "mdsap", kind: "primary", label: "MDSAP", title: "MDSAP", description: "Programme multi-marches" },
  { id: "iso-13485", kind: "primary", label: "ISO", title: "ISO 13485", description: "Systeme qualite DM" },
  { id: "iso-14971", kind: "transverse", label: "ISO", title: "ISO 14971", description: "Gestion des risques" },
  { id: "iso-9001", kind: "transverse", label: "ISO", title: "ISO 9001", description: "Qualite transverse" },
];

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

function asReferentialArray(value: unknown): ActiveReferential[] {
  const allowed = new Set(REFERENTIAL_CATALOG.map((item) => item.id));
  return asStringArray(value).filter((item): item is ActiveReferential => allowed.has(item as ActiveReferential));
}

export function readOnboardingState(): OnboardingState {
  if (typeof window === "undefined") return DEFAULT_STATE;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<OnboardingState>;

    return {
      referentials: asReferentialArray(parsed.referentials),
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
    ...asReferentialArray(value?.activeFrameworks),
    ...asReferentialArray(value?.activeReferentials),
    ...asReferentialArray(value?.referentials),
  ];

  if (fromProfile.length > 0) return Array.from(new Set(fromProfile));
  return readOnboardingState().referentials;
}

export function hasActiveReferential(profile: unknown) {
  return getActiveReferentials(profile).length > 0;
}
