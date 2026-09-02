import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { trpc } from "@/lib/trpc";
import { getPlanLabel } from "@/lib/plans";
import {
  BarChart3,
  Bell,
  Brain,
  CalendarClock,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Route as RouteIcon,
  Shield,
  UserCircle,
} from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Audits", path: "/audits", icon: ClipboardCheck },
  { label: "Préparation externe", path: "/preparation", icon: CalendarClock },
  { label: "Classification", path: "/classification", icon: BarChart3 },
  { label: "Voies FDA", path: "/fda", icon: RouteIcon },
  { label: "Amélioration", path: "/improvement", icon: Shield },
  { label: "Veille", path: "/veille", icon: Bell },
  { label: "Intelligence DM", path: "/intelligence", icon: Brain },
  { label: "Rapports", path: "/reports", icon: FileText },
];

type AuthenticatedLayoutProps = {
  children: ReactNode;
};

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { data: profile } = trpc.profile.get.useQuery(undefined, {
    enabled: Boolean(user),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const organization =
    (profile as any)?.companyName ||
    (user as any)?.organizationName ||
    user?.name ||
    "QARA";

  // Referme le tiroir mobile à chaque changement de page (rapport QA
  // 2026-09-02, IMP-4 : sous ~1024 px la sidebar ne se repliait pas et
  // repoussait tout le contenu très bas).
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const sidebarBody = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-[#edf1f6] px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#3b6fe0] text-white">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-bold tracking-wide">QARA</div>
          <div className="text-xs text-[#6b7688]">Compliance workspace</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = location === item.path || location.startsWith(`${item.path}/`);

          return (
            <Link
              key={item.path}
              href={item.path}
              className={[
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-[#e9efff] text-[#2558c7]"
                  : "text-[#344054] hover:bg-[#f4f6f9] hover:text-[#0e1c3d]",
              ].join(" ")}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#edf1f6] p-4">
        <Link href="/account" className="mb-3 flex items-center gap-3 rounded-md p-2 hover:bg-[#f4f6f9]">
          <UserCircle className="h-8 w-8 text-[#3b6fe0]" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{organization}</div>
            <div className="text-xs text-[#6b7688]">{getPlanLabel((profile as any)?.subscriptionTier)}</div>
          </div>
        </Link>
        <Button variant="outline" className="w-full justify-start gap-2" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Deconnexion
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-[#0e1c3d] lg:grid lg:grid-cols-[280px_1fr]">
      {/* Sidebar statique — desktop uniquement */}
      <aside className="hidden border-r border-[#dce3ef] bg-white lg:block lg:min-h-screen">
        {sidebarBody}
      </aside>

      {/* Barre supérieure mobile avec hamburger — < lg uniquement */}
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-[#dce3ef] bg-white px-4 py-3 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Ouvrir le menu"
          onClick={() => setMobileNavOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#3b6fe0] text-white">
            <Shield className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold tracking-wide">QARA</span>
        </div>
      </header>

      {/* Tiroir mobile */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-[280px] bg-white p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          {sidebarBody}
        </SheetContent>
      </Sheet>

      <main className="min-w-0">
        <div className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
