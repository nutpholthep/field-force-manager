import React, { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Upload } from "lucide-react";
import { toast } from "sonner";

/**
 * Shared toolbar for Master Data pages
 * Props:
 *   search, onSearch
 *   filter ("all"|"active"|"inactive"), onFilter  — optional, pass null to hide
 *   onExport(data) — called with current filtered data for download
 *   onImport(records) — called with parsed records array from uploaded file
 *   exportData — full filtered data array to export
 */
export default function MasterToolbar({ search, onSearch, filter, onFilter, exportData = [], onImport }) {
  const fileRef = useRef();

  const handleExport = () => {
    const clean = exportData.map(({ id, created_date, updated_date, created_by, ...rest }) => rest);
    const blob = new Blob([JSON.stringify(clean, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `export_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${clean.length} records`);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        const records = Array.isArray(data) ? data : [data];
        onImport(records);
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
        <Select value={filter} onValueChange={onFilter}>
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