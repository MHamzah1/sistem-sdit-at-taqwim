"use client";

import React, { use } from "react";
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

  if (loading || !state) {
    return (
      <div className="st-page-shell">
        <div className="st-table-loading">
          <div className="st-spinner" />
          <p>Memuat data siswa...</p>
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

  const handleSave = async (
    studentData: {
      name: string;
      nis: string;
      nisn: string | null;
      gender: "L" | "P" | null;
      classId: string;
      enrolledOn: string;
      birthPlace: string | null;
      birthDate: string | null;
      photoUrl: string | null;
      active: boolean;
    },
    guardianOption?: {
      type: "existing" | "new" | "none";
      guardianId?: string;
      newGuardian?: { name: string; phone: string };
    },
  ) => {
    try {
      await api(`students/${student.id}`, "PATCH", studentData);

      if (guardianOption?.type === "existing" && guardianOption.guardianId) {
        await api("guardian-students", "POST", {
          guardianId: guardianOption.guardianId,
          studentId: student.id,
        });
      } else if (
        guardianOption?.type === "new" &&
        guardianOption.newGuardian?.name &&
        guardianOption.newGuardian?.phone
      ) {
        const createdGuardian = await api<{ id: string }>(
          "guardians",
          "POST",
          guardianOption.newGuardian,
        );
        await api("guardian-students", "POST", {
          guardianId: createdGuardian.id,
          studentId: student.id,
        });
      }

      await refresh();
      setToast(`Data ${studentData.name} berhasil diperbarui`);
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
