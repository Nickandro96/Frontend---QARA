import { useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";

const STATUSES = ["OK", "PARTIAL", "NOK", "NA"] as const;

export default function ISOAuditDrilldown() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/iso/audit/:auditId");
  const auditId = Number(params?.auditId);

  const { data } = trpc.iso.getQuestionsForAudit.useQuery(
    { auditId },
    { enabled: Number.isFinite(auditId) }
  );

  const save = trpc.iso.saveResponse.useMutation();
  const [index, setIndex] = useState(0);

  const question = useMemo(() => data?.questions?.[index], [data, index]);

  if (!Number.isFinite(auditId)) {
    return <div style={{ padding: 24 }}>Audit ID invalide.</div>;
  }

  if (!question) {
    return (
      <div style={{ maxWidth: 980, margin: "0 auto", padding: 24 }}>
        <h1>Questionnaire ISO</h1>
        <p>Aucune question filtrée pour cet audit.</p>
        <button onClick={() => setLocation("/iso/audit")}>Retour</button>
      </div>
    );
  }

  const total = data?.count ?? data?.questions?.length ?? 0;

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 24 }}>
      <h1>Questionnaire ISO</h1>

      <p>
        {index + 1}/{total}
      </p>

      <h3>
        {question.article} - {question.title}
      </h3>

      <p>{question.questionText}</p>

      <p>
        <strong>Preuves attendues :</strong> {question.expectedEvidence}
      </p>

      <p>
        <strong>Criticité :</strong> {question.criticality}
      </p>

      {question.risk && (
        <p style={{ color: "red" }}>
          <strong>Risque :</strong> {question.risk}
        </p>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
        {STATUSES.map((s) => (
          <button
            key={s}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: "white",
              cursor: "pointer",
              color: s === "NOK" ? "red" : "inherit",
            }}
            disabled={save.isPending}
            onClick={async () => {
              await save.mutateAsync({
                auditId,
                questionKey: question.questionKey,
                status: s,
              });

              const lastIndex = (data?.questions?.length ?? 0) - 1;
              if (index >= lastIndex) setLocation(`/iso/audit/${auditId}/review`);
              else setIndex((x) => x + 1);
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {save.error && (
        <p style={{ marginTop: 12, color: "red" }}>
          Erreur enregistrement: {save.error.message}
        </p>
      )}
    </div>
  );
}
