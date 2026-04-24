'use client';

import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Award, Upload, Check, X, Clock, FileText, Trash2, ExternalLink,
  Plus, Loader2, AlertCircle, CheckCircle2, AlertTriangle, Package,
  type LucideIcon,
} from 'lucide-react';
import BulkSkillImport from './BulkSkillImport';
import { entities } from '@/lib/entity-client';
import { http } from '@/lib/api';
import { toast } from 'sonner';
import type { MemberSkillCert, MemberSkillCertStatus, Skill } from '@ffm/shared';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: LucideIcon }> = {
  pending: { label: 'Pending Review', color: 'bg-amber-100 text-amber-700', icon: Clock },
  approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: X },
  expired: { label: 'Expired', color: 'bg-slate-100 text-slate-500', icon: AlertTriangle },
};

interface CertCardProps {
  cert: MemberSkillCert;
  onStatusChange: (certId: string, status: MemberSkillCertStatus) => Promise<void> | void;
  onDelete: (certId: string) => void;
}

function CertCard({ cert, onStatusChange, onDelete }: CertCardProps) {
  const [updating, setUpdating] = useState(false);
  const s = STATUS_CONFIG[cert.status] || STATUS_CONFIG.pending;
  const Icon = s.icon;

  const handleStatus = async (status: MemberSkillCertStatus) => {
    setUpdating(true);
    await onStatusChange(cert.id, status);
    setUpdating(false);
  };

  return (
    <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-blue-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-slate-800">{cert.skill_name}</p>
            {cert.issued_date && (
              <p className="text-[10px] text-slate-400">Issued: {cert.issued_date}{cert.expiry_date ? ` · Expires: ${cert.expiry_date}` : ''}</p>
            )}
          </div>
        </div>
        <Badge className={`${s.color} text-[10px] shrink-0`}>
          <Icon className="w-2.5 h-2.5 mr-0.5" /> {s.label}
        </Badge>
      </div>

      {cert.cert_file_url && (
        <a
          href={cert.cert_file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
        >
          <FileText className="w-3.5 h-3.5" />
          {cert.cert_file_name || 'View Certificate'}
          <ExternalLink className="w-3 h-3" />
        </a>
      )}

      {cert.reviewer_note && (
        <p className="text-xs text-slate-500 bg-slate-50 rounded px-2 py-1 italic">{cert.reviewer_note}</p>
      )}

      <div className="flex gap-1.5 pt-1">
        {cert.status !== 'approved' && (
          <Button size="sm" variant="outline" className="h-7 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50"
            disabled={updating} onClick={() => handleStatus('approved')}>
            {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3 mr-1" />} Approve
          </Button>
        )}
        {cert.status !== 'rejected' && (
          <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
            disabled={updating} onClick={() => handleStatus('rejected')}>
            <X className="w-3 h-3 mr-1" /> Reject
          </Button>
        )}
        <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-400 hover:text-red-500 ml-auto"
          onClick={() => onDelete(cert.id)}>
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

interface NewCertState {
  skill_ids: string[];
  issued_date: string;
  expiry_date: string;
  cert_file_url: string;
  cert_file_name: string;
}

function toIsoDateStart(value?: string): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return `${trimmed}T00:00:00.000Z`;
  return trimmed;
}

interface Props {
  technicianId: string;
  technicianName: string;
}

export default function SkillCertPanel({ technicianId, technicianName }: Props) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [adding, setAdding] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newCert, setNewCert] = useState<NewCertState>({ skill_ids: [], issued_date: '', expiry_date: '', cert_file_url: '', cert_file_name: '' });

  const { data: certs = [], isLoading } = useQuery<MemberSkillCert[]>({
    queryKey: ['skillCerts', technicianId],
    queryFn: () => entities.MemberSkillCert.filter({ technician_id: technicianId }),
  });

  const { data: skills = [] } = useQuery<Skill[]>({
    queryKey: ['skills'],
    queryFn: () => entities.Skill.list('name', 500),
  });
  const { data: technician } = useQuery({
    queryKey: ['technician', technicianId],
    queryFn: () => entities.Technician.findById(technicianId),
    enabled: !!technicianId,
  });

  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: ['skillCerts', technicianId] });
    await qc.invalidateQueries({ queryKey: ['technicians'] });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    // TODO: backend file upload endpoint
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await http.post<{ file_url: string }>('/uploads', formData);
    const { file_url } = data;
    setNewCert(prev => ({ ...prev, cert_file_url: file_url, cert_file_name: file.name }));
    setUploading(false);
  };

  const toggleSkill = (skillId: string) => {
    setNewCert((prev) => {
      const exists = prev.skill_ids.includes(skillId);
      return {
        ...prev,
        skill_ids: exists
          ? prev.skill_ids.filter((id) => id !== skillId)
          : [...prev.skill_ids, skillId],
      };
    });
  };

  const handleAdd = async () => {
    if (newCert.skill_ids.length === 0) return;
    setAdding(true);
    try {
      const selectedSkills = availableSkills.filter((s) => newCert.skill_ids.includes(s.id));
      for (const skill of selectedSkills) {
        await entities.MemberSkillCert.create({
          technician_id: technicianId,
          technician_name: technicianName,
          skill_id: skill.id,
          skill_name: skill.name,
          cert_file_url: newCert.cert_file_url || undefined,
          cert_file_name: newCert.cert_file_name || undefined,
          issued_date: toIsoDateStart(newCert.issued_date),
          expiry_date: toIsoDateStart(newCert.expiry_date),
          status: 'pending',
        } as Partial<MemberSkillCert>);
      }
      setNewCert({ skill_ids: [], issued_date: '', expiry_date: '', cert_file_url: '', cert_file_name: '' });
      await refresh();
      toast.success(`Submitted ${selectedSkills.length} skill certification(s)`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit skills';
      toast.error(message);
    } finally {
      setAdding(false);
    }
  };

  const handleStatusChange = async (certId: string, status: MemberSkillCertStatus) => {
    try {
      await entities.MemberSkillCert.update(certId, { status });
      await refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update cert status';
      toast.error(message);
    }
  };

  const handleDelete = async (certId: string) => {
    try {
      await entities.MemberSkillCert.delete(certId);
      await refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete cert';
      toast.error(message);
    }
  };

  const handleRemoveTechnicianSkill = async (skillName: string) => {
    try {
      const current = Array.isArray(technician?.skills) ? technician.skills : [];
      const nextSkills = current.filter((s) => s !== skillName);
      await entities.Technician.update(technicianId, { skills: nextSkills });
      // Also remove matching cert rows (if any) so UI data stays consistent.
      const related = certs.filter((c) => c.skill_name === skillName);
      for (const cert of related) {
        await entities.MemberSkillCert.delete(cert.id);
      }
      await qc.invalidateQueries({ queryKey: ['technician', technicianId] });
      await refresh();
      toast.success(`Removed "${skillName}"`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove skill';
      toast.error(message);
    }
  };

  const existingSkillIds = new Set(certs.map(c => c.skill_id));
  const availableSkills = skills.filter(s => !existingSkillIds.has(s.id));
  const approved = certs.filter(c => c.status === 'approved');
  const pending = certs.filter(c => c.status === 'pending');

  return (
    <div className="space-y-4">
      <Button size="sm" variant="outline" className="w-full gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => setShowBulk(true)}>
        <Package className="w-3.5 h-3.5" /> Bulk Add Skills
      </Button>

      <div className="flex gap-3">
        <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-center">
          <p className="text-xl font-bold text-emerald-700">{approved.length}</p>
          <p className="text-xs text-emerald-600">Approved Skills</p>
        </div>
        <div className="flex-1 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-center">
          <p className="text-xl font-bold text-amber-700">{pending.length}</p>
          <p className="text-xs text-amber-600">Pending Review</p>
        </div>
      </div>

      {pending.length > 0 && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-700">{pending.length} cert(s) waiting for your approval</p>
        </div>
      )}

      <div className="space-y-2">
        {isLoading ? (
          <p className="text-sm text-slate-400">Loading...</p>
        ) : certs.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">No skill certifications yet</p>
        ) : (
          certs.map(cert => (
            <CertCard key={cert.id} cert={cert} onStatusChange={handleStatusChange} onDelete={handleDelete} />
          ))
        )}
      </div>

      {(technician?.skills?.length ?? 0) > 0 && (
        <div className="border rounded-lg p-3 space-y-2">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Current Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {technician?.skills?.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => handleRemoveTechnicianSkill(skill)}
                className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                title={`Remove ${skill}`}
              >
                <X className="w-3 h-3" />
                {skill}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-500">Click a skill chip to remove it from member profile.</p>
        </div>
      )}

      <div className="border-t pt-4 space-y-3">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Skill Certification
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2">
            <Label className="text-xs">Skill <span className="text-red-500">*</span></Label>
            {availableSkills.length === 0 ? (
              <div className="text-xs text-slate-400 border rounded-md p-2">All skills already added</div>
            ) : (
              <div className="border rounded-md p-2 space-y-2 max-h-36 overflow-y-auto">
                {availableSkills.map((s) => {
                  const isSelected = newCert.skill_ids.includes(s.id);
                  return (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => toggleSkill(s.id)}
                      className={`w-full flex items-center gap-2 text-left text-sm rounded px-2 py-1.5 transition ${
                        isSelected
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-300'}`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span>{s.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
            <p className="text-[11px] text-slate-500 mt-1">{newCert.skill_ids.length} skill(s) selected</p>
          </div>
          <div>
            <Label className="text-xs">Issued Date</Label>
            <Input type="date" value={newCert.issued_date} onChange={e => setNewCert(p => ({ ...p, issued_date: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs">Expiry Date</Label>
            <Input type="date" value={newCert.expiry_date} onChange={e => setNewCert(p => ({ ...p, expiry_date: e.target.value }))} />
          </div>
        </div>

        <div>
          <Label className="text-xs">Certificate File</Label>
          <input ref={fileRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} />
          {newCert.cert_file_url ? (
            <div className="flex items-center gap-2 mt-1 p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
              <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-xs text-emerald-700 truncate flex-1">{newCert.cert_file_name}</span>
              <button onClick={() => setNewCert(p => ({ ...p, cert_file_url: '', cert_file_name: '' }))}
                className="text-slate-400 hover:text-red-500">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="mt-1 w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-lg py-3 text-sm text-slate-500 hover:border-blue-300 hover:text-blue-600 transition-colors"
            >
              {uploading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                : <><Upload className="w-4 h-4" /> Upload PDF or Image</>
              }
            </button>
          )}
        </div>

        <Button
          className="w-full"
          size="sm"
          onClick={handleAdd}
          disabled={adding || newCert.skill_ids.length === 0}
        >
          {adding ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Plus className="w-4 h-4 mr-1.5" />}
          Submit for Review ({newCert.skill_ids.length})
        </Button>
      </div>

      {showBulk && (
        <BulkSkillImport
          open={showBulk}
          onClose={() => setShowBulk(false)}
          onDone={() => {
            void refresh();
          }}
          technicianId={technicianId}
          technicianName={technicianName}
        />
      )}
    </div>
  );
}
