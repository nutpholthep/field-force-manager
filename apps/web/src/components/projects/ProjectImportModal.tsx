'use client';

import { useState, useRef } from "react";
import { entities } from "@/lib/entity-client";
import { http } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2, Download, X } from "lucide-react";
import moment from "moment";
import type { Site, Workflow } from "@ffm/shared";

const SAMPLE_DATA = [
  ["site_name", "workflow_name", "start_date"],
  ["Site A - Bangkok", "AC Installation Workflow", "2026-04-15"],
  ["Site B - Chiang Mai", "AC Maintenance Workflow", "2026-04-20"],
  ["Site C - Phuket", "AC Installation Workflow", "2026-05-01"],
];

function downloadSample() {
  const csv = SAMPLE_DATA.map(row => row.join(",")).join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "project_import_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

interface ImportRow {
  site_name?: string;
  workflow_name?: string;
  start_date?: string;
  // TODO: tighten type
  _site?: Site;
  _wf?: Workflow;
  _errors: string[];
  _rowNum: number;
}

interface Props {
  onClose: () => void;
  onDone: () => void;
  workflows: Workflow[];
  sites: Site[];
}

export default function ProjectImportModal({ onClose, onDone, workflows, sites }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"upload" | "parsing" | "preview" | "importing" | "done">("upload");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [, setErrors] = useState<ImportRow[]>([]);
  const [, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [results, setResults] = useState({ ok: 0, failed: 0 });

  const handleFile = async (file: File) => {
    if (!file) return;
    setStep("parsing");

    const formData = new FormData();
    formData.append("file", file);
    const uploadRes = await http.post<{ file_url: string }>("/uploads", formData);
    const { file_url } = uploadRes.data;

    const extractRes = await http.post<{ status: string; output: { rows?: Array<{ site_name?: string; workflow_name?: string; start_date?: string }> } | Array<{ site_name?: string; workflow_name?: string; start_date?: string }> }>(
      "/ai/invoke",
      {
        action: "ExtractDataFromUploadedFile",
        file_url,
        json_schema: {
          type: "object",
          properties: {
            rows: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  site_name: { type: "string" },
                  workflow_name: { type: "string" },
                  start_date: { type: "string" },
                }
              }
            }
          }
        }
      }
    );

    let parsedRows: Array<{ site_name?: string; workflow_name?: string; start_date?: string }> = [];
    if (extractRes.data.status === "success") {
      const output = extractRes.data.output;
      parsedRows = Array.isArray(output) ? output : (output?.rows || []);
    }

    // Validate each row
    const validated: ImportRow[] = parsedRows.map((row, i) => {
      const site = sites.find(s => s.name?.toLowerCase().trim() === (row.site_name || "").toLowerCase().trim());
      const wf = workflows.find(w => w.name?.toLowerCase().trim() === (row.workflow_name || "").toLowerCase().trim());
      const errs: string[] = [];
      if (!row.site_name) errs.push("ไม่มี site_name");
      else if (!site) errs.push(`ไม่พบ Site: "${row.site_name}"`);
      if (!row.workflow_name) errs.push("ไม่มี workflow_name");
      else if (!wf) errs.push(`ไม่พบ Workflow: "${row.workflow_name}"`);
      if (row.start_date && !moment(row.start_date, ["YYYY-MM-DD", "DD/MM/YYYY", "M/D/YYYY"], true).isValid()) {
        errs.push("start_date รูปแบบไม่ถูกต้อง");
      }
      return { ...row, _site: site, _wf: wf, _errors: errs, _rowNum: i + 1 };
    });

    setRows(validated);
    setErrors(validated.filter(r => r._errors.length > 0));
    setStep("preview");
  };

  const handleImport = async () => {
    const validRows = rows.filter(r => r._errors.length === 0);
    setImporting(true);
    setStep("importing");
    let ok = 0, failed = 0;

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      try {
        const num = "PRJ-" + Date.now().toString().slice(-6) + String(i).padStart(2, "0");
        const site = row._site!;
        const wf = row._wf!;
        // TODO: tighten type — workflow nodes shape depends on backend
        const serviceNodes = ((wf?.nodes as Array<{ id: string; type: string; label: string; service_type_name?: string }>) || []).filter(n => n.type === "service");
        const firstStep = serviceNodes[0];
        const startDate = moment(row.start_date, ["YYYY-MM-DD", "DD/MM/YYYY", "M/D/YYYY"]).format("YYYY-MM-DD");

        const project = await entities.Project.create({
          project_number: num,
          name: `${site.name} - ${wf.name}`,
          site_id: site.id,
          site_name: site.name,
          customer_id: site.customer_id || "",
          customer_name: site.customer_name || "",
          workflow_id: wf.id,
          workflow_name: wf.name,
          start_date: startDate || moment().format("YYYY-MM-DD"),
          current_step_id: firstStep?.id || null,
          current_step_name: firstStep?.label || null,
          status: "in_progress",
          completed_steps: [],
          step_history: [],
        });

        for (let j = 0; j < serviceNodes.length; j++) {
          const node = serviceNodes[j];
          const woNum = `${num}-${String(j + 1).padStart(2, "0")}`;
          await entities.WorkOrder.create({
            order_number: woNum,
            title: `${node.label} — ${site.name}`,
            service_type: node.service_type_name || "maintenance",
            status: "created",
            customer_name: site.customer_name || "",
            customer_id: site.customer_id || "",
            site_name: site.name,
            site_id: site.id,
            site_latitude: site.latitude,
            site_longitude: site.longitude,
            notes: `Project: ${num} | Step ${j + 1}: ${node.label}`,
            project_id: project.id,
            project_step_id: node.id,
          });
        }
        ok++;
      } catch {
        failed++;
      }
      setImportProgress(Math.round(((i + 1) / validRows.length) * 100));
    }

    setResults({ ok, failed });
    setImporting(false);
    setStep("done");
    onDone();
  };

  const validCount = rows.filter(r => r._errors.length === 0).length;
  const errorCount = rows.filter(r => r._errors.length > 0).length;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Import Projects from Excel / CSV
          </DialogTitle>
        </DialogHeader>

        {/* Upload step */}
        {(step === "upload" || step === "parsing") && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700 space-y-1">
              <p className="font-semibold">รูปแบบ Excel / CSV ที่รองรับ:</p>
              <p>คอลัมน์ที่ต้องการ: <code className="bg-blue-100 px-1 rounded">site_name</code>, <code className="bg-blue-100 px-1 rounded">workflow_name</code>, <code className="bg-blue-100 px-1 rounded">start_date</code></p>
              <p className="text-xs text-blue-500">start_date รูปแบบ: YYYY-MM-DD หรือ DD/MM/YYYY</p>
            </div>

            <button
              className="w-full border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer"
              onClick={() => fileRef.current?.click()}
              disabled={step === "parsing"}
            >
              {step === "parsing" ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  <p className="text-sm text-slate-500">กำลัง Parse ไฟล์...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-slate-400" />
                  <p className="text-sm font-medium text-slate-600">คลิกเพื่ออัพโหลด Excel หรือ CSV</p>
                  <p className="text-xs text-slate-400">.xlsx, .xls, .csv</p>
                </div>
              )}
            </button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => e.target.files?.[0] && handleFile(e.target.files[0])} />

            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={downloadSample}>
              <Download className="w-3.5 h-3.5" /> Download Template CSV
            </Button>
          </div>
        )}

        {/* Preview step */}
        {step === "preview" && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" /> {validCount} แถวพร้อม import
              </div>
              {errorCount > 0 && (
                <div className="flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1 rounded-full text-sm font-medium">
                  <AlertTriangle className="w-4 h-4" /> {errorCount} แถวมีข้อผิดพลาด
                </div>
              )}
            </div>

            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-3 py-2 text-left text-slate-500 font-medium">#</th>
                    <th className="px-3 py-2 text-left text-slate-500 font-medium">Site</th>
                    <th className="px-3 py-2 text-left text-slate-500 font-medium">Workflow</th>
                    <th className="px-3 py-2 text-left text-slate-500 font-medium">Start Date</th>
                    <th className="px-3 py-2 text-left text-slate-500 font-medium">Steps</th>
                    <th className="px-3 py-2 text-left text-slate-500 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row, i) => (
                    <tr key={i} className={row._errors.length > 0 ? "bg-red-50" : "bg-white"}>
                      <td className="px-3 py-2 text-slate-400">{row._rowNum}</td>
                      <td className="px-3 py-2 font-medium text-slate-700">{row.site_name || "—"}</td>
                      <td className="px-3 py-2 text-slate-600">{row.workflow_name || "—"}</td>
                      <td className="px-3 py-2 text-slate-600">{row.start_date || "—"}</td>
                      <td className="px-3 py-2 text-slate-500">
                        {row._wf ? `${((row._wf.nodes as Array<{ type: string }> | undefined) || []).filter(n => n.type === "service").length} steps` : "—"}
                      </td>
                      <td className="px-3 py-2">
                        {row._errors.length === 0 ? (
                          <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">OK</Badge>
                        ) : (
                          <div className="space-y-0.5">
                            {row._errors.map((e, ei) => (
                              <div key={ei} className="flex items-center gap-1 text-red-600">
                                <X className="w-3 h-3 shrink-0" />{e}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {errorCount > 0 && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                {`แถวที่มีข้อผิดพลาดจะถูกข้ามไป ระบบจะ import เฉพาะแถวที่ถูกต้อง ${validCount} แถว`}
              </p>
            )}
          </div>
        )}

        {/* Importing */}
        {step === "importing" && (
          <div className="py-8 text-center space-y-4">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto" />
            <p className="text-sm font-medium text-slate-700">กำลัง Import... {importProgress}%</p>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${importProgress}%` }} />
            </div>
          </div>
        )}

        {/* Done */}
        {step === "done" && (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <p className="text-lg font-semibold text-slate-800">Import เสร็จสิ้น!</p>
            <div className="flex items-center justify-center gap-4">
              <div className="bg-emerald-50 px-4 py-2 rounded-lg">
                <p className="text-2xl font-bold text-emerald-600">{results.ok}</p>
                <p className="text-xs text-emerald-600">สำเร็จ</p>
              </div>
              {results.failed > 0 && (
                <div className="bg-red-50 px-4 py-2 rounded-lg">
                  <p className="text-2xl font-bold text-red-500">{results.failed}</p>
                  <p className="text-xs text-red-500">ผิดพลาด</p>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => setStep("upload")}>Back</Button>
              <Button onClick={handleImport} disabled={validCount === 0} className="gap-1.5">
                <Upload className="w-4 h-4" /> Import {validCount} Projects
              </Button>
            </>
          )}
          {(step === "upload" || step === "done") && (
            <Button variant="outline" onClick={onClose}>{step === "done" ? "Close" : "Cancel"}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
