"use client";

import React, { useState, type ReactNode } from "react";
import { Search, X, Inbox } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "./ui/table";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from "./ui/pagination";
import { cn } from "@/src/lib/utils";

export type Column<T> = {
  label: string;
  render: (row: T) => ReactNode;
  align?: "left" | "right" | "center";
};

export function DataTable<T extends { id?: string }>({
  rows,
  columns,
  actions,
  filter,
  searchText,
  pageSize = 10,
}: {
  rows: T[];
  columns: Column<T>[];
  actions?: (row: T) => ReactNode;
  filter?: ReactNode;
  searchText?: (row: T) => string;
  pageSize?: number;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = searchText
    ? rows.filter((r) =>
        searchText(r).toLowerCase().includes(query.toLowerCase()),
      )
    : rows;

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const currentRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const startEntry = filtered.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const endEntry = Math.min(page * pageSize, filtered.length);

  return (
    <div className="flex flex-col gap-3">
      {/* Table Toolbar: Search & Action Filters */}
      {(searchText || filter) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1">
          {searchText ? (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                placeholder="Cari data..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-9 pr-8 bg-card shadow-2xs"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-muted-foreground hover:text-foreground"
                  aria-label="Hapus pencarian"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div />
          )}

          {filter && <div className="flex items-center gap-2">{filter}</div>}
        </div>
      )}

      {/* Main Shadcn Data Table Container */}
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((c, i) => (
              <TableHead
                key={i}
                className={cn(
                  c.align === "right" && "text-right",
                  c.align === "center" && "text-center",
                )}
              >
                {c.label}
              </TableHead>
            ))}
            {actions && <TableHead className="text-right">Aksi</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentRows.map((r, i) => (
            <TableRow key={r.id || i}>
              {columns.map((c, j) => (
                <TableCell
                  key={j}
                  className={cn(
                    c.align === "right" && "text-right",
                    c.align === "center" && "text-center",
                  )}
                >
                  {c.render(r)}
                </TableCell>
              ))}
              {actions && (
                <TableCell className="text-right font-medium">
                  <div className="flex items-center justify-end gap-1.5">
                    {actions(r)}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}

          {currentRows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={columns.length + (actions ? 1 : 0)}
                className="h-36 text-center text-muted-foreground"
              >
                <div className="flex flex-col items-center justify-center gap-2">
                  <Inbox className="size-8 text-muted-foreground/60 stroke-[1.5]" />
                  <p className="text-xs font-medium">
                    {query
                      ? `Tidak ada data yang cocok dengan "${query}"`
                      : "Tidak ada data yang tersedia saat ini."}
                  </p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination Bar */}
      {filtered.length > pageSize && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2 py-2 text-xs text-muted-foreground border-t border-border/50">
          <span>
            Menampilkan <strong className="text-foreground">{startEntry}</strong>–
            <strong className="text-foreground">{endEntry}</strong> dari{" "}
            <strong className="text-foreground">{filtered.length}</strong> data
          </span>

          <Pagination className="w-auto mx-0">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                />
              </PaginationItem>

              <PaginationItem>
                <div className="flex items-center justify-center min-w-8 h-8 px-2 text-xs font-semibold rounded-md bg-primary/10 text-primary border border-primary/20">
                  {page} / {totalPages}
                </div>
              </PaginationItem>

              <PaginationItem>
                <PaginationNext
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
