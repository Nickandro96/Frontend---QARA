import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportQualificationPdf(result: any) {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("FDA Qualification Report", 14, 18);
  doc.setFontSize(11);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);
  doc.text(`Probable device status: ${result?.probableDeviceStatus ? "Yes" : "No / review needed"}`, 14, 36);
  doc.text(`Probable class: ${result?.deviceClass || "N/A"}`, 14, 44);
  doc.text(`Probable pathway: ${result?.pathway || "N/A"}`, 14, 52);
  doc.text(`Confidence: ${result?.confidence || 0}%`, 14, 60);
  autoTable(doc, {
    startY: 70,
    head: [["Obligation", "Required"]],
    body: (result?.obligations || []).map((item: any) => [item.label, item.required ? "Yes" : "No"]),
  });
  doc.text(doc.splitTextToSize(result?.rationale || "", 180), 14, (doc as any).lastAutoTable.finalY + 10);
  doc.save("fda-qualification-report.pdf");
}

export async function exportAuditPdf(report: any) {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("FDA Audit Report", 14, 18);
  doc.setFontSize(11);
  doc.text(report?.executiveSummary || "", 14, 28, { maxWidth: 180 });
  autoTable(doc, {
    startY: 40,
    head: [["Chapter", "Score"]],
    body: (report?.chapterScores || []).map((x: any) => [x.chapter, `${x.score}%`]),
  });
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 10,
    head: [["Top gap", "Criticality", "Expected evidence", "Recommendation"]],
    body: (report?.topGaps || []).map((x: any) => [x.title, x.criticality || "", x.expectedEvidence || "", x.recommendation || ""]),
  });
  doc.save("fda-audit-report.pdf");
}

export async function exportAuditExcel(report: any) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("FDA Audit");
  ws.columns = [
    { header: "Chapter", key: "chapter", width: 40 },
    { header: "Score", key: "score", width: 12 },
  ];
  for (const row of report?.chapterScores || []) ws.addRow(row);

  const gaps = wb.addWorksheet("Top Gaps");
  gaps.columns = [
    { header: "Title", key: "title", width: 40 },
    { header: "Criticality", key: "criticality", width: 15 },
    { header: "Expected Evidence", key: "expectedEvidence", width: 40 },
    { header: "Recommendation", key: "recommendation", width: 50 },
  ];
  for (const row of report?.topGaps || []) gaps.addRow(row);

  const buffer = await wb.xlsx.writeBuffer();
  downloadBlob(new Blob([buffer]), "fda-audit-report.xlsx");
}
