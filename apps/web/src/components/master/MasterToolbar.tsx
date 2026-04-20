'use client';

import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Upload } from "lucide-react";
import { toast } from "sonner";

/**
 * Shared toolbar for Master Data pages
 */
interface Props<T> {
  search: string;
  onSearch: (value: string) => void;
  filter?: "all" | "active" | "inactive" | null;
  onFilter?: ((value: "all" | "active" | "inactive") => void) | null;
  onImport: (records: T[]) => void;
  exportData?: T[];
}

export default function MasterToolbar<T extends Record<string, unknown>>({
  search,
  onSearch,
  filter,
  onFilter,
  exportData = [],
  onImport,
}: Props<T>) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const clean = exportData.map((record) => {
      const rest = { ...record } as Record<string, unknown>;
      delete rest.id;
      delete rest.created_date;
      delete rest.updated_date;
      delete rest.created_by;
      return rest;
    });
    const blob = new Blob([JSON.stringify(clean, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `export_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${clean.length} records`);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        const records = Array.isArray(data) ? data : [data];
        onImport(records as T[]);
        toast.success(`Importing ${records.length} records...`);
      } catch {
        toast.error("Invalid JSON file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search..."
          className="pl-9 w-52"
          value={search}
          onChange={e => onSearch(e.target.value)}
        />
      </div>

      {onFilter && (
        <Select value={filter ?? undefined} onValueChange={(v) => onFilter(v as "all" | "active" | "inactive")}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      )}

      <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
        <Download className="w-3.5 h-3.5" /> Export
      </Button>

      <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="gap-1.5">
        <Upload className="w-3.5 h-3.5" /> Import
      </Button>
      <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
    </div>
  );
}
