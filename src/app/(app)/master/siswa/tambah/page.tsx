"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/src/lib/context/AppContext";
import { StudentFormView } from "../_components/StudentFormView";
import { api } from "@/src/lib/api";

export default function TambahSiswaPage() {
  const router = useRouter();
  const { state, loading, busy, refresh, setToast, setError } = useApp();

  if (loading || !state) {
    return (
      <div className="st-page-shell">
        <div className="st-table-loading">
          <div className="st-spinner" />
          <p>Memuat formulir pendaftaran siswa...</p>
        </div>
      </div>
    );
  }

  const handleSave = async (payload: any) => {
    try {
      const createdStudent = await api<{ id: string }>(
        "students/profile",
        "POST",
        payload,
      );

      await refresh();
      setToast(`Siswa ${payload.student.name} berhasil didaftarkan`);
      router.push(`/master/siswa/${createdStudent.id}`);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Gagal menambahkan data siswa",
      );
      throw e;
    }
  };

  const handleSaveDraft = async (payload: any) => {
    try {
      await api("student-drafts", "POST", payload);
      setToast("Draf pendaftaran berhasil disimpan sementara");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan draf");
    }
  };

  return (
    <StudentFormView
      mode="tambah"
      classes={state.classes}
      academicYears={state.academicYears}
      guardians={state.guardians}
      guardianStudents={state.guardianStudents}
      busy={busy}
      onSave={handleSave}
      onSaveDraft={handleSaveDraft}
      onCancel={() => router.push("/master/siswa")}
    />
  );
}
