export type ImpactLevel = "Low" | "Medium" | "High" | "Critical";

export type WatchActionItem = {
  id: string;
  title: string;
  owner: string;
  dueDays: number;
  deliverables: string[];
  expectedEvidence: string[];
};

export type PersonalizedImpact = {
  impactLevel: ImpactLevel;
  reasons: string[];
  plan30: WatchActionItem[];
  plan60: WatchActionItem[];
  plan90: WatchActionItem[];
  sopDocsToUpdate: string[];
  auditReadinessChecklist: string[];
};

export type WatchUpdate = {
  id: string;
  type: "REGULATION" | "GUIDANCE" | "STANDARD" | "QUALITY";
  title: string;
  summaryShort: string;
  summaryLong: string;
  publishedAt: string | Date;
  status: "NEW" | "UPDATED" | "REPEALED" | "CORRIGENDUM";
  sourceName: string;
  sourceUrl: string;
  jurisdiction: string;
  impactedDomains: string[];
  impactedRoles: string[];
  impactLevel: ImpactLevel;
  risks: string[];
  recommendedActions: WatchActionItem[];
  expectedEvidence: string[];
  personalizedImpact?: PersonalizedImpact;
};

export type WatchMeta = {
  lastRefresh: string | Date | null;
  stale: boolean;
  refreshInProgress: boolean;
  degraded: boolean;
  sourceHealth: { name: string; ok: boolean; message?: string; durationMs?: number; items?: number }[];
};

export type CompanyProfile = {
  economicRole: "fabricant" | "importateur" | "distributeur" | "sous_traitant" | "ar";
  deviceClass: "I" | "IIa" | "IIb" | "III";
  deviceFamilies: ("active" | "non_active" | "implantable" | "sterile" | "software" | "in_vitro")[];
  markets: ("EU" | "UK" | "CH" | "US")[];
};
