import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { agent_id } = await req.json();
    if (!agent_id) {
      return Response.json({ error: 'agent_id required' }, { status: 400 });
    }

    // Fetch agent
    const agent = await base44.asServiceRole.entities.AIAgent.filter({ id: agent_id }, '', 1);
    if (!agent || agent.length === 0) {
      return Response.json({ error: 'Agent not found' }, { status: 404 });
    }

    const aiAgent = agent[0];

    if (!aiAgent.is_active) {
      return Response.json({ result: { status: 'skipped', reason: 'Agent is inactive' } });
    }

    // Validate agent has LLM config
    const useBuiltinLLM = aiAgent.llm_provider === 'base44' || !aiAgent.llm_api_key;
    if (!useBuiltinLLM && !aiAgent.llm_provider) {
      return Response.json({ error: 'Agent missing LLM configuration' }, { status: 400 });
    }
    if (!useBuiltinLLM && !aiAgent.llm_api_key) {
      return Response.json({ error: `API Key จำเป็นสำหรับ provider: ${aiAgent.llm_provider}` }, { status: 400 });
    }

    // Get assigned zones
    const zoneIds = aiAgent.assigned_zone_ids || [];
    if (zoneIds.length === 0) {
      return Response.json({ result: { status: 'completed', actions: [], reason: 'No zones assigned' } });
    }

    // Fetch data sources
    const [workOrders, technicians] = await Promise.all([
      base44.asServiceRole.entities.WorkOrder.list('-created_date', 500),
      base44.asServiceRole.entities.Technician.list('-created_date', 500),
    ]);

    // Filter to agent's zones
    const zoneWOs = workOrders.filter(wo => zoneIds.includes(wo.zone_id) || aiAgent.assigned_zone_names?.includes(wo.zone_name));
    const zoneTechs = technicians.filter(t => zoneIds.includes(t.zone_id) || aiAgent.assigned_zone_names?.includes(t.zone_name));

    // Build context for LLM
    const systemPrompt = aiAgent.system_prompt || 'You are a work order dispatcher. Analyze jobs and reassign as needed.';
    const dataContext = JSON.stringify({
      unassigned_jobs: zoneWOs.filter(w => w.status === 'created').map(w => ({
        id: w.id, order_number: w.order_number, title: w.title, priority: w.priority,
        service_type: w.service_type, required_skills: w.required_skills,
        estimated_duration_hrs: w.estimated_duration_hrs, customer_name: w.customer_name,
      })),
      assigned_jobs_at_risk: zoneWOs.filter(w => w.sla_risk === 'high' || w.sla_risk === 'medium').map(w => ({
        id: w.id, order_number: w.order_number, title: w.title, assigned_to: w.assigned_technician_name,
        sla_risk: w.sla_risk, status: w.status,
      })),
      technicians: zoneTechs.map(t => ({
        id: t.id, full_name: t.full_name, skills: t.skills || [], availability: t.availability,
        current_daily_jobs: t.current_daily_jobs || 0, max_daily_jobs: t.max_daily_jobs || 6,
      })),
      zones: aiAgent.assigned_zone_names || [],
    }, null, 2);

    const prompt = `System Prompt: ${systemPrompt}

Current work order data:
${dataContext}

Based on this context, analyze if any work orders should be reassigned. Return a JSON array of actions in this format:
{
  "actions": [
    {
      "type": "reassign",
      "work_order_id": "...",
      "new_technician_id": "...",
      "reason": "brief explanation"
    }
  ],
  "summary": "brief summary of decisions made"
}

Only include actions you are confident about. Prioritize:
1. Assigning high-priority unassigned jobs to the best-fit technicians
2. Reassigning jobs from overloaded technicians to available ones
3. Mitigating SLA risk by reassigning to faster/more experienced technicians
`;

    // Call LLM
    let llmResponse;
    if (useBuiltinLLM) {
      // Use Base44 built-in Core LLM
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            actions: { type: "array", items: { type: "object" } },
            summary: { type: "string" },
          },
        },
      });
      llmResponse = JSON.stringify(result);
    } else if (aiAgent.llm_provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${aiAgent.llm_api_key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: aiAgent.llm_model || 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 1000,
        }),
      });
      const data = await res.json();
      llmResponse = data.choices?.[0]?.message?.content || '';
    } else {
      return Response.json({ error: `LLM provider ${aiAgent.llm_provider} not yet supported` }, { status: 400 });
    }

    // Parse LLM response
    let decisions = { actions: [], summary: 'No actions taken' };
    try {
      const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        decisions = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.log('Failed to parse LLM response:', e.message);
    }

    // Execute actions
    const executedActions = [];
    for (const action of decisions.actions || []) {
      try {
        if (action.type === 'reassign' && action.work_order_id && action.new_technician_id) {
          const woToUpdate = workOrders.find(w => w.id === action.work_order_id);
          const techToAssign = technicians.find(t => t.id === action.new_technician_id);

          if (woToUpdate && techToAssign) {
            // Update work order
            await base44.asServiceRole.entities.WorkOrder.update(action.work_order_id, {
              assigned_technician_id: techToAssign.id,
              assigned_technician_name: techToAssign.full_name,
              status: 'assigned',
            });

            // Increment technician job count
            await base44.asServiceRole.entities.Technician.update(action.new_technician_id, {
              current_daily_jobs: (techToAssign.current_daily_jobs || 0) + 1,
            });

            executedActions.push({
              work_order_id: action.work_order_id,
              order_number: woToUpdate.order_number,
              assigned_to: techToAssign.full_name,
              reason: action.reason,
            });
          }
        }
      } catch (e) {
        console.error('Error executing action:', e.message);
      }
    }

    // Update agent metadata
    await base44.asServiceRole.entities.AIAgent.update(agent_id, {
      last_run_at: new Date().toISOString(),
      last_run_summary: `${executedActions.length} actions executed: ${decisions.summary}`,
    });

    return Response.json({
      result: {
        status: 'completed',
        actions_executed: executedActions.length,
        actions: executedActions,
        llm_summary: decisions.summary,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});