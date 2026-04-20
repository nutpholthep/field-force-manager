import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Upload, Loader2, FileText, AlertCircle, CheckCircle, ChevronDown, ChevronRight, Clock, Zap, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const TASK_TYPE_META = {
  text:     { label: "Text Input",    color: "bg-slate-100 text-slate-600" },
  date:     { label: "Date/Time",     color: "bg-blue-100 text-blue-600" },
  photo:    { label: "Photo",         color: "bg-purple-100 text-purple-600" },
  file:     { label: "Upload File",   color: "bg-orange-100 text-orange-600" },
  scan:     { label: "Scan/Barcode",  color: "bg-green-100 text-green-600" },
  number:   { label: "Number",        color: "bg-yellow-100 text-yellow-700" },
  checkbox: { label: "Checkbox",      color: "bg-pink-100 text-pink-600" },
  material: { label: "Material/Form", color: "bg-teal-100 text-teal-700" },
};

const TASK_TYPE_GUIDE = `
Task types available (choose the most appropriate type for each task):
- "text": free text input (notes, descriptions, observations)
- "date": date/time picker (appointment times, inspection dates, timestamps)
- "photo": camera/image upload (photos of equipment, site, defects)
- "file": document upload (manuals, certificates, forms)
- "scan": barcode/QR scan (serial numbers, asset tags, product codes)
- "number": numeric input (measurements, readings, quantities, temperatures, pressures)
- "checkbox": yes/no or multi-option selection (checklist items, confirmations)
- "material": material/parts selection (spare parts, consumables, components used)
`;

function PreviewStep({ step, index }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-left"
      >
        <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">{index + 1}</div>
        <span className="text-sm font-semibold text-slate-700 flex-1">{step.name}</span>
        {step.optional && <Badge variant="outline" className="text-[10px]">Optional</Badge>}
        <span className="text-[10px] text-slate-400">{(step.tasks || []).length} tasks</span>
        {open ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
      </button>
      {open && (
        <div className="p-2 space-y-1">
          {(step.tasks || []).map((task, ti) => {
            const meta = TASK_TYPE_META[task.type] || TASK_TYPE_META.text;
            return (
              <div key={ti} className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-white border border-slate-100">
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium shrink-0 ${meta.color}`}>{meta.label}</span>
                <span className="text-xs text-slate-700 flex-1">{task.label}</span>
                {task.required && <span className="text-[9px] text-red-400 shrink-0">Required</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AIStepGenerator({ onApply }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [stage, setStage] = useState("idle"); // idle | uploading | generating | preview | error
  const [errorMsg, setErrorMsg] = useState("");
  const [generatedSteps, setGeneratedSteps] = useState([]);
  const [suggestedSkills, setSuggestedSkills] = useState([]);
  const [suggestedDurationHrs, setSuggestedDurationHrs] = useState(null);
  const [suggestedReason, setSuggestedReason] = useState("");
  // editable in preview
  const [editSkills, setEditSkills] = useState([]);
  const [editDuration, setEditDuration] = useState("");
  const [newSkill, setNewSkill] = useState("");
  const [serviceContext, setServiceContext] = useState("");
  const fileRef = useRef();

  const reset = () => {
    setFile(null);
    setStage("idle");
    setErrorMsg("");
    setGeneratedSteps([]);
    setSuggestedSkills([]);
    setSuggestedDurationHrs(null);
    setSuggestedReason("");
    setEditSkills([]);
    setEditDuration("");
    setNewSkill("");
  };

  const handleClose = () => {
    setOpen(false);
    reset();
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setStage("idle");
    setGeneratedSteps([]);
    setErrorMsg("");
  };

  const handleGenerate = async () => {
    if (!file) return;
    setStage("uploading");
    setErrorMsg("");

    let fileUrl;
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      fileUrl = res.file_url;
    } catch (e) {
      setStage("error");
      setErrorMsg("อัพโหลดไฟล์ไม่สำเร็จ: " + e.message);
      return;
    }

    setStage("generating");

    const prompt = `You are a field service operations expert. Analyze the provided document (which may be a work instruction, SOP, maintenance manual, or checklist) and generate:
1. A structured list of service steps and tasks
2. Required skills for technicians to perform this service
3. Estimated SLA/duration in hours

${serviceContext ? `Additional context about this service type: ${serviceContext}\n` : ""}
${TASK_TYPE_GUIDE}

Instructions for steps:
1. Extract the logical sequence of steps from the document.
2. For each step, create relevant tasks that a technician would need to complete.
3. Choose the most appropriate task type for each task based on what data needs to be captured.
4. Use "photo" for any visual inspection or documentation requirements.
5. Use "scan" for any serial number, asset tag, or barcode verification.
6. Use "number" for measurements, readings, meter values.
7. Use "checkbox" for pass/fail checks or confirmation items.
8. Use "material" for any parts or consumables that need to be recorded.
9. Use "date" for date/time stamps.
10. Generate clear, concise Thai or English labels that match the document language.
11. Mark tasks as required=true if they are critical or mandatory in the document.

Instructions for skills:
- List the technical skill names required (e.g. "Electrical Wiring", "HVAC", "Network Cabling")
- Use concise English or Thai skill names
- Typically 1-5 skills

Instructions for SLA:
- Estimate realistic total job duration in hours (decimal OK, e.g. 2.5)
- Base on document complexity and typical field service standards
- Provide a brief reason for your estimate

Return ONLY valid JSON:
{
  "steps": [
    {
      "name": "Step name",
      "optional": false,
      "tasks": [
        { "label": "Task label", "type": "text|date|photo|file|scan|number|checkbox|material", "required": true }
      ]
    }
  ],
  "required_skills": ["Skill 1", "Skill 2"],
  "default_duration_hrs": 2.0,
  "duration_reason": "Brief explanation of the estimate"
}`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: [fileUrl],
        response_json_schema: {
          type: "object",
          properties: {
            steps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  optional: { type: "boolean" },
                  tasks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        label: { type: "string" },
                        type: { type: "string" },
                        required: { type: "boolean" },
                      },
                    },
                  },
                },
              },
            },
            required_skills: { type: "array", items: { type: "string" } },
            default_duration_hrs: { type: "number" },
            duration_reason: { type: "string" },
          },
        },
      });

      const rawSteps = result?.steps || [];
      if (rawSteps.length === 0) {
        setStage("error");
        setErrorMsg("AI ไม่สามารถสร้าง Steps จากเอกสารนี้ได้ ลองอัพโหลดเอกสารที่มีขั้นตอนชัดเจนขึ้น");
        return;
      }

      const withIds = rawSteps.map((step, si) => ({
        id: `step_ai_${Date.now()}_${si}`,
        name: step.name || `Step ${si + 1}`,
        optional: !!step.optional,
        tasks: (step.tasks || []).map((task, ti) => ({
          id: `task_ai_${Date.now()}_${si}_${ti}`,
          label: task.label || "",
          type: TASK_TYPE_META[task.type] ? task.type : "text",
          required: !!task.required,
          config: {},
        })),
      }));

      const skills = result?.required_skills || [];
      const durationHrs = result?.default_duration_hrs || null;
      const reason = result?.duration_reason || "";

      setGeneratedSteps(withIds);
      setSuggestedSkills(skills);
      setSuggestedDurationHrs(durationHrs);
      setSuggestedReason(reason);
      setEditSkills([...skills]);
      setEditDuration(durationHrs != null ? String(durationHrs) : "");
      setStage("preview");
    } catch (e) {
      setStage("error");
      setErrorMsg("AI ประมวลผลไม่สำเร็จ: " + e.message);
    }
  };

  const handleApply = (mode) => {
    onApply(generatedSteps, mode, {
      required_skills: editSkills,
      default_duration_hrs: parseFloat(editDuration) || null,
    });
    handleClose();
  };

  const removeSkill = (idx) => setEditSkills(s => s.filter((_, i) => i !== idx));
  const addSkill = () => {
    const v = newSkill.trim();
    if (v && !editSkills.includes(v)) setEditSkills(s => [...s, v]);
    setNewSkill("");
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5 border-violet-300 text-violet-700 hover:bg-violet-50 hover:border-violet-400"
      >
        <Sparkles className="w-3.5 h-3.5" />
        AI สร้างจาก PDF
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-500" />
              AI วิเคราะห์เอกสาร → Steps, Skills & SLA
            </DialogTitle>
            <p className="text-xs text-slate-400 mt-0.5">
              อัพโหลด PDF / Word / SOP แล้ว AI จะสร้าง Steps, แนะนำ Skills ที่ต้องการ และประเมิน SLA ให้
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* File upload */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">เอกสาร (PDF, Word, รูปภาพ)</label>
              <div
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center gap-2 cursor-pointer transition-colors
                  ${file ? "border-violet-300 bg-violet-50" : "border-slate-200 bg-slate-50 hover:border-violet-300 hover:bg-violet-50/50"}`}
              >
                {file ? (
                  <>
                    <FileText className="w-6 h-6 text-violet-500" />
                    <p className="text-sm font-medium text-violet-700">{file.name}</p>
                    <p className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(0)} KB · คลิกเพื่อเปลี่ยน</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-slate-300" />
                    <p className="text-sm text-slate-500">คลิกเพื่อเลือกไฟล์</p>
                    <p className="text-[10px] text-slate-400">รองรับ PDF, DOCX, PNG, JPG</p>
                  </>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            {/* Optional context */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                บริบทเพิ่มเติม <span className="text-slate-400 font-normal">(ไม่บังคับ)</span>
              </label>
              <textarea
                value={serviceContext}
                onChange={e => setServiceContext(e.target.value)}
                placeholder="เช่น 'งานบำรุงรักษาเครื่องปรับอากาศ', 'การติดตั้ง Solar Panel', 'ตรวจสอบระบบไฟฟ้า'..."
                className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 min-h-[48px] resize-none focus:outline-none focus:ring-1 focus:ring-violet-400 placeholder:text-slate-300"
              />
            </div>

            {/* Status */}
            {stage === "uploading" && (
              <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                กำลังอัพโหลดไฟล์...
              </div>
            )}
            {stage === "generating" && (
              <div className="flex items-center gap-2 text-sm text-slate-600 bg-violet-50 rounded-lg px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                AI กำลังวิเคราะห์เอกสาร — Steps, Skills และ SLA...
              </div>
            )}
            {stage === "error" && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {errorMsg}
              </div>
            )}

            {/* Preview */}
            {stage === "preview" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <p className="text-sm font-semibold text-slate-700">
                    AI วิเคราะห์เสร็จ — {generatedSteps.length} Steps, {generatedSteps.reduce((s, st) => s + st.tasks.length, 0)} Tasks
                  </p>
                </div>

                {/* SLA section */}
                <div className="border border-amber-200 bg-amber-50 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                    <Clock className="w-3.5 h-3.5" />
                    SLA — ประมาณเวลาดำเนินงาน
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={editDuration}
                      onChange={e => setEditDuration(e.target.value)}
                      className="h-7 w-24 text-xs"
                    />
                    <span className="text-xs text-slate-500">ชั่วโมง</span>
                  </div>
                  {suggestedReason && (
                    <p className="text-[10px] text-amber-600 italic">💡 {suggestedReason}</p>
                  )}
                </div>

                {/* Skills section */}
                <div className="border border-blue-200 bg-blue-50 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700">
                    <Zap className="w-3.5 h-3.5" />
                    Required Skills ที่แนะนำ
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {editSkills.map((skill, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                        {skill}
                        <button type="button" onClick={() => removeSkill(i)} className="hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {editSkills.length === 0 && <span className="text-[10px] text-slate-400">ไม่มี skill ที่แนะนำ</span>}
                  </div>
                  <div className="flex gap-1.5">
                    <Input
                      value={newSkill}
                      onChange={e => setNewSkill(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSkill())}
                      placeholder="เพิ่ม skill..."
                      className="h-7 text-xs flex-1"
                    />
                    <Button type="button" size="sm" variant="outline" className="h-7 text-xs px-2" onClick={addSkill}>+ Add</Button>
                  </div>
                </div>

                {/* Steps preview */}
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {generatedSteps.map((step, i) => (
                    <PreviewStep key={step.id} step={step} index={i} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-slate-100 pt-3 shrink-0 gap-2 flex-wrap">
            <Button variant="outline" onClick={handleClose} className="mr-auto">ยกเลิก</Button>
            {stage === "preview" ? (
              <>
                <Button variant="outline" onClick={() => handleApply("append")} className="gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-50">
                  + เพิ่มต่อท้าย Steps เดิม
                </Button>
                <Button onClick={() => handleApply("replace")} className="gap-1.5 bg-violet-600 hover:bg-violet-700">
                  <Sparkles className="w-3.5 h-3.5" />
                  แทนที่ทั้งหมด
                </Button>
              </>
            ) : (
              <Button
                onClick={handleGenerate}
                disabled={!file || stage === "uploading" || stage === "generating"}
                className="gap-1.5 bg-violet-600 hover:bg-violet-700"
              >
                {(stage === "uploading" || stage === "generating") ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                วิเคราะห์ด้วย AI
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}