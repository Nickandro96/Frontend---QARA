import { Link, useParams } from "react-router-dom";

export default function ISOAuditReview() {
  const { auditId } = useParams();

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1>Audit ISO #{auditId} - Revue</h1>
      <p>Résumé V1 (OK / PARTIAL / NOK / NA) à alimenter via endpoint analytics.</p>
      <p>Export PDF/Excel: placeholder V1.</p>
      <Link to="/iso/audit">Retour audits</Link>
    </div>
  );
}
