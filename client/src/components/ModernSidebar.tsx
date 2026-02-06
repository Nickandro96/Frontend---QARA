import { useTranslation } from "react-i18next";
import { Link, useLocation } from "wouter";
import {
  Home,
  ClipboardCheck,
  FileText,
  BarChart3,
  Bell,
  Folder,
  FileBarChart,
  Settings,
  CreditCard,
  DollarSign,
  Mail,
  HelpCircle,
  BarChart2,
  FileCheck,
  User,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMarket, Market } from "@/hooks/useMarket";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
// import { getLoginUrl } from "@/const";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function ModernSidebar() {
  const { t, i18n } = useTranslation();
  const [location] = useLocation();
  const { market, setMarket } = useMarket();
  const { user, isAuthenticated } = useAuth();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      window.location.href = '/';
    },
  });

  const euItems = [
    {
      id: "home",
      label: t("nav.home") || "Accueil",
      icon: Home,
      href: "/",
    },
    {
      id: "audit",
      label: t("nav.auditEU") || "Audit MDR",
      icon: ClipboardCheck,
      href: "/mdr/audit",
    },
    {
      id: "iso-qualification",
      label: t("nav.qualificationISO") || "Qualification ISO",
      icon: User,
      href: "/iso/qualification",
    },
    {
      id: "iso-audit",
      label: t("nav.auditISO") || "Audit ISO",
      icon: FileCheck,
      href: "/iso/audit",
    },
    {
      id: "classification",
      label: t("nav.classificationDM") || "Classification MDR",
      icon: FileText,
      href: "/classification",
    },
    {
      id: "dashboard",
      label: t("nav.dashboard") || "Dashboard",
      icon: BarChart3,
      href: "/dashboard",
    },
    {
      id: "veille",
      label: t("nav.veille") || "Veille UE",
      icon: Bell,
      href: "/regulatory-watch",
    },
  ];

  const usItems = [
    {
      id: "home",
      label: t("nav.home") || "Accueil",
      icon: Home,
      href: "/",
    },
    {
      id: "fda-qualification",
      label: "FDA Qualification",
      icon: User,
      href: "/fda/qualification",
    },
    {
      id: "fda-audit",
      label: t("nav.auditFDA") || "FDA Audit",
      icon: ClipboardCheck,
      href: "/fda/audit",
    },
    {
      id: "fda-dashboard",
      label: t("nav.fdaDashboard") || "FDA Dashboard",
      icon: BarChart3,
      href: "/fda-dashboard",
    },
    {
      id: "fda-watch",
      label: t("nav.veilleFDA") || "FDA Watch",
      icon: Bell,
      href: "/fda-regulatory-watch",
    },
  ];

  const transverseItems = [
    {
      id: "documents",
      label: t("nav.documents") || "Documents",
      icon: Folder,
      href: "/documents",
    },
    {
      id: "reports",
      label: t("nav.reports") || "Rapports",
      icon: FileBarChart,
      href: "/reports",
    },
    {
      id: "analytics",
      label: t("nav.analytics") || "Analytics",
      icon: BarChart2,
      href: "/analytics",
    },
    {
      id: "pricing",
      label: t("nav.pricing") || "Pricing",
      icon: DollarSign,
      href: "/pricing",
    },
    {
      id: "subscription",
      label: t("nav.subscription") || "Subscription",
      icon: CreditCard,
      href: "/subscription",
    },
    {
      id: "contact",
      label: t("nav.contact") || "Contact",
      icon: Mail,
      href: "/contact",
    },
    {
      id: "faq",
      label: t("nav.faq") || "FAQ",
      icon: HelpCircle,
      href: "/faq",
    },
    {
      id: "administration",
      label: t("nav.administration") || "Administration",
      icon: Settings,
      href: "/admin/contacts",
    },
  ];

  const navItems = market === "EU" ? [...euItems, ...transverseItems] : [...usItems, ...transverseItems];

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <button className="text-gray-600 hover:text-gray-900">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="width" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="ml-3 text-sm font-medium text-gray-700">Navigation</span>
      </div>

      {/* Market Selector */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex gap-2">
          <button
            onClick={() => setMarket("EU")}
            className={cn(
              "flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors",
              market === "EU"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            🇪🇺 EU
          </button>
          <button
            onClick={() => setMarket("US")}
            className={cn(
              "flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors",
              market === "US"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            🇺🇸 US
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <li key={String(item.id ?? Math.random())}>
                <Link href={String(item.href ?? "/")}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-normal transition-colors cursor-pointer",
                      active
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="flex-1">{String(item.label ?? "")}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Menu */}
      <div className="p-4 border-t border-gray-200">
        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full flex items-center gap-3 px-3 py-2 justify-start">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {String(user?.name?.substring(0, 2) ?? "U").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left overflow-hidden">
                  <p className="text-sm font-medium truncate">{String(user?.name ?? "")}</p>
                  <p className="text-xs text-muted-foreground">
                    {String(user?.role ?? "FREE").toUpperCase()}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-sm">
                <p className="font-medium">{String(user?.name ?? "")}</p>
                <p className="text-xs text-muted-foreground">{String(user?.email ?? "")}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {String(user?.role ?? "USER").toUpperCase()}
                  </span>
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                  <User className="h-4 w-4" />
                  {t("common.profile")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/subscription" className="flex items-center gap-2 cursor-pointer">
                  <CreditCard className="h-4 w-4" />
                  {t("common.subscription")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="flex items-center gap-2 cursor-pointer text-red-600"
                onClick={() => {
                  logoutMutation.mutate();
                }}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="h-4 w-4" />
                {logoutMutation.isPending ? "Déconnexion..." : t("common.logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link href="/login" className="w-full">
            <Button className="w-full">
              {t("common.login")}
            </Button>
          </Link>
        )}
      </div>

      {/* Language Selector */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => i18n.changeLanguage(i18n.language === "fr" ? "en" : "fr")}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
        >
          <span className="text-lg">{i18n.language === "fr" ? "🇫🇷" : "🇺🇸"}</span>
          <span className="font-medium">{i18n.language === "fr" ? "FR" : "EN"}</span>
        </button>
      </div>
    </aside>
  );
}
