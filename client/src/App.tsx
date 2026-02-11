import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ActionDashboard from "./pages/ActionDashboard";
import ModernHome from "./pages/ModernHome";
import Classification from "./pages/Classification";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Reports from "./pages/Reports";
import RegulatoryWatch from "./pages/RegulatoryWatch";
import WatchDashboard from "./pages/WatchDashboard";
import Documents from "./pages/Documents";
import FdaAudit from "./pages/FdaAudit";
import FdaClassification from "./pages/FdaClassification";
import FdaRegulatoryWatch from "./pages/FdaRegulatoryWatch";
import FdaDashboard from "./pages/FdaDashboard";
import FdaSubmissionTracker from "./pages/FdaSubmissionTracker";
import Pricing from "./pages/Pricing";
import Subscription from "./pages/Subscription";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import SubscriptionCancel from "./pages/SubscriptionCancel";
import { HreflangTags } from "./components/HreflangTags";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import AdminContacts from "./pages/AdminContacts";
import AdminUsers from "./pages/AdminUsers";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import DashboardV2 from "./pages/DashboardV2";
import FDAQualification from "./pages/FDAQualification";
import FDAAuditNew from "./pages/FDAAudit";
import ReportGeneration from "./pages/ReportGeneration";
import ReportHistory from "./pages/ReportHistory";
import AuditDetail from "./pages/AuditDetail";
import ReportComparative from "./pages/ReportComparative";
import AuditsList from "./pages/AuditsList";
import MdrRoutesErrorBoundary from "./components/MdrRoutesErrorBoundary";
import ISOQualification from "./pages/ISOQualification";
import ISOAudit from "./pages/ISOAudit";
import AuditHistory from "./pages/AuditHistory";
import AuditResults from "./pages/AuditResults";
import AuditComparison from "./pages/AuditComparison";
import SiteManagement from "./pages/SiteManagement";

/**
 * ✅ MDR Wizard route must be isolated:
 * - /mdr/audit => Wizard only (must NOT trigger mdr.getAuditContext)
 * - /mdr/*     => everything else MDR (including /mdr/audit/:auditId) handled by MDR router
 *
 * IMPORTANT:
 * - Do NOT import a fake questionnaire page here (it broke Vercel build).
 * - Keep /mdr/audit BEFORE /mdr/* (order matters in Wouter).
 */
import MDRAuditWizard from "./pages/MDRAudit";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={ModernHome} />
      <Route path={"/login"} component={Login} />
      <Route path={"/register"} component={Register} />
      <Route path={"/action-dashboard"} component={ActionDashboard} />
      <Route path={"/home-old"} component={Home} />
      <Route path="/classification" component={Classification} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/dashboard-v2"} component={DashboardV2} />

      <Route path={"/fda/qualification"} component={FDAQualification} />
      <Route path={"/fda/audit"} component={FDAAuditNew} />

      {/* ✅ MDR ROUTING FIX (ORDER MATTERS) */}
      <Route path="/mdr/audit" component={MDRAuditWizard} />
      <Route path={"/mdr/*"} component={MdrRoutesErrorBoundary} />

      <Route path={"/iso/qualification"} component={ISOQualification} />
      <Route path="/iso/audit" component={ISOAudit} />

      <Route path="/audit-history" component={AuditHistory} />
      <Route path="/audit/compare" component={AuditComparison} />
      <Route path="/audit/:id/results" component={AuditResults} />
      <Route path="/settings/sites" component={SiteManagement} />

      <Route path={"/profile"} component={Profile} />

      <Route path="/reports/comparative" component={ReportComparative} />
      <Route path="/audits" component={AuditsList} />

      {/* ✅ Aliases pour éviter les 404 (ORDER MATTERS)
          IMPORTANT: redirect to /mdr/audit (wizard) — NOT /mdr/audit/0
      */}
      <Route path="/audit/new">
        <Redirect to="/mdr/audit" />
      </Route>
      <Route path="/audit/create">
        <Redirect to="/mdr/audit" />
      </Route>
      <Route path="/audit">
        <Redirect to="/audits" />
      </Route>

      <Route path={"/audit/:id"} component={AuditDetail} />

      <Route path={"/reports"} component={Reports} />
      <Route path={"/regulatory-watch"} component={RegulatoryWatch} />
      <Route path={"/watch-dashboard"} component={WatchDashboard} />
      <Route path={"/documents"} component={Documents} />

      <Route path={"/fda-audit"} component={FdaAudit} />
      <Route path={"/fda-classification"} component={FdaClassification} />
      <Route path="/fda-regulatory-watch" component={FdaRegulatoryWatch} />
      <Route path="/fda-dashboard" component={FdaDashboard} />
      <Route path="/fda-submission-tracker" component={FdaSubmissionTracker} />

      <Route path="/pricing" component={Pricing} />
      <Route path="/subscription" component={Subscription} />
      <Route path="/subscription/success" component={SubscriptionSuccess} />
      <Route path="/subscription/cancel" component={SubscriptionCancel} />

      <Route path="/contact" component={Contact} />
      <Route path="/faq" component={FAQ} />
      <Route path="/admin/contacts" component={AdminContacts} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/analytics" component={AnalyticsDashboard} />

      <Route path="/reports/generate" component={ReportGeneration} />
      <Route path="/reports/history" component={ReportHistory} />

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <TooltipProvider>
          <HreflangTags />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
