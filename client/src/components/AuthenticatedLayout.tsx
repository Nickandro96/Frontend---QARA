import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { getPlanLabel } from "@/lib/plans";
import {
  BarChart3,
  Bell,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  Route as RouteIcon,
  Shield,
  UserCircle,
} from "lucide-react";
import { ReactNode } from "react";
import { Link, useLocation } from "wouter";

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Audits", path: "/audits", icon: ClipboardCheck },
  { label: "Classification", path: "/classification", icon: BarChart3 },
  { label: "Voies FDA", path: "/fda", icon: RouteIcon },
  { label: "Plan d'action", path: "/action-plan", icon: FileText },
  { label: "Rapports", path: "/reports", icon: FileText },
  { label: "Veille", path: "/veille", icon: Bell },
];

type AuthenticatedLayoutProps = {
  children: ReactNode;
};

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();
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

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-[#0e1c3d] lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="border-r border-[#dce3ef] bg-white lg:min-h-screen">
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

          <nav className="flex-1 space-y-1 px-3 py-4">
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
      </aside>

      <main className="min-w-0">
        <div className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
