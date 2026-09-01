import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function dateStamp() {
  return new Date().toISOString().slice(0, 10);
}

export async function exportNonConformitiesExcel(rows: any[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "QARA";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("Registre NC");
  sheet.columns = [
    { header: "Identifiant", key: "id", width: 20 },
    { header: "Constat", key: "questionText", width: 65 },
    { header: "Audit / origine", key: "auditName", width: 28 },
    { header: "Référentiel / clause", key: "articleReference", width: 25 },
    { header: "Processus", key: "processName", width: 28 },
    { header: "Criticité", key: "criticality", width: 15 },
    { header: "Détection", key: "detectedAt", width: 18 },
    { header: "Statut", key: "status", width: 18 },
    { header: "Récurrence", key: "recurrenceCount", width: 14 },
    { header: "CAPA associée", key: "capaIdentifier", width: 20 },
  ];
  rows.forEach((row) => sheet.addRow({ ...row, detectedAt: row.detectedAt ? new Date(row.detectedAt).toLocaleDateString("fr-FR") : "", capaIdentifier: row.capaIdentifier ?? "" }));
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1D4ED8" } };
  sheet.autoFilter = { from: "A1", to: "J1" };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(new Blob([buffer]), `registre-nc-qara-${dateStamp()}.xlsx`);
}

export function exportNonConformitiesPdf(rows: any[]) {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(18); doc.text("QARA — Registre des non-conformités", 14, 16);
  doc.setFontSize(9); doc.text(`Édité le ${new Date().toLocaleString("fr-FR")} — ${rows.length} enregistrement(s)`, 14, 23);
  autoTable(doc, { startY: 29, head: [["ID", "Constat", "Origine", "Référence", "Criticité", "Processus", "Statut", "CAPA"]], body: rows.map((row) => [row.id, row.questionText, row.auditName, row.articleReference ?? "", row.criticality, row.processName ?? "", row.status, row.capaIdentifier ?? "—"]), styles: { fontSize: 7, cellPadding: 2 }, headStyles: { fillColor: [29, 78, 216] }, columnStyles: { 1: { cellWidth: 75 } } });
  doc.save(`registre-nc-qara-${dateStamp()}.pdf`);
}

export async function exportActionPlanExcel(rows: any[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "QARA";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("Plan d'actions");
  sheet.columns = [
    { header: "Identifiant", key: "actionIdentifier", width: 20 },
    { header: "CAPA", key: "capaIdentifier", width: 20 },
    { header: "Action validée", key: "actionRetenue", width: 70 },
    { header: "Origine", key: "auditName", width: 28 },
    { header: "Processus", key: "processName", width: 25 },
    { header: "Priorité", key: "gravite", width: 14 },
    { header: "Responsable", key: "responsible", width: 24 },
    { header: "Échéance", key: "dueDate", width: 18 },
    { header: "Statut", key: "statut", width: 22 },
    { header: "Preuve de réalisation", key: "preuveRealisation", width: 40 },
    { header: "Résultat efficacité", key: "resultatEfficacite", width: 22 },
    { header: "Preuve efficacité", key: "preuveEfficacite", width: 40 },
  ];
  rows.filter((row) => row.actionRetenue).forEach((row) => sheet.addRow({ ...row, dueDate: row.dueDate ? new Date(row.dueDate).toLocaleDateString("fr-FR") : "" }));
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1D4ED8" } };
  sheet.autoFilter = { from: "A1", to: "L1" };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(new Blob([buffer]), `plan-actions-qara-${dateStamp()}.xlsx`);
}

export function exportActionPlanPdf(rows: any[]) {
  const validated = rows.filter((row) => row.actionRetenue);
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(18); doc.text("QARA — Plan d’actions", 14, 16);
  doc.setFontSize(9); doc.text(`Édité le ${new Date().toLocaleString("fr-FR")} — ${validated.length} action(s) validée(s)`, 14, 23);
  autoTable(doc, { startY: 29, head: [["ID", "CAPA", "Action", "Responsable", "Échéance", "Statut", "Efficacité"]], body: validated.map((row) => [row.actionIdentifier, row.capaIdentifier, row.actionRetenue, row.responsible ?? "À attribuer", row.dueDate ? new Date(row.dueDate).toLocaleDateString("fr-FR") : "À définir", row.statut, row.resultatEfficacite ?? "Non vérifiée"]), styles: { fontSize: 7, cellPadding: 2 }, headStyles: { fillColor: [29, 78, 216] }, columnStyles: { 2: { cellWidth: 95 } } });
  doc.save(`plan-actions-qara-${dateStamp()}.pdf`);
}
