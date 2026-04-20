import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

const DATA_SKILLS = [
  { key: "work_orders", label: "Work Orders", desc: "Read & monitor all work orders" },
  { key: "technicians", label: "Technicians", desc: "Access technician profiles & availability" },
  { key: "customers", label: "Customers", desc: "Read customer data" },
  { key: "zones", label: "Zones", desc: "Access zone & territory data" },
  { key: "sites", label: "Sites", desc: "Access site locations" },
  { key: "notifications", label: "Send Notifications", desc: "Create in-app notifications" },
];

const LLM_PROVIDERS = [
  { value: "base44", label: "Base44 Built-in (ไม่ต้อง API Key)", models: ["auto"], noApiKey: true },
  { value: "openai", label: "OpenAI", models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"] },
  { value: "gemini", label: "Google Gemini", models: ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.0-flash"] },
  { value: "openrouter", label: "OpenRouter", models: ["anthropic/claude-3-5-sonnet", "meta-llama/llama-3.1-70b-instruct", "mistralai/mistral-7b-instruct"] },
  { value: "ollama", label: "Ollama (Local)", models: ["llama3", "mistral", "qwen2.5", "deepseek-r1"] },
];

const DEFAULT_FORM = {
  name: "",
  description: "",
  system_prompt: "You are an intelligent field service dispatch agent. Your job is to monitor work orders in your assigned zone, ensure SLA deadlines are not breached, follow up with technicians, and alert supervisors when intervention is needed.",
  data_skills: ["work_orders", "technicians", "notifications"],
  can_send_email: false,
  notification_email: "",
  llm_provider: "base44",
  llm_model: "auto",
  llm_api_key: "",
  llm_api_url: "",
  check_interval_minutes: 30,
  sla_warning_hours: 2,
  is_active: true,
};

export default function AgentForm({ open, onClose, onSaved, editData }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editData) {
      setForm({ ...DEFAULT_FORM, ...editData });
    } else {
      setForm(DEFAULT_FORM);
    }
  }, [editData, open]);

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const toggleSkill = (key) => {
    const skills = form.data_skills || [];
    update("data_skills", skills.includes(key) ? skills.filter(s => s !== key) : [...skills, key]);
  };

  const handleSave = async () => {
    setSaving(true);
    if (editData?.id) {
      await base44.entities.AIAgent.update(editData.id, form);
    } else {
      await base44.entities.AIAgent.create(form);
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  const provider = LLM_PROVIDERS.find(p => p.value === form.llm_provider);
  const requiresApiKey = provider && !provider.noApiKey && form.llm_provider !== "ollama";
  const isSaveDisabled = saving || !form.name || !form.system_prompt || (requiresApiKey && !form.llm_api_key);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editData ? "Edit AI Agent" : "Create AI Agent"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <Label>Agent Name *</Label>
              <Input value={form.name} onChange={e => update("name", e.target.value)} placeholder="e.g. Bangkok Zone Monitor" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label>Description</Label>
              <Input value={form.description} onChange={e => update("description", e.target.value)} placeholder="Brief description" />
            </div>
          </div>

          {/* System Prompt */}
          <div>
            <Label>System Prompt *</Label>
            <Textarea
              value={form.system_prompt}
              onChange={e => update("system_prompt", e.target.value)}
              rows={5}
              className="font-mono text-xs mt-1"
              placeholder="Define agent behavior, rules, and escalation logic..."
            />
          </div>

          {/* Data Skills */}
          <div>
            <Label className="mb-2 block">Data Access & Skills</Label>
            <div className="grid grid-cols-2 gap-2">
              {DATA_SKILLS.map(skill => (
                <button
                  key={skill.key}
                  type="button"
                  onClick={() => toggleSkill(skill.key)}
                  className={`text-left p-3 rounded-lg border text-sm transition-all ${
                    form.data_skills?.includes(skill.key)
                      ? "border-blue-500 bg-blue-50 text-blue-800"
                      : "border-slate-200 hover:border-slate-300 text-slate-600"
                  }`}
                >
                  <div className="font-medium text-xs">{skill.label}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{skill.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Email Notification */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
            <div>
              <div className="text-sm font-medium text-slate-700">Email Notifications</div>
              <div className="text-xs text-slate-500">Agent can send email alerts</div>
            </div>
            <Switch checked={form.can_send_email} onCheckedChange={v => update("can_send_email", v)} />
          </div>
          {form.can_send_email && (
            <div>
              <Label>Notification Email</Label>
              <Input value={form.notification_email} onChange={e => update("notification_email", e.target.value)} placeholder="supervisor@company.com" type="email" />
            </div>
          )}

          {/* LLM Config */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
            <p className="text-sm font-semibold text-slate-700">LLM Configuration</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Provider</Label>
                <Select value={form.llm_provider} onValueChange={v => { update("llm_provider", v); update("llm_model", LLM_PROVIDERS.find(p => p.value === v)?.models[0] || ""); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LLM_PROVIDERS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Model</Label>
                <Select value={form.llm_model} onValueChange={v => update("llm_model", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {provider?.models.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {provider?.noApiKey && (
              <div className="col-span-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                ✅ Base44 Built-in LLM — ไม่ต้องใส่ API Key ใดๆ พร้อมใช้งานทันที
              </div>
            )}
            {requiresApiKey && (
              <div>
                <Label>API Key <span className="text-red-500">*</span></Label>
                <Input
                  value={form.llm_api_key}
                  onChange={e => update("llm_api_key", e.target.value)}
                  type="password"
                  placeholder={form.llm_provider === "openai" ? "sk-..." : form.llm_provider === "gemini" ? "AIza..." : "API Key..."}
                  className={requiresApiKey && !form.llm_api_key ? "border-red-300 focus-visible:ring-red-400" : ""}
                />
                {requiresApiKey && !form.llm_api_key && (
                  <p className="text-xs text-red-500 mt-1">⚠️ API Key จำเป็นสำหรับ {provider?.label}</p>
                )}
              </div>
            )}
            {(form.llm_provider === "ollama" || form.llm_provider === "openrouter") && (
              <div>
                <Label>API Endpoint URL</Label>
                <Input value={form.llm_api_url} onChange={e => update("llm_api_url", e.target.value)} placeholder={form.llm_provider === "ollama" ? "http://localhost:11434" : "https://openrouter.ai/api/v1"} />
              </div>
            )}
          </div>

          {/* Monitoring Config */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Check Interval (minutes)</Label>
              <Input type="number" value={form.check_interval_minutes} onChange={e => update("check_interval_minutes", Number(e.target.value))} min={5} />
            </div>
            <div>
              <Label>SLA Warning (hours before)</Label>
              <Input type="number" value={form.sla_warning_hours} onChange={e => update("sla_warning_hours", Number(e.target.value))} min={1} />
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
            <div>
              <div className="text-sm font-medium text-slate-700">Active</div>
              <div className="text-xs text-slate-500">Enable this agent to monitor and act</div>
            </div>
            <Switch checked={form.is_active} onCheckedChange={v => update("is_active", v)} />
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaveDisabled}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {editData ? "Update Agent" : "Create Agent"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}