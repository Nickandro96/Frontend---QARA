/**
 * Libellés lisibles pour les valeurs d'énumération des audits.
 *
 * Le rapport QA 2026-09-02 relevait l'affichage de valeurs brutes à
 * l'utilisateur : « Type d'audit : internal », méthode « on_site »,
 * processus « all » dans les récapitulatifs. Ces tables centralisent la
 * traduction ; toute valeur inconnue est renvoyée telle quelle.
 */

const AUDIT_TYPE_LABELS: Record<string, string> = {
  internal: "Interne",
  external: "Externe",
  supplier: "Fournisseur",
  certification: "Certification",
  surveillance: "Surveillance",
  blanc: "À blanc",
};

const AUDIT_METHOD_LABELS: Record<string, string> = {
  on_site: "Sur site",
  remote: "À distance",
  hybrid: "Hybride",
  document_review: "Revue documentaire",
};

export function auditTypeLabel(value: string | null | undefined): string {
  if (!value) return "Non spécifié";
  return AUDIT_TYPE_LABELS[value] ?? value;
}

export function auditMethodLabel(value: string | null | undefined): string {
  if (!value) return "Non spécifiée";
  return AUDIT_METHOD_LABELS[value] ?? value;
}

/**
 * Périmètre processus : `all` (ou vide) = tous les processus.
 */
export function auditProcessScopeLabel(value: string | null | undefined): string {
  if (!value || value === "all") return "Tous les processus";
  return value;
}
