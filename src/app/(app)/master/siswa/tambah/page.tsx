"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/src/lib/context/AppContext";
import { StudentFormView } from "../_components/StudentFormView";
import { api } from "@/src/lib/api";

export function normalizeDraftData(data: any) {
  if (!data) return null;
  // Convert addresses object to array if needed
  let addresses = data.addresses;
  if (addresses && !Array.isArray(addresses)) {
    addresses = [];
    if (data.addresses.identity) {
      addresses.push({ addressType: "IDENTITY", ...data.addresses.identity });
    }
    if (data.addresses.domicile) {
      addresses.push({ addressType: "DOMICILE", ...data.addresses.domicile });
    }
  }

  // Convert family object to array if needed
  let family = data.family;
  if (family && !Array.isArray(family)) {
    family = [];
    if (data.family.father?.name || data.family.father?.fullName) {
      family.push({
        relationshipType: "FATHER",
        isPrimaryContact: data.family.primaryContact === "FATHER",
        isPaymentResponsible: data.family.paymentResponsible === "FATHER",
        isEmergencyContact: false,
        member: {
          id: data.family.father.id,
          fullName: data.family.father.name || data.family.father.fullName,
          ...data.family.father,
        },
      });
    }
    if (data.family.mother?.name || data.family.mother?.fullName) {
      family.push({
        relationshipType: "MOTHER",
        isPrimaryContact: data.family.primaryContact === "MOTHER",
        isPaymentResponsible: data.family.paymentResponsible === "MOTHER",
        isEmergencyContact: false,
        member: {
          id: data.family.mother.id,
          fullName: data.family.mother.name || data.family.mother.fullName,
          ...data.family.mother,
        },
      });
    }
    if (data.family.guardian?.name || data.family.guardian?.fullName) {
      family.push({
        relationshipType: data.family.guardianRelationship || "OTHER_GUARDIAN",
        isPrimaryContact: data.family.primaryContact === "GUARDIAN",
        isPaymentResponsible: data.family.paymentResponsible === "GUARDIAN",
        isEmergencyContact: false,
        member: {
          id: data.family.guardian.id,
          fullName: data.family.guardian.name || data.family.guardian.fullName,
          ...data.family.guardian,
        },
      });
    }
    if (data.family.emergencyContact?.name) {
      family.push({
        relationshipType:
          data.family.emergencyContact.relationship || "OTHER_GUARDIAN",
        isPrimaryContact: false,
        isPaymentResponsible: false,
        isEmergencyContact: true,
        member: {
          fullName: data.family.emergencyContact.name,
          phone: data.family.emergencyContact.phone,
        },
      });
    }
  }

  return {
    ...data,
    addresses: addresses || [],
    family: family || [],
    health: data.health || null,
    aidRecords: data.aidRecords || data.aid || [],
    measurements: data.measurements || [],
    documents: data.documents || [],
  };
}

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
        setDraftProfile(normalizeDraftData(draft.data));
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
