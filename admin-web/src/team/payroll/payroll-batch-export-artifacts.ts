import JSZip from "jszip";
import { buildDetailedCsv, buildEmployeeCsv, buildSummaryCsv } from "./payroll-batch-export-csv";
import { draftLabel, sanitizePayrollFilePart } from "./payroll-batch-export-data";
import type { BatchArtifactResult, BatchEmployeeRecord, BatchExportInput, PayrollBatchBridge } from "./payroll-batch-export-types";

type PayrollWindow = Window & typeof globalThis & {
  html2canvas?: (element: HTMLElement, options?: Record<string, unknown>) => Promise<HTMLCanvasElement>;
  jspdf?: { jsPDF: new (...args: unknown[]) => JsPdfLike };
};

interface JsPdfLike {
  internal: { pageSize: { getWidth(): number; getHeight(): number } };
  addPage(): void;
  addImage(data: string, type: string, x: number, y: number, width: number, height: number): void;
  output(type: "blob"): Blob;
}

function payrollFileBase(input: BatchExportInput, count: number, retryNumber = 0): string {
  const year = input.period.year ?? String(input.period.startDate ?? input.period.rangeLabel ?? "").match(/\d{4}/)?.[0] ?? "Year";
  const period = input.period.periodNumber ?? "Period";
  const detail = input.options.detailType === "summary" ? "Summary" : "Detailed";
  return `Payroll_${year}_Period_${period}_${detail}_${count}_Employees${retryNumber ? `_retry_${retryNumber}` : ""}`;
}

function employeeFileBase(record: BatchEmployeeRecord): string {
  return `${sanitizePayrollFilePart(record.employee.id)}_${sanitizePayrollFilePart(record.employee.name)}`;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function summaryHtml(record: BatchEmployeeRecord): string {
  const employee = record.employee;
  const period = record.period;
  const rows = (employee.segments ?? []).map((segment) => `<tr><td>${segment.date ?? ""}</td><td>${segment.in ?? ""}</td><td>${segment.out ?? ""}</td><td>${Number(segment.reg ?? segment.regular ?? 0).toFixed(2)}</td><td>${Number(segment.ot ?? 0).toFixed(2)}</td><td>${Number(segment.ot2 ?? 0).toFixed(2)}</td></tr>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>body{font:11px Arial;margin:0;color:#111}.sheet{box-sizing:border-box;width:794px;min-height:1123px;padding:42px;background:#fff}.draft{color:#b91c1c;font-weight:700}.meta{display:flex;justify-content:space-between}.title{font-size:20px;font-weight:700}table{width:100%;border-collapse:collapse;margin-top:18px}th,td{border:1px solid #666;padding:5px;text-align:center}.sign{margin-top:28px;border-top:1px solid #aaa;padding-top:12px}</style></head><body><article class="sheet"><div class="meta"><div><div class="title">${employee.name}</div><div>Role: ${employee.role ?? ""}</div><div>Hire Date: ${employee.hireDate ?? ""}</div><div>Employee ID: ${employee.id}</div></div><div><div class="title">Payroll #${period.periodNumber ?? ""} Report</div><div>Pay Date: ${period.paycheckDate ?? ""}</div><div>Pay Period: ${period.rangeLabel ?? `${period.startDate ?? ""} - ${period.endDate ?? ""}`}</div><div class="draft">${draftLabel(record)}</div></div></div><table><thead><tr><th>Date</th><th>In</th><th>Out</th><th>Regular</th><th>OT</th><th>OT2</th></tr></thead><tbody>${rows || '<tr><td colspan="6">No attendance rows</td></tr>'}</tbody></table><div class="sign">Employee Signature ____________________ &nbsp;&nbsp; Date ____________</div></article></body></html>`;
}

function loadScript(src: string, ready: () => boolean): Promise<void> {
  if (ready()) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => ready() ? resolve() : reject(new Error(`Library did not initialize: ${src}`));
    script.onerror = () => reject(new Error(`Unable to load ${src}`));
    document.head.appendChild(script);
  });
}

async function ensurePdfLibraries(): Promise<PayrollWindow> {
  const host = window as PayrollWindow;
  await loadScript("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js", () => Boolean(host.html2canvas));
  await loadScript("https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js", () => Boolean(host.jspdf));
  return host;
}

async function htmlToCanvas(html: string, host: PayrollWindow, signal: AbortSignal): Promise<HTMLCanvasElement> {
  if (signal.aborted) throw new DOMException("Batch export cancelled", "AbortError");
  const frame = document.createElement("iframe");
  frame.style.cssText = "position:fixed;left:-10000px;top:0;width:1280px;height:1600px;border:0;opacity:0;pointer-events:none";
  document.body.appendChild(frame);
  try {
    const doc = frame.contentDocument;
    if (!doc) throw new Error("Unable to create PDF render frame");
    doc.open(); doc.write(html); doc.close();
    await new Promise((resolve) => setTimeout(resolve, 60));
    const target = doc.querySelector<HTMLElement>(".payroll-detail-print,.sheet,article,body");
    if (!target || !host.html2canvas) throw new Error("Employee print content is unavailable");
    return await host.html2canvas(target, { scale: 1.5, backgroundColor: "#ffffff", useCORS: true });
  } finally {
    frame.remove();
  }
}

async function canvasesToPdf(canvases: HTMLCanvasElement[], signal: AbortSignal, multiPage: boolean): Promise<Blob> {
  const host = await ensurePdfLibraries();
  if (!host.jspdf) throw new Error("PDF library is unavailable");
  const pdf = new host.jspdf.jsPDF("p", "mm", "a4");
  canvases.forEach((canvas, employeeIndex) => {
    if (signal.aborted) throw new DOMException("Batch export cancelled", "AbortError");
    if (employeeIndex > 0) pdf.addPage();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const naturalHeight = canvas.height * pageWidth / canvas.width;
    const imageHeight = multiPage ? naturalHeight : Math.min(pageHeight, naturalHeight);
    const image = canvas.toDataURL("image/jpeg", 0.92);
    pdf.addImage(image, "JPEG", 0, 0, pageWidth, imageHeight);
    if (multiPage) {
      let remaining = imageHeight - pageHeight;
      while (remaining > 0) {
        pdf.addPage();
        pdf.addImage(image, "JPEG", 0, remaining - imageHeight, pageWidth, imageHeight);
        remaining -= pageHeight;
      }
    }
  });
  return pdf.output("blob");
}

async function employeeHtml(record: BatchEmployeeRecord, input: BatchExportInput, bridge: PayrollBatchBridge): Promise<string> {
  if (input.options.detailType === "summary") return summaryHtml(record);
  const html = bridge.getDetailPrintHtml(record.employee.id, "detailed", input.options.summaryPagination);
  if (!html) throw new Error("Detailed payroll template is unavailable");
  return html;
}

export async function createBatchArtifact(
  input: BatchExportInput,
  bridge: PayrollBatchBridge,
  signal: AbortSignal,
  onEmployeeComplete: (completed: number, total: number) => void,
  retryNumber = 0,
  onPhase: (phase: "generating" | "packaging") => void = () => {},
): Promise<BatchArtifactResult> {
  const exportable = input.records.filter((record) => record.status !== "no_data");
  if (!exportable.length) throw new Error("No exportable payroll data");
  const succeededIds: string[] = [];
  const failures: BatchArtifactResult["failures"] = [];
  const skippedIds = input.records.filter((record) => record.status === "no_data").map((record) => record.employee.id);
  const successfulRecords: BatchEmployeeRecord[] = [];
  const canvases: HTMLCanvasElement[] = [];
  const individualFiles: Array<{ name: string; blob: Blob }> = [];

  for (const record of exportable) {
    if (signal.aborted) throw new DOMException("Batch export cancelled", "AbortError");
    try {
      if (input.options.format === "csv") {
        const csv = buildEmployeeCsv(record, input.options.detailType);
        if (input.options.organization === "zip") individualFiles.push({ name: `${employeeFileBase(record)}.csv`, blob: new Blob([csv], { type: "text/csv;charset=utf-8" }) });
      } else {
        const host = await ensurePdfLibraries();
        const canvas = await htmlToCanvas(await employeeHtml(record, input, bridge), host, signal);
        const multiPage = input.options.detailType === "detailed" || input.options.summaryPagination === "auto-pages";
        if (input.options.organization === "zip") individualFiles.push({ name: `${employeeFileBase(record)}.pdf`, blob: await canvasesToPdf([canvas], signal, multiPage) });
        else canvases.push(canvas);
      }
      succeededIds.push(record.employee.id);
      successfulRecords.push(record);
    } catch (error) {
      failures.push({ employeeId: record.employee.id, employeeName: record.employee.name, message: errorMessage(error) });
    }
    onEmployeeComplete(succeededIds.length + failures.length, exportable.length);
  }
  if (!succeededIds.length) throw new Error(failures[0]?.message || "No employee file could be generated");
  onPhase("packaging");
  const base = payrollFileBase(input, succeededIds.length, retryNumber);
  let blob: Blob;
  let filename: string;
  if (input.options.organization === "zip") {
    const zip = new JSZip();
    individualFiles.forEach((file) => zip.file(file.name, file.blob));
    blob = await zip.generateAsync({ type: "blob" });
    filename = `${base}.zip`;
  } else if (input.options.format === "csv") {
    const csv = input.options.detailType === "summary" ? buildSummaryCsv(successfulRecords) : buildDetailedCsv(successfulRecords);
    blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    filename = `${base}.csv`;
  } else {
    const multiPage = input.options.detailType === "detailed" || input.options.summaryPagination === "auto-pages";
    blob = await canvasesToPdf(canvases, signal, multiPage);
    filename = `${base}.pdf`;
  }
  return { blob, filename, succeededIds, failures, skippedIds };
}

export function downloadBatchArtifact(result: BatchArtifactResult): string {
  const url = URL.createObjectURL(result.blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = result.filename;
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  return url;
}
