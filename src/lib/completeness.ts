// Pure completeness calculation engine for Student Profile (Client & Server safe)

export interface StudentCompletenessInput {
  student: {
    name?: string | null;
    nis?: string | null;
    nik?: string | null;
    familyCardNumber?: string | null;
    gender?: string | null;
    birthPlace?: string | null;
    birthDate?: string | null;
    nisn?: string | null;
  };
  address?: {
    address?: string | null;
    province?: string | null;
    regency?: string | null;
    district?: string | null;
    village?: string | null;
    transportationType?: string | null;
  } | null;
  addresses?: Array<any> | null;
  registration?: {
    enrolledOn?: string | null;
    classId?: string | null;
  } | null;
  father?: { fullName?: string | null; lifeStatus?: string | null } | null;
  mother?: { fullName?: string | null; lifeStatus?: string | null } | null;
  family?: any;
  emergencyContact?: { name?: string | null; phone?: string | null } | null;
  health?: { bloodType?: string | null } | null;
  characteristic?: { status?: string } | null;
  characteristicStatus?: string | null;
  aidRecords?: Array<{ aidType: string; status: string }> | null;
  aid?: Array<any> | null;
  documents?: Array<{ documentType: string; verificationStatus?: string | null }>;
}

export interface StudentCompletenessResult {
  percentage: number;
  pct: number;
  score: number;
  totalSections: number;
  overallPercent: number;
  completed: number;
  total: number;
  applicableCount: number;
  completedCount: number;
  sections: Record<
    string,
    { status: "COMPLETE" | "INCOMPLETE" | "NOT_APPLICABLE"; missing: string[] }
  >;
  isComplete: boolean;
  missingFields: string[] | string;
  verifiedDocsCount?: number;
  totalDocsCount?: number;
  documentSummary?: {
    verifiedCount: number;
    pendingCount: number;
    totalUploaded: number;
    verifiedPercentage: number;
    totalDocsCount?: number;
    verifiedDocsCount?: number;
  };
}

export function calculateStudentCompleteness(
  data: StudentCompletenessInput,
): StudentCompletenessResult {
  const sections: Record<
    string,
    { status: "COMPLETE" | "INCOMPLETE" | "NOT_APPLICABLE"; missing: string[] }
  > = {};

  const resolvedAddr =
    data.address ||
    (Array.isArray(data.addresses)
      ? data.addresses.find((a: any) => a.addressType === "IDENTITY") ||
        data.addresses[0]
      : null);
  const resolvedFather = data.father || data.family?.father;
  const resolvedMother = data.mother || data.family?.mother;
  const resolvedEmergency =
    data.emergencyContact || data.family?.emergencyContact;

  // 1. Identitas
  const identMissing: string[] = [];
  if (!data.student?.name) identMissing.push("Nama Lengkap");
  if (!data.student?.nis) identMissing.push("NIS");
  if (!data.student?.nik) identMissing.push("NIK (16 digit)");
  if (!data.student?.gender) identMissing.push("Jenis Kelamin");
  if (!data.student?.birthDate) identMissing.push("Tanggal Lahir");
  sections["identitas"] = {
    status: identMissing.length === 0 ? "COMPLETE" : "INCOMPLETE",
    missing: identMissing,
  };

  // 2. Alamat
  const addrMissing: string[] = [];
  if (!resolvedAddr?.address) addrMissing.push("Alamat Jalan / Tempat Tinggal");
  if (!resolvedAddr?.regency) addrMissing.push("Kota / Kabupaten");
  if (!resolvedAddr?.transportationType) addrMissing.push("Moda Transportasi");
  sections["alamat"] = {
    status: addrMissing.length === 0 ? "COMPLETE" : "INCOMPLETE",
    missing: addrMissing,
  };

  // 3. Registrasi
  const regMissing: string[] = [];
  if (!data.registration?.classId) regMissing.push("Kelas Penempatan");
  if (!data.registration?.enrolledOn) regMissing.push("Tanggal Masuk");
  sections["registrasi"] = {
    status: regMissing.length === 0 ? "COMPLETE" : "INCOMPLETE",
    missing: regMissing,
  };

  // 4. Data Ayah
  const fatherMissing: string[] = [];
  const fatherLife = resolvedFather?.lifeStatus || resolvedFather?.data?.lifeStatus;
  const fatherFullName = resolvedFather?.fullName || resolvedFather?.data?.fullName;
  if (fatherLife === "DECEASED") {
    sections["ayah"] = { status: "COMPLETE", missing: [] };
  } else {
    if (!fatherFullName) fatherMissing.push("Nama Lengkap Ayah");
    sections["ayah"] = {
      status: fatherMissing.length === 0 ? "COMPLETE" : "INCOMPLETE",
      missing: fatherMissing,
    };
  }

  // 5. Data Ibu
  const motherMissing: string[] = [];
  const motherLife = resolvedMother?.lifeStatus || resolvedMother?.data?.lifeStatus;
  const motherFullName = resolvedMother?.fullName || resolvedMother?.data?.fullName;
  if (motherLife === "DECEASED") {
    sections["ibu"] = { status: "COMPLETE", missing: [] };
  } else {
    if (!motherFullName) motherMissing.push("Nama Lengkap Ibu");
    sections["ibu"] = {
      status: motherMissing.length === 0 ? "COMPLETE" : "INCOMPLETE",
      missing: motherMissing,
    };
  }

  // 6. Wali & Kontak Darurat
  const emMissing: string[] = [];
  const emName = resolvedEmergency?.name || resolvedEmergency?.fullName;
  const emPhone = resolvedEmergency?.phone;
  if (!emName) emMissing.push("Nama Kontak Darurat");
  if (!emPhone) emMissing.push("Nomor Telepon Darurat");
  sections["wali_darurat"] = {
    status: emMissing.length === 0 ? "COMPLETE" : "INCOMPLETE",
    missing: emMissing,
  };

  // 7. Kesehatan
  const blood = data.health?.bloodType;
  const isHealthComplete = !!blood && blood !== "UNKNOWN";
  sections["kesehatan"] = {
    status: isHealthComplete ? "COMPLETE" : "INCOMPLETE",
    missing: isHealthComplete ? [] : ["Golongan Darah"],
  };

  // 8. Bantuan Pendidikan (Opsional, status selalu terpenuhi jika ada / tidak ada)
  sections["bantuan"] = {
    status: "COMPLETE",
    missing: [],
  };

  // 9. Karakteristik
  const charStatus = data.characteristic?.status || data.characteristicStatus;
  if (charStatus === "EMPTY") {
    sections["karakteristik"] = {
      status: "INCOMPLETE",
      missing: ["Kuesioner karakteristik santri belum diisi"],
    };
  } else {
    sections["karakteristik"] = {
      status: "COMPLETE",
      missing: [],
    };
  }

  // 10. Dokumen (KK, Akta Kelahiran, Pas Foto)
  const coreDocs = ["KK", "AKTA_KELAHIRAN", "PAS_FOTO"];
  const docs = data.documents || [];
  const verifiedDocs = docs
    .filter((d) => d.verificationStatus === "VERIFIED")
    .map((d) => d.documentType);
  const docMissing = coreDocs.filter((cd) => !verifiedDocs.includes(cd));
  sections["dokumen"] = {
    status: docMissing.length === 0 ? "COMPLETE" : "INCOMPLETE",
    missing: docMissing.map((d) => `Dokumen ${d} belum terverifikasi`),
  };

  const sectionKeys = Object.keys(sections);
  const total = sectionKeys.length;
  const completed = sectionKeys.filter(
    (k) => sections[k].status === "COMPLETE",
  ).length;
  const percentage = Math.round((completed / total) * 100);

  const missingFields: string[] = [];
  for (const s of Object.values(sections)) {
    missingFields.push(...s.missing);
  }

  const verifiedCount = docs.filter(
    (d) => d.verificationStatus === "VERIFIED",
  ).length;
  const pendingCount = docs.filter(
    (d) => d.verificationStatus === "PENDING",
  ).length;

  return {
    percentage,
    pct: percentage,
    score: completed,
    totalSections: total,
    overallPercent: percentage,
    completed,
    total,
    applicableCount: total,
    completedCount: completed,
    sections,
    isComplete: completed === total,
    missingFields,
    documentSummary: {
      verifiedCount,
      pendingCount,
      totalUploaded: docs.length,
      verifiedPercentage:
        docs.length > 0 ? Math.round((verifiedCount / docs.length) * 100) : 0,
      totalDocsCount: docs.length,
      verifiedDocsCount: verifiedCount,
    },
    verifiedDocsCount: verifiedCount,
    totalDocsCount: docs.length,
  };
}
