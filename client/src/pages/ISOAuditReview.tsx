import { Link, useRoute } from "wouter";

export default function ISOAuditReview() {
  const [, params] = useRoute("/iso/audit/:auditId/review");
  const auditId = params?.auditId;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1>Audit ISO #{auditId} - Revue</h1>
      <p>Résumé V1 (OK / PARTIAL / NOK / NA) à alimenter via endpoint analytics.</p>
      <p>Export PDF/Excel: placeholder V1.</p>

      <Link href="/iso/audit">Retour audits</Link>
    </div>
  );
}
