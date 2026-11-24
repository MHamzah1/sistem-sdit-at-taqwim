"use client";

import React, { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useApp } from "@/src/lib/context/AppContext";
import { StudentFormView } from "../../_components/StudentFormView";
import { api } from "@/src/lib/api";

export default function UbahSiswaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { state, loading, busy, refresh, setToast, setError } = useApp();
  const [fullProfile, setFullProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const fetchProfile = () => {
    setLoadingProfile(true);
    setProfileError(null);
    api<any>(`students/${id}/profile`)
      .then((res) => {
        setFullProfile(res);
      })
      .catch((err) => {
        setProfileError(
          err.message || "Gagal memuat profil lengkap siswa dari server.",
        );
      })
      .finally(() => {
        setLoadingProfile(false);
      });
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  if (loading || !state || loadingProfile) {
    return (
      <div className="st-page-shell">
        <div className="st-table-loading">
          <div className="st-spinner" />
          <p>Memuat profil lengkap siswa...</p>
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="st-page-shell">
        <div className="st-empty-state">
          <AlertTriangle size={48} className="st-empty-icon" />
          <h3>Gagal Memuat Profil Siswa</h3>
          <p>{profileError}</p>
          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <button
              type="button"
              className="st-btn-primary"
              onClick={fetchProfile}
            >
              Coba Lagi
            </button>
            <Link href={`/master/siswa/${id}`} className="st-btn-outline">
              Kembali ke Detail
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const student = state.students.find((s) => s.id === id);

  if (!student) {
    return (
      <div className="st-page-shell">
        <div className="st-empty-state">
          <AlertTriangle size={48} className="st-empty-icon" />
          <h3>Siswa Tidak Ditemukan</h3>
          <p>Data siswa tidak ditemukan di sistem.</p>
          <Link href="/master/siswa" className="st-btn-primary" style={{ marginTop: 16 }}>
            Kembali ke Daftar Siswa
          </Link>
        </div>
      </div>
    );
  }

  const handleSave = async (payload: any) => {
    try {
      await api(`students/${student.id}/profile`, "PATCH", payload);
      await refresh();
      setToast(`Biodata siswa ${payload.student.name} berhasil diperbarui`);
      router.push(`/master/siswa/${student.id}`);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Gagal memperbarui data siswa",
      );
      throw e;
    }
  };

  return (
    <StudentFormView
      mode="ubah"
      student={student}
      initialFullProfile={fullProfile}
      classes={state.classes}
      academicYears={state.academicYears}
      guardians={state.guardians}
      guardianStudents={state.guardianStudents}
      busy={busy}
      onSave={handleSave}
      onCancel={() => router.push(`/master/siswa/${student.id}`)}
    />
  );
}
