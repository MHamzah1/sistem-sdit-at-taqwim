"use client";

import React, { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, AlertTriangle } from "lucide-react";
import { useApp } from "@/src/lib/context/AppContext";
import { StudentDetailView } from "../_components/StudentDetailView";
import { Modal } from "@/src/components/Modal";
import {
  PaymentModal,
  ExamCardModal,
  type ExamCardData,
} from "@/src/components/modals";
import { api } from "@/src/lib/api";
import type { AppState } from "@/server/state";

type Student = AppState["students"][number];

export default function DetailSiswaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { state, loading, busy, run, can, isGuardian, refresh, setToast, setError } =
    useApp();

  const [paymentStudentId, setPaymentStudentId] = useState<string | null>(null);
  const [examCard, setExamCard] = useState<ExamCardData | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedGuardianId, setSelectedGuardianId] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [fullProfile, setFullProfile] = useState<any>(null);

  const loadFullProfile = React.useCallback(async () => {
    try {
      const res = await api<any>(`students/${id}/profile`);
      setFullProfile(res);
    } catch {
      // Abaikan jika profil belum siap
    }
  }, [id]);

  React.useEffect(() => {
    void loadFullProfile();
  }, [loadFullProfile]);

  if (loading || !state) {
    return (
      <div className="st-page-shell">
        <div className="st-table-loading">
          <div className="st-spinner" />
          <p>Memuat rincian data siswa...</p>
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
          <p>Data siswa dengan ID tersebut tidak ditemukan di sistem atau mungkin telah dihapus.</p>
          <Link href="/master/siswa" className="st-btn-primary" style={{ marginTop: 16 }}>
            Kembali ke Daftar Siswa
          </Link>
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    setDeleteError("");
    try {
      await run(
        () => api(`students/${student.id}`, "DELETE"),
        `Data siswa ${student.name} berhasil dihapus`,
      );
      setShowDeleteModal(false);
      router.push("/master/siswa");
    } catch (e) {
      setDeleteError(
        e instanceof Error ? e.message : "Gagal menghapus data siswa",
      );
    }
  };

  const handleConnectGuardian = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuardianId) return;
    try {
      await api("guardian-students", "POST", {
        guardianId: selectedGuardianId,
        studentId: student.id,
      });
      await refresh();
      setToast("Wali murid berhasil dihubungkan ke siswa ini");
      setShowConnectModal(false);
      setSelectedGuardianId("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal menghubungkan wali murid",
      );
    }
  };

  const handleDisconnectGuardian = async (guardianId: string) => {
    if (confirm("Putuskan hubungan wali murid dengan siswa ini?")) {
      try {
        await api("guardian-students", "DELETE", {
          guardianId,
          studentId: student.id,
        });
        await refresh();
        setToast("Hubungan wali murid berhasil diputuskan");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Gagal memutuskan hubungan wali",
        );
      }
    }
  };

  const handlePrintCard = async (st: Student) => {
    const exam = state.exams[0];
    if (!exam) {
      setError("Belum ada periode ujian aktif untuk mencetak kartu.");
      return;
    }
    try {
      const result = await api<ExamCardData>("exam-cards", "POST", {
        studentId: st.id,
        examPeriodId: exam.id,
      });
      setExamCard(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal menerbitkan kartu ujian",
      );
    }
  };

  return (
    <>
      <StudentDetailView
        student={student}
        fullProfile={fullProfile}
        classes={state.classes}
        academicYears={state.academicYears}
        invoices={state.invoices}
        payments={state.payments}
        dispensations={state.dispensations}
        eligibilities={state.eligibilities}
        exams={state.exams}
        examCards={state.examCards}
        guardians={state.guardians}
        guardianStudents={state.guardianStudents}
        canMaster={can("master")}
        canFinance={can("finance")}
        onBack={() => router.push("/master/siswa")}
        onEdit={() => router.push(`/master/siswa/${student.id}/ubah`)}
        onDelete={() => setShowDeleteModal(true)}
        onPay={(studentId) => setPaymentStudentId(studentId)}
        onConnectGuardian={() => setShowConnectModal(true)}
        onDisconnectGuardian={handleDisconnectGuardian}
        onPrintCard={handlePrintCard}
        onProfileReload={async () => {
          await loadFullProfile();
          await refresh();
        }}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <Modal
          title="Konfirmasi Hapus Siswa"
          close={() => {
            if (!busy) {
              setShowDeleteModal(false);
              setDeleteError("");
            }
          }}
        >
          <div className="st-delete-modal-body">
            <p>
              Apakah Anda yakin ingin menghapus data siswa{" "}
              <strong>{student.name}</strong> (NIS: {student.nis})?
            </p>
            <div className="notice amber" style={{ marginTop: 12 }}>
              Data yang telah terikat transaksi keuangan atau ujian tidak dapat
              dihapus untuk menjaga integritas pembukuan dan audit.
            </div>
            {deleteError && (
              <div
                role="alert"
                className="flex items-center gap-2 p-3 mt-3 text-xs rounded-lg border border-destructive/20 bg-destructive/10 text-destructive font-medium"
              >
                <AlertTriangle size={15} className="shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}
            <div className="st-modal-actions" style={{ marginTop: 20 }}>
              <button
                type="button"
                className="outline"
                disabled={busy}
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteError("");
                }}
              >
                Batal
              </button>
              <button
                type="button"
                className="danger"
                disabled={busy}
                onClick={() => void handleDelete()}
              >
                {busy ? "Menghapus..." : "Ya, Hapus Siswa Ini"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Connect Guardian Modal */}
      {showConnectModal && (
        <Modal
          title="Hubungkan Wali Murid"
          close={() => setShowConnectModal(false)}
        >
          <form onSubmit={handleConnectGuardian}>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>
              Pilih data wali murid yang terdaftar untuk dihubungkan ke{" "}
              <strong>{student.name}</strong>:
            </p>
            <label>
              Pilih Wali Murid:
              <select
                required
                value={selectedGuardianId}
                onChange={(e) => setSelectedGuardianId(e.target.value)}
              >
                <option value="">-- Pilih dari direktori wali murid --</option>
                {state.guardians.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.phone})
                  </option>
                ))}
              </select>
            </label>
            <div className="st-modal-actions" style={{ marginTop: 20 }}>
              <button
                type="button"
                className="outline"
                onClick={() => setShowConnectModal(false)}
              >
                Batal
              </button>
              <button
                type="submit"
                className="primary"
                disabled={!selectedGuardianId || busy}
              >
                Hubungkan Wali
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Payment Modal */}
      {paymentStudentId && (
        <PaymentModal
          data={state}
          initialStudent={paymentStudentId}
          close={() => setPaymentStudentId(null)}
          saved={async () => {
            await refresh();
            setToast("Pembayaran berhasil dicatat");
          }}
        />
      )}

      {/* Exam Card Modal */}
      {examCard && (
        <ExamCardModal
          card={examCard}
          data={state}
          close={() => setExamCard(null)}
        />
      )}
    </>
  );
}
