import { CockpitSidebar } from "@/components/CockpitSidebar";
import { Link } from "wouter";
import {
  ClipboardCheck,
  Shapes,
  Route as RouteIcon,
  FileText,
  Plus,
  Settings2,
  ArrowRight,
  Bell,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

/**
 * Dashboard d'accueil — spec figée docs/design-passation/SPEC-dashboard-accueil.md
 * + amendement A1 (normes transverses ISO 14971/9001 en bandeau compact,
 * décrit dans le prompt de mission — voir PROGRESS-dashboard.md).
 * Remplace ModernHome.tsx sur la route "/". Voir PROGRESS-dashboard.md pour
 * le détail des données réelles vs démonstration (§Mapping données).
 */

type ReferentialCode = "MDR" | "IVDR" | "FDA_QMSR" | "MDSAP" | "ISO13485" | "ISO14971" | "ISO9001";

const REFERENTIAL_META: Record<
  ReferentialCode,
  { label: string; sub: string; badge: string; bg: string; fg: string; tools: { icon: any; label: string }[] }
> = {
  MDR: {
    label: "MDR 2017/745",
    sub: "Dispositifs médicaux · UE",
    badge: "MDR",
    bg: "#e8eefb",
    fg: "#2563eb",
    tools: [
      { icon: ClipboardCheck, label: "Audit" },
      { icon: Shapes, label: "Classe DM" },
      { icon: FileText, label: "Rapport" },
    ],
  },
  IVDR: {
    label: "IVDR 2017/746",
    sub: "Diagnostic in vitro · UE",
    badge: "IVDR",
    bg: "#fdeef0",
    fg: "#be123c",
    tools: [
      { icon: ClipboardCheck, label: "Audit" },
      { icon: Shapes, label: "Classe A/B/C/D" },
      { icon: FileText, label: "Rapport" },
    ],
  },
  FDA_QMSR: {
    label: "FDA QMSR",
    sub: "21 CFR 820 · États-Unis",
    badge: "FDA",
    bg: "#eaf3ec",
    fg: "#16794c",
    tools: [
      { icon: ClipboardCheck, label: "Audit" },
      { icon: RouteIcon, label: "Voie 510(k)/PMA" },
      { icon: FileText, label: "Rapport" },
    ],
  },
  MDSAP: {
    label: "MDSAP",
    sub: "Programme multi-juridictions",
    badge: "MDSAP",
    bg: "#eef1f5",
    fg: "#475569",
    tools: [
      { icon: ClipboardCheck, label: "Audit" },
      { icon: FileText, label: "Rapport" },
    ],
  },
  ISO13485: {
    label: "ISO 13485",
    sub: "SMQ · 2016",
    badge: "ISO",
    bg: "#f0edfa",
    fg: "#6d28d9",
    tools: [
      { icon: ClipboardCheck, label: "Audit" },
      { icon: FileText, label: "Rapport" },
    ],
  },
  ISO14971: { label: "ISO 14971", sub: "Gestion des risques · 2019", badge: "ISO", bg: "#fef1e0", fg: "#b45309", tools: [] },
  ISO9001: { label: "ISO 9001", sub: "SMQ générique · 2015", badge: "ISO", bg: "#eef1f5", fg: "#475569", tools: [] },
};

const PRODUCT_REFS: ReferentialCode[] = ["MDR", "IVDR", "FDA_QMSR", "MDSAP", "ISO13485"];
const TRANSVERSE_REFS: ReferentialCode[] = ["ISO14971", "ISO9001"];

function scoreColor(score: number) {
  if (score >= 80) return "#16a34a";
  if (score >= 50) return "#eab308";
  return "#dc2626";
}

// TODO(data): aucune procédure n'agrège un score par référentiel — voir
// PROGRESS-dashboard.md §Mapping données. Valeur de démonstration en attendant
// dashboard.getScoring branché référentiel par référentiel.
const DEMO_SCORE_BY_REF: Partial<Record<ReferentialCode, number>> = {
  MDR: 82,
  IVDR: 58,
  FDA_QMSR: 64,
  MDSAP: 70,
  ISO13485: 88,
  ISO14971: 74,
  ISO9001: 91,
};

function statusLabel(status?: string) {
  switch (status) {
    case "completed":
      return "Terminé";
    case "in_progress":
      return "En cours";
    case "draft":
      return "Brouillon";
    default:
      return status || "—";
  }
}

export default function DashboardHome() {
  const { data: profile } = trpc.profile.get.useQuery();
  const { data: kpis } = trpc.dashboard.getKPIs.useQuery();
  const { data: scope } = trpc.onboarding.getMyScope.useQuery();
  const { data: recentAudits } = trpc.audit.getRecentAudits.useQuery({ limit: 5 });
  const { data: watch } = trpc.watch.updates.useQuery({ limit: 3 });

  const activeCodes = new Set<ReferentialCode>((scope?.referentialCodes ?? []) as ReferentialCode[]);
  const activeProductRefs = PRODUCT_REFS.filter((c) => activeCodes.has(c));
  const activeTransverseRefs = TRANSVERSE_REFS.filter((c) => activeCodes.has(c));
  const inactiveCount = PRODUCT_REFS.length + TRANSVERSE_REFS.length - activeCodes.size;

  const conformite = Math.round(kpis?.scoreGlobal ?? 0);
  const ecarts = kpis?.nonConformitiesCount ?? 0;
  const watchTotal = watch?.items?.length ?? 0;

  const orgName = profile?.companyName || profile?.name || "votre organisation";

  return (
    <>
      <CockpitSidebar />
      <div className="ml-[194px] min-h-screen bg-[#f4f6f9]">
        <div className="mx-auto max-w-[1280px] px-6 py-[22px] lg:px-[26px]">
          {/* En-tête */}
          <div className="mb-[18px] flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[19px] font-semibold tracking-[-0.3px] text-[#0e1c3d]">
                Bonjour, ravi de vous revoir
              </div>
              <div className="text-[12px] text-[#6b7688]">
                {orgName} · {activeCodes.size} référentiel{activeCodes.size > 1 ? "s" : ""} actif
                {activeCodes.size > 1 ? "s" : ""}
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/onboarding">
                <button className="flex items-center gap-1.5 rounded-lg border border-[#dfe4ea] bg-white px-[13px] py-[9px] text-[12px] text-[#334155]">
                  <Settings2 className="h-3.5 w-3.5" />
                  Gérer mes référentiels
                </button>
              </Link>
              <Link href="/mdr/audit">
                <button className="flex items-center gap-1.5 rounded-lg bg-[#3b6fe0] px-[13px] py-[9px] text-[12px] font-medium text-white">
                  <Plus className="h-3.5 w-3.5" />
                  Nouvel audit
                </button>
              </Link>
            </div>
          </div>

          {/* Bandeau 4 indicateurs */}
          <div className="mb-5 grid grid-cols-2 gap-[10px] lg:grid-cols-4">
            <div className="rounded-[11px] border border-[#dfe4ea] bg-white p-[13px_15px]">
              <div className="text-[11px] text-[#6b7688]">Conformité globale</div>
              <div className="mt-0.5 text-[22px] font-semibold text-[#0e1c3d]">{conformite}%</div>
              <div className="mt-[7px] h-1 rounded-full bg-[#eef1f5]">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${conformite}%`, background: scoreColor(conformite) }}
                />
              </div>
            </div>
            <div className="rounded-[11px] border border-[#dfe4ea] bg-white p-[13px_15px]">
              <div className="text-[11px] text-[#6b7688]">Écarts ouverts</div>
              <div className="mt-0.5 text-[22px] font-semibold text-[#0e1c3d]">{ecarts}</div>
              {/* TODO(data): répartition par criticité non exposée par getKPIs */}
              <div className="mt-[7px] text-[10px] text-[#9aa3b2]">Détail par criticité à venir</div>
            </div>
            <div className="rounded-[11px] border border-[#dfe4ea] bg-white p-[13px_15px]">
              <div className="text-[11px] text-[#6b7688]">Dispositifs classés</div>
              {/* TODO(data): pas d'historique de classification persistée côté backend */}
              <div className="mt-0.5 text-[22px] font-semibold text-[#0e1c3d]">—</div>
              <div className="mt-[7px] text-[10px] text-[#9aa3b2]">Bientôt disponible</div>
            </div>
            <div className="rounded-[11px] border border-[#dfe4ea] bg-white p-[13px_15px]">
              <div className="text-[11px] text-[#6b7688]">Alertes de veille</div>
              <div className="mt-0.5 text-[22px] font-semibold text-[#0e1c3d]">{watchTotal}</div>
              <div className="mt-[7px] text-[10px] text-[#c2410c]">À consulter</div>
            </div>
          </div>

          {/* Référentiels actifs */}
          <div className="mb-[11px] text-[13px] font-semibold text-[#0e1c3d]">Vos référentiels actifs</div>
          <div className="mb-[18px] grid grid-cols-1 gap-[11px] md:grid-cols-2">
            {activeProductRefs.map((code) => {
              const meta = REFERENTIAL_META[code];
              const score = DEMO_SCORE_BY_REF[code] ?? 0;
              return (
                <div key={code} className="rounded-[13px] border border-[#dfe4ea] bg-white p-[15px_16px]">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-[9px]">
                      <div
                        className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] text-[11px] font-semibold"
                        style={{ background: meta.bg, color: meta.fg }}
                      >
                        {meta.badge}
                      </div>
                      <div>
                        <div className="text-[13px] font-semibold text-[#0e1c3d]">{meta.label}</div>
                        <div className="text-[10px] text-[#6b7688]">{meta.sub}</div>
                      </div>
                    </div>
                    <div className="text-[15px] font-semibold" style={{ color: scoreColor(score) }}>
                      {score}%
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {meta.tools.map((tool) => (
                      <div
                        key={tool.label}
                        className="flex items-center gap-1 rounded-[7px] border px-2 py-1 text-[10px]"
                        style={{ background: meta.bg, color: meta.fg, borderColor: meta.bg }}
                      >
                        <tool.icon className="h-3 w-3" />
                        {tool.label}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {inactiveCount > 0 && (
              <Link href="/onboarding">
                <div className="flex min-h-[110px] cursor-pointer items-center justify-center rounded-[13px] border border-dashed border-[#c4ccd6] bg-white/60 p-[15px_16px] text-[12px] text-[#6b7688] hover:bg-white">
                  <Plus className="mr-1.5 h-4 w-4" /> Activer un référentiel
                </div>
              </Link>
            )}
          </div>

          {/* Normes transverses — amendement A1 */}
          {activeTransverseRefs.length > 0 && (
            <div className="mb-[18px]">
              <div className="mb-[11px] text-[13px] font-semibold text-[#0e1c3d]">Normes transverses</div>
              <div className="rounded-[13px] border border-[#dfe4ea] bg-white">
                {activeTransverseRefs.map((code, idx) => {
                  const meta = REFERENTIAL_META[code];
                  const score = DEMO_SCORE_BY_REF[code] ?? 0;
                  return (
                    <Link key={code} href="/iso/audit">
                      <div
                        className={`flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-[#f7f9fc] ${
                          idx > 0 ? "border-t border-[#eef1f5]" : ""
                        }`}
                      >
                        <div
                          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px] text-[10px] font-semibold"
                          style={{ background: meta.bg, color: meta.fg }}
                        >
                          {meta.badge}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-medium text-[#0e1c3d]">{meta.label}</div>
                          <div className="text-[10px] text-[#6b7688]">{meta.sub} · Audit · Rapport</div>
                        </div>
                        <div className="text-[13px] font-semibold" style={{ color: scoreColor(score) }}>
                          {score}%
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Colonnes basses */}
          <div className="grid grid-cols-1 gap-[11px] lg:grid-cols-[1.25fr_1fr]">
            <div className="rounded-[13px] border border-[#dfe4ea] bg-white p-[15px]">
              <div className="mb-[11px] text-[12px] font-semibold text-[#0e1c3d]">Travaux en cours</div>
              <div className="flex flex-col gap-[9px]">
                {(recentAudits ?? [])
                  .filter((a: any) => a.status !== "completed")
                  .map((audit: any) => (
                    <Link key={audit.id} href={`/mdr/audit/${audit.id}`}>
                      <div className="flex cursor-pointer items-center gap-[10px]">
                        <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[8px] bg-[#e8eefb]">
                          <ClipboardCheck className="h-[15px] w-[15px] text-[#2563eb]" />
                        </div>
                        <div className="flex-1">
                          <div className="text-[12px] text-[#0e1c3d]">{audit.name}</div>
                          <div className="text-[10px] text-[#9aa3b2]">{statusLabel(audit.status)}</div>
                        </div>
                        <span className="text-[11px] font-medium text-[#3b6fe0]">Reprendre</span>
                      </div>
                    </Link>
                  ))}
                {(recentAudits ?? []).filter((a: any) => a.status !== "completed").length === 0 && (
                  <div className="text-[12px] text-[#9aa3b2]">Aucun travail en cours pour le moment.</div>
                )}
              </div>
            </div>

            <div className="rounded-[13px] border border-[#dfe4ea] bg-white p-[15px]">
              <div className="mb-[11px] flex items-center justify-between">
                <span className="text-[12px] font-semibold text-[#0e1c3d]">Veille réglementaire</span>
                {watchTotal > 0 && (
                  <span className="rounded-full bg-[#fef1e7] px-2 py-0.5 text-[10px] text-[#c2410c]">
                    {watchTotal} nouvelle{watchTotal > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-[10px]">
                {(watch?.items ?? []).map((item: any) => (
                  <div key={item.id} className="flex gap-[9px]">
                    <div className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-[7px] bg-[#e8eefb]">
                      <Bell className="h-3 w-3 text-[#2563eb]" />
                    </div>
                    <div>
                      <div className="text-[11px] leading-[1.35] text-[#0e1c3d]">{item.title ?? item.name}</div>
                      <div className="text-[10px] text-[#9aa3b2]">{item.publishedAt ?? item.createdAt ?? ""}</div>
                    </div>
                  </div>
                ))}
                {(watch?.items ?? []).length === 0 && (
                  <div className="text-[12px] text-[#9aa3b2]">Aucune alerte pour le moment.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
