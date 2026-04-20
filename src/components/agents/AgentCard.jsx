import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, Pencil, Trash2, MapPin, Zap, Clock, CheckCircle2, XCircle, Mail } from "lucide-react";
import moment from "moment";

const PROVIDER_COLORS = {
  openai: "bg-emerald-100 text-emerald-700",
  gemini: "bg-blue-100 text-blue-700",
  openrouter: "bg-purple-100 text-purple-700",
  ollama: "bg-orange-100 text-orange-700",
};

const PROVIDER_LABELS = {
  openai: "OpenAI",
  gemini: "Gemini",
  openrouter: "OpenRouter",
  ollama: "Ollama",
};

const DATA_SKILL_LABELS = {
  work_orders: "Work Orders",
  technicians: "Technicians",
  customers: "Customers",
  zones: "Zones",
  sites: "Sites",
  notifications: "Notifications",
};

export default function AgentCard({ agent, onEdit, onDelete, onRun }) {
  return (
    <Card className="p-5 bg-white border-slate-200 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${agent.is_active ? "bg-blue-100" : "bg-slate-100"}`}>
            <Bot className={`w-5 h-5 ${agent.is_active ? "text-blue-600" : "text-slate-400"}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-slate-800">{agent.name}</p>
              {agent.is_active ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-slate-400" />
              )}
            </div>
            {agent.description && <p className="text-xs text-slate-500">{agent.description}</p>}
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(agent)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => onDelete(agent.id)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* LLM & config badges */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        <Badge className={`text-[10px] font-medium ${PROVIDER_COLORS[agent.llm_provider] || "bg-slate-100 text-slate-600"}`}>
          <Zap className="w-2.5 h-2.5 mr-0.5" />
          {PROVIDER_LABELS[agent.llm_provider] || agent.llm_provider} · {agent.llm_model}
        </Badge>
        <Badge variant="outline" className="text-[10px]">
          <Clock className="w-2.5 h-2.5 mr-0.5" />
          Every {agent.check_interval_minutes}m
        </Badge>
        {agent.can_send_email && (
          <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700">
            <Mail className="w-2.5 h-2.5 mr-0.5" /> Email
          </Badge>
        )}
      </div>

      {/* Data skills */}
      {agent.data_skills?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2.5">
          {agent.data_skills.map(s => (
            <Badge key={s} variant="secondary" className="text-[10px]">
              {DATA_SKILL_LABELS[s] || s}
            </Badge>
          ))}
        </div>
      )}

      {/* Assigned zones */}
      {agent.assigned_zone_names?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2.5 pt-2.5 border-t border-slate-100">
          <MapPin className="w-3 h-3 text-slate-400 mt-0.5" />
          {agent.assigned_zone_names.map(z => (
            <Badge key={z} className="text-[10px] bg-blue-50 text-blue-700">{z}</Badge>
          ))}
        </div>
      )}

      {/* Last run */}
      {agent.last_run_at && (
        <p className="text-[10px] text-slate-400 mt-2">
          Last run: {moment(agent.last_run_at).fromNow()}
          {agent.last_run_summary && <span className="ml-1 text-slate-500">· {agent.last_run_summary}</span>}
        </p>
      )}

      {/* System prompt preview */}
      <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 bg-slate-50 rounded-md p-2 font-mono">
        {agent.system_prompt}
      </p>

      {/* Run button */}
      <Button size="sm" variant="outline" className="w-full mt-3 h-7 text-xs" onClick={() => onRun(agent)} disabled={!agent.is_active}>
        <Zap className="w-3 h-3 mr-1 text-blue-500" /> Run Agent Now
      </Button>
    </Card>
  );
}