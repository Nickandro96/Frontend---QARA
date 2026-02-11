import React from 'react';
import { Route, Switch } from 'wouter';
import ErrorBoundary from './ErrorBoundary';
import MDRQualification from '@/pages/MDRQualification';
import MDRAudit from '@/pages/MDRAudit';
import MDRAuditDrilldown from '@/pages/MDRAuditDrilldown';

const MdrRoutes = () => (
  <Switch>
    <Route path={"/mdr/qualification"} component={MDRQualification} />
    <Route path={"/mdr/audit"} component={MDRAudit} />
    <Route path={"/mdr/audit/:id"} component={MDRAuditDrilldown} />
  </Switch>
);

const MdrRoutesErrorBoundary = () => (
  <ErrorBoundary>
    <MdrRoutes />
  </ErrorBoundary>
);

export default MdrRoutesErrorBoundary;
