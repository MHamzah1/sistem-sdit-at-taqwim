"use client";

import React from "react";
import { User, QrCode as QrIcon } from "lucide-react";
import { Badge } from "@/src/components/Badge";
import { formatDateIndo } from "@/src/lib/formatters";
import { cn } from "@/src/lib/utils";
import { getStudentPhotoUrl } from "@/src/lib/api";

export interface ExamCardStudent {
  id: string;
  name: string;
  nis: string;
  nisn?: string | null;
  photoUrl?: string | null;
  classId?: string;
}

export interface ExamCardViewProps {
  student: ExamCardStudent;
  classNameStr: string;
  participantNumber: string;
  examName: string;
  academicYearName: string;
  startDate: string;
  endDate: string;
  status: string;
  qrCodeUrl?: string;
  compact?: boolean;
}

export function ExamCardView({
  student,
  classNameStr,
  participantNumber,
  examName,
  academicYearName,
  startDate,
  endDate,
  status,
  qrCodeUrl,
  compact = false,
}: ExamCardViewProps) {
  const scheduleFormatted =
    startDate && endDate
      ? `${formatDateIndo(startDate)} – ${formatDateIndo(endDate)}`
      : "Sesuai Jadwal Resmi";

  return (
    <div
      className={cn(
        "official-exam-card bg-white border-2 border-emerald-800 rounded-xl shadow-md overflow-hidden text-slate-800",
        compact ? "p-3.5 text-xs" : "p-5 text-xs sm:text-sm",
      )}
    >
      {/* 1. KOP RESMI SEKOLAH */}
      <div className="exam-card-kop flex items-center gap-3.5 pb-2.5">
        <img
          src="/attachment-0.png"
          alt="Logo SDIT AT-TAQWIM"
          className="size-12 object-contain shrink-0"
        />
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <p className="text-[10px] sm:text-[11px] font-bold tracking-wider text-slate-600 uppercase leading-none">
            Yayasan Pendidikan Islam At-Taqwim
          </p>
          <h2 className="text-[13px] sm:text-[15px] font-black text-emerald-800 tracking-wide leading-tight uppercase font-heading mt-0.5">
            SDIT AT-TAQWIM BEKASI
          </h2>
          <p className="text-[9px] sm:text-[9.5px] text-slate-500 font-medium leading-tight mt-0.5">
            Jl. KH. Noer Ali, Babelan, Kab. Bekasi, Jawa Barat 17610 · Telp. (021) 89123456
          </p>
        </div>
      </div>

      {/* GARIS GANDA KOP (DOUBLE LINE) */}
      <div className="exam-card-divider border-t-2 border-emerald-800 border-b border-amber-600/60 h-1 mb-2.5" />

      {/* 2. PITA JUDUL UJIAN */}
      <div className="exam-card-banner bg-emerald-800 text-white rounded-lg py-1.5 px-3 text-center mb-3 shadow-xs">
        <h3 className="text-xs sm:text-[13px] font-black tracking-wider uppercase leading-none font-heading text-white">
          KARTU TANDA PESERTA UJIAN
        </h3>
        <p className="text-[9.5px] sm:text-[10px] text-emerald-100 font-medium tracking-normal mt-0.5 uppercase">
          {examName} · {academicYearName}
        </p>
      </div>

      {/* 3. BADGE NO. PESERTA */}
      <div className="mb-2.5 flex items-center justify-between flex-wrap gap-2">
        <div className="participant-badge-official inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-950">
          <span className="text-[11px] font-semibold text-emerald-800">No. Peserta:</span>
          <span className="font-mono font-bold text-xs sm:text-[13px] text-emerald-900 tracking-wider">
            {participantNumber}
          </span>
        </div>
        <div className="status-seal shrink-0">
          <Badge status={status} />
        </div>
      </div>

      {/* 4. KONTEN UTAMA: BIODATA & MEDIA */}
      <div className="exam-card-body grid grid-cols-1 sm:grid-cols-12 gap-3.5 mb-3.5 items-start">
        {/* Kolom Biodata (Kiri) */}
        <div className="sm:col-span-7 space-y-1.5">
          <div>
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block">
              Nama Peserta Didik
            </span>
            <strong className="text-sm sm:text-base font-bold text-slate-900 leading-snug tracking-tight uppercase block font-heading">
              {student.name}
            </strong>
          </div>

          <div className="grid grid-cols-1 gap-1 text-[11px] pt-1 border-t border-slate-100">
            <div className="flex items-baseline gap-1.5">
              <span className="w-24 text-slate-500 shrink-0">NIS / NISN</span>
              <span className="text-slate-400 shrink-0">:</span>
              <span className="font-semibold text-slate-800">
                {student.nis} / {student.nisn || "—"}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="w-24 text-slate-500 shrink-0">Kelas / Rombel</span>
              <span className="text-slate-400 shrink-0">:</span>
              <span className="font-semibold text-slate-800">{classNameStr}</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="w-24 text-slate-500 shrink-0">Pelaksanaan</span>
              <span className="text-slate-400 shrink-0">:</span>
              <span className="font-semibold text-slate-800">{scheduleFormatted}</span>
            </div>
          </div>
        </div>

        {/* Kolom Media: Pas Foto 3x4 & QR Code (Kanan) */}
        <div className="sm:col-span-5 flex items-center justify-center sm:justify-end gap-2.5">
          {/* Pas Foto 3x4 */}
          <div className="exam-card-photo-box shrink-0 w-[78px] h-[104px] rounded-md border-2 border-emerald-800/80 bg-slate-50 overflow-hidden shadow-xs flex flex-col items-center justify-center text-center p-1">
            {getStudentPhotoUrl(student) ? (
              <img
                src={getStudentPhotoUrl(student)!}
                alt={`Pas foto ${student.name}`}
                className="w-full h-full object-cover rounded-xs"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400">
                <User className="size-6 text-emerald-800/60 mb-1" />
                <span className="text-[9px] font-bold text-slate-500 leading-tight">
                  Pas Foto
                </span>
                <span className="text-[8.5px] text-slate-400 font-medium">3 × 4</span>
              </div>
            )}
          </div>

          {/* QR Code Validasi */}
          <div className="exam-card-qr-box shrink-0 flex flex-col items-center">
            <div className="w-[104px] h-[104px] bg-white p-1 rounded-md border border-slate-200 shadow-xs flex items-center justify-center">
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt={`QR Validasi ${student.name}`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center text-slate-300">
                  <QrIcon className="size-8" />
                  <span className="text-[8px] text-slate-400 mt-1">QR Validasi</span>
                </div>
              )}
            </div>
            <span className="text-[8.5px] font-medium text-slate-500 mt-1 text-center">
              Pindai untuk Validasi
            </span>
          </div>
        </div>
      </div>

      {/* 5. FOOTER: TATA TERTIB & PENGESAHAN */}
      <div className="exam-card-footer pt-2.5 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
        {/* Tata Tertib Singkat (Kiri) */}
        <div className="sm:col-span-7 text-[9px] text-slate-600 space-y-0.5">
          <strong className="text-[9.5px] text-slate-800 font-semibold block uppercase tracking-wider">
            Tata Tertib Singkat Peserta:
          </strong>
          <ol className="list-decimal list-inside space-y-0.5 text-slate-500">
            <li>Kartu wajib dibawa dan diletakkan di atas meja saat ujian.</li>
            <li>Hadir di ruang ujian paling lambat 15 menit sebelum dimulai.</li>
            <li>Berpakaian seragam sekolah rapi, lengkap, dan sesuai syariat.</li>
          </ol>
        </div>

        {/* Kolom Pengesahan (Kanan) */}
        <div className="sm:col-span-5 text-center sm:text-right text-[9.5px] text-slate-700">
          <p className="text-slate-500">
            Bekasi, {startDate ? formatDateIndo(startDate) : "—"}
          </p>
          <p className="font-semibold text-slate-800 mt-0.5">Kepala Sekolah,</p>
          <div className="h-9 flex items-center justify-end">
            <span className="text-[8px] italic text-emerald-800/60 font-serif border border-dashed border-emerald-600/30 px-2 py-0.5 rounded">
              [Tanda Tangan & Stempel Resmi]
            </span>
          </div>
          <p className="font-bold text-slate-900 border-b border-slate-700/60 inline-block font-heading">
            SDIT AT-TAQWIM BEKASI
          </p>
        </div>
      </div>

      {/* CATATAN RESMI DIGITAL (PENGGANTI TAMPILAN RAW UUID) */}
      <div className="mt-2.5 pt-1.5 border-t border-dotted border-slate-200 text-center text-[8.5px] text-slate-400 font-medium">
        Dokumen digital resmi SDIT AT-TAQWIM · Keabsahan kartu diverifikasi melalui pemindaian kode QR
      </div>
    </div>
  );
}
