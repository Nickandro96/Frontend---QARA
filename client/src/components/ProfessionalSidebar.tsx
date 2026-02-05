import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import {
  ClipboardCheck,
  FileText,
  Bell,
  BarChart3,
  FolderOpen,
  Settings,
  ChevronRight,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: string;
  children?: NavItem[];
}

export function ProfessionalSidebar() {
  const { t } = useTranslation();
  const [location] = useLocation();

  const navSections: { title: string; items: NavItem[] }[] = [
    {
      title: "",
      items: [
        {
          id: "home",
          label: t("nav.home") || "Accueil",
          icon: Home,
          href: "/",
        },
        {
          id: "dashboard",
          label: t("nav.dashboard") || "Dashboard",
          icon: BarChart3,
          href: "/dashboard",
        },
      ],
    },
    {
      title: t("nav.sections.audit") || "Audit & Assessments",
      items: [
        {
          id: "audit-ue",
          label: t("nav.auditEU") || "Audit de Conformité (UE)",
          icon: ClipboardCheck,
          href: "/audit",
        },
        {
          id: "audit-fda",
          label: t("nav.auditFDA") || "FDA Audit (US)",
          icon: ClipboardCheck,
          href: "/audit",
        },
      ],
    },
    {
      title: t("nav.sections.classification") || "Classification & Submissions",
      items: [
        {
          id: "classification-dm",
          label: t("nav.classificationDM") || "Classification DM",
          icon: FileText,
          href: "/classification",
        },
        {
          id: "classification-fda",
          label: t("nav.classificationFDA") || "Classification FDA (US)",
          icon: FileText,
          href: "/classification",
        },
      ],
    },
    {
      title: t("nav.sections.intelligence") || "Intelligence réglementaire",
      items: [
        {
          id: "veille",
          label: t("nav.veille") || "Veille Réglementaire",
          icon: Bell,
          href: "/veille",
        },
        {
          id: "veille-fda",
          label: t("nav.veilleFDA") || "Veille Réglementaire FDA",
          icon: Bell,
          href: "/veille",
        },
      ],
    },
    {
      title: t("nav.sections.dashboards") || "Dashboards & KPI",
      items: [
        {
          id: "analytics",
          label: t("nav.analytics") || "Dashboard Analytique",
          icon: BarChart3,
          href: "/analytics",
        },
      ],
    },
    {
      title: t("nav.sections.documents") || "Documents & Exports",
      items: [
        {
          id: "documents",
          label: t("nav.documents") || "Gestion Documentaire",
          icon: FolderOpen,
          href: "/documents",
        },
        {
          id: "reports",
          label: t("nav.reports") || "Rapports & Exports",
          icon: FileText,
          href: "/reports",
        },
      ],
    },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-surface border-r border-border-light overflow-y-auto">
      <nav className="p-4 space-y-8">
        {navSections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            {section.title && (
              <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3 px-3">
                {section.title}
              </h3>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                
                return (
                  <li key={item.id}>
                    <Link href={item.href}>
                      <div
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all cursor-pointer",
                          active
                            ? "bg-accent-primary text-white shadow-sm"
                            : "text-text-secondary hover:bg-background hover:text-text-primary"
                        )}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge && (
                          <span className="px-2 py-0.5 text-xs font-semibold bg-warning-100 text-warning-700 rounded-full">
                            {item.badge}
                          </span>
                        )}
                        {item.children && (
                          <ChevronRight className="w-4 h-4 flex-shrink-0" />
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
