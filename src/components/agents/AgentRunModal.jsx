import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Loader2, Zap, CheckCircle2, AlertTriangle, Mail } from "lucide-react";
import moment from "moment";

export default function AgentRunModal({ open, onClose, agent, onSaved }) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  const handleRun = async () => {
    if (!agent) return;
    setRunning(true);
    setResult(null);

    try {
      // Call backend function to execute agent
      const response = await base44.functions.invoke('executeAIAgent', { agent_id: agent.id });
      const { result, error } = response.data;

      if (error) {
        setResult({
          zone_health: 'Critical',
          summary: error,
          alerts: [],
          actions_executed: 0,
          actions: [],
        });
      } else {
        const actionsExecuted = result.actions_executed ?? 0;
        const actions = result.actions || [];
        const summary = result.llm_summary || result.reason || `${actionsExecuted} reassignments completed`;
        setResult({
          zone_health: actionsExecuted > 0 ? 'Good' : 'Warning',
          summary,
          alerts: actions.map(a => ({
            type: 'reassign',
            order_number: a.order_number,
            message: `Reassigned to ${a.assigned_to}`,
            action: a.reason,
          })),
          actions_executed: actionsExecuted,
          actions,
        });
      }
    } catch (e) {
      setResult({
        zone_health: 'Critical',
        summary: 'Error executing agent: ' + e.message,
        alerts: [],
        recommendations: [],
        notifications_to_create: [],
        actions_executed: 0,
      });
    }

    setRunning(false);
    onSaved();
  };

  const healthColor = {
    Good: "text-emerald-600 bg-emerald-50 border-emerald-200",
    Warning: "text-amber-600 bg-amber-50 border-amber-200",
    Critical: "text-red-600 bg-red-50 border-red-200",
  };

  return (
    <Dialog open={open} onOpenChange={() => { onClose(); setResult(null); }}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-600" />
            Run Agent: {agent?.name}
          </DialogTitle>
        </DialogHeader>

        {!result && !running && (
          <div className="space-y-3 text-sm text-slate-600">
            <p>Agent will analyze the following data:</p>
            <div className="flex flex-wrap gap-1.5">
              {agent?.data_skills?.map(s => (
                <Badge key={s} variant="secondary" className="text-xs">{s.replace("_", " ")}</Badge>
              ))}
            </div>
            {agent?.assigned_zone_names?.length > 0 && (
              <p className="text-xs text-slate-500">Scope: {agent.assigned_zone_names.join(", ")}</p>
            )}
            <p className="text-xs text-slate-400">Using: {agent?.llm_provider === "base44" ? "Base44 Built-in LLM" : `${agent?.llm_provider} · ${agent?.llm_model}`}</p>
          </div>
        )}

        {running && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm text-slate-500">Agent is analyzing data...</p>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className={`p-3 rounded-xl border font-semibold text-sm flex items-center gap-2 ${healthColor[result.zone_health] || "bg-slate-50 border-slate-200 text-slate-600"}`}>
              {result.zone_health === "Good" && <CheckCircle2 className="w-4 h-4" />}
              {result.zone_health === "Warning" && <AlertTriangle className="w-4 h-4" />}
              {result.zone_health === "Critical" && <AlertTriangle className="w-4 h-4" />}
              <span>{result.zone_health}</span>
              <span className="ml-auto text-sm font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                {result.actions_executed} action{result.actions_executed !== 1 ? 's' : ''} executed
              </span>
            </div>
            <p className="text-sm text-slate-700">{result.summary}</p>

            {result.actions?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-2">Reassignments ({result.actions.length})</p>
                <div className="space-y-2">
                  {result.actions.map((a, i) => (
                    <div key={i} className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <Badge className="text-[10px] bg-emerald-200 text-emerald-800">reassigned</Badge>
                        <span className="text-[10px] text-slate-500 font-mono">{a.order_number}</span>
                      </div>
                      <p className="text-xs text-slate-700 mt-1">→ Assigned to <span className="font-semibold">{a.assigned_to}</span></p>
                      {a.reason && <p className="text-xs text-slate-600 mt-1">Reason: {a.reason}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.alerts?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-2">Alerts ({result.alerts.length})</p>
                <div className="space-y-2">
                  {result.alerts.map((a, i) => (
                    <div key={i} className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <Badge className="text-[10px] bg-amber-200 text-amber-800">{a.type}</Badge>
                        {a.order_number && <span className="text-[10px] text-slate-500 font-mono">{a.order_number}</span>}
                      </div>
                      <p className="text-xs text-slate-700 mt-1">{a.message}</p>
                      {a.action && <p className="text-xs text-blue-600 mt-1">→ {a.action}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.recommendations?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-2">Recommendations</p>
                <ul className="space-y-1">
                  {result.recommendations.map((r, i) => (
                    <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                      <Zap className="w-3 h-3 text-blue-400 mt-0.5 shrink-0" /> {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {!result ? (
            <>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleRun} disabled={running}>
                {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                Run Now
              </Button>
            </>
          ) : (
            <Button onClick={() => { onClose(); setResult(null); }}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}