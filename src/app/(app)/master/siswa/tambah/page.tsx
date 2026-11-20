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
      const createdStudent = await api<{ id: string }>(
        "students",
        "POST",
        studentData,
      );

      if (guardianOption?.type === "existing" && guardianOption.guardianId) {
        await api("guardian-students", "POST", {
          guardianId: guardianOption.guardianId,
          studentId: createdStudent.id,
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
          studentId: createdStudent.id,
        });
      }

      await refresh();
      setToast(`Siswa ${studentData.name} berhasil ditambahkan`);
      router.push(`/master/siswa/${createdStudent.id}`);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Gagal menambahkan data siswa",
      );
      throw e;
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
      onCancel={() => router.push("/master/siswa")}
    />
  );
}
