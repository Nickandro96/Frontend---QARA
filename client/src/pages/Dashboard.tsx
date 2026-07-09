import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { getActiveReferentials, REFERENTIAL_CATALOG, type ActiveReferential } from "@/lib/onboarding";
import { getPlanLabel } from "@/lib/plans";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Layers3,
  Loader2,
  Plus,
  Settings,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { useMemo } from "react";
import { Link, Redirect } from "wouter";

type ScoreTone = "success" | "warning" | "danger";

type ReferenceCard = {
  key: ActiveReferential;
  label: string;
  title: string;
  score: number;
  tools: string[];
  badgeBg: string;
  badgeColor: string;
  href: string;
};

type WorkItem = {
  title: string;
  meta: string;
  progress: number;
  href: string;
};

type WatchItem = {
  title: string;
  meta: string;
  severity: string;
};

const REFERENCE_META: Record<ActiveReferential, Omit<ReferenceCard, "score">> = {
  mdr: {
    key: "mdr",
    label: "MDR",
    title: "MDR 2017/745",
    tools: ["Audit", "Classe DM", "Rapport"],
    badgeBg: "#e8eefb",
    badgeColor: "#2563eb",
    href: "/audits",
  },
  ivdr: {
    key: "ivdr",
    label: "IVDR",
    title: "IVDR 2017/746",
    tools: ["Audit", "Classe A/B/C/D", "Rapport"],
    badgeBg: "#fdeef0",
    badgeColor: "#be123c",
    href: "/audits",
  },
  "fda-qmsr": {
    key: "fda-qmsr",
    label: "FDA",
    title: "FDA QMSR",
    tools: ["Audit", "Voie 510(k)/PMA", "Rapport"],
    badgeBg: "#eaf3ec",
    badgeColor: "#16794c",
    href: "/audits",
  },
  mdsap: {
    key: "mdsap",
    label: "MDSAP",
    title: "MDSAP",
    tools: ["Audit", "Rapport"],
    badgeBg: "#eaf3ec",
    badgeColor: "#16794c",
    href: "/audits",
  },
  "iso-13485": {
    key: "iso-13485",
    label: "ISO",
    title: "ISO 13485",
    tools: ["Audit", "Rapport"],
    badgeBg: "#f0edfa",
    badgeColor: "#6d28d9",
    href: "/iso/audit",
  },
  "iso-14971": {
    key: "iso-14971",
    label: "ISO",
    title: "ISO 14971",
    tools: ["Audit", "Rapport"],
    badgeBg: "#fef1e0",
    badgeColor: "#b45309",
    href: "/iso/audit",
  },
  "iso-9001": {
    key: "iso-9001",
    label: "ISO",
    title: "ISO 9001",
    tools: ["Audit", "Rapport"],
    badgeBg: "#eef1f5",
    badgeColor: "#475569",
    href: "/iso/audit",
  },
};

function scoreTone(score: number): ScoreTone {
  if (score >= 80) return "success";
  if (score >= 50) return "warning";
  return "danger";
}

function scoreColor(score: number) {
  const tone = scoreTone(score);
  if (tone === "success") return "#16a34a";
  if (tone === "warning") return "#eab308";
  return "#dc2626";
}

function formatPercent(value: number) {
  return `${Math.round(Number.isFinite(value) ? value : 0)}%`;
}

function clampProgress(value: unknown) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(Math.max(numeric, 0), 100);
}

export default function Dashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const { data: profile, isLoading: profileLoading } = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated });
  const { data: kpiData } = trpc.dashboard.getKPIs.useQuery(undefined, { enabled: isAuthenticated });
  const { data: recentFindings } = trpc.dashboard.getRecentFindings.useQuery(
    { limit: 4 },
    { enabled: isAuthenticated },
  );
  const { data: recentAudits } = trpc.audit.getRecentAudits.useQuery({ limit: 5 }, { enabled: isAuthenticated });

  const activeReferentials = useMemo(
    () => getActiveReferentials(profile) as ActiveReferential[],
    [profile],
  );
  const activeKeys = useMemo(() => new Set(activeReferentials), [activeReferentials.join("|")]);

  const safeKPIs = useMemo(() => {
    return {
      scoreGlobal: Number((kpiData as any)?.scoreGlobal ?? 0),
      nonConformitiesCount: Number((kpiData as any)?.nonConformitiesCount ?? 0),
      classifiedDevices: Number((kpiData as any)?.classifiedDevices ?? 0),
      watchAlerts: Number((kpiData as any)?.watchAlerts ?? 0),
    };
  }, [kpiData]);

  const references = useMemo<ReferenceCard[]>(() => {
    const frameworkScores = (kpiData as any)?.frameworkScores ?? {};
    return REFERENTIAL_CATALOG.filter((item) => item.kind === "primary" && activeKeys.has(item.id)).map((item) => ({
      ...REFERENCE_META[item.id],
      score: Number(frameworkScores[item.id] ?? 0),
    }));
  }, [activeKeys, kpiData]);

  const transverseStandards = useMemo<ReferenceCard[]>(() => {
    const frameworkScores = (kpiData as any)?.frameworkScores ?? {};
    return REFERENTIAL_CATALOG.filter((item) => item.kind === "transverse" && activeKeys.has(item.id)).map((item) => ({
      ...REFERENCE_META[item.id],
      score: Number(frameworkScores[item.id] ?? 0),
    }));
  }, [activeKeys, kpiData]);

  const workItems = useMemo<WorkItem[]>(() => {
    const audits = Array.isArray(recentAudits) ? recentAudits : [];
    return audits.slice(0, 4).map((audit: any, index) => ({
      title: audit?.title ?? audit?.name ?? `Audit en cours ${index + 1}`,
      meta: audit?.framework ?? audit?.type ?? "Audit",
      progress: clampProgress(audit?.progression ?? audit?.progress),
      href: audit?.id ? `/audit/${audit.id}` : "/audits",
    }));
  }, [recentAudits]);

  const watchItems = useMemo<WatchItem[]>(() => {
    const findings = Array.isArray(recentFindings) ? recentFindings : [];
    return findings.slice(0, 3).map((finding: any) => ({
      title: finding?.title ?? finding?.description ?? "Point reglementaire a suivre",
      meta: finding?.framework ?? finding?.process ?? "Referentiel",
      severity: finding?.criticality ?? finding?.severity ?? "A verifier",
    }));
  }, [recentFindings]);

  if (loading || (isAuthenticated && profileLoading)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#3b6fe0]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  if (activeReferentials.length === 0) {
    return <Redirect to="/onboarding" />;
  }

  const companyName = (profile as any)?.companyName || (user as any)?.organizationName || user?.name || "QARA";
  const planLabel = getPlanLabel(profile);

  return (
    <div className="text-[#0e1c3d]">
      <header className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-medium text-[#6b7688] ring-1 ring-[#dfe4ea]">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#16a34a]" />
            {companyName} - {planLabel}
          </div>
          <h1 className="text-[26px] font-semibold leading-tight tracking-normal text-[#0e1c3d]">
            Tableau de bord
          </h1>
          <p className="mt-1 text-[13px] text-[#6b7688]">
            Vue consolidee de vos referentiels, audits, classifications et veille reglementaire.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/onboarding">
            <button className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#dfe4ea] bg-white px-3 text-[12px] font-medium text-[#0e1c3d] shadow-sm transition hover:border-[#c3ccd9]">
              <Settings className="h-4 w-4" />
              Gerer mes referentiels
            </button>
          </Link>
          <Link href="/audits">
            <button className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#3b6fe0] px-3 text-[12px] font-medium text-white shadow-sm transition hover:bg-[#2f5ec5]">
              <Plus className="h-4 w-4" />
              Nouvel audit
            </button>
          </Link>
        </div>
      </header>

      <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={ShieldCheck} label="Conformite globale" value={formatPercent(safeKPIs.scoreGlobal)} detail="Score consolide" color={scoreColor(safeKPIs.scoreGlobal)} />
        <KpiCard icon={AlertTriangle} label="Ecarts ouverts" value={String(safeKPIs.nonConformitiesCount)} detail="Actions a prioriser" color="#dc2626" />
        <KpiCard icon={Layers3} label="Dispositifs classes" value={String(safeKPIs.classifiedDevices)} detail="MDR, IVDR et FDA" color="#3b6fe0" />
        <KpiCard icon={Bell} label="Alertes de veille" value={String(safeKPIs.watchAlerts)} detail="Evolutions a suivre" color="#eab308" />
      </section>

      <section className="mb-4 rounded-xl bg-white p-4 ring-1 ring-[#dfe4ea]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[13px] font-semibold text-[#0e1c3d]">Vos referentiels actifs</h2>
            <p className="mt-1 text-[11px] text-[#6b7688]">Suite d'outils par referentiel active.</p>
          </div>
        </div>

        <div className="grid gap-[10px] lg:grid-cols-2">
          {references.length > 0 ? (
            references.map((reference) => <ReferenceCardView key={reference.key} reference={reference} />)
          ) : (
            <EmptyPanel
              icon={ShieldCheck}
              title="Aucun referentiel metier actif"
              description="Ajoutez MDR, IVDR, FDA, MDSAP ou ISO 13485 pour afficher les cartes de pilotage."
              actionLabel="Gerer les referentiels"
              href="/onboarding"
            />
          )}

          <Link href="/onboarding">
            <div className="flex min-h-[78px] cursor-pointer items-center justify-center gap-2 rounded-[13px] border border-dashed border-[#c3ccd9] bg-transparent p-3 text-[12px] font-medium text-[#6b7688] transition hover:border-[#3b6fe0] hover:text-[#3b6fe0]">
              <Plus className="h-4 w-4" />
              Activer un referentiel
            </div>
          </Link>
        </div>

        {transverseStandards.length > 0 ? (
          <div className="mt-4">
            <h3 className="text-[13px] font-semibold text-[#0e1c3d]">Normes transverses</h3>
            <p className="mt-1 text-[11px] text-[#6b7688]">
              Gestion des risques et qualite - soutiennent tous vos marches
            </p>
            <div className="mt-2 overflow-hidden rounded-[13px] border border-[#dfe4ea] bg-white">
              {transverseStandards.map((standard, index) => (
                <Link key={standard.key} href={standard.href}>
                  <div
                    className={`grid cursor-pointer grid-cols-[auto_minmax(80px,110px)_1fr_auto_auto] items-center gap-2 px-3 py-2.5 text-[12px] transition hover:bg-[#f8fafc] ${
                      index > 0 ? "border-t border-[#eef1f5]" : ""
                    }`}
                  >
                    <span className="rounded-md px-2 py-1 text-[10px] font-medium" style={{ background: standard.badgeBg, color: standard.badgeColor }}>
                      {standard.label}
                    </span>
                    <span className="font-semibold text-[#0e1c3d]">{standard.title}</span>
                    <span className="min-w-0 truncate text-[#6b7688]">{REFERENCE_META[standard.key].tools.join(" - ")}</span>
                    <span className="hidden text-[#6b7688] sm:inline">Audit - Rapport</span>
                    <span className="min-w-[38px] text-right font-semibold" style={{ color: scoreColor(standard.score) }}>
                      {formatPercent(standard.score)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_1fr]">
        <div className="rounded-xl bg-white p-4 ring-1 ring-[#dfe4ea]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-[#0e1c3d]">Travaux en cours</h2>
            <Link href="/audits">
              <span className="cursor-pointer text-[11px] font-medium text-[#3b6fe0]">Tout voir</span>
            </Link>
          </div>
          <div className="space-y-2">
            {workItems.length > 0 ? (
              workItems.map((item) => (
                <Link key={`${item.title}-${item.meta}`} href={item.href}>
                  <div className="cursor-pointer rounded-lg border border-[#eef1f5] p-3 transition hover:border-[#dfe4ea] hover:bg-[#f8fafc]">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-semibold text-[#0e1c3d]">{item.title}</div>
                        <div className="mt-1 text-[11px] text-[#6b7688]">{item.meta}</div>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-[#9aa5b5]" />
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#eef1f5]">
                      <div className="h-full rounded-full bg-[#3b6fe0]" style={{ width: `${item.progress}%` }} />
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <EmptyPanel
                icon={ClipboardCheck}
                title="Aucun travail en cours"
                description="Lancez votre premier audit pour suivre sa progression ici."
                actionLabel="Lancer votre premier audit"
                href="/audits"
              />
            )}
          </div>
        </div>

        <div className="rounded-xl bg-white p-4 ring-1 ring-[#dfe4ea]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-[#0e1c3d]">Veille reglementaire</h2>
            <Link href="/veille">
              <span className="cursor-pointer text-[11px] font-medium text-[#3b6fe0]">Ouvrir</span>
            </Link>
          </div>
          <div className="space-y-2">
            {watchItems.length > 0 ? (
              watchItems.map((item) => (
                <div key={`${item.title}-${item.meta}`} className="rounded-lg border border-[#eef1f5] p-3">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 rounded-full bg-[#e8eefb] p-1.5 text-[#2563eb]">
                      <Bell className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold leading-snug text-[#0e1c3d]">{item.title}</div>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-[#6b7688]">
                        <span>{item.meta}</span>
                        <span>-</span>
                        <span>{item.severity}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyPanel
                icon={Bell}
                title="Aucune veille active"
                description="Ouvrez la veille pour suivre les changements qui concernent vos referentiels."
                actionLabel="Ouvrir la veille"
                href="/veille"
              />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function ReferenceCardView({ reference }: { reference: ReferenceCard }) {
  return (
    <Link href={reference.href}>
      <div className="cursor-pointer rounded-[13px] border border-[#dfe4ea] bg-white p-3 transition hover:border-[#c3ccd9] hover:shadow-sm">
        <div className="flex items-center gap-2">
          <span className="rounded-md px-2 py-1 text-[10px] font-medium" style={{ background: reference.badgeBg, color: reference.badgeColor }}>
            {reference.label}
          </span>
          <span className="min-w-0 flex-1 text-[13px] font-semibold text-[#0e1c3d]">{reference.title}</span>
          <span className="text-[15px] font-semibold" style={{ color: scoreColor(reference.score) }}>
            {formatPercent(reference.score)}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {reference.tools.map((tool) => (
            <span key={tool} className="rounded-full bg-[#f4f6f9] px-2 py-1 text-[11px] text-[#6b7688]">
              {tool}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

function EmptyPanel({
  icon: Icon,
  title,
  description,
  actionLabel,
  href,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  href: string;
}) {
  return (
    <div className="rounded-[13px] border border-dashed border-[#c3ccd9] bg-[#f8fafc] p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-[#e9efff] p-2 text-[#3b6fe0]">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-[#0e1c3d]">{title}</div>
          <p className="mt-1 text-[12px] leading-5 text-[#6b7688]">{description}</p>
          <Link href={href}>
            <span className="mt-3 inline-flex cursor-pointer text-[12px] font-semibold text-[#3b6fe0]">
              {actionLabel}
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  detail,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  color: string;
}) {
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-[#dfe4ea]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-medium text-[#6b7688]">{label}</div>
          <div className="mt-2 text-[25px] font-semibold leading-none text-[#0e1c3d]">{value}</div>
          <div className="mt-2 text-[11px] text-[#6b7688]">{detail}</div>
        </div>
        <div className="rounded-lg p-2" style={{ background: `${color}16`, color }}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
