import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "../utils/trpc";

type Mode = "all" | "select";

export default function ISOAuditWizard() {
  const navigate = useNavigate();
  const standards = trpc.iso.getStandards.useQuery();
  const processes = trpc.iso.getProcesses.useQuery();
  const sites = trpc.iso.getSites.useQuery();
  const saveDraft = trpc.iso.createOrUpdateAuditDraft.useMutation();
  const [step, setStep] = useState(0);
  const [auditId, setAuditId] = useState<number | null>(null);
  const [data, setData] = useState({
    standardCode: "ISO9001" as "ISO9001" | "ISO13485",
    siteId: 0,
    name: `Audit ISO ${new Date().toISOString().slice(0, 10)}`,
    scope: "",
    method: "",
    processMode: "all" as Mode,
    processIds: [] as number[],
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
    auditorName: "",
    auditeeName: "",
    auditeeEmail: "",
    entityName: "",
    address: "",
    exclusions: "",
    productFamilies: "",
    markets: "",
    auditTeam: "",
    standardsVersion: "",
  });

  const questions = trpc.iso.getQuestionsForAudit.useQuery(
    { auditId: auditId ?? 0 },
    { enabled: !!auditId && step === 3 },
  );

  const selectedStandard = useMemo(
    () => standards.data?.find((s) => s.code === data.standardCode),
    [standards.data, data.standardCode],
  );

  const upsertDraft = async (status: "draft" | "in_progress" = "draft") => {
    const res = await saveDraft.mutateAsync({ ...data, auditId: auditId ?? undefined, status, siteId: Number(data.siteId), endDate: data.endDate || null });
    setAuditId(res.auditId);
    return res.auditId;
  };

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 24 }}>
      <h1>Audit ISO Wizard</h1>
      {step === 0 && (
        <>
          <h2>Choix du référentiel</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {standards.data?.map((s) => (
              <button key={s.code} onClick={() => setData((d) => ({ ...d, standardCode: s.code as "ISO9001" | "ISO13485" }))}>
                {s.label}
              </button>
            ))}
          </div>
          <button onClick={() => setStep(1)}>Continuer</button>
        </>
      )}

      {step === 1 && (
        <>
          <h2>Étape 1/3 - Informations critiques</h2>
          <select value={data.siteId} onChange={(e) => setData((d) => ({ ...d, siteId: Number(e.target.value) }))}>
            <option value={0}>Choisir un site</option>
            {sites.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input placeholder="Nom audit" value={data.name} onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))} />
          <input placeholder="Scope" value={data.scope} onChange={(e) => setData((d) => ({ ...d, scope: e.target.value }))} />
          <input placeholder="Méthode" value={data.method} onChange={(e) => setData((d) => ({ ...d, method: e.target.value }))} />
          <div>
            <label><input type="radio" checked={data.processMode === "all"} onChange={() => setData((d) => ({ ...d, processMode: "all", processIds: [] }))} />Tous les processus</label>
            <label><input type="radio" checked={data.processMode === "select"} onChange={() => setData((d) => ({ ...d, processMode: "select" }))} />Sélection manuelle</label>
          </div>
          {data.processMode === "select" && processes.data?.map((p) => (
            <label key={p.id}><input type="checkbox" checked={data.processIds.includes(p.id)} onChange={(e) => setData((d) => ({ ...d, processIds: e.target.checked ? [...d.processIds, p.id] : d.processIds.filter((x) => x !== p.id) }))} />{p.name}</label>
          ))}
          <input type="date" value={data.startDate} onChange={(e) => setData((d) => ({ ...d, startDate: e.target.value }))} />
          <input type="date" value={data.endDate} onChange={(e) => setData((d) => ({ ...d, endDate: e.target.value }))} />
          <input placeholder="Auditeur" value={data.auditorName} onChange={(e) => setData((d) => ({ ...d, auditorName: e.target.value }))} />
          <input placeholder="Contact audité" value={data.auditeeName} onChange={(e) => setData((d) => ({ ...d, auditeeName: e.target.value }))} />
          <input placeholder="Email audité" value={data.auditeeEmail} onChange={(e) => setData((d) => ({ ...d, auditeeEmail: e.target.value }))} />
          <button onClick={async () => { await upsertDraft(); setStep(2); }}>Continuer</button>
        </>
      )}

      {step === 2 && (
        <>
          <h2>Étape 2/3 - Contexte & détails</h2>
          <input placeholder="Entité auditée" value={data.entityName} onChange={(e) => setData((d) => ({ ...d, entityName: e.target.value }))} />
          <input placeholder="Adresse" value={data.address} onChange={(e) => setData((d) => ({ ...d, address: e.target.value }))} />
          <textarea placeholder="Exclusions" value={data.exclusions} onChange={(e) => setData((d) => ({ ...d, exclusions: e.target.value }))} />
          <textarea placeholder="Familles produits" value={data.productFamilies} onChange={(e) => setData((d) => ({ ...d, productFamilies: e.target.value }))} />
          <textarea placeholder="Marchés" value={data.markets} onChange={(e) => setData((d) => ({ ...d, markets: e.target.value }))} />
          <textarea placeholder="Équipe audit" value={data.auditTeam} onChange={(e) => setData((d) => ({ ...d, auditTeam: e.target.value }))} />
          <input placeholder="Version référentiel" value={data.standardsVersion} onChange={(e) => setData((d) => ({ ...d, standardsVersion: e.target.value }))} />
          <button onClick={async () => { await upsertDraft(); setStep(3); }}>Résumé</button>
        </>
      )}

      {step === 3 && (
        <>
          <h2>Étape 3/3 - Résumé</h2>
          <p>Audit ID: {auditId}</p>
          <p>Référentiel: {selectedStandard?.label}</p>
          <p>Questions disponibles: {questions.data?.count ?? 0}</p>
          <button onClick={() => questions.refetch()}>Rafraîchir</button>
          <button onClick={async () => {
            const id = auditId ?? (await upsertDraft());
            await saveDraft.mutateAsync({ ...data, auditId: id, siteId: Number(data.siteId), status: "in_progress", endDate: data.endDate || null });
            navigate(`/iso/audit/${id}`);
          }}>Démarrer le Questionnaire ISO</button>
        </>
      )}
    </div>
  );
}
