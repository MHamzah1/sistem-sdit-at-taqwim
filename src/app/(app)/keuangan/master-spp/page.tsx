"use client";

import React, { useState } from "react";
import { Wallet, Plus, Pencil, AlertCircle } from "lucide-react";
import { useApp } from "@/src/lib/context/AppContext";
import { DataForm, type Field, type FormSpec } from "@/src/components/DataForm";
import { money } from "@/src/lib/formatters";
import type { AppState } from "@/server/state";

type SppConfig = AppState["sppConfigs"][number];

export default function MasterSppPage() {
  const { state, loading, busy, save, can, yearName } = useApp();
  const [formConfig, setFormConfig] = useState<FormSpec | null>(null);

  if (loading || !state) {
    return (
      <div className="st-page-shell">
        <div className="st-table-loading">
          <div className="st-spinner" />
          <p>Memuat konfigurasi Master SPP...</p>
        </div>
      </div>
    );
  }

  const sppConfigs = state.sppConfigs;
  const academicYears = state.academicYears;

  const yearOptions = academicYears.map((y) => ({
    value: y.id,
    label: `${y.name} ${y.active ? "(Aktif)" : ""}`,
  }));

  const formFields: Field[] = [
    {
      key: "academicYearId",
      label: "Tahun Ajaran",
      options: yearOptions,
    },
    {
      key: "amount",
      label: "Nominal SPP per Bulan (Rp)",
      type: "number",
      min: 1,
      max: 100000000,
    },
    {
      key: "dueDay",
      label: "Tanggal Jatuh Tempo Bulanan (1 - 28)",
      type: "number",
      min: 1,
      max: 28,
    },
  ];

  const handleAdd = () => {
    setFormConfig({
      title: "Tambah Konfigurasi Master SPP",
      fields: formFields,
      note: "Perubahan Master SPP hanya berlaku untuk tagihan baru. Invoice yang sudah terbit akan mempertahankan nominalnya.",
      submit: async (values) => {
        await save("spp/config", values);
        setFormConfig(null);
      },
    });
  };

  const handleEdit = (config: SppConfig) => {
    setFormConfig({
      title: "Ubah Master SPP",
      fields: formFields,
      initial: {
        academicYearId: config.academicYearId,
        amount: config.amount,
        dueDay: config.dueDay,
      },
      note: "Perubahan hanya berpengaruh pada penerbitan invoice berikutnya.",
      submit: async (values) => {
        await save("spp/config", values, config.id);
        setFormConfig(null);
      },
    });
  };

  return (
    <div className="st-page-shell">
      {/* Top Banner */}
      <div className="st-header-card">
        <div className="st-header-left">
          <div className="st-header-icon-box">
            <Wallet size={28} />
          </div>
          <div>
            <div className="st-breadcrumb">
              <span>Keuangan</span>
              <span>/</span>
              <span>Master SPP</span>
            </div>
            <h1 className="st-title">Master SPP</h1>
            <p className="st-subtitle">
              Atur besaran nominal iuran bulanan dan tanggal jatuh tempo per tahun ajaran.
            </p>
          </div>
        </div>

        {can("finance") && (
          <div className="st-header-actions">
            <button
              type="button"
              className="st-btn-primary"
              onClick={handleAdd}
            >
              <Plus size={16} />
              <span>Tambah Master SPP</span>
            </button>
          </div>
        )}
      </div>

      <div className="notice" style={{ marginBottom: 20 }}>
        <AlertCircle size={18} />
        <span>
          <strong>Ketentuan Immutability Finansial:</strong> Perubahan Master SPP
          berlaku untuk invoice baru. Invoice yang sudah terbit mempertahankan
          nominalnya untuk mencegah manipulasi historis.
        </span>
      </div>

      {/* Main Table */}
      <div className="st-table-card">
        <div className="st-table-responsive">
          <table className="st-table">
            <thead>
              <tr>
                <th style={{ width: 50 }}>No</th>
                <th>Tahun Ajaran</th>
                <th>Nominal SPP Bulanan</th>
                <th>Tanggal Jatuh Tempo</th>
                {can("finance") && (
                  <th style={{ textAlign: "right", minWidth: 100 }}>Aksi</th>
                )}
              </tr>
            </thead>
            <tbody>
              {sppConfigs.map((c, idx) => (
                <tr key={c.id} className="st-table-row">
                  <td className="st-col-idx">{idx + 1}</td>
                  <td>
                    <strong className="st-user-name">
                      {yearName(c.academicYearId)}
                    </strong>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: "#16613e" }}>
                      {money(c.amount)}
                    </span>
                  </td>
                  <td>Setiap tanggal {c.dueDay}</td>
                  {can("finance") && (
                    <td style={{ textAlign: "right" }}>
                      <div className="st-action-row">
                        <button
                          type="button"
                          className="st-btn-action edit"
                          onClick={() => handleEdit(c)}
                          title="Ubah Konfigurasi"
                        >
                          <Pencil size={15} />
                          <span>Ubah</span>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {sppConfigs.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 32, color: "#94a3b8" }}>
                    Belum ada konfigurasi Master SPP. Silakan tambahkan konfigurasi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dynamic Form Modal */}
      {formConfig && (
        <DataForm
          spec={formConfig}
          close={() => setFormConfig(null)}
        />
      )}
    </div>
  );
}
