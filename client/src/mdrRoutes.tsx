import React from "react";
import { Route, Switch } from "wouter";
import MDRAuditDrilldown from "./MDRAuditDrilldown";
import MDRAuditReview from "./MDRAuditReview";

/**
 * Route bundle MDR (safe additive).
 *
 * À intégrer dans le router principal de l'application sans supprimer les routes existantes.
 */
export default function MDRRoutes() {
  return (
    <Switch>
      <Route path="/mdr/audit/:auditId" component={MDRAuditDrilldown} />
      <Route path="/mdr/audit/:auditId/review" component={MDRAuditReview} />
    </Switch>
  );
}
