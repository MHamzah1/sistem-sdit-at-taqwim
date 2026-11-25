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
    const father = data.family?.father;
    const fatherData = father?.data || father;
    const fatherFullName =
      fatherData?.fullName || fatherData?.name || father?.fullName || father?.name;
    const fatherId = father?.familyMemberId || father?.id;
    if (fatherFullName || fatherId) {
      family.push({
        relationshipType: "FATHER",
        isPrimaryContact: data.family.primaryContact === "FATHER",
        isPaymentResponsible: data.family.paymentResponsible === "FATHER",
        isEmergencyContact: false,
        member: {
          id: fatherId || undefined,
          fullName: fatherFullName || "",
          nik: fatherData?.nik || father?.nik || null,
          lifeStatus: fatherData?.lifeStatus || father?.lifeStatus || "ALIVE",
          education: fatherData?.education || father?.education || "S1",
          occupation: fatherData?.occupation || father?.occupation || "KARYAWAN_SWASTA",
          institutionName: fatherData?.institutionName || father?.institutionName || "",
          monthlyIncomeRange:
            fatherData?.monthlyIncomeRange || father?.monthlyIncomeRange || "RP_2_JT_SD_5_JT",
          phone: fatherData?.phone || father?.phone || "",
          email: fatherData?.email || father?.email || "",
        },
      });
    }

    const mother = data.family?.mother;
    const motherData = mother?.data || mother;
    const motherFullName =
      motherData?.fullName || motherData?.name || mother?.fullName || mother?.name;
    const motherId = mother?.familyMemberId || mother?.id;
    if (motherFullName || motherId) {
      family.push({
        relationshipType: "MOTHER",
        isPrimaryContact: data.family.primaryContact === "MOTHER",
        isPaymentResponsible: data.family.paymentResponsible === "MOTHER",
        isEmergencyContact: false,
        member: {
          id: motherId || undefined,
          fullName: motherFullName || "",
          nik: motherData?.nik || mother?.nik || null,
          lifeStatus: motherData?.lifeStatus || mother?.lifeStatus || "ALIVE",
          education: motherData?.education || mother?.education || "D3",
          occupation: motherData?.occupation || mother?.occupation || "IBU_RUMAH_TANGGA",
          institutionName: motherData?.institutionName || mother?.institutionName || "",
          monthlyIncomeRange:
            motherData?.monthlyIncomeRange || mother?.monthlyIncomeRange || "TIDAK_BERPENGHASILAN",
          phone: motherData?.phone || mother?.phone || "",
          email: motherData?.email || mother?.email || "",
        },
      });
    }

    const guardian = data.family?.guardian;
    const guardianData = guardian?.data || guardian;
    const guardianFullName =
      guardianData?.fullName || guardianData?.name || guardian?.fullName || guardian?.name;
    const guardianId = guardian?.familyMemberId || guardian?.id;
    if (guardianFullName || guardianId) {
      family.push({
        relationshipType: data.family.guardianRelationship || "OTHER_GUARDIAN",
        isPrimaryContact: data.family.primaryContact === "GUARDIAN",
        isPaymentResponsible: data.family.paymentResponsible === "GUARDIAN",
        isEmergencyContact: false,
        member: {
          id: guardianId || undefined,
          fullName: guardianFullName || "",
          nik: guardianData?.nik || guardian?.nik || null,
          lifeStatus: guardianData?.lifeStatus || guardian?.lifeStatus || "ALIVE",
          education: guardianData?.education || guardian?.education || "",
          occupation: guardianData?.occupation || guardian?.occupation || "",
          institutionName: guardianData?.institutionName || guardian?.institutionName || "",
          monthlyIncomeRange: guardianData?.monthlyIncomeRange || guardian?.monthlyIncomeRange || "",
          phone: guardianData?.phone || guardian?.phone || "",
          email: guardianData?.email || guardian?.email || "",
        },
      });
    }

    const em = data.family?.emergencyContact;
    if (em?.name || em?.fullName) {
      family.push({
        relationshipType: em.relationship || "OTHER_GUARDIAN",
        isPrimaryContact: false,
        isPaymentResponsible: false,
        isEmergencyContact: true,
        member: {
          fullName: em.name || em.fullName,
          phone: em.phone || "",
        },
      });
    }
  }

  const student = data.student ? { ...data.student } : { ...data };
  if (data.classId && !student.classId) student.classId = data.classId;
  if (data.enrolledOn && !student.enrolledOn) student.enrolledOn = data.enrolledOn;

  const reg = data.registration;
  const enrollments = data.enrollments || (reg ? [{
    registrationNumber: reg.registrationNumber || null,
    registrationType: reg.registrationType || "NEW_STUDENT",
    registrationDate: reg.registrationDate || null,
    acceptedDate: reg.acceptedDate || null,
    entryGrade: reg.entryGrade || 1,
    attendedPaud: reg.attendedPaud ?? true,
    attendedKindergarten: reg.attendedKindergarten ?? true,
    previousSchoolName: reg.previousSchoolName || null,
    previousSchoolNpsn: reg.previousSchoolNpsn || null,
    notes: reg.notes || null,
  }] : []);

  return {
    ...data,
    student,
    registration: reg || null,
    enrollments,
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
    if (draftIdParam.startsWith("local-")) {
      try {
        const raw = localStorage.getItem("taqwim_student_drafts_v1");
        const list = raw ? JSON.parse(raw) : [];
        const found = Array.isArray(list) ? list.find((d: any) => d.id === draftIdParam) : null;
        if (!found) {
          setDraftError("Draf lokal tidak ditemukan di browser.");
        } else {
          setDraftProfile(normalizeDraftData(found.data));
          setActiveDraftId(found.id);
        }
      } catch {
        setDraftError("Gagal membaca draf lokal.");
      } finally {
        setLoadingDraft(false);
      }
      return;
    }
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
      const isLocalDraft = Boolean(activeDraftId?.startsWith("local-"));
      if (activeDraftId && !isLocalDraft) {
        payload.draftId = activeDraftId;
      }
      const createdStudent = await api<{ id: string }>(
        "students/profile",
        "POST",
        payload,
      );
      if (isLocalDraft && activeDraftId) {
        try {
          const raw = localStorage.getItem("taqwim_student_drafts_v1");
          const list = raw ? JSON.parse(raw) : [];
          if (Array.isArray(list)) {
            localStorage.setItem(
              "taqwim_student_drafts_v1",
              JSON.stringify(list.filter((d: any) => d.id !== activeDraftId)),
            );
          }
        } catch {
          // ignore localStorage cleanup error
        }
      }

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
      if (activeDraftId && activeDraftId.startsWith("local-")) {
        const raw = localStorage.getItem("taqwim_student_drafts_v1");
        const list = raw ? JSON.parse(raw) : [];
        const updatedList = Array.isArray(list)
          ? list.map((d: any) =>
              d.id === activeDraftId
                ? {
                    ...d,
                    data: payload,
                    studentName: payload?.student?.name || "Calon Siswa Tanpa Nama",
                    updatedAt: new Date().toISOString(),
                  }
                : d,
            )
          : [];
        localStorage.setItem("taqwim_student_drafts_v1", JSON.stringify(updatedList));
        setToast("Draf lokal berhasil diperbarui");
        return;
      }
      if (activeDraftId) {
        await api(`student-drafts/${activeDraftId}`, "PATCH", payload);
        setToast("Draf berhasil diperbarui");
      } else {
        const created = await api<{ id: string }>("student-drafts", "POST", payload);
        setActiveDraftId(created.id);
        setToast("Draf pendaftaran berhasil disimpan sementara");
      }
    } catch (e) {
      const code = (e as { code?: string })?.code;
      if (code === "SCHEMA_NOT_READY") {
        const localId = `local-${crypto.randomUUID()}`;
        const raw = localStorage.getItem("taqwim_student_drafts_v1");
        const list = raw ? JSON.parse(raw) : [];
        const entry = {
          id: localId,
          data: payload,
          studentName: payload?.student?.name || "Calon Siswa Tanpa Nama",
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(
          "taqwim_student_drafts_v1",
          JSON.stringify(Array.isArray(list) ? [entry, ...list] : [entry]),
        );
        setActiveDraftId(localId);
        setToast("Draf disimpan sementara secara lokal di browser");
        return;
      }
      setError(e instanceof Error ? e.message : "Gagal menyimpan draf");
      throw e;
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
