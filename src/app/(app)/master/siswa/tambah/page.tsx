"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/src/lib/context/AppContext";
import { StudentFormView } from "../_components/StudentFormView";
import { api } from "@/src/lib/api";

export default function TambahSiswaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftIdParam = searchParams.get("draftId");

  const { state, loading, busy, refresh, setToast, setError } = useApp();
  const [activeDraftId, setActiveDraftId] = useState<string | null>(draftIdParam);
  const [draftProfile, setDraftProfile] = useState<any>(null);
  const [loadingDraft, setLoadingDraft] = useState(Boolean(draftIdParam));
  const [draftError, setDraftError] = useState<string | null>(null);

  useEffect(() => {
    if (!draftIdParam) return;
    let mounted = true;
    api<any>(`student-drafts/${draftIdParam}`)
      .then((draft) => {
        if (!mounted) return;
        if (draft.status === "FINALIZED" && draft.finalStudentId) {
          setToast("Draf ini sudah pernah difinalisasi.");
          router.replace(`/master/siswa/${draft.finalStudentId}`);
          return;
        }
        setDraftProfile(draft.data);
        setActiveDraftId(draft.id);
      })
      .catch((err) => {
        if (mounted) {
          setDraftError(err.message || "Gagal memuat draf tersimpan.");
        }
      })
      .finally(() => {
        if (mounted) setLoadingDraft(false);
      });
    return () => {
      mounted = false;
    };
  }, [draftIdParam, router, setToast]);

  if (loading || !state || loadingDraft) {
    return (
      <div className="st-page-shell">
        <div className="st-table-loading">
          <div className="st-spinner" />
          <p>
            {loadingDraft
              ? "Memulihkan draf pendaftaran tersimpan..."
              : "Memuat formulir pendaftaran siswa..."}
          </p>
        </div>
      </div>
    );
  }

  if (draftError) {
    return (
      <div className="st-page-shell">
        <div className="st-empty-state">
          <h3>Gagal Memuat Draf</h3>
          <p>{draftError}</p>
          <button
            type="button"
            className="st-btn-primary"
            style={{ marginTop: 16 }}
            onClick={() => router.push("/master/siswa/tambah")}
          >
            Mulai Formulir Kosong
          </button>
        </div>
      </div>
    );
  }

  const handleSave = async (payload: any) => {
    try {
      if (activeDraftId) {
        payload.draftId = activeDraftId;
      }
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
      if (activeDraftId) {
        await api(`student-drafts/${activeDraftId}`, "PATCH", payload);
        setToast("Draf berhasil diperbarui");
      } else {
        const created = await api<{ id: string }>("student-drafts", "POST", payload);
        setActiveDraftId(created.id);
        setToast("Draf pendaftaran berhasil disimpan sementara");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan draf");
    }
  };

  return (
    <StudentFormView
      mode="tambah"
      initialFullProfile={draftProfile}
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
