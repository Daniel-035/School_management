import { ChevronLeft, ChevronRight, Download, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TableControlsProps {
  search: string;
  onSearchChange: (value: string) => void;
  filter?: string;
  filterLabel?: string;
  filterOptions?: { label: string; value: string }[];
  onFilterChange?: (value: string) => void;
  sort: string;
  sortOptions: { label: string; value: string }[];
  onSortChange: (value: string) => void;
  onExport: () => void;
  selectedCount?: number;
  onBulkDelete?: () => void;
}

export function TableControls(props: TableControlsProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search..." value={props.search} onChange={event => props.onSearchChange(event.target.value)} />
        </div>
        {props.filterOptions && props.onFilterChange ? (
          <Select value={props.filter ?? "all"} onValueChange={props.onFilterChange}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder={props.filterLabel ?? "Filter"} /></SelectTrigger>
            <SelectContent>{props.filterOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
          </Select>
        ) : null}
        <Select value={props.sort} onValueChange={props.onSortChange}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Sort" /></SelectTrigger>
          <SelectContent>{props.sortOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        {props.selectedCount ? <Button variant="destructive" size="sm" onClick={props.onBulkDelete}><Trash2 className="h-4 w-4" />Delete {props.selectedCount}</Button> : null}
        <Button variant="outline" size="sm" onClick={props.onExport}><Download className="h-4 w-4" />Export CSV</Button>
      </div>
    </div>
  );
}

export function PaginationControls({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (page: number) => void }) {
  return (
    <div className="mt-4 flex items-center justify-end gap-2 text-sm text-muted-foreground">
      <span>Page {page} of {Math.max(totalPages, 1)}</span>
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
      <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
    </div>
  );
}

export function applyTableState<T>(rows: T[], options: { search: string; filter?: string; sort: string; page: number; pageSize?: number; searchText: (row: T) => string; filterValue?: (row: T) => string; sorters: Record<string, (a: T, b: T) => number> }) {
  const pageSize = options.pageSize ?? 10;
  const query = options.search.trim().toLowerCase();
  const filtered = rows
    .filter(row => !query || options.searchText(row).toLowerCase().includes(query))
    .filter(row => !options.filter || options.filter === "all" || !options.filterValue || options.filterValue(row) === options.filter)
    .sort(options.sorters[options.sort] ?? (() => 0));
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(options.page, totalPages);
  return { rows: filtered.slice((page - 1) * pageSize, page * pageSize), allRows: filtered, totalPages, page };
}
