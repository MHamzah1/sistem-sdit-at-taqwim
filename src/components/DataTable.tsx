"use client";

import React, { useState, type ReactNode } from "react";
import { Search } from "lucide-react";

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

  return (
    <>
      <div className="table-toolbar">
        {searchText ? (
          <div className="search-field">
            <Search size={14} />
            <input
              type="search"
              placeholder="Cari data..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
        ) : (
          <div />
        )}
        {filter}
      </div>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {columns.map((c, i) => (
                <th
                  key={i}
                  className={c.align === "right" ? "right" : undefined}
                >
                  {c.label}
                </th>
              ))}
              {actions && <th className="right">Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {currentRows.map((r, i) => (
              <tr key={r.id || i}>
                {columns.map((c, j) => (
                  <td
                    key={j}
                    className={c.align === "right" ? "right" : undefined}
                  >
                    {c.render(r)}
                  </td>
                ))}
                {actions && <td className="right row-actions">{actions(r)}</td>}
              </tr>
            ))}
            {currentRows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="empty"
                >
                  Tidak ada data yang ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > pageSize && (
        <div className="pagination">
          <span>
            Menampilkan {(page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, filtered.length)} dari {filtered.length}{" "}
            data
          </span>
          <div>
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Sebelumnya
            </button>
            <span className="current">{page}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}
    </>
  );
}
