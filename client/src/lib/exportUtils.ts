import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface AuditScore {
  total: number;
  answered: number;
  conforme: number;
  nok: number;
  na: number;
  score: number;
  progress: number;
}

interface Question {
  id: number;
  question: string;
  article: string;
  criticality: string;
  process?: { name: string };
  referential?: { name: string };
}

interface Response {
  questionId: number;
  response?: string;
  status: "conforme" | "nok" | "na";
  comment?: string;
}

export async function exportAuditToExcel(
  score: AuditScore,
  questions: Question[],
  responses: Response[],
  userRole: string
) {
  const workbook = new ExcelJS.Workbook();
  
  // Sheet 1: Résumé
  const summarySheet = workbook.addWorksheet("Résumé");
  summarySheet.columns = [
    { header: "Indicateur", key: "indicator", width: 30 },
    { header: "Valeur", key: "value", width: 20 }
  ];
  
  summarySheet.addRows([
    { indicator: "Rôle économique", value: userRole },
    { indicator: "Date du rapport", value: new Date().toLocaleDateString("fr-FR") },
    { indicator: "", value: "" },
    { indicator: "Questions totales", value: score.total },
    { indicator: "Questions répondues", value: score.answered },
    { indicator: "Conformes", value: score.conforme },
    { indicator: "Non-conformes", value: score.nok },
    { indicator: "Non applicables", value: score.na },
    { indicator: "", value: "" },
    { indicator: "Score de conformité", value: `${score.score.toFixed(1)}%` },
    { indicator: "Progression", value: `${score.progress.toFixed(1)}%` }
  ]);
  
  // Add chart data for visualization
  summarySheet.addRow({ indicator: "", value: "" });
  summarySheet.addRow({ indicator: "Répartition des réponses", value: "" });
  summarySheet.addRow({ indicator: "Conformes", value: score.conforme });
  summarySheet.addRow({ indicator: "Non-conformes", value: score.nok });
  summarySheet.addRow({ indicator: "Non applicables", value: score.na });
  summarySheet.addRow({ indicator: "Non répondues", value: score.total - score.answered });
  
  // Add progress bar visualization using conditional formatting
  summarySheet.addRow({ indicator: "", value: "" });
  summarySheet.addRow({ indicator: "Visualisation progression", value: "" });
  const progressRow = summarySheet.addRow({ indicator: "Progression", value: score.progress / 100 });
  progressRow.getCell(2).numFmt = '0%';
  progressRow.getCell(2).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: score.progress >= 75 ? "FF22C55E" : score.progress >= 50 ? "FFF59E0B" : "FFEF4444" }
  };
  
  const scoreRow = summarySheet.addRow({ indicator: "Score conformité", value: score.score / 100 });
  scoreRow.getCell(2).numFmt = '0%';
  scoreRow.getCell(2).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: score.score >= 75 ? "FF22C55E" : score.score >= 50 ? "FFF59E0B" : "FFEF4444" }
  };
  
  // Style header
  summarySheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  summarySheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4472C4" }
  };
  
  // Style chart data rows
  const chartDataStartRow = 14;
  for (let i = 0; i < 5; i++) {
    const row = summarySheet.getRow(chartDataStartRow + i);
    if (i === 0) {
      row.font = { bold: true };
    } else if (i === 1) {
      row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF22C55E" } };
    } else if (i === 2) {
      row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEF4444" } };
    } else if (i === 3) {
      row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF59E0B" } };
    } else if (i === 4) {
      row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF9CA3AF" } };
    }
  }
  
  // Sheet 2: Résultats détaillés
  const detailsSheet = workbook.addWorksheet("Résultats détaillés");
  detailsSheet.columns = [
    { header: "Article", key: "article", width: 15 },
    { header: "Question", key: "question", width: 50 },
    { header: "Processus", key: "process", width: 25 },
    { header: "Référentiel", key: "referential", width: 20 },
    { header: "Criticité", key: "criticality", width: 15 },
    { header: "Statut", key: "status", width: 15 },
    { header: "Réponse", key: "response", width: 40 },
    { header: "Commentaire", key: "comment", width: 40 }
  ];
  
  // Add data
  const responseMap = new Map(responses.map(r => [r.questionId, r]));
  questions.forEach(q => {
    const resp = responseMap.get(q.id);
    detailsSheet.addRow({
      article: q.article,
      question: q.question,
      process: q.process?.name || "-",
      referential: q.referential?.name || "-",
      criticality: q.criticality,
      status: resp ? (resp.status === "conforme" ? "Conforme" : resp.status === "nok" ? "NOK" : "N/A") : "Non répondu",
      response: resp?.response || "-",
      comment: resp?.comment || "-"
    });
  });
  
  // Style header
  detailsSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  detailsSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4472C4" }
  };
  
  // Sheet 3: Plan d'action (NOK uniquement)
  const actionSheet = workbook.addWorksheet("Plan d'action");
  actionSheet.columns = [
    { header: "Priorité", key: "priority", width: 12 },
    { header: "Article", key: "article", width: 15 },
    { header: "Question", key: "question", width: 50 },
    { header: "Criticité", key: "criticality", width: 15 },
    { header: "Commentaire", key: "comment", width: 40 }
  ];
  
  const nokQuestions = questions.filter(q => {
    const resp = responseMap.get(q.id);
    return resp?.status === "nok";
  });
  
  nokQuestions
    .sort((a, b) => {
      const criticalityOrder = { "Critique": 1, "Majeure": 2, "Mineure": 3 };
      return (criticalityOrder[a.criticality as keyof typeof criticalityOrder] || 4) - 
             (criticalityOrder[b.criticality as keyof typeof criticalityOrder] || 4);
    })
    .forEach((q, index) => {
      const resp = responseMap.get(q.id);
      actionSheet.addRow({
        priority: index + 1,
        article: q.article,
        question: q.question,
        criticality: q.criticality,
        comment: resp?.comment || "-"
      });
    });
  
  // Style header
  actionSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  actionSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFF0000" }
  };
  
  // Generate file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rapport-audit-${new Date().toISOString().split("T")[0]}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportAuditToPDF(
  score: AuditScore,
  questions: Question[],
  responses: Response[],
  userRole: string
) {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.setTextColor(40);
  doc.text("Rapport d'Audit de Conformité", 14, 20);
  
  // Metadata
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Rôle économique: ${userRole}`, 14, 30);
  doc.text(`Date: ${new Date().toLocaleDateString("fr-FR")}`, 14, 36);
  
  // Summary
  doc.setFontSize(14);
  doc.setTextColor(40);
  doc.text("Résumé", 14, 50);
  
  autoTable(doc, {
    startY: 55,
    head: [["Indicateur", "Valeur"]],
    body: [
      ["Questions totales", score.total.toString()],
      ["Questions répondues", score.answered.toString()],
      ["Conformes", score.conforme.toString()],
      ["Non-conformes", score.nok.toString()],
      ["Non applicables", score.na.toString()],
      ["Score de conformité", `${score.score.toFixed(1)}%`],
      ["Progression", `${score.progress.toFixed(1)}%`]
    ],
    theme: "grid",
    headStyles: { fillColor: [68, 114, 196] }
  });
  
  // Add pie chart visualization
  const chartY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(12);
  doc.text("Répartition des réponses", 14, chartY);
  
  // Draw simple pie chart
  const centerX = 105;
  const centerY = chartY + 35;
  const radius = 25;
  
  const total = score.answered + (score.total - score.answered);
  const conformeAngle = (score.conforme / total) * 360;
  const nokAngle = (score.nok / total) * 360;
  const naAngle = (score.na / total) * 360;
  
  let startAngle = 0;
  
  // Conforme (green)
  if (score.conforme > 0) {
    doc.setFillColor(34, 197, 94);
    drawPieSlice(doc, centerX, centerY, radius, startAngle, startAngle + conformeAngle);
    startAngle += conformeAngle;
  }
  
  // NOK (red)
  if (score.nok > 0) {
    doc.setFillColor(239, 68, 68);
    drawPieSlice(doc, centerX, centerY, radius, startAngle, startAngle + nokAngle);
    startAngle += nokAngle;
  }
  
  // NA (orange)
  if (score.na > 0) {
    doc.setFillColor(245, 158, 11);
    drawPieSlice(doc, centerX, centerY, radius, startAngle, startAngle + naAngle);
    startAngle += naAngle;
  }
  
  // Non répondues (gray)
  const notAnswered = score.total - score.answered;
  if (notAnswered > 0) {
    doc.setFillColor(156, 163, 175);
    drawPieSlice(doc, centerX, centerY, radius, startAngle, 360);
  }
  
  // Legend
  const legendX = 150;
  const legendY = chartY + 15;
  doc.setFontSize(9);
  
  doc.setFillColor(34, 197, 94);
  doc.rect(legendX, legendY, 4, 4, 'F');
  doc.setTextColor(40);
  doc.text(`Conformes (${score.conforme})`, legendX + 6, legendY + 3);
  
  doc.setFillColor(239, 68, 68);
  doc.rect(legendX, legendY + 8, 4, 4, 'F');
  doc.text(`Non-conformes (${score.nok})`, legendX + 6, legendY + 11);
  
  doc.setFillColor(245, 158, 11);
  doc.rect(legendX, legendY + 16, 4, 4, 'F');
  doc.text(`Non applicables (${score.na})`, legendX + 6, legendY + 19);
  
  doc.setFillColor(156, 163, 175);
  doc.rect(legendX, legendY + 24, 4, 4, 'F');
  doc.text(`Non répondues (${notAnswered})`, legendX + 6, legendY + 27);
  
  // Progress bars
  const progressY = chartY + 65;
  doc.setFontSize(10);
  doc.setTextColor(40);
  doc.text("Progression:", 14, progressY);
  drawProgressBar(doc, 50, progressY - 3, 100, 6, score.progress, [34, 197, 94]);
  doc.text(`${score.progress.toFixed(1)}%`, 155, progressY);
  
  doc.text("Conformité:", 14, progressY + 12);
  drawProgressBar(doc, 50, progressY + 9, 100, 6, score.score, [68, 114, 196]);
  doc.text(`${score.score.toFixed(1)}%`, 155, progressY + 12);
  
  // Action Plan (NOK only)
  const responseMap = new Map(responses.map(r => [r.questionId, r]));
  const nokQuestions = questions.filter(q => {
    const resp = responseMap.get(q.id);
    return resp?.status === "nok";
  });
  
  if (nokQuestions.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.text("Plan d'Action (Non-conformités)", 14, 20);
    
    autoTable(doc, {
      startY: 25,
      head: [["#", "Article", "Question", "Criticité"]],
      body: nokQuestions
        .sort((a, b) => {
          const criticalityOrder = { "Critique": 1, "Majeure": 2, "Mineure": 3 };
          return (criticalityOrder[a.criticality as keyof typeof criticalityOrder] || 4) - 
                 (criticalityOrder[b.criticality as keyof typeof criticalityOrder] || 4);
        })
        .map((q, index) => [
          (index + 1).toString(),
          q.article,
          q.question.substring(0, 80) + (q.question.length > 80 ? "..." : ""),
          q.criticality
        ]),
      theme: "grid",
      headStyles: { fillColor: [255, 0, 0] },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 25 },
        2: { cellWidth: 120 },
        3: { cellWidth: 25 }
      }
    });
  }
  
  // Save
  doc.save(`rapport-audit-${new Date().toISOString().split("T")[0]}.pdf`);
}

export async function exportClassificationToExcel(
  deviceName: string,
  resultingClass: string,
  appliedRules: any[],
  justification: string
) {
  const workbook = new ExcelJS.Workbook();
  
  // Sheet 1: Résultat
  const resultSheet = workbook.addWorksheet("Résultat");
  resultSheet.columns = [
    { header: "Élément", key: "element", width: 30 },
    { header: "Valeur", key: "value", width: 50 }
  ];
  
  resultSheet.addRows([
    { element: "Nom du dispositif", value: deviceName },
    { element: "Date de classification", value: new Date().toLocaleDateString("fr-FR") },
    { element: "", value: "" },
    { element: "Classe résultante", value: resultingClass },
    { element: "", value: "" },
    { element: "Justification", value: justification }
  ]);
  
  // Style
  resultSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  resultSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4472C4" }
  };
  
  // Sheet 2: Règles appliquées
  const rulesSheet = workbook.addWorksheet("Règles appliquées");
  rulesSheet.columns = [
    { header: "Règle", key: "rule", width: 15 },
    { header: "Description", key: "description", width: 60 },
    { header: "Classe", key: "class", width: 15 }
  ];
  
  appliedRules.forEach(rule => {
    rulesSheet.addRow({
      rule: rule.id,
      description: rule.description || rule.title || "-",
      class: rule.resultingClass || "-"
    });
  });
  
  // Style
  rulesSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  rulesSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4472C4" }
  };
  
  // Generate file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `classification-${deviceName.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportClassificationToPDF(
  deviceName: string,
  resultingClass: string,
  appliedRules: any[],
  justification: string
) {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.setTextColor(40);
  doc.text("Classification de Dispositif Médical", 14, 20);
  
  // Device info
  doc.setFontSize(12);
  doc.text(`Dispositif: ${deviceName}`, 14, 35);
  doc.text(`Date: ${new Date().toLocaleDateString("fr-FR")}`, 14, 42);
  
  // Result
  doc.setFontSize(16);
  doc.setTextColor(68, 114, 196);
  doc.text(`Classe: ${resultingClass}`, 14, 55);
  
  // Justification
  doc.setFontSize(12);
  doc.setTextColor(40);
  doc.text("Justification:", 14, 70);
  doc.setFontSize(10);
  const splitJustification = doc.splitTextToSize(justification, 180);
  doc.text(splitJustification, 14, 78);
  
  // Applied Rules
  const rulesStartY = 78 + (splitJustification.length * 5) + 10;
  doc.setFontSize(12);
  doc.text("Règles appliquées:", 14, rulesStartY);
  
  autoTable(doc, {
    startY: rulesStartY + 5,
    head: [["Règle", "Description", "Classe"]],
    body: appliedRules.map(rule => [
      rule.id,
      (rule.description || rule.title || "-").substring(0, 60),
      rule.resultingClass || "-"
    ]),
    theme: "grid",
    headStyles: { fillColor: [68, 114, 196] }
  });
  
  // Save
  doc.save(`classification-${deviceName.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`);
}


// Helper function to draw a pie slice
function drawPieSlice(doc: jsPDF, centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number) {
  const startRad = (startAngle - 90) * Math.PI / 180;
  const endRad = (endAngle - 90) * Math.PI / 180;
  
  doc.moveTo(centerX, centerY);
  doc.lineTo(centerX + radius * Math.cos(startRad), centerY + radius * Math.sin(startRad));
  
  // Draw arc
  const steps = Math.ceil(Math.abs(endAngle - startAngle));
  for (let i = 0; i <= steps; i++) {
    const angle = startRad + (endRad - startRad) * i / steps;
    doc.lineTo(centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle));
  }
  
  doc.lineTo(centerX, centerY);
  doc.fill();
}

// Helper function to draw a progress bar
function drawProgressBar(doc: jsPDF, x: number, y: number, width: number, height: number, progress: number, color: [number, number, number]) {
  // Background (gray)
  doc.setFillColor(229, 231, 235);
  doc.rect(x, y, width, height, 'F');
  
  // Progress (colored)
  const progressWidth = (progress / 100) * width;
  doc.setFillColor(...color);
  doc.rect(x, y, progressWidth, height, 'F');
  
  // Border
  doc.setDrawColor(156, 163, 175);
  doc.rect(x, y, width, height, 'S');
}
