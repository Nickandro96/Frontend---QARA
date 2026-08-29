import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { Redirect, Route, Switch, useParams } from "wouter";
import { trpc, trpcClient } from "./lib/trpc";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { AuthenticatedLayout } from "./components/AuthenticatedLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import { HreflangTags } from "./components/HreflangTags";
import { ProtectedRoute } from "./components/routing/ProtectedRoute";
import { PublicOnlyRoute } from "./components/routing/PublicOnlyRoute";
import { ThemeProvider } from "./contexts/ThemeContext";
import ActionDashboard from "./pages/ActionDashboard";
import AdminContacts from "./pages/AdminContacts";
import AdminUsers from "./pages/AdminUsers";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import AuditComparison from "./pages/AuditComparison";
import AuditDetail from "./pages/AuditDetail";
import CapaPlan from "./pages/CapaPlan";
import AuditHistory from "./pages/AuditHistory";
import AuditResults from "./pages/AuditResults";
import AuditsList from "./pages/AuditsList";
import Classification from "./pages/Classification";
import Contact from "./pages/Contact";
import Dashboard from "./pages/Dashboard";
import Documents from "./pages/Documents";
import FAQ from "./pages/FAQ";
import FdaClassification from "./pages/FdaClassification";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ISOAuditReview from "./pages/ISOAuditReview";
import ISOAuditWizard from "./pages/ISOAuditWizard";
import GenericAuditWizard from "./pages/GenericAuditWizard";
import GenericAuditQuestionnaire from "./pages/GenericAuditQuestionnaire";
import ISOQualification from "./pages/ISOQualification";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import MDRAuditReview from "./pages/MDRAuditReview";
import MDRAuditWizard from "./pages/MDRAudit";
import MdrRoutesErrorBoundary from "./components/MdrRoutesErrorBoundary";
import NotFound from "@/pages/NotFound";
import Onboarding from "./pages/Onboarding";
import Pricing from "./pages/Pricing";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import RegulatoryWatch from "./pages/RegulatoryWatch";
import ReportComparative from "./pages/ReportComparative";
import ReportGeneration from "./pages/ReportGeneration";
import ReportHistory from "./pages/ReportHistory";
import Reports from "./pages/Reports";
import SiteManagement from "./pages/SiteManagement";

function PublicPage({ children }: { children: ReactNode }) {
  return <PublicOnlyRoute>{children}</PublicOnlyRoute>;
}

function ProtectedPage({
  children,
  forceOnboarding = true,
}: {
  children: ReactNode;
  forceOnboarding?: boolean;
}) {
  return (
    <ProtectedRoute forceOnboarding={forceOnboarding}>
      <AuthenticatedLayout>{children}</AuthenticatedLayout>
    </ProtectedRoute>
  );
}

function LegacyAuditRedirect() {
  const params = useParams<{ id: string }>();
  return <Redirect to={`/audits/${params.id}`} />;
}

function LegacyQuestionnaireRedirect() {
  const params = useParams<{ auditId: string }>();
  return <Redirect to={`/audit/${params.auditId}/questionnaire`} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <PublicPage>
          <Landing />
        </PublicPage>
      </Route>
      <Route path="/login">
        <PublicPage>
          <Login />
        </PublicPage>
      </Route>
      <Route path="/signup">
        <PublicPage>
          <Register />
        </PublicPage>
      </Route>
      <Route path="/register">
        <Redirect to="/signup" />
      </Route>
      <Route path="/forgot-password">
        <PublicPage>
          <ForgotPassword />
        </PublicPage>
      </Route>
      <Route path="/reset-password">
        <ResetPassword />
      </Route>

      <Route path="/pricing" component={Pricing} />
      <Route path="/contact" component={Contact} />
      <Route path="/faq" component={FAQ} />

      <Route path="/onboarding">
        <ProtectedPage forceOnboarding={false}>
          <Onboarding />
        </ProtectedPage>
      </Route>
      <Route path="/dashboard">
        <ProtectedPage>
          <Dashboard />
        </ProtectedPage>
      </Route>
      <Route path="/audits/:id/capa">
        <ProtectedPage>
          <CapaPlan />
        </ProtectedPage>
      </Route>
      <Route path="/audits/:id">
        <ProtectedPage>
          <AuditDetail />
        </ProtectedPage>
      </Route>
      <Route path="/audits">
        <ProtectedPage>
          <AuditsList />
        </ProtectedPage>
      </Route>
      <Route path="/classification/:id">
        <ProtectedPage>
          <Classification />
        </ProtectedPage>
      </Route>
      <Route path="/classification">
        <ProtectedPage>
          <Classification />
        </ProtectedPage>
      </Route>
      <Route path="/fda/qualification">
        <Redirect to="/fda" />
      </Route>
      <Route path="/fda/audit">
        <Redirect to="/audits" />
      </Route>
      <Route path="/us/fda-qualification">
        <Redirect to="/fda" />
      </Route>
      <Route path="/fda-classification">
        <Redirect to="/fda" />
      </Route>
      <Route path="/us/fda-audit">
        <Redirect to="/audits" />
      </Route>
      <Route path="/fda-audit">
        <Redirect to="/audits" />
      </Route>
      <Route path="/fda-regulatory-watch">
        <Redirect to="/veille" />
      </Route>
      <Route path="/fda-dashboard">
        <Redirect to="/fda" />
      </Route>
      <Route path="/fda-submission-tracker">
        <Redirect to="/fda" />
      </Route>
      <Route path="/us/fda-dashboard">
        <Redirect to="/fda" />
      </Route>
      <Route path="/us/fda-watch">
        <Redirect to="/veille" />
      </Route>
      <Route path="/us/fda-documents">
        <Redirect to="/documents" />
      </Route>
      <Route path="/us/fda-reports">
        <Redirect to="/reports" />
      </Route>
      <Route path="/fda/:id">
        <ProtectedPage>
          <FdaClassification />
        </ProtectedPage>
      </Route>
      <Route path="/fda">
        <ProtectedPage>
          <FdaClassification />
        </ProtectedPage>
      </Route>
      <Route path="/action-plan">
        <ProtectedPage>
          <ActionDashboard />
        </ProtectedPage>
      </Route>
      <Route path="/reports/comparative">
        <ProtectedPage>
          <ReportComparative />
        </ProtectedPage>
      </Route>
      <Route path="/reports/generate">
        <ProtectedPage>
          <ReportGeneration />
        </ProtectedPage>
      </Route>
      <Route path="/reports/history">
        <ProtectedPage>
          <ReportHistory />
        </ProtectedPage>
      </Route>
      <Route path="/reports/:id">
        <ProtectedPage>
          <Reports />
        </ProtectedPage>
      </Route>
      <Route path="/reports">
        <ProtectedPage>
          <Reports />
        </ProtectedPage>
      </Route>
      <Route path="/veille">
        <ProtectedPage>
          <RegulatoryWatch />
        </ProtectedPage>
      </Route>
      <Route path="/account">
        <ProtectedPage forceOnboarding={false}>
          <Profile />
        </ProtectedPage>
      </Route>

      <Route path="/mdr/audit/:auditId/review">
        <ProtectedPage>
          <MDRAuditReview />
        </ProtectedPage>
      </Route>
      <Route path="/mdr/audit/:auditId">
        <LegacyQuestionnaireRedirect />
      </Route>
      <Route path="/mdr/audit">
        <ProtectedPage>
          <MDRAuditWizard />
        </ProtectedPage>
      </Route>
      <Route path="/mdr/*">
        <ProtectedPage>
          <MdrRoutesErrorBoundary />
        </ProtectedPage>
      </Route>
      <Route path="/iso/audit/:auditId/review">
        <ProtectedPage>
          <ISOAuditReview />
        </ProtectedPage>
      </Route>
      <Route path="/iso/audit/:auditId">
        <LegacyQuestionnaireRedirect />
      </Route>
      <Route path="/iso/audit">
        <ProtectedPage>
          <ISOAuditWizard />
        </ProtectedPage>
      </Route>
      {/*
        Wizard générique (étape D, voir CORRECTIONS.md) : sert les
        référentiels sans wizard dédié (IVDR, MDSAP) via le routeur
        backend générique trpc.audit.* (referentialId-agnostique).
        ?ref=IVDR ou ?ref=MDSAP résout le référentiel dynamiquement,
        jamais d'ID en dur.
      */}
      <Route path="/audit/generic">
        <ProtectedPage>
          <GenericAuditWizard />
        </ProtectedPage>
      </Route>
      {/*
        ISOAuditWizard.tsx navigue vers "/iso/qualification" quand la
        qualification n'est pas complétée — route absente jusqu'ici (lien
        mort, voir CORRECTIONS.md LOT 3), alors que ISOQualification.tsx
        existe déjà et utilise les vraies procédures iso.getQualification/
        saveQualification.
      */}
      <Route path="/iso/qualification">
        <ProtectedPage>
          <ISOQualification />
        </ProtectedPage>
      </Route>

      <Route path="/audit-history">
        <ProtectedPage>
          <AuditHistory />
        </ProtectedPage>
      </Route>
      <Route path="/audit/compare">
        <ProtectedPage>
          <AuditComparison />
        </ProtectedPage>
      </Route>
      <Route path="/audit/new">
        <Redirect to="/audit/generic" />
      </Route>
      <Route path="/audit/create">
        <Redirect to="/audit/generic" />
      </Route>
      <Route path="/audit/:auditId/questionnaire">
        <ProtectedPage>
          <GenericAuditQuestionnaire />
        </ProtectedPage>
      </Route>
      <Route path="/audit/:id/results">
        <ProtectedPage>
          <AuditResults />
        </ProtectedPage>
      </Route>
      <Route path="/audit/:id" component={LegacyAuditRedirect} />
      <Route path="/audit">
        <Redirect to="/audits" />
      </Route>

      <Route path="/profile">
        <Redirect to="/account" />
      </Route>
      <Route path="/subscription/success">
        <Redirect to="/account" />
      </Route>
      <Route path="/subscription/cancel">
        <Redirect to="/account" />
      </Route>
      <Route path="/subscription">
        <Redirect to="/account" />
      </Route>
      <Route path="/regulatory-watch">
        <Redirect to="/veille" />
      </Route>
      <Route path="/watch-dashboard">
        <Redirect to="/veille" />
      </Route>
      <Route path="/action-dashboard">
        <Redirect to="/action-plan" />
      </Route>
      <Route path="/dashboard-v2">
        <Redirect to="/dashboard" />
      </Route>
      <Route path="/dashboard-executive">
        <Redirect to="/dashboard" />
      </Route>
      <Route path="/dashboard-executive/">
        <Redirect to="/dashboard" />
      </Route>
      <Route path="/home-old">
        <Redirect to="/dashboard" />
      </Route>

      <Route path="/documents">
        <ProtectedPage>
          <Documents />
        </ProtectedPage>
      </Route>
      <Route path="/settings/sites">
        <ProtectedPage>
          <SiteManagement />
        </ProtectedPage>
      </Route>
      <Route path="/admin/contacts">
        <ProtectedPage>
          <AdminContacts />
        </ProtectedPage>
      </Route>
      <Route path="/admin/users">
        <ProtectedPage>
          <AdminUsers />
        </ProtectedPage>
      </Route>
      <Route path="/analytics">
        <ProtectedPage>
          <AnalyticsDashboard />
        </ProtectedPage>
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <ErrorBoundary>
          <ThemeProvider>
            <TooltipProvider>
              <HreflangTags />
              <Router />
              <Toaster richColors position="top-right" />
            </TooltipProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </trpc.Provider>
    </QueryClientProvider>
  );
}

