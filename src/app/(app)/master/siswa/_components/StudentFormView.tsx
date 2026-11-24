"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
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
  Search,
  FileText,
  HeartPulse,
  Award,
  BookOpen,
  FolderOpen,
  MapPin,
  Phone,
  Mail,
  Shield,
  Eye,
  Check,
  ChevronRight,
  Plus,
  HelpCircle,
} from "lucide-react";
import type { AppState } from "@/server/state";
import { calculateAge, money } from "@/src/lib/formatters";
import { Badge } from "@/src/components/Badge";
import { Modal } from "@/src/components/Modal";
import { api } from "@/src/lib/api";

type Student = AppState["students"][number];
type ClassItem = AppState["classes"][number];
type AcademicYear = AppState["academicYears"][number];
type Guardian = AppState["guardians"][number];
type GuardianStudent = AppState["guardianStudents"][number];

export interface StudentFormViewProps {
  mode: "tambah" | "ubah";
  student?: Student;
  initialFullProfile?: any;
  classes: ClassItem[];
  academicYears: AcademicYear[];
  guardians: Guardian[];
  guardianStudents: GuardianStudent[];
  busy: boolean;
  onSave: (payload: any) => Promise<void>;
  onCancel: () => void;
  onSaveDraft?: (data: any) => Promise<void>;
}

export function StudentFormView({
  mode,
  student,
  initialFullProfile,
  classes,
  academicYears,
  guardians,
  guardianStudents,
  busy,
  onSave,
  onCancel,
  onSaveDraft,
}: StudentFormViewProps) {
  const todayStr = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Jakarta",
  });

  // Current Active Section (1-10)
  const [activeSection, setActiveSection] = useState(1);

  // --- Section 01: Identitas ---
  const sAny = student as any;
  const [name, setName] = useState(student?.name || initialFullProfile?.student?.name || "");
  const [nickname, setNickname] = useState(sAny?.nickname || initialFullProfile?.student?.nickname || "");
  const [nis, setNis] = useState(student?.nis || initialFullProfile?.student?.nis || "");
  const [nisn, setNisn] = useState(student?.nisn || initialFullProfile?.student?.nisn || "");
  const [nik, setNik] = useState(sAny?.nik || initialFullProfile?.student?.nik || "");
  const [familyCardNumber, setFamilyCardNumber] = useState(
    sAny?.familyCardNumber || initialFullProfile?.student?.familyCardNumber || "",
  );
  const [birthCertificateNumber, setBirthCertificateNumber] = useState(
    sAny?.birthCertificateNumber || initialFullProfile?.student?.birthCertificateNumber || "",
  );
  const [gender, setGender] = useState<"L" | "P" | "">(
    (student?.gender as "L" | "P") || (initialFullProfile?.student?.gender as "L" | "P") || "L",
  );
  const [birthPlace, setBirthPlace] = useState(
    student?.birthPlace || initialFullProfile?.student?.birthPlace || "",
  );
  const [birthDate, setBirthDate] = useState(
    student?.birthDate?.slice(0, 10) || initialFullProfile?.student?.birthDate?.slice(0, 10) || "",
  );
  const [photoUrl, setPhotoUrl] = useState(
    student?.photoUrl || initialFullProfile?.student?.photoUrl || "",
  );
  const [religion, setReligion] = useState(
    sAny?.religion || initialFullProfile?.student?.religion || "Islam",
  );
  const [citizenship, setCitizenship] = useState(
    sAny?.citizenship || initialFullProfile?.student?.citizenship || "WNI",
  );
  const [birthOrder, setBirthOrder] = useState<number | "">(
    sAny?.birthOrder ?? initialFullProfile?.student?.birthOrder ?? 1,
  );
  const [siblingCount, setSiblingCount] = useState<number | "">(
    sAny?.siblingCount ?? initialFullProfile?.student?.siblingCount ?? 0,
  );
  const [dailyLanguage, setDailyLanguage] = useState(
    sAny?.dailyLanguage || initialFullProfile?.student?.dailyLanguage || "Indonesia",
  );

  // --- Section 02: Alamat & Domisili ---
  const idAddr = initialFullProfile?.addresses?.find((a: any) => a.addressType === "IDENTITY");
  const domAddr = initialFullProfile?.addresses?.find((a: any) => a.addressType === "DOMICILE");

  const [idAddress, setIdAddress] = useState(idAddr?.address || "");
  const [idRt, setIdRt] = useState(idAddr?.rt || "");
  const [idRw, setIdRw] = useState(idAddr?.rw || "");
  const [idHamlet, setIdHamlet] = useState(idAddr?.hamlet || "");
  const [idVillage, setIdVillage] = useState(idAddr?.village || "");
  const [idDistrict, setIdDistrict] = useState(idAddr?.district || "");
  const [idRegency, setIdRegency] = useState(idAddr?.regency || "Kab. Bogor");
  const [idProvince, setIdProvince] = useState(idAddr?.province || "Jawa Barat");
  const [idPostalCode, setIdPostalCode] = useState(idAddr?.postalCode || "");
  const [sameAsIdentity, setSameAsIdentity] = useState(true);

  const [domAddress, setDomAddress] = useState(domAddr?.address || "");
  const [domRt, setDomRt] = useState(domAddr?.rt || "");
  const [domRw, setDomRw] = useState(domAddr?.rw || "");
  const [domVillage, setDomVillage] = useState(domAddr?.village || "");
  const [domDistrict, setDomDistrict] = useState(domAddr?.district || "");
  const [domRegency, setDomRegency] = useState(domAddr?.regency || "");
  const [domProvince, setDomProvince] = useState(domAddr?.province || "");
  const [domPostalCode, setDomPostalCode] = useState(domAddr?.postalCode || "");

  const [residenceType, setResidenceType] = useState(idAddr?.residenceType || "BERSAMA_ORANG_TUA");
  const [transportationType, setTransportationType] = useState(idAddr?.transportationType || "SEPEDA_MOTOR");
  const [distanceToSchool, setDistanceToSchool] = useState<number | "">(
    idAddr?.distanceToSchool ? Number(idAddr.distanceToSchool) : 2,
  );
  const [travelTimeMinutes, setTravelTimeMinutes] = useState<number | "">(
    idAddr?.travelTimeMinutes ?? 15,
  );

  // --- Section 03: Registrasi & Akademik ---
  const initialEnrollment = initialFullProfile?.enrollments?.[0];
  const [registrationNumber, setRegistrationNumber] = useState(
    initialEnrollment?.registrationNumber || "",
  );
  const [registrationType, setRegistrationType] = useState<"NEW_STUDENT" | "TRANSFER_STUDENT">(
    initialEnrollment?.registrationType || "NEW_STUDENT",
  );
  const [registrationDate, setRegistrationDate] = useState(
    initialEnrollment?.registrationDate?.slice(0, 10) || todayStr,
  );
  const [acceptedDate, setAcceptedDate] = useState(
    initialEnrollment?.acceptedDate?.slice(0, 10) || todayStr,
  );
  const [enrolledOn, setEnrolledOn] = useState(
    student?.enrolledOn?.slice(0, 10) || initialFullProfile?.student?.enrolledOn?.slice(0, 10) || todayStr,
  );
  const [entryGrade, setEntryGrade] = useState<number>(initialEnrollment?.entryGrade || 1);
  const [classId, setClassId] = useState(student?.classId || classes[0]?.id || "");
  const [academicYearId, setAcademicYearId] = useState(
    academicYears.find((y) => y.active)?.id || academicYears[0]?.id || "",
  );
  const [attendedPaud, setAttendedPaud] = useState<boolean | null>(
    initialEnrollment?.attendedPaud ?? true,
  );
  const [attendedKindergarten, setAttendedKindergarten] = useState<boolean | null>(
    initialEnrollment?.attendedKindergarten ?? true,
  );
  const [previousSchoolName, setPreviousSchoolName] = useState(
    initialEnrollment?.previousSchoolName || "",
  );
  const [previousSchoolNpsn, setPreviousSchoolNpsn] = useState(
    initialEnrollment?.previousSchoolNpsn || "",
  );
  const [studentStatus, setStudentStatus] = useState<string>(
    student?.studentStatus || initialFullProfile?.student?.studentStatus || "ACTIVE",
  );
  const [academicNotes, setAcademicNotes] = useState(initialEnrollment?.notes || "");

  // --- Section 04 & 05: Data Ayah & Ibu ---
  const fatherData = initialFullProfile?.family?.find((f: any) => f.relationshipType === "FATHER")?.member;
  const motherData = initialFullProfile?.family?.find((f: any) => f.relationshipType === "MOTHER")?.member;

  // Ayah state
  const [fatherMode, setFatherMode] = useState<"new" | "existing">("new");
  const [fatherId, setFatherId] = useState<string | null>(fatherData?.id || null);
  const [fatherName, setFatherName] = useState(fatherData?.fullName || "");
  const [fatherNik, setFatherNik] = useState(fatherData?.nik || "");
  const [fatherLifeStatus, setFatherLifeStatus] = useState(fatherData?.lifeStatus || "ALIVE");
  const [fatherEducation, setFatherEducation] = useState(fatherData?.education || "S1");
  const [fatherOccupation, setFatherOccupation] = useState(fatherData?.occupation || "KARYAWAN_SWASTA");
  const [fatherInstitution, setFatherInstitution] = useState(fatherData?.institutionName || "");
  const [fatherIncome, setFatherIncome] = useState(fatherData?.monthlyIncomeRange || "RP_2_JT_SD_5_JT");
  const [fatherPhone, setFatherPhone] = useState(fatherData?.phone || "");
  const [fatherEmail, setFatherEmail] = useState(fatherData?.email || "");

  // Ibu state
  const [motherMode, setMotherMode] = useState<"new" | "existing">("new");
  const [motherId, setMotherId] = useState<string | null>(motherData?.id || null);
  const [motherName, setMotherName] = useState(motherData?.fullName || "");
  const [motherNik, setMotherNik] = useState(motherData?.nik || "");
  const [motherLifeStatus, setMotherLifeStatus] = useState(motherData?.lifeStatus || "ALIVE");
  const [motherEducation, setMotherEducation] = useState(motherData?.education || "D3");
  const [motherOccupation, setMotherOccupation] = useState(motherData?.occupation || "IBU_RUMAH_TANGGA");
  const [motherInstitution, setMotherInstitution] = useState(motherData?.institutionName || "");
  const [motherIncome, setMotherIncome] = useState(motherData?.monthlyIncomeRange || "TIDAK_BERPENGHASILAN");
  const [motherPhone, setMotherPhone] = useState(motherData?.phone || "");
  const [motherEmail, setMotherEmail] = useState(motherData?.email || "");

  // --- Section 06: Wali & Kontak Darurat ---
  const [primaryContact, setPrimaryContact] = useState<"FATHER" | "MOTHER" | "GUARDIAN">("FATHER");
  const [paymentResponsible, setPaymentResponsible] = useState<"FATHER" | "MOTHER" | "GUARDIAN">("FATHER");
  const [emergencyName, setEmergencyName] = useState(fatherData?.fullName || "");
  const [emergencyRelationship, setEmergencyRelationship] = useState("AYAH_KANDUNG");
  const [emergencyPhone, setEmergencyPhone] = useState(fatherData?.phone || "");

  // --- Section 07: Kesehatan ---
  const healthData = initialFullProfile?.health;
  const [bloodType, setBloodType] = useState(healthData?.bloodType || "UNKNOWN");
  const [medicalHistory, setMedicalHistory] = useState(healthData?.medicalHistory || "");
  const [foodAllergies, setFoodAllergies] = useState(healthData?.foodAllergies || "");
  const [drugAllergies, setDrugAllergies] = useState(healthData?.drugAllergies || "");
  const [hasSpecialNeeds, setHasSpecialNeeds] = useState(healthData?.hasSpecialNeeds || false);
  const [routineMedication, setRoutineMedication] = useState(healthData?.routineMedication || "");
  const [emergencyHandlingNotes, setEmergencyHandlingNotes] = useState(
    healthData?.emergencyHandlingNotes || "",
  );
  const [assistanceNeeds, setAssistanceNeeds] = useState(healthData?.assistanceNeeds || "");

  // Pengukuran fisik
  const [measurements, setMeasurements] = useState<any[]>(initialFullProfile?.measurements || []);
  const [showMeasurementModal, setShowMeasurementModal] = useState(false);
  const [newMeasureDate, setNewMeasureDate] = useState(todayStr);
  const [newHeight, setNewHeight] = useState<number | "">("");
  const [newWeight, setNewWeight] = useState<number | "">("");
  const [newMeasureNotes, setNewMeasureNotes] = useState("");

  // --- Section 08: Bantuan Pendidikan ---
  const [aidRecords, setAidRecords] = useState<any[]>(initialFullProfile?.aidRecords || []);
  const [showAidModal, setShowAidModal] = useState(false);
  const [newAidType, setNewAidType] = useState<string>("KIP");
  const [newAidNumber, setNewAidNumber] = useState("");
  const [newAidSource, setNewAidSource] = useState("Kementerian Pendidikan");
  const [newAidNotes, setNewAidNotes] = useState("");

  // --- Section 09: Karakteristik ---
  const [characteristicTemplateId, setCharacteristicTemplateId] = useState("");

  // --- Section 10: Dokumen ---
  const [documents, setDocuments] = useState<any[]>(initialFullProfile?.documents || []);
  const [showUploadDocModal, setShowUploadDocModal] = useState(false);
  const [uploadDocType, setUploadDocType] = useState("KK");
  const [uploadDocName, setUploadDocName] = useState("Kartu Keluarga");
  const [uploadDocFile, setUploadDocFile] = useState<File | null>(null);

  // Search existing family modal
  const [showSearchFamilyModal, setShowSearchFamilyModal] = useState<"father" | "mother" | null>(null);
  const [familySearchQuery, setFamilySearchQuery] = useState("");
  const [familySearchResults, setFamilySearchResults] = useState<any[]>([]);
  const [searchingFamily, setSearchingFamily] = useState(false);

  // Photo processing
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState("");
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);

  // Sync Emergency Contact when Primary Changes
  useEffect(() => {
    if (primaryContact === "FATHER" && fatherName) {
      setEmergencyName(fatherName);
      setEmergencyRelationship("AYAH_KANDUNG");
      setEmergencyPhone(fatherPhone);
    } else if (primaryContact === "MOTHER" && motherName) {
      setEmergencyName(motherName);
      setEmergencyRelationship("IBU_KANDUNG");
      setEmergencyPhone(motherPhone);
    }
  }, [primaryContact, fatherName, fatherPhone, motherName, motherPhone]);

  // Handle Photo File selection and compression
  const handlePhotoSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setPhotoError("File harus berupa gambar (JPG/PNG/WEBP)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Ukuran foto maksimal 5 MB");
      return;
    }
    setPhotoError("");
    setIsProcessingPhoto(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const targetWidth = 300;
        const targetHeight = 400; // 3:4 aspect ratio
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Cover crop
        const scale = Math.max(targetWidth / img.width, targetHeight / img.height);
        const x = (targetWidth - img.width * scale) / 2;
        const y = (targetHeight - img.height * scale) / 2;

        if (ctx) {
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
          const compressed = canvas.toDataURL("image/jpeg", 0.85);
          setPhotoUrl(compressed);
        }
        setIsProcessingPhoto(false);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Search Family Members Handler
  const handleSearchFamily = async () => {
    if (!familySearchQuery.trim()) return;
    setSearchingFamily(true);
    try {
      const res = await api<any[]>(`family-members/search?q=${encodeURIComponent(familySearchQuery)}`);
      setFamilySearchResults(res || []);
    } catch {
      setFamilySearchResults([]);
    } finally {
      setSearchingFamily(false);
    }
  };

  // Add Measurement Handler
  const handleAddMeasurement = () => {
    if (!newHeight || !newWeight) return;
    const newEntry = {
      id: "temp-" + Date.now(),
      measurementDate: newMeasureDate,
      heightCm: newHeight.toString(),
      weightKg: newWeight.toString(),
      notes: newMeasureNotes,
      semester: 1,
    };
    setMeasurements((prev) => [newEntry, ...prev]);
    setShowMeasurementModal(false);
    setNewHeight("");
    setNewWeight("");
    setNewMeasureNotes("");
  };

  // Add Aid Handler
  const handleAddAid = () => {
    const newEntry = {
      id: "temp-" + Date.now(),
      aidType: newAidType,
      aidNumber: newAidNumber,
      aidSource: newAidSource,
      notes: newAidNotes,
      status: "ACTIVE",
    };
    setAidRecords((prev) => [newEntry, ...prev]);
    setShowAidModal(false);
    setNewAidNumber("");
    setNewAidNotes("");
  };

  // Calculate Completeness Score
  const completeness = useMemo(() => {
    let score = 0;
    const totalSections = 10;
    // 01 Identitas
    if (name && nis && nik && gender && birthDate) score += 1;
    // 02 Alamat
    if (idAddress && idRegency && transportationType) score += 1;
    // 03 Registrasi
    if (classId && enrolledOn) score += 1;
    // 04 Ayah
    if (fatherName || fatherLifeStatus === "DECEASED") score += 1;
    // 05 Ibu
    if (motherName || motherLifeStatus === "DECEASED") score += 1;
    // 06 Wali / Darurat
    if (emergencyName && emergencyPhone) score += 1;
    // 07 Kesehatan
    if (bloodType !== "UNKNOWN") score += 1;
    // 08 Bantuan
    score += 1; // Opsional terkonfirmasi
    // 09 Karakteristik
    score += 1;
    // 10 Dokumen
    const verifiedOrUploaded = documents.length > 0;
    if (verifiedOrUploaded) score += 1;

    const pct = Math.round((score / totalSections) * 100);
    return { score, totalSections, pct };
  }, [
    name,
    nis,
    nik,
    gender,
    birthDate,
    idAddress,
    idRegency,
    transportationType,
    classId,
    enrolledOn,
    fatherName,
    fatherLifeStatus,
    motherName,
    motherLifeStatus,
    emergencyName,
    emergencyPhone,
    bloodType,
    documents,
  ]);

  // Construct Full Payload
  const getPayload = () => {
    return {
      student: {
        name: name.trim(),
        nickname: nickname.trim() || null,
        nis: nis.trim(),
        nisn: nisn.trim() || null,
        nik: nik.trim() || null,
        familyCardNumber: familyCardNumber.trim() || null,
        birthCertificateNumber: birthCertificateNumber.trim() || null,
        gender: gender || null,
        birthPlace: birthPlace.trim() || null,
        birthDate: birthDate || null,
        photoUrl: photoUrl || null,
        religion,
        citizenship,
        birthOrder: birthOrder === "" ? null : Number(birthOrder),
        siblingCount: siblingCount === "" ? null : Number(siblingCount),
        dailyLanguage: dailyLanguage.trim() || null,
        classId,
        enrolledOn,
        studentStatus,
        active: studentStatus === "ACTIVE",
      },
      addresses: {
        identity: {
          address: idAddress.trim() || null,
          rt: idRt.trim() || null,
          rw: idRw.trim() || null,
          hamlet: idHamlet.trim() || null,
          village: idVillage.trim() || null,
          district: idDistrict.trim() || null,
          regency: idRegency.trim() || null,
          province: idProvince.trim() || null,
          postalCode: idPostalCode.trim() || null,
          residenceType,
          transportationType,
          distanceToSchool: distanceToSchool === "" ? null : Number(distanceToSchool),
          travelTimeMinutes: travelTimeMinutes === "" ? null : Number(travelTimeMinutes),
        },
        domicile: sameAsIdentity
          ? undefined
          : {
              address: domAddress.trim() || null,
              rt: domRt.trim() || null,
              rw: domRw.trim() || null,
              village: domVillage.trim() || null,
              district: domDistrict.trim() || null,
              regency: domRegency.trim() || null,
              province: domProvince.trim() || null,
              postalCode: domPostalCode.trim() || null,
            },
        sameAsIdentity,
      },
      registration: {
        registrationNumber: registrationNumber.trim() || null,
        registrationType,
        registrationDate: registrationDate || null,
        acceptedDate: acceptedDate || null,
        entryGrade,
        attendedPaud,
        attendedKindergarten,
        previousSchoolName: previousSchoolName.trim() || null,
        previousSchoolNpsn: previousSchoolNpsn.trim() || null,
        notes: academicNotes.trim() || null,
      },
      family: {
        father: {
          mode: fatherMode,
          familyMemberId: fatherId,
          data: {
            fullName: fatherName.trim(),
            nik: fatherNik.trim() || null,
            lifeStatus: fatherLifeStatus as any,
            education: fatherEducation,
            occupation: fatherOccupation,
            institutionName: fatherInstitution.trim() || null,
            monthlyIncomeRange: fatherIncome,
            phone: fatherPhone.trim() || null,
            email: fatherEmail.trim() || null,
          },
        },
        mother: {
          mode: motherMode,
          familyMemberId: motherId,
          data: {
            fullName: motherName.trim(),
            nik: motherNik.trim() || null,
            lifeStatus: motherLifeStatus as any,
            education: motherEducation,
            occupation: motherOccupation,
            institutionName: motherInstitution.trim() || null,
            monthlyIncomeRange: motherIncome,
            phone: motherPhone.trim() || null,
            email: motherEmail.trim() || null,
          },
        },
        primaryContact,
        paymentResponsible,
        emergencyContact: {
          name: emergencyName.trim(),
          relationship: emergencyRelationship,
          phone: emergencyPhone.trim(),
        },
      },
      health: {
        bloodType: bloodType as any,
        medicalHistory: medicalHistory.trim() || null,
        foodAllergies: foodAllergies.trim() || null,
        drugAllergies: drugAllergies.trim() || null,
        hasSpecialNeeds,
        routineMedication: routineMedication.trim() || null,
        emergencyHandlingNotes: emergencyHandlingNotes.trim() || null,
        assistanceNeeds: assistanceNeeds.trim() || null,
      },
      aid: aidRecords.map((a) => ({
        aidType: a.aidType,
        aidNumber: a.aidNumber || null,
        aidSource: a.aidSource || null,
        status: a.status || "ACTIVE",
        notes: a.notes || null,
      })),
    };
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setActiveSection(1);
      alert("Nama lengkap siswa wajib diisi");
      return;
    }
    if (!nis.trim()) {
      setActiveSection(1);
      alert("NIS siswa wajib diisi");
      return;
    }
    if (!classId) {
      setActiveSection(3);
      alert("Kelas penempatan siswa wajib dipilih");
      return;
    }

    const payload = getPayload();
    await onSave(payload);
  };

  const handleDraftSaveClick = async () => {
    if (onSaveDraft) {
      await onSaveDraft(getPayload());
    }
  };

  const sectionsList = [
    { id: 1, title: "01. Identitas Siswa", icon: Users, complete: !!(name && nis && nik) },
    { id: 2, title: "02. Alamat & Domisili", icon: MapPin, complete: !!(idAddress && idRegency) },
    { id: 3, title: "03. Registrasi & Akademik", icon: School, complete: !!(classId && enrolledOn) },
    { id: 4, title: "04. Data Ayah Kandung", icon: Users, complete: !!(fatherName || fatherLifeStatus === "DECEASED") },
    { id: 5, title: "05. Data Ibu Kandung", icon: Users, complete: !!(motherName || motherLifeStatus === "DECEASED") },
    { id: 6, title: "06. Wali & Kontak Darurat", icon: Shield, complete: !!(emergencyName && emergencyPhone) },
    { id: 7, title: "07. Kesehatan & Kebutuhan Khusus", icon: HeartPulse, complete: bloodType !== "UNKNOWN" },
    { id: 8, title: "08. Bantuan Pendidikan", icon: Award, complete: true },
    { id: 9, title: "09. Karakteristik & Perkembangan", icon: BookOpen, complete: true },
    { id: 10, title: "10. Dokumen Persyaratan", icon: FolderOpen, complete: documents.length > 0 },
  ];

  return (
    <div className="st-page-shell">
      {/* Header Card */}
      <div className="st-header-card" style={{ marginBottom: 16 }}>
        <div className="st-header-left">
          <div className="st-header-icon-box">
            <Users size={28} />
          </div>
          <div>
            <div className="st-breadcrumb">
              <span>Master Data</span>
              <span>/</span>
              <span>Siswa</span>
              <span>/</span>
              <span>{mode === "tambah" ? "Tambah Siswa Baru" : "Ubah Data Siswa"}</span>
            </div>
            <h1 className="st-header-title">
              {mode === "tambah" ? "Pendaftaran & Biodata Siswa Baru" : `Ubah Biodata: ${name || student?.name}`}
            </h1>
            <p className="st-header-subtitle">
              Lengkapi 10 bagian informasi administrasi dan data induk siswa SDIT AT-TAQWIM.
            </p>
          </div>
        </div>

        <div className="st-header-actions" style={{ alignItems: "flex-end" }}>
          <div style={{ textAlign: "right", minWidth: 220 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: "#16613e", marginBottom: 5 }}>
              <span>Kelengkapan Biodata</span>
              <span>{completeness.pct}%</span>
            </div>
            <div style={{ height: 8, background: "#e1e7e3", borderRadius: 4, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${completeness.pct}%`,
                  background: completeness.pct >= 80 ? "#10b981" : "#f59e0b",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
            <div style={{ fontSize: 10, color: "#6c7971", marginTop: 4 }}>
              Dokumen: {documents.filter((d) => d.verificationStatus === "VERIFIED").length}/{documents.length || 3} Terverifikasi
            </div>
          </div>
        </div>
      </div>

      {/* Main Form 2-Panel Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "260px minmax(0, 1fr)",
          gap: 18,
          alignItems: "start",
        }}
        className="st-form-2panel"
      >
        {/* Left Sidebar Nav */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #e1e7e3",
            borderRadius: 10,
            padding: 12,
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 750, color: "#154d35", padding: "6px 8px 10px", borderBottom: "1px solid #edf0ed" }}>
            BAGIAN FORMULIR
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 8 }}>
            {sectionsList.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveSection(sec.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 10px",
                    borderRadius: 6,
                    textAlign: "left",
                    background: isActive ? "#e8f2ec" : "transparent",
                    color: isActive ? "#154d35" : "#536448",
                    fontWeight: isActive ? 750 : 500,
                    fontSize: 12,
                    border: 0,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Icon size={16} color={isActive ? "#16613e" : "#87918c"} />
                  <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {sec.title}
                  </span>
                  {sec.complete ? (
                    <CheckCircle2 size={14} color="#10b981" />
                  ) : (
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b" }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Draft Note */}
          <div
            style={{
              marginTop: 16,
              padding: 10,
              background: "#f7f9f7",
              border: "1px solid #e9eeea",
              borderRadius: 6,
              fontSize: 11,
              color: "#536448",
            }}
          >
            <strong>Simpan Sementara</strong>
            <p style={{ margin: "4px 0 0", fontSize: 10, color: "#7a8c6d", lineHeight: 1.4 }}>
              Draf tidak menghasilkan tagihan SPP atau kartu ujian sebelum difinalisasi.
            </p>
          </div>
        </div>

        {/* Right Active Section Content */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #e1e7e3",
            borderRadius: 10,
            padding: 24,
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <form onSubmit={handleFinalSubmit}>
            {/* SECTION 01: Identitas Siswa */}
            {activeSection === 1 && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 750, color: "#154d35", marginBottom: 4 }}>
                  01. Identitas Siswa
                </h3>
                <p style={{ fontSize: 12, color: "#7a8c6d", marginBottom: 20 }}>
                  Isi data identitas siswa sesuai dengan Kartu Keluarga dan Akta Kelahiran.
                </p>

                {/* Pas Foto Upload & Preview */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 18,
                    padding: 16,
                    background: "#f7f9f7",
                    border: "1px solid #e7ece8",
                    borderRadius: 8,
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      width: 90,
                      height: 120,
                      borderRadius: 6,
                      background: "#eef2ee",
                      border: "1px dashed #c0ccc4",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt="Pas Foto 3x4"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{ textAlign: "center", color: "#87918c", fontSize: 10 }}>
                        <Users size={28} style={{ margin: "0 auto 4px" }} />
                        <span>Foto 3×4</span>
                      </div>
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#283b34", marginBottom: 4 }}>
                      Pas Foto Siswa (Rasio 3:4)
                    </div>
                    <div style={{ fontSize: 11, color: "#6c7971", marginBottom: 10 }}>
                      Format JPG, PNG, atau WEBP. Ukuran maksimal 5 MB. Foto digunakan untuk kartu ujian ber-QR.
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/jpeg,image/png,image/webp"
                        style={{ display: "none" }}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handlePhotoSelect(f);
                        }}
                      />
                      <button
                        type="button"
                        className="st-btn-secondary"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessingPhoto}
                        style={{ fontSize: 11, padding: "6px 12px" }}
                      >
                        <Upload size={14} style={{ marginRight: 6 }} />
                        {photoUrl ? "Ganti Foto" : "Pilih Foto"}
                      </button>
                      {photoUrl && (
                        <button
                          type="button"
                          className="st-btn-secondary"
                          onClick={() => setPhotoUrl("")}
                          style={{ fontSize: 11, padding: "6px 12px", color: "#dc2626" }}
                        >
                          <Trash2 size={14} style={{ marginRight: 6 }} />
                          Hapus
                        </button>
                      )}
                    </div>
                    {photoError && (
                      <div style={{ fontSize: 11, color: "#dc2626", marginTop: 6 }}>{photoError}</div>
                    )}
                  </div>
                </div>

                <div className="form-grid" style={{ marginBottom: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                      Nama Lengkap Siswa *
                    </label>
                    <input
                      type="text"
                      className="st-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Sesuai dokumen Kartu Keluarga"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                      Nama Panggilan
                    </label>
                    <input
                      type="text"
                      className="st-input"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="Contoh: Fauzi"
                    />
                  </div>
                </div>

                <div className="form-grid" style={{ marginBottom: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                      NIS (Nomor Induk Siswa) *
                    </label>
                    <input
                      type="text"
                      className="st-input"
                      value={nis}
                      onChange={(e) => setNis(e.target.value)}
                      placeholder="Nomor induk unik sekolah"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                      NISN (Nomor Induk Siswa Nasional)
                    </label>
                    <input
                      type="text"
                      className="st-input"
                      value={nisn}
                      maxLength={10}
                      onChange={(e) => setNisn(e.target.value.replace(/\D/g, ""))}
                      placeholder="10 digit angka jika sudah ada"
                    />
                  </div>
                </div>

                <div className="form-grid" style={{ marginBottom: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                      NIK (Nomor Induk Kependudukan)
                    </label>
                    <input
                      type="text"
                      className="st-input"
                      value={nik}
                      maxLength={16}
                      onChange={(e) => setNik(e.target.value.replace(/\D/g, ""))}
                      placeholder="16 digit angka sesuai KK/KIA"
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                      Nomor Kartu Keluarga (KK)
                    </label>
                    <input
                      type="text"
                      className="st-input"
                      value={familyCardNumber}
                      maxLength={16}
                      onChange={(e) => setFamilyCardNumber(e.target.value.replace(/\D/g, ""))}
                      placeholder="16 digit angka kepala keluarga"
                    />
                  </div>
                </div>

                <div className="form-grid" style={{ marginBottom: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                      Nomor Akta Kelahiran
                    </label>
                    <input
                      type="text"
                      className="st-input"
                      value={birthCertificateNumber}
                      onChange={(e) => setBirthCertificateNumber(e.target.value)}
                      placeholder="Nomor register akta kelahiran"
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                      Jenis Kelamin
                    </label>
                    <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12 }}>
                        <input
                          type="radio"
                          name="gender"
                          checked={gender === "L"}
                          onChange={() => setGender("L")}
                        />
                        Laki-laki
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12 }}>
                        <input
                          type="radio"
                          name="gender"
                          checked={gender === "P"}
                          onChange={() => setGender("P")}
                        />
                        Perempuan
                      </label>
                    </div>
                  </div>
                </div>

                <div className="form-grid" style={{ marginBottom: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                      Tempat Lahir
                    </label>
                    <input
                      type="text"
                      className="st-input"
                      value={birthPlace}
                      onChange={(e) => setBirthPlace(e.target.value)}
                      placeholder="Contoh: Bogor"
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                      Tanggal Lahir
                    </label>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <input
                        type="date"
                        className="st-input"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        max={todayStr}
                      />
                      {birthDate && (
                        <span style={{ fontSize: 11, color: "#16613e", fontWeight: 600, whiteSpace: "nowrap" }}>
                          Usia: {calculateAge(birthDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="form-grid" style={{ marginBottom: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                      Agama
                    </label>
                    <select
                      className="st-input"
                      value={religion}
                      onChange={(e) => setReligion(e.target.value)}
                    >
                      <option value="Islam">Islam</option>
                      <option value="Kristen">Kristen</option>
                      <option value="Katolik">Katolik</option>
                      <option value="Hindu">Hindu</option>
                      <option value="Buddha">Buddha</option>
                      <option value="Konghucu">Konghucu</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                      Kewarganegaraan
                    </label>
                    <select
                      className="st-input"
                      value={citizenship}
                      onChange={(e) => setCitizenship(e.target.value)}
                    >
                      <option value="WNI">WNI (Warga Negara Indonesia)</option>
                      <option value="WNA">WNA (Warga Negara Asing)</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid" style={{ marginBottom: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                      Anak ke-
                    </label>
                    <input
                      type="number"
                      className="st-input"
                      min={1}
                      value={birthOrder}
                      onChange={(e) => setBirthOrder(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                      Jumlah Saudara Kandung
                    </label>
                    <input
                      type="number"
                      className="st-input"
                      min={0}
                      value={siblingCount}
                      onChange={(e) => setSiblingCount(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 02: Alamat & Domisili */}
            {activeSection === 2 && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 750, color: "#154d35", marginBottom: 4 }}>
                  02. Alamat & Tempat Tinggal
                </h3>
                <p style={{ fontSize: 12, color: "#7a8c6d", marginBottom: 20 }}>
                  Kelola alamat kependudukan sesuai Kartu Keluarga serta alamat domisili anak saat ini.
                </p>

                <div style={{ background: "#f9faf9", border: "1px solid #e9eeea", padding: 16, borderRadius: 8, marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 750, color: "#154d35", marginBottom: 12 }}>
                    ALAMAT SESUAI KARTU KELUARGA (KK)
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                      Alamat Jalan / Lingkungan *
                    </label>
                    <textarea
                      rows={2}
                      className="st-input"
                      value={idAddress}
                      onChange={(e) => setIdAddress(e.target.value)}
                      placeholder="Nama jalan, nomor rumah, gang/blok"
                    />
                  </div>
                  <div className="form-grid" style={{ marginBottom: 12 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                        RT / RW
                      </label>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          type="text"
                          className="st-input"
                          placeholder="RT"
                          value={idRt}
                          onChange={(e) => setIdRt(e.target.value)}
                        />
                        <input
                          type="text"
                          className="st-input"
                          placeholder="RW"
                          value={idRw}
                          onChange={(e) => setIdRw(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                        Dusun / Lingkungan
                      </label>
                      <input
                        type="text"
                        className="st-input"
                        value={idHamlet}
                        onChange={(e) => setIdHamlet(e.target.value)}
                        placeholder="Dusun I"
                      />
                    </div>
                  </div>
                  <div className="form-grid" style={{ marginBottom: 12 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                        Kelurahan / Desa
                      </label>
                      <input
                        type="text"
                        className="st-input"
                        value={idVillage}
                        onChange={(e) => setIdVillage(e.target.value)}
                        placeholder="Desa Benteng"
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                        Kecamatan
                      </label>
                      <input
                        type="text"
                        className="st-input"
                        value={idDistrict}
                        onChange={(e) => setIdDistrict(e.target.value)}
                        placeholder="Kecamatan Ciampea"
                      />
                    </div>
                  </div>
                  <div className="form-grid">
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                        Kabupaten / Kota
                      </label>
                      <input
                        type="text"
                        className="st-input"
                        value={idRegency}
                        onChange={(e) => setIdRegency(e.target.value)}
                        placeholder="Kab. Bogor"
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                        Kode Pos
                      </label>
                      <input
                        type="text"
                        className="st-input"
                        value={idPostalCode}
                        maxLength={5}
                        onChange={(e) => setIdPostalCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="16620"
                      />
                    </div>
                  </div>
                </div>

                {/* Domicile Checkbox */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, fontWeight: 650, color: "#16613e" }}>
                    <input
                      type="checkbox"
                      checked={sameAsIdentity}
                      onChange={(e) => setSameAsIdentity(e.target.checked)}
                      style={{ width: 16, height: 16, accentColor: "#10b981" }}
                    />
                    Alamat tempat tinggal / domisili sama persis dengan alamat KK
                  </label>
                </div>

                {!sameAsIdentity && (
                  <div style={{ background: "#fff", border: "1px dashed #c0ccc4", padding: 16, borderRadius: 8, marginBottom: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 750, color: "#154d35", marginBottom: 12 }}>
                      ALAMAT DOMISILI SAAT INI
                    </div>
                    <textarea
                      rows={2}
                      className="st-input"
                      value={domAddress}
                      onChange={(e) => setDomAddress(e.target.value)}
                      placeholder="Alamat domisili jika berbeda dari KK"
                      style={{ marginBottom: 12 }}
                    />
                    <div className="form-grid">
                      <input
                        type="text"
                        className="st-input"
                        value={domRegency}
                        onChange={(e) => setDomRegency(e.target.value)}
                        placeholder="Kota / Kabupaten Domisili"
                      />
                      <input
                        type="text"
                        className="st-input"
                        value={domPostalCode}
                        maxLength={5}
                        onChange={(e) => setDomPostalCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="Kode Pos Domisili"
                      />
                    </div>
                  </div>
                )}

                {/* Akses & Transportasi */}
                <div style={{ background: "#f7f9f7", border: "1px solid #e7ece8", padding: 16, borderRadius: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 750, color: "#154d35", marginBottom: 12 }}>
                    TEMPAT TINGGAL & AKSES KE SEKOLAH
                  </div>
                  <div className="form-grid" style={{ marginBottom: 12 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                        Jenis Tempat Tinggal
                      </label>
                      <select
                        className="st-input"
                        value={residenceType}
                        onChange={(e) => setResidenceType(e.target.value)}
                      >
                        <option value="BERSAMA_ORANG_TUA">Bersama Orang Tua</option>
                        <option value="BERSAMA_WALI">Bersama Wali</option>
                        <option value="KOS_ASRAMA">Kost / Asrama</option>
                        <option value="PANTI_ASUHAN">Panti Asuhan</option>
                        <option value="LAINNYA">Lainnya</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                        Moda Transportasi Utama
                      </label>
                      <select
                        className="st-input"
                        value={transportationType}
                        onChange={(e) => setTransportationType(e.target.value)}
                      >
                        <option value="JALAN_KAKI">Jalan Kaki</option>
                        <option value="SEPEDA">Sepeda</option>
                        <option value="SEPEDA_MOTOR">Sepeda Motor</option>
                        <option value="MOBIL_PRIBADI">Mobil Pribadi</option>
                        <option value="ANTAR_JEMPUT">Antar Jemput Sekolah</option>
                        <option value="ANGKUTAN_UMUM">Angkutan Umum</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-grid">
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                        Jarak ke Sekolah (km)
                      </label>
                      <input
                        type="number"
                        className="st-input"
                        step="0.1"
                        min="0"
                        value={distanceToSchool}
                        onChange={(e) => setDistanceToSchool(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="Contoh: 2.5"
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                        Waktu Tempuh (Menit)
                      </label>
                      <input
                        type="number"
                        className="st-input"
                        min="0"
                        value={travelTimeMinutes}
                        onChange={(e) => setTravelTimeMinutes(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="Contoh: 15"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 03: Registrasi & Akademik */}
            {activeSection === 3 && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 750, color: "#154d35", marginBottom: 4 }}>
                  03. Registrasi & Akademik
                </h3>
                <p style={{ fontSize: 12, color: "#7a8c6d", marginBottom: 20 }}>
                  Tentukan nomor registrasi penerimaan, kelas penempatan aktif, dan riwayat sekolah sebelumnya.
                </p>

                <div className="form-grid" style={{ marginBottom: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                      Nomor Pendaftaran
                    </label>
                    <input
                      type="text"
                      className="st-input"
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      placeholder="Contoh: REG-2026-001"
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                      Jenis Pendaftaran
                    </label>
                    <select
                      className="st-input"
                      value={registrationType}
                      onChange={(e) => setRegistrationType(e.target.value as any)}
                    >
                      <option value="NEW_STUDENT">Siswa Baru</option>
                      <option value="TRANSFER_STUDENT">Siswa Pindahan</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid" style={{ marginBottom: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                      Tanggal Masuk Sekolah *
                    </label>
                    <input
                      type="date"
                      className="st-input"
                      value={enrolledOn}
                      onChange={(e) => setEnrolledOn(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                      Kelas Saat Ini *
                    </label>
                    <select
                      className="st-input"
                      value={classId}
                      onChange={(e) => setClassId(e.target.value)}
                      required
                    >
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-grid" style={{ marginBottom: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                      Pernah PAUD?
                    </label>
                    <select
                      className="st-input"
                      value={attendedPaud === null ? "null" : attendedPaud ? "true" : "false"}
                      onChange={(e) =>
                        setAttendedPaud(e.target.value === "null" ? null : e.target.value === "true")
                      }
                    >
                      <option value="true">Ya, Pernah</option>
                      <option value="false">Tidak Pernah</option>
                      <option value="null">Belum Diketahui</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                      Pernah TK / RA?
                    </label>
                    <select
                      className="st-input"
                      value={attendedKindergarten === null ? "null" : attendedKindergarten ? "true" : "false"}
                      onChange={(e) =>
                        setAttendedKindergarten(e.target.value === "null" ? null : e.target.value === "true")
                      }
                    >
                      <option value="true">Ya, Pernah</option>
                      <option value="false">Tidak Pernah</option>
                      <option value="null">Belum Diketahui</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid" style={{ marginBottom: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                      Nama Sekolah Asal (TK/SD)
                    </label>
                    <input
                      type="text"
                      className="st-input"
                      value={previousSchoolName}
                      onChange={(e) => setPreviousSchoolName(e.target.value)}
                      placeholder="Contoh: TK IT Al-Ikhlas"
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                      NPSN Sekolah Asal
                    </label>
                    <input
                      type="text"
                      className="st-input"
                      value={previousSchoolNpsn}
                      onChange={(e) => setPreviousSchoolNpsn(e.target.value)}
                      placeholder="8 digit NPSN jika ada"
                    />
                  </div>
                </div>

                <div style={{ background: "#fef3c7", border: "1px solid #fde68a", padding: 12, borderRadius: 6, fontSize: 11, color: "#92400e" }}>
                  <strong>Proteksi Finansial:</strong> Perubahan kelas dan tanggal masuk pada siswa yang telah memiliki riwayat tagihan SPP dilindungi server demi integritas laporan keuangan.
                </div>
              </div>
            )}

            {/* SECTION 04: Data Ayah Kandung */}
            {activeSection === 4 && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 750, color: "#154d35" }}>
                    04. Data Ayah Kandung
                  </h3>
                  <button
                    type="button"
                    className="st-btn-secondary"
                    onClick={() => {
                      setShowSearchFamilyModal("father");
                      setFamilySearchResults([]);
                    }}
                    style={{ fontSize: 11, padding: "5px 10px" }}
                  >
                    <Search size={13} style={{ marginRight: 6 }} />
                    Pilih Data Ayah Existing
                  </button>
                </div>
                <p style={{ fontSize: 12, color: "#7a8c6d", marginBottom: 20 }}>
                  Data keluarga bersifat modular dan dapat dihubungkan ke beberapa siswa yang bersaudara.
                </p>

                <div className="form-grid" style={{ marginBottom: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                      Nama Lengkap Ayah
                    </label>
                    <input
                      type="text"
                      className="st-input"
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                      placeholder="Nama lengkap sesuai KTP"
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                      NIK Ayah (16 Digit)
                    </label>
                    <input
                      type="text"
                      className="st-input"
                      value={fatherNik}
                      maxLength={16}
                      onChange={(e) => setFatherNik(e.target.value.replace(/\D/g, ""))}
                      placeholder="16 digit angka"
                    />
                  </div>
                </div>

                <div className="form-grid" style={{ marginBottom: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                      Status Hidup
                    </label>
                    <select
                      className="st-input"
                      value={fatherLifeStatus}
                      onChange={(e) => setFatherLifeStatus(e.target.value)}
                    >
                      <option value="ALIVE">Masih Hidup</option>
                      <option value="DECEASED">Meninggal Dunia</option>
                      <option value="UNKNOWN">Tidak Diketahui</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                      Pendidikan Terakhir
                    </label>
                    <select
                      className="st-input"
                      value={fatherEducation}
                      onChange={(e) => setFatherEducation(e.target.value)}
                    >
                      <option value="SD">SD / Sederajat</option>
                      <option value="SMP">SMP / Sederajat</option>
                      <option value="SMA">SMA / SMK / Sederajat</option>
                      <option value="D3">Diploma (D1-D3)</option>
                      <option value="S1">Sarjana (S1/D4)</option>
                      <option value="S2">Magister (S2)</option>
                      <option value="S3">Doktor (S3)</option>
                      <option value="LAINNYA">Lainnya / Tidak Sekolah</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid" style={{ marginBottom: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                      Pekerjaan Utama
                    </label>
                    <select
                      className="st-input"
                      value={fatherOccupation}
                      onChange={(e) => setFatherOccupation(e.target.value)}
                    >
                      <option value="PNS">ASN / PNS</option>
                      <option value="TNI_POLRI">TNI / Polri</option>
                      <option value="KARYAWAN_SWASTA">Karyawan Swasta</option>
                      <option value="WIRASWASTA">Wiraswasta / Pengusaha</option>
                      <option value="PEDAGANG">Pedagang</option>
                      <option value="GURU_DOSEN">Guru / Dosen</option>
                      <option value="BURUH">Buruh / Karyawan Harian</option>
                      <option value="TIDAK_BEKERJA">Tidak Bekerja</option>
                      <option value="LAINNYA">Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                      Penghasilan Bulanan
                    </label>
                    <select
                      className="st-input"
                      value={fatherIncome}
                      onChange={(e) => setFatherIncome(e.target.value)}
                    >
                      <option value="TIDAK_BERPENGHASILAN">Tidak Berpenghasilan</option>
                      <option value="KURANG_DARI_500RB">&lt; Rp500.000</option>
                      <option value="RP_500RB_SD_1_JT">Rp500.000 - Rp1.000.000</option>
                      <option value="RP_1_JT_SD_2_JT">Rp1.000.000 - Rp2.000.000</option>
                      <option value="RP_2_JT_SD_5_JT">Rp2.000.000 - Rp5.000.000</option>
                      <option value="RP_5_JT_SD_20_JT">Rp5.000.000 - Rp20.000.000</option>
                      <option value="LEBIH_DARI_20_JT">&gt; Rp20.000.000</option>
                      <option value="TIDAK_DIKETAHUI">Tidak Diketahui</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid">
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                      Nomor HP / WhatsApp Ayah
                    </label>
                    <input
                      type="text"
                      className="st-input"
                      value={fatherPhone}
                      onChange={(e) => setFatherPhone(e.target.value)}
                      placeholder="0812xxxxxxxx"
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                      Email Ayah
                    </label>
                    <input
                      type="email"
                      className="st-input"
                      value={fatherEmail}
                      onChange={(e) => setFatherEmail(e.target.value)}
                      placeholder="ayah@contoh.com"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 05: Data Ibu Kandung */}
            {activeSection === 5 && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 750, color: "#154d35" }}>
                    05. Data Ibu Kandung
                  </h3>
                  <button
                    type="button"
                    className="st-btn-secondary"
                    onClick={() => {
                      setShowSearchFamilyModal("mother");
                      setFamilySearchResults([]);
                    }}
                    style={{ fontSize: 11, padding: "5px 10px" }}
                  >
                    <Search size={13} style={{ marginRight: 6 }} />
                    Pilih Data Ibu Existing
                  </button>
                </div>
                <p style={{ fontSize: 12, color: "#7a8c6d", marginBottom: 20 }}>
                  Kelola biodata ibu kandung siswa sesuai dokumen kependudukan.
                </p>

                <div className="form-grid" style={{ marginBottom: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                      Nama Lengkap Ibu
                    </label>
                    <input
                      type="text"
                      className="st-input"
                      value={motherName}
                      onChange={(e) => setMotherName(e.target.value)}
                      placeholder="Nama lengkap sesuai KTP"
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                      NIK Ibu (16 Digit)
                    </label>
                    <input
                      type="text"
                      className="st-input"
                      value={motherNik}
                      maxLength={16}
                      onChange={(e) => setMotherNik(e.target.value.replace(/\D/g, ""))}
                      placeholder="16 digit angka"
                    />
                  </div>
                </div>

                <div className="form-grid" style={{ marginBottom: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                      Status Hidup
                    </label>
                    <select
                      className="st-input"
                      value={motherLifeStatus}
                      onChange={(e) => setMotherLifeStatus(e.target.value)}
                    >
                      <option value="ALIVE">Masih Hidup</option>
                      <option value="DECEASED">Meninggal Dunia</option>
                      <option value="UNKNOWN">Tidak Diketahui</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                      Pendidikan Terakhir
                    </label>
                    <select
                      className="st-input"
                      value={motherEducation}
                      onChange={(e) => setMotherEducation(e.target.value)}
                    >
                      <option value="SD">SD / Sederajat</option>
                      <option value="SMP">SMP / Sederajat</option>
                      <option value="SMA">SMA / SMK / Sederajat</option>
                      <option value="D3">Diploma (D1-D3)</option>
                      <option value="S1">Sarjana (S1/D4)</option>
                      <option value="S2">Magister (S2)</option>
                      <option value="S3">Doktor (S3)</option>
                      <option value="LAINNYA">Lainnya / Tidak Sekolah</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid" style={{ marginBottom: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                      Pekerjaan Utama
                    </label>
                    <select
                      className="st-input"
                      value={motherOccupation}
                      onChange={(e) => setMotherOccupation(e.target.value)}
                    >
                      <option value="IBU_RUMAH_TANGGA">Ibu Rumah Tangga</option>
                      <option value="PNS">ASN / PNS</option>
                      <option value="KARYAWAN_SWASTA">Karyawan Swasta</option>
                      <option value="WIRASWASTA">Wiraswasta / Pedagang</option>
                      <option value="GURU_DOSEN">Guru / Dosen</option>
                      <option value="TIDAK_BEKERJA">Tidak Bekerja</option>
                      <option value="LAINNYA">Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                      Nomor HP / WhatsApp Ibu
                    </label>
                    <input
                      type="text"
                      className="st-input"
                      value={motherPhone}
                      onChange={(e) => setMotherPhone(e.target.value)}
                      placeholder="0812xxxxxxxx"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 06: Wali & Kontak Darurat */}
            {activeSection === 6 && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 750, color: "#154d35", marginBottom: 4 }}>
                  06. Wali & Kontak Darurat
                </h3>
                <p style={{ fontSize: 12, color: "#7a8c6d", marginBottom: 20 }}>
                  Tentukan penanggung jawab administratif, penanggung jawab SPP, dan nomor kontak darurat sekolah.
                </p>

                <div style={{ background: "#f9faf9", border: "1px solid #e9eeea", padding: 16, borderRadius: 8, marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 750, color: "#154d35", marginBottom: 10 }}>
                    PENANGGUNG JAWAB & KONTAK UTAMA SEKOLAH
                  </div>
                  <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12 }}>
                      <input
                        type="radio"
                        name="primaryContact"
                        checked={primaryContact === "FATHER"}
                        onChange={() => setPrimaryContact("FATHER")}
                      />
                      Ayah Kandung
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12 }}>
                      <input
                        type="radio"
                        name="primaryContact"
                        checked={primaryContact === "MOTHER"}
                        onChange={() => setPrimaryContact("MOTHER")}
                      />
                      Ibu Kandung
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12 }}>
                      <input
                        type="radio"
                        name="primaryContact"
                        checked={primaryContact === "GUARDIAN"}
                        onChange={() => setPrimaryContact("GUARDIAN")}
                      />
                      Wali Lainnya
                    </label>
                  </div>

                  <div style={{ fontSize: 13, fontWeight: 750, color: "#154d35", marginBottom: 10 }}>
                    PENANGGUNG JAWAB SPP / PEMBAYARAN
                  </div>
                  <div style={{ display: "flex", gap: 16 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12 }}>
                      <input
                        type="radio"
                        name="paymentResponsible"
                        checked={paymentResponsible === "FATHER"}
                        onChange={() => setPaymentResponsible("FATHER")}
                      />
                      Ayah Kandung
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12 }}>
                      <input
                        type="radio"
                        name="paymentResponsible"
                        checked={paymentResponsible === "MOTHER"}
                        onChange={() => setPaymentResponsible("MOTHER")}
                      />
                      Ibu Kandung
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12 }}>
                      <input
                        type="radio"
                        name="paymentResponsible"
                        checked={paymentResponsible === "GUARDIAN"}
                        onChange={() => setPaymentResponsible("GUARDIAN")}
                      />
                      Wali Lainnya
                    </label>
                  </div>
                </div>

                <div style={{ background: "#f7f9f7", border: "1px solid #e7ece8", padding: 16, borderRadius: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 750, color: "#154d35", marginBottom: 12 }}>
                    KONTAK DARURAT (EMERGENCY CONTACT)
                  </div>
                  <div className="form-grid" style={{ marginBottom: 12 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                        Nama Kontak Darurat *
                      </label>
                      <input
                        type="text"
                        className="st-input"
                        value={emergencyName}
                        onChange={(e) => setEmergencyName(e.target.value)}
                        placeholder="Nama orang yang dapat dihubungi segera"
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                        Hubungan dengan Siswa
                      </label>
                      <input
                        type="text"
                        className="st-input"
                        value={emergencyRelationship}
                        onChange={(e) => setEmergencyRelationship(e.target.value)}
                        placeholder="Contoh: Ayah Kandung / Paman"
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                      Nomor Telepon / WhatsApp Darurat *
                    </label>
                    <input
                      type="text"
                      className="st-input"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      placeholder="0812xxxxxxxx"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 07: Kesehatan & Kebutuhan Khusus */}
            {activeSection === 7 && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 750, color: "#154d35", marginBottom: 4 }}>
                  07. Kesehatan & Kebutuhan Khusus
                </h3>
                <p style={{ fontSize: 12, color: "#7a8c6d", marginBottom: 20 }}>
                  Catatan medis bersifat rahasia dan hanya digunakan untuk keselamatan serta pendampingan belajar anak.
                </p>

                <div className="form-grid" style={{ marginBottom: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                      Golongan Darah
                    </label>
                    <select
                      className="st-input"
                      value={bloodType}
                      onChange={(e) => setBloodType(e.target.value)}
                    >
                      <option value="UNKNOWN">Belum Diketahui</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="AB">AB</option>
                      <option value="O">O</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                      Memiliki Kebutuhan Khusus?
                    </label>
                    <select
                      className="st-input"
                      value={hasSpecialNeeds ? "true" : "false"}
                      onChange={(e) => setHasSpecialNeeds(e.target.value === "true")}
                    >
                      <option value="false">Tidak Ada</option>
                      <option value="true">Ada Kebutuhan Khusus</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid" style={{ marginBottom: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                      Alergi Makanan
                    </label>
                    <input
                      type="text"
                      className="st-input"
                      value={foodAllergies}
                      onChange={(e) => setFoodAllergies(e.target.value)}
                      placeholder="Contoh: Udang, kacang tanah"
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                      Alergi Obat
                    </label>
                    <input
                      type="text"
                      className="st-input"
                      value={drugAllergies}
                      onChange={(e) => setDrugAllergies(e.target.value)}
                      placeholder="Contoh: Penisilin, amoksisilin"
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                    Riwayat Penyakit yang Pernah Diderita
                  </label>
                  <textarea
                    rows={2}
                    className="st-input"
                    value={medicalHistory}
                    onChange={(e) => setMedicalHistory(e.target.value)}
                    placeholder="Contoh: Asma, kejang demam (step)"
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                    Catatan Penanganan Darurat / Pengobatan Rutin
                  </label>
                  <textarea
                    rows={2}
                    className="st-input"
                    value={emergencyHandlingNotes}
                    onChange={(e) => setEmergencyHandlingNotes(e.target.value)}
                    placeholder="Tindakan yang harus diambil jika alergi kambuh"
                  />
                </div>

                {/* Tabel Pengukuran Fisik */}
                <div style={{ background: "#f9faf9", border: "1px solid #e9eeea", padding: 16, borderRadius: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 750, color: "#154d35" }}>
                      PENGUKURAN FISIK BERKALA (TINGGI & BERAT BADAN)
                    </div>
                    <button
                      type="button"
                      className="st-btn-secondary"
                      onClick={() => setShowMeasurementModal(true)}
                      style={{ fontSize: 11, padding: "5px 10px" }}
                    >
                      <Plus size={13} style={{ marginRight: 6 }} />
                      Tambah Pengukuran
                    </button>
                  </div>

                  {measurements.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "16px 0", color: "#87918c", fontSize: 12 }}>
                      Belum ada catatan pengukuran fisik berkala.
                    </div>
                  ) : (
                    <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #e1e7e3", textAlign: "left", color: "#6c7971" }}>
                          <th style={{ padding: "6px 8px" }}>Tanggal</th>
                          <th style={{ padding: "6px 8px" }}>Tinggi (cm)</th>
                          <th style={{ padding: "6px 8px" }}>Berat (kg)</th>
                          <th style={{ padding: "6px 8px" }}>Catatan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {measurements.map((m, i) => (
                          <tr key={i} style={{ borderBottom: "1px solid #f0f3f1" }}>
                            <td style={{ padding: "8px" }}>{m.measurementDate}</td>
                            <td style={{ padding: "8px", fontWeight: 700 }}>{m.heightCm} cm</td>
                            <td style={{ padding: "8px", fontWeight: 700 }}>{m.weightKg} kg</td>
                            <td style={{ padding: "8px", color: "#7a8c6d" }}>{m.notes || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* SECTION 08: Bantuan Pendidikan */}
            {activeSection === 8 && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 750, color: "#154d35" }}>
                    08. Bantuan Pendidikan
                  </h3>
                  <button
                    type="button"
                    className="st-btn-secondary"
                    onClick={() => setShowAidModal(true)}
                    style={{ fontSize: 11, padding: "5px 10px" }}
                  >
                    <Plus size={13} style={{ marginRight: 6 }} />
                    Tambah Bantuan
                  </button>
                </div>
                <p style={{ fontSize: 12, color: "#7a8c6d", marginBottom: 20 }}>
                  Pencatatan KIP, PIP, PKH, atau beasiswa merupakan data administrasi dan tidak mengubah tagihan SPP secara otomatis.
                </p>

                {aidRecords.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: 30,
                      background: "#f9faf9",
                      borderRadius: 8,
                      border: "1px dashed #d1dbd4",
                      color: "#6c7971",
                    }}
                  >
                    <Award size={32} style={{ margin: "0 auto 8px", color: "#87918c" }} />
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#34443c" }}>
                      Tidak Ada Bantuan Terdaftar
                    </div>
                    <p style={{ fontSize: 11, margin: "4px 0 0" }}>
                      Siswa saat ini tercatat tidak menerima program bantuan atau beasiswa.
                    </p>
                  </div>
                ) : (
                  <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #e1e7e3", textAlign: "left", color: "#6c7971" }}>
                        <th style={{ padding: "8px" }}>Program Bantuan</th>
                        <th style={{ padding: "8px" }}>Nomor Kartu / SK</th>
                        <th style={{ padding: "8px" }}>Sumber</th>
                        <th style={{ padding: "8px" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aidRecords.map((a, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid #f0f3f1" }}>
                          <td style={{ padding: "10px 8px", fontWeight: 700, color: "#154d35" }}>
                            {a.aidType}
                          </td>
                          <td style={{ padding: "10px 8px" }}>{a.aidNumber || "-"}</td>
                          <td style={{ padding: "10px 8px" }}>{a.aidSource || "-"}</td>
                          <td style={{ padding: "10px 8px" }}>
                            <Badge status={a.status || "ACTIVE"} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* SECTION 09: Karakteristik Anak */}
            {activeSection === 9 && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 750, color: "#154d35", marginBottom: 4 }}>
                  09. Karakteristik & Perkembangan Anak
                </h3>
                <p style={{ fontSize: 12, color: "#7a8c6d", marginBottom: 20 }}>
                  Terintegrasi dengan modul evaluasi karakteristik santri dan kebiasaan ibadah harian.
                </p>

                <div style={{ background: "#f7f9f7", border: "1px solid #e7ece8", padding: 18, borderRadius: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <BookOpen size={24} color="#16613e" />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 750, color: "#154d35" }}>
                        Formulir Karakteristik Siswa
                      </div>
                      <div style={{ fontSize: 11, color: "#6c7971" }}>
                        Pengisian kuesioner perkembangan anak dapat dilengkapi melalui portal wali murid.
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "#536448", lineHeight: 1.6 }}>
                    Mencakup: Minat, bakat, kebiasaan belajar, kemandirian anak, kemampuan membaca Al-Qur'an, metode pembelajaran sebelumnya, serta hafalan surat/doa harian.
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 10: Dokumen Persyaratan */}
            {activeSection === 10 && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 750, color: "#154d35" }}>
                    10. Dokumen Persyaratan
                  </h3>
                  <button
                    type="button"
                    className="st-btn-secondary"
                    onClick={() => setShowUploadDocModal(true)}
                    style={{ fontSize: 11, padding: "5px 10px" }}
                  >
                    <Upload size={13} style={{ marginRight: 6 }} />
                    Unggah Dokumen
                  </button>
                </div>
                <p style={{ fontSize: 12, color: "#7a8c6d", marginBottom: 20 }}>
                  Dokumen disimpan secara aman pada private storage Vercel Blob dan diverifikasi oleh staf Tata Usaha.
                </p>

                {documents.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: 30,
                      background: "#f9faf9",
                      borderRadius: 8,
                      border: "1px dashed #d1dbd4",
                      color: "#6c7971",
                    }}
                  >
                    <FolderOpen size={32} style={{ margin: "0 auto 8px", color: "#87918c" }} />
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#34443c" }}>
                      Belum Ada Berkas Diunggah
                    </div>
                    <p style={{ fontSize: 11, margin: "4px 0 0" }}>
                      Unggah berkas KK, Akta Kelahiran, KTP Orang Tua, atau Ijazah TK.
                    </p>
                  </div>
                ) : (
                  <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #e1e7e3", textAlign: "left", color: "#6c7971" }}>
                        <th style={{ padding: "8px" }}>Jenis Dokumen</th>
                        <th style={{ padding: "8px" }}>Nama Berkas</th>
                        <th style={{ padding: "8px" }}>Status Verifikasi</th>
                        <th style={{ padding: "8px", textAlign: "right" }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((doc, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid #f0f3f1" }}>
                          <td style={{ padding: "10px 8px", fontWeight: 700, color: "#154d35" }}>
                            {doc.documentType}
                          </td>
                          <td style={{ padding: "10px 8px" }}>{doc.documentName || doc.originalFilename}</td>
                          <td style={{ padding: "10px 8px" }}>
                            <Badge status={doc.verificationStatus} />
                          </td>
                          <td style={{ padding: "10px 8px", textAlign: "right" }}>
                            <button
                              type="button"
                              className="st-btn-secondary"
                              onClick={() => window.open(doc.storagePath, "_blank")}
                              style={{ fontSize: 10, padding: "3px 8px" }}
                            >
                              Lihat
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Bottom Form Actions Bar */}
            <div
              style={{
                marginTop: 24,
                paddingTop: 16,
                borderTop: "1px solid #edf0ed",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="st-btn-secondary"
                  onClick={onCancel}
                  disabled={busy}
                >
                  Batal
                </button>
                {mode === "tambah" && onSaveDraft && (
                  <button
                    type="button"
                    className="st-btn-secondary"
                    onClick={handleDraftSaveClick}
                    disabled={busy}
                    style={{ color: "#16613e" }}
                  >
                    <Save size={14} style={{ marginRight: 6 }} />
                    Simpan Draf
                  </button>
                )}
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                {activeSection > 1 && (
                  <button
                    type="button"
                    className="st-btn-secondary"
                    onClick={() => setActiveSection((s) => Math.max(1, s - 1))}
                    disabled={busy}
                  >
                    Kembali
                  </button>
                )}
                {activeSection < 10 ? (
                  <button
                    type="button"
                    className="st-btn-primary"
                    onClick={() => setActiveSection((s) => Math.min(10, s + 1))}
                    disabled={busy}
                  >
                    Selanjutnya
                    <ChevronRight size={14} style={{ marginLeft: 6 }} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="st-btn-primary"
                    disabled={busy}
                    style={{ padding: "8px 20px" }}
                  >
                    <Check size={16} style={{ marginRight: 6 }} />
                    {mode === "tambah" ? "Simpan Siswa Baru" : "Simpan Perubahan"}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Modal Search Family Existing */}
      {showSearchFamilyModal && (
        <Modal
          title={`Pilih Data ${showSearchFamilyModal === "father" ? "Ayah" : "Ibu"} Terdaftar`}
          close={() => setShowSearchFamilyModal(null)}
        >
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: "#6c7971", marginBottom: 12 }}>
              Cari data orang tua yang telah terdaftar pada database sekolah untuk menghubungkan siswa bersaudara.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                className="st-input"
                placeholder="Cari nama, NIK, atau nomor HP..."
                value={familySearchQuery}
                onChange={(e) => setFamilySearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchFamily()}
              />
              <button
                type="button"
                className="st-btn-primary"
                onClick={handleSearchFamily}
                disabled={searchingFamily}
              >
                {searchingFamily ? "Mencari..." : "Cari"}
              </button>
            </div>
          </div>

          <div style={{ maxHeight: 250, overflowY: "auto" }}>
            {familySearchResults.length === 0 ? (
              <div style={{ textAlign: "center", padding: 20, color: "#87918c", fontSize: 12 }}>
                {familySearchQuery ? "Tidak ditemukan anggota keluarga yang cocok" : "Ketik kata kunci pencarian"}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {familySearchResults.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: 10,
                      border: "1px solid #e1e7e3",
                      borderRadius: 6,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 12, color: "#154d35" }}>{m.fullName}</div>
                      <div style={{ fontSize: 11, color: "#6c7971" }}>
                        NIK: {m.maskedNik} • HP: {m.maskedPhone} • {m.occupation || "Pekerjaan -"}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="st-btn-primary"
                      style={{ fontSize: 11, padding: "4px 10px" }}
                      onClick={() => {
                        if (showSearchFamilyModal === "father") {
                          setFatherMode("existing");
                          setFatherId(m.id);
                          setFatherName(m.fullName);
                        } else {
                          setMotherMode("existing");
                          setMotherId(m.id);
                          setMotherName(m.fullName);
                        }
                        setShowSearchFamilyModal(null);
                      }}
                    >
                      Pilih
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Modal Tambah Pengukuran Fisik */}
      {showMeasurementModal && (
        <Modal
          title="Tambah Pengukuran Fisik Berkala"
          close={() => setShowMeasurementModal(false)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                Tanggal Pengukuran
              </label>
              <input
                type="date"
                className="st-input"
                value={newMeasureDate}
                onChange={(e) => setNewMeasureDate(e.target.value)}
                max={todayStr}
              />
            </div>
            <div className="form-grid">
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                  Tinggi Badan (cm) *
                </label>
                <input
                  type="number"
                  className="st-input"
                  min="30"
                  max="250"
                  value={newHeight}
                  onChange={(e) => setNewHeight(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Contoh: 125"
                  required
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                  Berat Badan (kg) *
                </label>
                <input
                  type="number"
                  className="st-input"
                  min="5"
                  max="200"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Contoh: 26.5"
                  required
                />
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                Catatan Petugas (Opsional)
              </label>
              <input
                type="text"
                className="st-input"
                value={newMeasureNotes}
                onChange={(e) => setNewMeasureNotes(e.target.value)}
                placeholder="Pemeriksaan berkala UKS semester 1"
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
              <button
                type="button"
                className="st-btn-secondary"
                onClick={() => setShowMeasurementModal(false)}
              >
                Batal
              </button>
              <button
                type="button"
                className="st-btn-primary"
                onClick={handleAddMeasurement}
                disabled={!newHeight || !newWeight}
              >
                Simpan Pengukuran
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Tambah Bantuan Pendidikan */}
      {showAidModal && (
        <Modal
          title="Tambah Catatan Bantuan Pendidikan"
          close={() => setShowAidModal(false)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                Jenis Program Bantuan *
              </label>
              <select
                className="st-input"
                value={newAidType}
                onChange={(e) => setNewAidType(e.target.value)}
              >
                <option value="KIP">KIP (Kartu Indonesia Pintar)</option>
                <option value="PIP">PIP (Program Indonesia Pintar)</option>
                <option value="PKH">PKH (Program Keluarga Harapan)</option>
                <option value="KKS">KKS (Kartu Keluarga Sejahtera)</option>
                <option value="BEASISWA_INTERNAL">Beasiswa Internal Yayasan</option>
                <option value="BEASISWA_EKSTERNAL">Beasiswa Eksternal</option>
                <option value="OTHER">Lainnya</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                Nomor Kartu / Nomor KIP / Nomor SK
              </label>
              <input
                type="text"
                className="st-input"
                value={newAidNumber}
                onChange={(e) => setNewAidNumber(e.target.value)}
                placeholder="Nomor kartu bantuan"
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                Instansi / Sumber Pemberi
              </label>
              <input
                type="text"
                className="st-input"
                value={newAidSource}
                onChange={(e) => setNewAidSource(e.target.value)}
                placeholder="Kementerian Pendidikan / Yayasan"
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                Catatan Keterangan
              </label>
              <textarea
                rows={2}
                className="st-input"
                value={newAidNotes}
                onChange={(e) => setNewAidNotes(e.target.value)}
                placeholder="Keterangan alokasi bantuan"
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
              <button
                type="button"
                className="st-btn-secondary"
                onClick={() => setShowAidModal(false)}
              >
                Batal
              </button>
              <button
                type="button"
                className="st-btn-primary"
                onClick={handleAddAid}
              >
                Tambahkan Bantuan
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Upload Dokumen */}
      {showUploadDocModal && (
        <Modal
          title="Unggah Dokumen Persyaratan"
          close={() => setShowUploadDocModal(false)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                Jenis Dokumen *
              </label>
              <select
                className="st-input"
                value={uploadDocType}
                onChange={(e) => {
                  setUploadDocType(e.target.value);
                  const names: Record<string, string> = {
                    KK: "Kartu Keluarga",
                    AKTA_KELAHIRAN: "Akta Kelahiran",
                    KTP_AYAH: "KTP Ayah Kandung",
                    KTP_IBU: "KTP Ibu Kandung",
                    KTP_WALI: "KTP Wali",
                    PAS_FOTO: "Pas Foto 3x4",
                    IJAZAH_TK: "Ijazah / Sertifikat TK",
                    BUKTI_NISN: "Bukti NISN Resmi",
                    SURAT_PINDAH: "Surat Pindah Sekolah",
                    RAPOR_ASAL: "Buku Rapor Asal",
                    BUKTI_BANTUAN: "Kartu / Bukti Bantuan KIP",
                    LAINNYA: "Dokumen Persyaratan Lainnya",
                  };
                  setUploadDocName(names[e.target.value] || e.target.value);
                }}
              >
                <option value="KK">Kartu Keluarga (KK)</option>
                <option value="AKTA_KELAHIRAN">Akta Kelahiran</option>
                <option value="KTP_AYAH">KTP Ayah</option>
                <option value="KTP_IBU">KTP Ibu</option>
                <option value="PAS_FOTO">Pas Foto 3x4</option>
                <option value="IJAZAH_TK">Ijazah / Sertifikat TK</option>
                <option value="BUKTI_NISN">Bukti NISN</option>
                <option value="SURAT_PINDAH">Surat Pindah</option>
                <option value="BUKTI_BANTUAN">Bukti KIP / PKH</option>
                <option value="LAINNYA">Lainnya</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                Nama Dokumen / Keterangan
              </label>
              <input
                type="text"
                className="st-input"
                value={uploadDocName}
                onChange={(e) => setUploadDocName(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#34443c", marginBottom: 6 }}>
                Pilih Berkas (PDF, JPG, PNG maks 5 MB) *
              </label>
              <input
                type="file"
                className="st-input"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setUploadDocFile(f);
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
              <button
                type="button"
                className="st-btn-secondary"
                onClick={() => setShowUploadDocModal(false)}
              >
                Batal
              </button>
              <button
                type="button"
                className="st-btn-primary"
                disabled={!uploadDocFile}
                onClick={() => {
                  if (uploadDocFile) {
                    const newDoc = {
                      id: "temp-" + Date.now(),
                      documentType: uploadDocType,
                      documentName: uploadDocName,
                      originalFilename: uploadDocFile.name,
                      mimeType: uploadDocFile.type,
                      fileSize: uploadDocFile.size,
                      verificationStatus: "PENDING",
                      storagePath: URL.createObjectURL(uploadDocFile),
                    };
                    setDocuments((prev) => [...prev, newDoc]);
                    setShowUploadDocModal(false);
                    setUploadDocFile(null);
                  }
                }}
              >
                Simpan Dokumen
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
