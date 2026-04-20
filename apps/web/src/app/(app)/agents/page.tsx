'use client';

import { useState } from 'react';
import { entities } from '@/lib/entity-client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Bot, CheckCircle2, XCircle, Zap } from 'lucide-react';
import { toast } from 'sonner';
import AgentForm from '@/components/agents/AgentForm';
import AgentCard from '@/components/agents/AgentCard';
import AgentRunModal from '@/components/agents/AgentRunModal';
import type { AIAgent } from '@ffm/shared';

export default function AgentsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<AIAgent | null>(null);
  const [runAgent, setRunAgent] = useState<AIAgent | null>(null);
  const queryClient = useQueryClient();

  const { data: agents = [], isLoading } = useQuery<AIAgent[]>({
    queryKey: ['agents'],
    queryFn: () => entities.AIAgent.list('-created_date', 100),
  });

  const handleDelete = async (id: string) => {
    await entities.AIAgent.delete(id);
    queryClient.invalidateQueries({ queryKey: ['agents'] });
    toast.success('Agent deleted');
  };

  const handleSaved = () => {
    queryClient.invalidateQueries({ queryKey: ['agents'] });
  };

  const activeCount = agents.filter((a) => a.is_active).length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Bot className="w-6 h-6 text-blue-600" /> AI Agents
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Autonomous agents that monitor zones, track SLA, and alert technicians
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 text-sm text-slate-500 border-r border-slate-200 pr-4">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> {activeCount} Active
            </span>
            <span className="flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5 text-slate-400" /> {agents.length - activeCount}{' '}
              Inactive
            </span>
          </div>
          <Button
            onClick={() => {
              setEditData(null);
              setShowForm(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1" /> New Agent
          </Button>
        </div>
      </div>

      <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-700 flex items-start gap-3">
        <Zap className="w-5 h-5 shrink-0 mt-0.5 text-blue-500" />
        <div>
          <strong>How it works:</strong> Each agent monitors work orders in its assigned zones
          using AI. Agents can detect SLA risks, overloaded technicians, and unassigned jobs —
          then send alerts and notifications automatically. Assign agents to zones on the{' '}
          <a href="/zones" className="underline font-semibold">
            Zones page
          </a>
          .
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center py-24 text-slate-400">
          <Bot className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No agents yet</p>
          <p className="text-sm mt-1">
            Create your first AI agent to start automating zone management
          </p>
          <Button
            className="mt-4"
            onClick={() => {
              setEditData(null);
              setShowForm(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1" /> Create First Agent
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onEdit={(a: AIAgent) => {
                setEditData(a);
                setShowForm(true);
              }}
              onDelete={handleDelete}
              onRun={(a: AIAgent) => setRunAgent(a)}
            />
          ))}
        </div>
      )}

      <AgentForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSaved={handleSaved}
        editData={editData}
      />

      {runAgent && (
        <AgentRunModal
          open={!!runAgent}
          onClose={() => setRunAgent(null)}
          agent={runAgent}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
