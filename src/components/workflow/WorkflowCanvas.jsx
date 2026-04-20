import React, { useRef, useState, useCallback, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Play, Square, GitBranch, Trash2, X, ZoomIn, ZoomOut, Plus, Loader2 } from "lucide-react";
import NodeConfigPanel from "./NodeConfigPanel";
import AIStepGenerator from "@/components/servicetype/AIStepGenerator";
import StepTaskEditor from "@/components/servicetype/StepTaskEditor";
import { useQueryClient } from "@tanstack/react-query";

const NODE_WIDTH = 160;
const NODE_HEIGHT = 64;
const MIN_ZOOM_W = 700;   // most zoomed-in  (small viewBox = zoom in)
const MAX_ZOOM_W = 2000;  // most zoomed-out (large viewBox = zoom out)

function getNodeColor(type) {
  if (type === "start") return { bg: "#dcfce7", border: "#16a34a", text: "#166534" };
  if (type === "end") return { bg: "#fee2e2", border: "#dc2626", text: "#991b1b" };
  return { bg: "#eff6ff", border: "#3b82f6", text: "#1e40af" };
}

function NodeBox({ node, selected, onSelect, onDragStart, onPortMouseDown, onDelete, connecting }) {
  const colors = getNodeColor(node.type);
  return (
    <g
      transform={`translate(${node.x},${node.y})`}
      style={{ cursor: connecting ? "crosshair" : "move" }}
      data-node="true"
      onMouseDown={(e) => {
        e.stopPropagation();
        onDragStart(e, node.id);
        onSelect(node.id);
      }}
    >
      <rect
        width={NODE_WIDTH} height={NODE_HEIGHT}
        rx={node.type === "start" || node.type === "end" ? 32 : 10}
        fill={colors.bg}
        stroke={selected ? "#6366f1" : colors.border}
        strokeWidth={selected ? 2.5 : 1.5}
        filter="url(#shadow)"
      />
      <text x={NODE_WIDTH / 2} y={NODE_HEIGHT / 2 - 6} textAnchor="middle" dominantBaseline="middle"
        fontSize={13} fontWeight="600" fill={colors.text} style={{ pointerEvents: "none", userSelect: "none" }}>
        {node.label.length > 16 ? node.label.slice(0, 15) + "…" : node.label}
      </text>
      {node.type === "service" && (
        <text x={NODE_WIDTH / 2} y={NODE_HEIGHT / 2 + 12} textAnchor="middle" dominantBaseline="middle"
          fontSize={9} fill="#6b7280" style={{ pointerEvents: "none", userSelect: "none" }}>
          {node.assignee_mode === "auto" ? "⚡ Auto Assign" : node.assignee_mode === "zone" ? "📍 Zone" : "👤 Manual"}
        </text>
      )}
      {/* Output port */}
      {node.type !== "end" && (
        <circle cx={NODE_WIDTH} cy={NODE_HEIGHT / 2} r={7} fill="white" stroke={colors.border} strokeWidth={2}
          style={{ cursor: "crosshair" }}
          onMouseDown={(e) => { e.stopPropagation(); onPortMouseDown(e, node.id, "out"); }}
        />
      )}
      {/* Input port */}
      {node.type !== "start" && (
        <circle cx={0} cy={NODE_HEIGHT / 2} r={7} fill="white" stroke={colors.border} strokeWidth={2}
          style={{ cursor: "crosshair" }}
          onMouseDown={(e) => { e.stopPropagation(); onPortMouseDown(e, node.id, "in"); }}
        />
      )}
      {selected && node.type !== "start" && node.type !== "end" && (
        <g transform={`translate(${NODE_WIDTH - 18}, -10)`}
          onMouseDown={(e) => { e.stopPropagation(); onDelete(node.id); }}
          style={{ cursor: "pointer" }}>
          <circle r={9} fill="#ef4444" />
          <text x={0} y={0} textAnchor="middle" dominantBaseline="middle" fontSize={12} fill="white" fontWeight="bold">×</text>
        </g>
      )}
    </g>
  );
}

function NewServiceTypeDialog({ onClose, onCreated }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [steps, setSteps] = useState([]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const created = await base44.entities.ServiceType.create({
      name: name.trim(),
      code: code.trim() || name.trim().toLowerCase().replace(/\s+/g, "_"),
      steps: steps,
      is_active: true,
    });
    setSaving(false);
    onCreated(created);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Plus className="w-4 h-4" />New Service Type</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Name *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Installation" autoFocus />
            </div>
            <div>
              <Label className="text-xs">Code <span className="text-slate-400">(auto if blank)</span></Label>
              <Input value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. installation" />
            </div>
          </div>
          <div className="border-t border-slate-100 pt-3">
            <StepTaskEditor steps={steps} onChange={setSteps} />
          </div>
        </div>
        <DialogFooter className="border-t border-slate-100 pt-3 shrink-0">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Create & Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function WorkflowCanvas({ workflow, serviceTypes, technicians, zones, onChange }) {
  const svgRef = useRef(null);
  const qc = useQueryClient();
  const [nodes, setNodes] = useState(workflow?.nodes || []);
  const [edges, setEdges] = useState(workflow?.edges || []);
  const [selected, setSelected] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [connecting, setConnecting] = useState(null); // { fromId, fromX, fromY, curX, curY }
  const [configNode, setConfigNode] = useState(null);
  const [viewBox, setViewBox] = useState({ x: -40, y: -40, w: 1000, h: 700 });
  const [panning, setPanning] = useState(null);
  const [showNewST, setShowNewST] = useState(false);

  useEffect(() => {
    setNodes(workflow?.nodes || []);
    setEdges(workflow?.edges || []);
  }, [workflow?.id]);

  const save = useCallback((ns, es) => {
    onChange({ nodes: ns, edges: es });
  }, [onChange]);

  const addNode = (type, serviceType = null) => {
    const id = `node_${Date.now()}`;
    const x = 200 + nodes.length * 40;
    const y = 200 + (nodes.length % 4) * 100;
    const newNode = {
      id, type,
      label: type === "start" ? "Start" : type === "end" ? "End" : serviceType?.name || "Service",
      x, y,
      service_type_id: serviceType?.id || null,
      service_type_name: serviceType?.name || null,
      assignee_mode: "manual",
      allowed_technician_ids: [],
      allowed_zone_ids: [],
      auto_assign: false,
    };
    const ns = [...nodes, newNode];
    setNodes(ns);
    save(ns, edges);
  };

  const deleteNode = (id) => {
    // Find predecessor (node that has edge → id) and successor (node that id → )
    const inEdge = edges.find(e => e.target === id);
    const outEdge = edges.find(e => e.source === id);

    const ns = nodes.filter(n => n.id !== id);
    let es = edges.filter(e => e.source !== id && e.target !== id);

    // Auto-reconnect: predecessor → successor
    if (inEdge && outEdge) {
      es = [...es, { id: `edge_${Date.now()}`, source: inEdge.source, target: outEdge.target }];
    }

    setNodes(ns);
    setEdges(es);
    setSelected(null);
    setConfigNode(null);
    save(ns, es);
  };

  const deleteEdge = (id) => {
    const es = edges.filter(e => e.id !== id);
    setEdges(es);
    save(nodes, es);
  };

  const onSvgMouseDown = (e) => {
    // Pan on: middle click, alt+click, or left click on svg background (not on nodes/ports)
    const isBackground = e.target === svgRef.current || e.target.tagName === "svg" || e.target.tagName === "rect" && e.target.closest("g") === null;
    if (e.button === 1 || e.altKey || (e.button === 0 && isBackground)) {
      setPanning({ startX: e.clientX, startY: e.clientY, vb: { ...viewBox } });
      setSelected(null);
      setConnecting(null);
      e.preventDefault();
    }
  };

  const onNodeDragStart = (e, id) => {
    if (connecting) return;
    const node = nodes.find(n => n.id === id);
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
    setDragging({ id, offX: svgP.x - node.x, offY: svgP.y - node.y });
  };

  const onPortMouseDown = (e, nodeId, portType) => {
    e.preventDefault();
    const node = nodes.find(n => n.id === nodeId);
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
    if (portType === "out") {
      setConnecting({ fromId: nodeId, fromX: node.x + NODE_WIDTH, fromY: node.y + NODE_HEIGHT / 2, curX: svgP.x, curY: svgP.y });
    }
  };

  const onSvgMouseMove = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

    if (dragging) {
      const ns = nodes.map(n => n.id === dragging.id
        ? { ...n, x: svgP.x - dragging.offX, y: svgP.y - dragging.offY }
        : n);
      setNodes(ns);
    }
    if (connecting) {
      setConnecting(c => ({ ...c, curX: svgP.x, curY: svgP.y }));
    }
    if (panning) {
      const dx = (e.clientX - panning.startX) * (panning.vb.w / svg.clientWidth);
      const dy = (e.clientY - panning.startY) * (panning.vb.h / svg.clientHeight);
      setViewBox({ ...panning.vb, x: panning.vb.x - dx, y: panning.vb.y - dy });
    }
  }, [dragging, connecting, panning, nodes]);

  const onSvgMouseUp = useCallback((e) => {
    if (dragging) {
      save(nodes, edges);
      setDragging(null);
    }
    if (panning) setPanning(null);
    if (connecting) {
      const svg = svgRef.current;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
      // find target node
      const target = nodes.find(n =>
        n.id !== connecting.fromId &&
        n.type !== "start" &&
        svgP.x >= n.x && svgP.x <= n.x + NODE_WIDTH &&
        svgP.y >= n.y && svgP.y <= n.y + NODE_HEIGHT
      );
      if (target) {
        const already = edges.find(edge => edge.source === connecting.fromId && edge.target === target.id);
        if (!already) {
          const es = [...edges, { id: `edge_${Date.now()}`, source: connecting.fromId, target: target.id }];
          setEdges(es);
          save(nodes, es);
        }
      }
      setConnecting(null);
    }
  }, [dragging, panning, connecting, nodes, edges, save]);

  const zoom = (factor) => {
    setViewBox(vb => {
      const newW = Math.min(MAX_ZOOM_W, Math.max(MIN_ZOOM_W, vb.w * factor));
      const newH = newW * (vb.h / vb.w);
      return {
        x: vb.x + (vb.w - newW) / 2,
        y: vb.y + (vb.h - newH) / 2,
        w: newW,
        h: newH,
      };
    });
  };

  const edgePath = (edge) => {
    const s = nodes.find(n => n.id === edge.source);
    const t = nodes.find(n => n.id === edge.target);
    if (!s || !t) return "";
    const x1 = s.x + NODE_WIDTH, y1 = s.y + NODE_HEIGHT / 2;
    const x2 = t.x, y2 = t.y + NODE_HEIGHT / 2;
    const cx = (x1 + x2) / 2;
    return `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`;
  };

  // Add service node to the right of the rightmost node (no auto-connect)
  const addServiceNodeAtEnd = (serviceType) => {
    const endNode = nodes.find(n => n.type === "end");
    const serviceNodes = nodes.filter(n => n.type !== "end");
    const maxX = serviceNodes.length > 0 ? Math.max(...serviceNodes.map(n => n.x)) : 100;
    const refNode = serviceNodes.find(n => n.x === maxX);
    const newX = endNode ? endNode.x - NODE_WIDTH - 80 : maxX + NODE_WIDTH + 80;
    const newY = refNode ? refNode.y : 200;

    const newNodeId = `node_${Date.now()}`;
    const newNode = {
      id: newNodeId,
      type: "service",
      label: serviceType.name,
      x: newX,
      y: newY,
      service_type_id: serviceType.id,
      service_type_name: serviceType.name,
      assignee_mode: "manual",
      allowed_technician_ids: [],
      allowed_zone_ids: [],
      auto_assign: false,
    };

    // Push End node further right if exists
    let newNodes = [...nodes, newNode];
    if (endNode) {
      newNodes = newNodes.map(n => n.id === endNode.id ? { ...n, x: newX + NODE_WIDTH + 80 } : n);
    }

    setNodes(newNodes);
    save(newNodes, edges);
  };

  const hasStart = nodes.some(n => n.type === "start");
  const hasEnd = nodes.some(n => n.type === "end");

  return (
    <div className="flex h-full min-h-0">
      {/* Left Panel - Toolbox */}
      <div className="w-52 border-r border-slate-200 bg-slate-50 p-3 flex flex-col gap-2 overflow-y-auto shrink-0">
        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-1">Control Nodes</p>
        {!hasStart && (
          <button onClick={() => addNode("start")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-green-300 bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 transition-colors">
            <Play className="w-3.5 h-3.5" /> Start
          </button>
        )}
        {!hasEnd && (
          <button onClick={() => addNode("end")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-300 bg-red-50 text-red-700 text-xs font-medium hover:bg-red-100 transition-colors">
            <Square className="w-3.5 h-3.5" /> End
          </button>
        )}
        <div className="flex items-center justify-between mt-2 mb-1">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Service Types</p>
          <button onClick={() => setShowNewST(true)}
            className="w-5 h-5 rounded flex items-center justify-center bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors" title="New Service Type">
            <Plus className="w-3 h-3" />
          </button>
        </div>
        {serviceTypes.filter(st => st.is_active !== false).map(st => (
          <div key={st.id} className="flex items-center gap-1">
            <button onClick={() => addNode("service", st)}
              className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border border-blue-200 bg-white text-blue-700 text-xs font-medium hover:bg-blue-50 transition-colors text-left min-w-0">
              <GitBranch className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{st.name}</span>
            </button>
            <button
              onClick={() => addServiceNodeAtEnd(st)}
              title="เพิ่ม node นี้ต่อท้าย workflow อัตโนมัติ"
              className="w-6 h-6 rounded flex items-center justify-center bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-colors shrink-0">
              <Plus className="w-3 h-3" />
            </button>
          </div>
        ))}
        {serviceTypes.length === 0 && (
          <p className="text-xs text-slate-400">No service types yet. Click + to add.</p>
        )}
        <div className="mt-auto pt-3 border-t border-slate-200 flex gap-1.5">
          <button onClick={() => zoom(0.8)} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 text-xs"><ZoomIn className="w-3 h-3" /></button>
          <button onClick={() => zoom(1.25)} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 text-xs"><ZoomOut className="w-3 h-3" /></button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden bg-[#f8fafc]" style={{ backgroundImage: "radial-gradient(circle, #cbd5e1 1px, transparent 1px)", backgroundSize: "24px 24px" }}>
        <svg
          ref={svgRef}
          className="w-full h-full"
          style={{ cursor: panning ? "grabbing" : "grab" }}
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
          onMouseDown={onSvgMouseDown}
          onMouseMove={onSvgMouseMove}
          onMouseUp={onSvgMouseUp}
          onMouseLeave={onSvgMouseUp}
          onWheel={(e) => {
            e.preventDefault();
            const factor = e.deltaY > 0 ? 1.1 : 0.9;
            setViewBox(vb => {
              const newW = Math.min(MAX_ZOOM_W, Math.max(MIN_ZOOM_W, vb.w * factor));
              const newH = newW * (vb.h / vb.w);
              return {
                x: vb.x + (vb.w - newW) / 2,
                y: vb.y + (vb.h - newH) / 2,
                w: newW,
                h: newH,
              };
            });
          }}
        >
          <defs>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#00000015" />
            </filter>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#94a3b8" />
            </marker>
          </defs>

          {/* Edges */}
          {edges.map(edge => (
            <g key={edge.id}>
              <path d={edgePath(edge)} fill="none" stroke="#cbd5e1" strokeWidth={10} strokeOpacity={0} style={{ cursor: "pointer" }}
                onClick={() => deleteEdge(edge.id)} />
              <path d={edgePath(edge)} fill="none" stroke="#94a3b8" strokeWidth={2} markerEnd="url(#arrow)" />
            </g>
          ))}

          {/* Connecting line preview */}
          {connecting && (
            <line x1={connecting.fromX} y1={connecting.fromY} x2={connecting.curX} y2={connecting.curY}
              stroke="#6366f1" strokeWidth={2} strokeDasharray="6,4" />
          )}

          {/* Nodes */}
          {nodes.map(node => (
            <NodeBox key={node.id} node={node} selected={selected === node.id}
              onSelect={(id) => { setSelected(id); setConfigNode(nodes.find(n => n.id === id)); }}
              onDragStart={onNodeDragStart}
              onPortMouseDown={onPortMouseDown}
              onDelete={deleteNode}
              connecting={!!connecting}
            />
          ))}
        </svg>

        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <GitBranch className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">Add nodes from the left panel to start designing your workflow</p>
              <p className="text-slate-300 text-xs mt-1">Drag nodes to reposition • Click output port and drag to connect</p>
            </div>
          </div>
        )}
      </div>

      {showNewST && (
        <NewServiceTypeDialog
          onClose={() => setShowNewST(false)}
          onCreated={(st) => {
            qc.invalidateQueries({ queryKey: ["serviceTypes"] });
            addNode("service", st);
          }}
        />
      )}

      {/* Right Panel - Node Config */}
      {configNode && configNode.type === "service" && (
        <NodeConfigPanel
          node={configNode}
          technicians={technicians}
          zones={zones}
          onClose={() => { setConfigNode(null); setSelected(null); }}
          onChange={(updated) => {
            const ns = nodes.map(n => n.id === updated.id ? updated : n);
            setNodes(ns);
            setConfigNode(updated);
            save(ns, edges);
          }}
        />
      )}
    </div>
  );
}