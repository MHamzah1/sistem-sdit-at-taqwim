"use client";

import React, { useState, useRef } from "react";
import {
  ArrowLeft,
  Users,
  UserCheck,
  School,
  CalendarDays,
  Clock,
  Save,
  AlertTriangle,
  Upload,
  Trash2,
  CheckCircle2,
  Link2,
  RefreshCw,
} from "lucide-react";
import type { AppState } from "@/server/state";
import { calculateAge } from "@/src/lib/formatters";

type Student = AppState["students"][number];
type ClassItem = AppState["classes"][number];
type AcademicYear = AppState["academicYears"][number];
type Guardian = AppState["guardians"][number];
type GuardianStudent = AppState["guardianStudents"][number];

interface StudentFormViewProps {
  mode: "tambah" | "ubah";
  student?: Student;
  classes: ClassItem[];
  academicYears: AcademicYear[];
  guardians: Guardian[];
  guardianStudents: GuardianStudent[];
  busy: boolean;
  onSave: (
    data: {
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
  ) => Promise<void>;
  onCancel: () => void;
}

export function StudentFormView({
  mode,
  student,
  classes,
  academicYears,
  guardians,
  guardianStudents,
  busy,
  onSave,
  onCancel,
}: StudentFormViewProps) {
  const todayStr = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Jakarta",
  });

  const [name, setName] = useState(student?.name || "");
  const [nis, setNis] = useState(student?.nis || "");
  const [nisn, setNisn] = useState(student?.nisn || "");
  const [gender, setGender] = useState<"L" | "P" | "">(
    (student?.gender as "L" | "P") || "L",
  );
  const [classId, setClassId] = useState(
    student?.classId || classes[0]?.id || "",
  );
  const [enrolledOn, setEnrolledOn] = useState(
    student?.enrolledOn?.slice(0, 10) || todayStr,
  );
  const [active, setActive] = useState(student ? student.active : true);
  const [birthPlace, setBirthPlace] = useState(student?.birthPlace || "");
  const [birthDate, setBirthDate] = useState(
    student?.birthDate?.slice(0, 10) || "",
  );
  const [photoUrl, setPhotoUrl] = useState(student?.photoUrl || "");
  const [photoFileName, setPhotoFileName] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(
    !!student?.photoUrl && student.photoUrl.startsWith("http"),
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = (file: File) => {
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      setPhotoError("Format file harus berupa gambar JPG, PNG, atau WEBP.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Ukuran file foto maksimal 5 MB.");
      return;
    }

    setPhotoError("");
    setIsProcessingPhoto(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const targetWidth = 360;
          const targetHeight = 480;
          const targetRatio = 3 / 4;

          const imgRatio = img.naturalWidth / img.naturalHeight;
          let srcX = 0;
          let srcY = 0;
          let srcWidth = img.naturalWidth;
          let srcHeight = img.naturalHeight;

          if (imgRatio > targetRatio) {
            srcWidth = img.naturalHeight * targetRatio;
            srcX = (img.naturalWidth - srcWidth) / 2;
          } else if (imgRatio < targetRatio) {
            srcHeight = img.naturalWidth / targetRatio;
            srcY = Math.max(0, (img.naturalHeight - srcHeight) * 0.2);
          }

          const canvas = document.createElement("canvas");
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Gagal mengolah kanvas foto");

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(
            img,
            srcX,
            srcY,
            srcWidth,
            srcHeight,
            0,
            0,
            targetWidth,
            targetHeight,
          );

          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
          setPhotoUrl(compressedDataUrl);
          setPhotoFileName(file.name);
          setShowUrlInput(false);
        } catch {
          setPhotoError("Gagal memproses gambar pas foto.");
        } finally {
          setIsProcessingPhoto(false);
        }
      };
      img.onerror = () => {
        setPhotoError("File gambar tidak valid atau rusak.");
        setIsProcessingPhoto(false);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setPhotoError("Gagal membaca file dari perangkat.");
      setIsProcessingPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoUrl("");
    setPhotoFileName("");
    setPhotoError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const existingLinkedGuardian = student
    ? guardianStudents.find((gs) => gs.studentId === student.id)?.guardianId
    : undefined;

  const [guardianMode, setGuardianMode] = useState<"existing" | "new" | "none">(
    existingLinkedGuardian ? "existing" : "none",
  );
  const [selectedGuardianId, setSelectedGuardianId] = useState<string>(
    existingLinkedGuardian || (guardians[0]?.id || ""),
  );
  const [newGuardianName, setNewGuardianName] = useState("");
  const [newGuardianPhone, setNewGuardianPhone] = useState("");
  const [formError, setFormError] = useState("");

  const calculatedAge = birthDate ? calculateAge(birthDate) : "—";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Nama lengkap siswa wajib diisi.");
      return;
    }
    if (!nis.trim()) {
      setFormError("Nomor Induk Siswa (NIS) wajib diisi.");
      return;
    }
    if (!classId) {
      setFormError("Kelas belajar siswa wajib dipilih.");
      return;
    }
    if (nisn.trim() && !/^\d{10}$/.test(nisn.trim())) {
      setFormError("NISN harus terdiri dari tepat 10 digit angka.");
      return;
    }
    if (guardianMode === "new") {
      if (!newGuardianName.trim()) {
        setFormError("Nama wali murid baru wajib diisi.");
        return;
      }
      if (!newGuardianPhone.trim()) {
        setFormError("Nomor WhatsApp/telepon wali murid baru wajib diisi.");
        return;
      }
    }

    try {
      await onSave(
        {
          name: name.trim(),
          nis: nis.trim(),
          nisn: nisn.trim() ? nisn.trim() : null,
          gender: gender ? gender : null,
          classId,
          enrolledOn,
          birthPlace: birthPlace.trim() ? birthPlace.trim() : null,
          birthDate: birthDate ? birthDate : null,
          photoUrl: photoUrl.trim() ? photoUrl.trim() : null,
          active,
        },
        mode === "tambah"
          ? {
              type: guardianMode,
              guardianId:
                guardianMode === "existing" ? selectedGuardianId : undefined,
              newGuardian:
                guardianMode === "new"
                  ? {
                      name: newGuardianName.trim(),
                      phone: newGuardianPhone.trim(),
                    }
                  : undefined,
            }
          : undefined,
      );
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan data.");
    }
  };

  const getYearName = (ayId: string) =>
    academicYears.find((y) => y.id === ayId)?.name || "—";

  return (
    <div className="st-page-shell">
      <div className="st-header-actions">
        <button type="button" className="st-back-link" onClick={onCancel}>
          <ArrowLeft size={16} />
          Kembali ke Daftar Siswa
        </button>
      </div>

      <div className="st-page-header">
        <div>
          <span className="eyebrow">MASTER DATA SISWA</span>
          <h1>{mode === "tambah" ? "Tambah Siswa Baru" : "Ubah Data Siswa"}</h1>
          <p>
            {mode === "tambah"
              ? "Lengkapi formulir pendaftaran siswa baru untuk data akademik, kelas, dan SPP SDIT AT-TAQWIM."
              : `Perbarui informasi profil dan data administratif siswa ${name || ""}.`}
          </p>
        </div>
      </div>

      {formError && (
        <div className="notice amber space-bottom" role="alert">
          <AlertTriangle size={16} />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="st-form-container">
        <div className="st-form-main-grid">
          <div className="st-form-column">
            <div className="panel st-form-card">
              <div className="st-card-header">
                <School size={18} className="st-card-icon" />
                <div>
                  <h3>Identitas & Administrasi Sekolah</h3>
                  <small>Nomor induk, nama siswa, dan penempatan kelas belajar</small>
                </div>
              </div>
              <div className="st-card-body">
                <div className="form-grid">
                  <label>
                    <span>Nomor Induk Siswa (NIS) *</span>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 2026001"
                      value={nis}
                      onChange={(e) => setNis(e.target.value)}
                    />
                  </label>
                  <label>
                    <span>NISN (10 Digit Nasional)</span>
                    <input
                      type="text"
                      maxLength={10}
                      placeholder="Contoh: 0104304564"
                      value={nisn}
                      onChange={(e) => setNisn(e.target.value.replace(/\D/g, ""))}
                    />
                  </label>
                </div>

                <label style={{ marginTop: 12 }}>
                  <span>Nama Lengkap Siswa *</span>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Sarah Salimah"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>

                <div className="form-grid" style={{ marginTop: 12 }}>
                  <label>
                    <span>Jenis Kelamin *</span>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as "L" | "P")}
                    >
                      <option value="L">Laki-laki (L)</option>
                      <option value="P">Perempuan (P)</option>
                    </select>
                  </label>
                  <label>
                    <span>Kelas Belajar *</span>
                    <select
                      required
                      value={classId}
                      onChange={(e) => setClassId(e.target.value)}
                    >
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} · {getYearName(c.academicYearId)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="form-grid" style={{ marginTop: 12 }}>
                  <label>
                    <span>Tanggal Masuk Sekolah *</span>
                    <input
                      type="date"
                      required
                      value={enrolledOn}
                      onChange={(e) => setEnrolledOn(e.target.value)}
                    />
                  </label>
                  <label>
                    <span>Status Siswa</span>
                    <select
                      value={active ? "true" : "false"}
                      onChange={(e) => setActive(e.target.value === "true")}
                    >
                      <option value="true">Aktif</option>
                      <option value="false">Tidak Aktif / Lulus / Pindah</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>

            <div className="panel st-form-card" style={{ marginTop: 20 }}>
              <div className="st-card-header">
                <CalendarDays size={18} className="st-card-icon" />
                <div>
                  <h3>Kelahiran & Informasi Pribadi</h3>
                  <small>Tempat dan tanggal kelahiran siswa untuk verifikasi ujian</small>
                </div>
              </div>
              <div className="st-card-body">
                <div className="form-grid">
                  <label>
                    <span>Kota / Tempat Lahir</span>
                    <input
                      type="text"
                      placeholder="Contoh: Bekasi"
                      value={birthPlace}
                      onChange={(e) => setBirthPlace(e.target.value)}
                    />
                  </label>
                  <label>
                    <span>Tanggal Lahir</span>
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                    />
                  </label>
                </div>

                {birthDate && (
                  <div className="st-age-preview-badge">
                    <Clock size={14} />
                    <span>
                      Usia Siswa Saat Ini: <strong>{calculatedAge}</strong>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="st-form-column">
            <div className="panel st-form-card">
              <div className="st-card-header">
                <UserCheck size={18} className="st-card-icon" />
                <div>
                  <h3>Pas Foto Siswa</h3>
                  <small>Pratinjau foto profil siswa untuk kartu ujian digital</small>
                </div>
              </div>
              <div className="st-card-body">
                <div className="st-photo-upload-container">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileProcess(file);
                    }}
                  />

                  <div
                    className={`st-photo-dropzone ${isDragging ? "dragging" : ""} ${photoUrl ? "has-photo" : ""}`}
                    onClick={handleTriggerUpload}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    role="button"
                    tabIndex={0}
                    title={photoUrl ? "Klik untuk mengganti foto" : "Klik atau seret foto ke sini"}
                  >
                    {photoUrl ? (
                      <div className="st-photo-3x4-frame">
                        <img
                          src={photoUrl}
                          alt="Pas Foto Siswa"
                          className="st-photo-3x4-img"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = "none";
                          }}
                        />
                        <div className="st-photo-ratio-tag">3x4</div>
                        <div className="st-photo-overlay-hover">
                          <Upload size={16} />
                          <span>Ganti Foto</span>
                        </div>
                      </div>
                    ) : (
                      <div className="st-photo-3x4-empty">
                        <div className="st-photo-empty-icon">
                          <Upload size={22} />
                        </div>
                        <span className="st-photo-empty-title">Pilih / Seret Foto</span>
                        <span className="st-photo-empty-sub">Standar Pas Foto 3x4</span>
                      </div>
                    )}
                  </div>

                  {isProcessingPhoto && (
                    <div className="st-photo-processing">
                      <RefreshCw size={13} className="st-spin" />
                      <span>Mengoptimalkan ukuran pas foto...</span>
                    </div>
                  )}

                  {photoError && (
                    <div className="st-photo-error">
                      <AlertTriangle size={14} />
                      <span>{photoError}</span>
                    </div>
                  )}

                  <div className="st-photo-actions">
                    <button
                      type="button"
                      className="st-btn-upload-photo"
                      onClick={handleTriggerUpload}
                      disabled={isProcessingPhoto}
                    >
                      <Upload size={14} />
                      {photoUrl ? "Ganti Foto" : "Unggah Foto Siswa"}
                    </button>

                    {photoUrl && (
                      <button
                        type="button"
                        className="st-btn-remove-photo"
                        onClick={handleRemovePhoto}
                        title="Hapus pas foto"
                      >
                        <Trash2 size={14} />
                        Hapus
                      </button>
                    )}
                  </div>

                  {photoFileName && photoUrl && (
                    <div className="st-photo-filename-badge">
                      <CheckCircle2 size={12} />
                      <span className="st-photo-filename-text">{photoFileName}</span>
                    </div>
                  )}

                  <div className="st-photo-helper-text">
                    Gunakan format pas foto standar rasio 3x4 (JPG, PNG, atau WEBP, maks. 5 MB). Otomatis dipotong dan dioptimalkan untuk kartu ujian.
                  </div>

                  <div className="st-photo-url-toggle">
                    <button
                      type="button"
                      className="st-btn-link-subtle"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                    >
                      <Link2 size={12} />
                      {showUrlInput ? "Sembunyikan Input URL" : "Atau gunakan tautan URL gambar"}
                    </button>
                  </div>

                  {showUrlInput && (
                    <div className="st-photo-url-field">
                      <label style={{ width: "100%", marginBottom: 0 }}>
                        <span style={{ fontSize: 11 }}>URL Pas Foto Siswa (Opsional)</span>
                        <input
                          type="url"
                          placeholder="https://.../foto-siswa.jpg"
                          value={photoUrl.startsWith("data:") ? "" : photoUrl}
                          onChange={(e) => {
                            setPhotoUrl(e.target.value);
                            setPhotoFileName("");
                          }}
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {mode === "tambah" && (
              <div className="panel st-form-card" style={{ marginTop: 20 }}>
                <div className="st-card-header">
                  <Users size={18} className="st-card-icon" />
                  <div>
                    <h3>Data Orang Tua / Wali Murid</h3>
                    <small>Hubungkan siswa dengan kontak orang tua/wali murid</small>
                  </div>
                </div>
                <div className="st-card-body">
                  <div className="st-guardian-options">
                    <label className="st-radio-label">
                      <input
                        type="radio"
                        name="guardianOption"
                        checked={guardianMode === "none"}
                        onChange={() => setGuardianMode("none")}
                      />
                      <span>Nanti saja (Hubungkan setelah data tersimpan)</span>
                    </label>

                    <label className="st-radio-label">
                      <input
                        type="radio"
                        name="guardianOption"
                        checked={guardianMode === "existing"}
                        onChange={() => setGuardianMode("existing")}
                      />
                      <span>Pilih Wali Murid yang sudah terdaftar</span>
                    </label>

                    {guardianMode === "existing" && (
                      <div className="st-guardian-subbox">
                        {guardians.length === 0 ? (
                          <p
                            style={{
                              margin: 0,
                              fontSize: 11,
                              color: "var(--muted)",
                            }}
                          >
                            Belum ada master data wali murid. Pilih daftarkan wali baru di bawah.
                          </p>
                        ) : (
                          <select
                            value={selectedGuardianId}
                            onChange={(e) => setSelectedGuardianId(e.target.value)}
                            style={{ width: "100%" }}
                          >
                            {guardians.map((g) => (
                              <option key={g.id} value={g.id}>
                                {g.name} · WA: {g.phone}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}

                    <label className="st-radio-label">
                      <input
                        type="radio"
                        name="guardianOption"
                        checked={guardianMode === "new"}
                        onChange={() => setGuardianMode("new")}
                      />
                      <span>Daftarkan Kontak Wali Murid Baru Sekaligus</span>
                    </label>

                    {guardianMode === "new" && (
                      <div className="st-guardian-subbox">
                        <label>
                          <span>Nama Lengkap Wali *</span>
                          <input
                            type="text"
                            placeholder="Contoh: Bapak Ahmad Sumaryana"
                            value={newGuardianName}
                            onChange={(e) => setNewGuardianName(e.target.value)}
                          />
                        </label>
                        <label style={{ marginTop: 8 }}>
                          <span>Nomor WhatsApp / Telepon *</span>
                          <input
                            type="tel"
                            placeholder="Contoh: 082297317872"
                            value={newGuardianPhone}
                            onChange={(e) => setNewGuardianPhone(e.target.value)}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="st-form-footer">
          <button
            type="button"
            className="outline"
            onClick={onCancel}
            disabled={busy}
          >
            Batal
          </button>
          <button type="submit" className="primary" disabled={busy}>
            <Save size={15} />
            {busy
              ? "Menyimpan Data..."
              : mode === "tambah"
                ? "Simpan Data Siswa"
                : "Simpan Perubahan"}
          </button>
        </div>
      </form>
    </div>
  );
}
