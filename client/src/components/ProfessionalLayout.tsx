import { ReactNode } from "react";
import { ProfessionalSidebar } from "./ProfessionalSidebar";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ProfessionalLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export function ProfessionalLayout({ children, showSidebar = true }: ProfessionalLayoutProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const logoutMutation = trpc.auth.logout.useMutation();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      window.location.href = "/";
    } catch (error) {
      toast({
        title: t("auth.logoutError") || "Erreur",
        description: t("auth.logoutErrorMessage") || "Impossible de se déconnecter",
        variant: "destructive",
      });
    }
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-surface border-b border-border-light z-50">
        <div className="h-full px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/>">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 bg-accent-primary rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="font-semibold text-lg text-text-primary">
                MDR Compliance Platform
              </span>
            </div>
          </Link>
          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  {i18n.language === "fr" ? "🇫🇷 Français" : "🇺🇸 English"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => changeLanguage("fr")}>
                  🇫🇷 Français
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage("en")}>
                  🇺🇸 English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Pricing Link */}
            <Link href="/pricing">
              <Button variant="ghost" size="sm">
                {t("nav.pricing") || "Pricing"}
              </Button>
            </Link>

            {/* User Menu */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {user.name || user.email}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                      <div className="w-full cursor-pointer">{t("nav.dashboard") || "Dashboard"}</div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/subscription">
                      <div className="w-full cursor-pointer">{t("nav.subscription") || "My subscription"}</div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    {t("auth.logout") || "Logout"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-16">
        {showSidebar && <ProfessionalSidebar />}
        <main className={showSidebar ? "ml-64" : ""}>
          {children}
        </main>
      </div>
    </div>
  );
}
