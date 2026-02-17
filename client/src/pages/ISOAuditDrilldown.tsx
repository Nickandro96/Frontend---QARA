import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { trpc } from "../utils/trpc";

const STATUSES = ["OK", "PARTIAL", "NOK", "NA"] as const;

export default function ISOAuditDrilldown() {
  const navigate = useNavigate();
  const { auditId } = useParams();
  const id = Number(auditId);
  const { data } = trpc.iso.getQuestionsForAudit.useQuery({ auditId: id }, { enabled: Number.isFinite(id) });
  const save = trpc.iso.saveResponse.useMutation();
  const [index, setIndex] = useState(0);

  const question = useMemo(() => data?.questions[index], [data, index]);

  if (!question) return <div>Aucune question filtrée pour cet audit.</div>;

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 24 }}>
      <h1>Questionnaire ISO</h1>
      <p>{index + 1}/{data?.count}</p>
      <h3>{question.article} - {question.title}</h3>
      <p>{question.questionText}</p>
      <p><strong>Preuves attendues :</strong> {question.expectedEvidence}</p>
      <p><strong>Criticité :</strong> {question.criticality}</p>
      {question.risk && <p style={{ color: "red" }}><strong>Risque :</strong> {question.risk}</p>}
      <div>
        {STATUSES.map((s) => (
          <button key={s} style={{ color: s === "NOK" ? "red" : "inherit" }} onClick={async () => {
            await save.mutateAsync({ auditId: id, questionKey: question.questionKey, status: s });
            if ((data?.questions.length ?? 0) - 1 === index) navigate(`/iso/audit/${id}/review`);
            else setIndex((x) => x + 1);
          }}>{s}</button>
        ))}
      </div>
    </div>
  );
}
