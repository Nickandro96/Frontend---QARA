import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  ClipboardCheck,
  Shapes,
  Route as RouteIcon,
  ListChecks,
  FileText,
  Bell,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

/**
 * Sidebar cockpit — spec figée docs/design-passation/SPEC-dashboard-accueil.md
 * + PASSATION-nouvelle-session.md §3. Ne reproduit pas ModernSidebar (marché
 * EU/US, 15 items) : structure trop différente pour être adaptée par prop.
 * Utilisée pour l'instant uniquement par le nouveau dashboard d'accueil
 * (voir PROGRESS-dashboard.md, étape 6 — un écran à la fois).
 */
const NAV_ITEMS = [
  { label: "Tableau de bord", icon: LayoutDashboard, href: "/" },
  { label: "Audits", icon: ClipboardCheck, href: "/audits" },
  { label: "Classification", icon: Shapes, href: "/classification" },
  { label: "Voies FDA", icon: RouteIcon, href: "/us/fda-qualification" },
  { label: "Plan d'action", icon: ListChecks, href: "/action-dashboard" },
  { label: "Rapports", icon: FileText, href: "/reports" },
  { label: "Veille", icon: Bell, href: "/regulatory-watch" },
];

export function CockpitSidebar() {
  const [location] = useLocation();
  const { data: profile } = trpc.profile.get.useQuery();

  const isActive = (href: string) => (href === "/" ? location === "/" : location.startsWith(href));

  const orgName = profile?.companyName || profile?.name || "Mon organisation";
  const plan = profile?.subscriptionTier ? `Plan ${profile.subscriptionTier}` : "Plan Free";
  const initials = orgName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase())
    .join("") || "?";

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-30 flex w-[194px] flex-col gap-[3px] bg-[#0e1c3d] px-[14px] py-5">
      <Link href="/">
        <div className="mb-[22px] flex cursor-pointer items-center gap-[10px] px-2">
          <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-[#3b6fe0]">
            <ShieldCheck className="h-[19px] w-[19px] text-white" />
          </div>
          <span className="text-[18px] font-semibold tracking-[-0.3px] text-white">QARA</span>
        </div>
      </Link>

      <nav className="flex flex-1 flex-col gap-[3px]">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex cursor-pointer items-center gap-[11px] rounded-[9px] px-3 py-[11px] transition-colors",
                  active ? "bg-[#1e335f] text-white" : "text-[#8a99ba] hover:bg-[#152a52]/60"
                )}
              >
                <Icon className="h-[17px] w-[17px] flex-shrink-0" />
                <span className={cn("text-[13px]", active && "font-medium")}>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex items-center gap-[10px] rounded-[11px] bg-[#152a52] p-[11px]">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#3b6fe0] text-[12px] font-semibold text-white">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="truncate text-[12px] font-medium text-white">{orgName}</div>
          <div className="truncate text-[11px] text-[#8a99ba]">{plan}</div>
        </div>
      </div>
    </aside>
  );
}
