'use client';

import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Award, Upload, Check, X, Clock, FileText, Trash2, ExternalLink,
  Plus, Loader2, AlertCircle, CheckCircle2, AlertTriangle, Package,
  type LucideIcon,
} from 'lucide-react';
import BulkSkillImport from './BulkSkillImport';
import { entities } from '@/lib/entity-client';
import { http } from '@/lib/api';
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
  skill_id: string;
  skill_name: string;
  issued_date: string;
  expiry_date: string;
  cert_file_url: string;
  cert_file_name: string;
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
  const [newCert, setNewCert] = useState<NewCertState>({ skill_id: '', skill_name: '', issued_date: '', expiry_date: '', cert_file_url: '', cert_file_name: '' });

  const { data: certs = [], isLoading } = useQuery<MemberSkillCert[]>({
    queryKey: ['skillCerts', technicianId],
    queryFn: () => entities.MemberSkillCert.filter({ technician_id: technicianId }),
  });

  const { data: skills = [] } = useQuery<Skill[]>({
    queryKey: ['skills'],
    queryFn: () => entities.Skill.list('name', 500),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['skillCerts', technicianId] });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    // TODO: backend file upload endpoint
    const formData = new FormData();
    formData.append('file', file);
    const { file_url } = await http.post<{ file_url: string }>('/uploads', formData);
    setNewCert(prev => ({ ...prev, cert_file_url: file_url, cert_file_name: file.name }));
    setUploading(false);
  };

  const handleSkillChange = (skillId: string) => {
    const skill = skills.find(s => s.id === skillId);
    setNewCert(prev => ({ ...prev, skill_id: skillId, skill_name: skill?.name || '' }));
  };

  const syncApprovedSkills = async () => {
    const allCerts = await entities.MemberSkillCert.filter({ technician_id: technicianId });
    const approved = allCerts.filter(c => c.status === 'approved').map(c => c.skill_name);
    await entities.Technician.update(technicianId, { skills: approved });
    qc.invalidateQueries({ queryKey: ['technicians'] });
  };

  const handleAdd = async () => {
    if (!newCert.skill_id) return;
    setAdding(true);
    await entities.MemberSkillCert.create({
      technician_id: technicianId,
      technician_name: technicianName,
      skill_id: newCert.skill_id,
      skill_name: newCert.skill_name,
      cert_file_url: newCert.cert_file_url,
      cert_file_name: newCert.cert_file_name,
      issued_date: newCert.issued_date,
      expiry_date: newCert.expiry_date,
      status: 'pending',
    } as Partial<MemberSkillCert>);
    setNewCert({ skill_id: '', skill_name: '', issued_date: '', expiry_date: '', cert_file_url: '', cert_file_name: '' });
    setAdding(false);
    refresh();
    syncApprovedSkills();
  };

  const handleStatusChange = async (certId: string, status: MemberSkillCertStatus) => {
    await entities.MemberSkillCert.update(certId, { status });
    refresh();
    syncApprovedSkills();
  };

  const handleDelete = async (certId: string) => {
    await entities.MemberSkillCert.delete(certId);
    refresh();
    syncApprovedSkills();
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

      <div className="border-t pt-4 space-y-3">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Skill Certification
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2">
            <Label className="text-xs">Skill <span className="text-red-500">*</span></Label>
            <Select value={newCert.skill_id} onValueChange={handleSkillChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select skill..." />
              </SelectTrigger>
              <SelectContent>
                {availableSkills.length === 0
                  ? <SelectItem value="__none__" disabled>All skills already added</SelectItem>
                  : availableSkills.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
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
          disabled={adding || !newCert.skill_id}
        >
          {adding ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Plus className="w-4 h-4 mr-1.5" />}
          Submit for Review
        </Button>
      </div>

      {showBulk && (
        <BulkSkillImport
          open={showBulk}
          onClose={() => setShowBulk(false)}
          onDone={refresh}
          technicianId={technicianId}
          technicianName={technicianName}
        />
      )}
    </div>
  );
}
