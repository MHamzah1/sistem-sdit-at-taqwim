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
  ChevronLeft,
  Plus,
  HelpCircle,
  Sparkles,
  Info,
} from "lucide-react";
import type { AppState } from "@/server/state";
import { calculateAge, money } from "@/src/lib/formatters";
import { Badge } from "@/src/components/Badge";
import { Modal } from "@/src/components/Modal";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Select } from "@/src/components/ui/select";
import { Textarea } from "@/src/components/ui/textarea";
import { Badge as UiBadge } from "@/src/components/ui/badge";
import { cn } from "@/src/lib/utils";
import { upload } from "@vercel/blob/client";
import { useApp } from "@/src/lib/context/AppContext";
import { api, uploadStudentDocument, downloadStudentDocumentContent } from "@/src/lib/api";
import { calculateStudentCompleteness } from "@/src/lib/completeness";

interface FormFieldProps {
  label: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

function FormField({ label, required, helperText, error, children, className }: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5 text-left", className)}>
      <label className="block text-xs font-semibold text-foreground">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      {children}
      {helperText && !error && (
        <p className="text-[11px] text-muted-foreground leading-normal">{helperText}</p>
      )}
      {error && (
        <p className="text-[11px] text-destructive font-medium leading-normal">{error}</p>
      )}
    </div>
  );
}

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
  const { state } = useApp();
  const currentUserId = state?.actor?.id;

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
  const initialPhotoRaw =
    student?.photoUrl || initialFullProfile?.student?.photoUrl || "";
  const [photoUrl, setPhotoUrl] = useState(initialPhotoRaw);
  const [photoStoragePath, setPhotoStoragePath] = useState(
    initialPhotoRaw.startsWith("data:") || initialPhotoRaw.startsWith("http")
      ? ""
      : initialPhotoRaw,
  );
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string>(() => {
    if (!initialPhotoRaw) return "";
    if (
      initialPhotoRaw.startsWith("data:") ||
      initialPhotoRaw.startsWith("blob:") ||
      initialPhotoRaw.startsWith("http")
    ) {
      return initialPhotoRaw;
    }
    const sId = student?.id || initialFullProfile?.student?.id;
    return sId ? `/api/students/${sId}/photo` : "";
  });
  const localPreviewRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (localPreviewRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(localPreviewRef.current);
      }
    };
  }, []);
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
  const addressList: any[] = Array.isArray(initialFullProfile?.addresses)
    ? initialFullProfile.addresses
    : initialFullProfile?.addresses
      ? [
          ...(initialFullProfile.addresses.identity
            ? [{ addressType: "IDENTITY", ...initialFullProfile.addresses.identity }]
            : []),
          ...(initialFullProfile.addresses.domicile
            ? [{ addressType: "DOMICILE", ...initialFullProfile.addresses.domicile }]
            : []),
        ]
      : [];
  const idAddr = addressList.find((a: any) => a.addressType === "IDENTITY");
  const domAddr = addressList.find((a: any) => a.addressType === "DOMICILE");

  const [idAddress, setIdAddress] = useState(idAddr?.address || "");
  const [idRt, setIdRt] = useState(idAddr?.rt || "");
  const [idRw, setIdRw] = useState(idAddr?.rw || "");
  const [idHamlet, setIdHamlet] = useState(idAddr?.hamlet || "");
  const [idVillage, setIdVillage] = useState(idAddr?.village || "");
  const [idDistrict, setIdDistrict] = useState(idAddr?.district || "");
  const [idRegency, setIdRegency] = useState(idAddr?.regency || "Kab. Bogor");
  const [idProvince, setIdProvince] = useState(idAddr?.province || "Jawa Barat");
  const [idPostalCode, setIdPostalCode] = useState(idAddr?.postalCode || "");
  const [sameAsIdentity, setSameAsIdentity] = useState(
    domAddr
      ? domAddr.address === idAddr?.address &&
        domAddr.village === idAddr?.village &&
        domAddr.district === idAddr?.district
      : true,
  );

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
  const initialReg = initialFullProfile?.registration || initialEnrollment;
  const [registrationNumber, setRegistrationNumber] = useState(
    initialReg?.registrationNumber || "",
  );
  const [registrationType, setRegistrationType] = useState<"NEW_STUDENT" | "TRANSFER_STUDENT">(
    initialReg?.registrationType || "NEW_STUDENT",
  );
  const [registrationDate, setRegistrationDate] = useState(
    initialReg?.registrationDate?.slice(0, 10) || todayStr,
  );
  const [acceptedDate, setAcceptedDate] = useState(
    initialReg?.acceptedDate?.slice(0, 10) || todayStr,
  );
  const [enrolledOn, setEnrolledOn] = useState(
    student?.enrolledOn?.slice(0, 10) ||
      initialFullProfile?.student?.enrolledOn?.slice(0, 10) ||
      todayStr,
  );
  const [entryGrade, setEntryGrade] = useState<number>(initialReg?.entryGrade || 1);
  const [classId, setClassId] = useState(
    student?.classId ||
      initialFullProfile?.student?.classId ||
      classes[0]?.id ||
      "",
  );
  const [academicYearId, setAcademicYearId] = useState(
    academicYears.find((y) => y.active)?.id || academicYears[0]?.id || "",
  );
  const [attendedPaud, setAttendedPaud] = useState<boolean | null>(
    initialReg?.attendedPaud ?? true,
  );
  const [attendedKindergarten, setAttendedKindergarten] = useState<boolean | null>(
    initialReg?.attendedKindergarten ?? true,
  );
  const [previousSchoolName, setPreviousSchoolName] = useState(
    initialReg?.previousSchoolName || "",
  );
  const [previousSchoolNpsn, setPreviousSchoolNpsn] = useState(
    initialReg?.previousSchoolNpsn || "",
  );
  const [studentStatus, setStudentStatus] = useState<string>(
    student?.studentStatus || initialFullProfile?.student?.studentStatus || "ACTIVE",
  );
  const [academicNotes, setAcademicNotes] = useState(
    initialReg?.notes || initialEnrollment?.notes || "",
  );

  // --- Section 04 & 05: Data Ayah & Ibu ---
  const familyList: any[] = Array.isArray(initialFullProfile?.family)
    ? initialFullProfile.family
    : [];
  const fatherRel = familyList.find(
    (f: any) => f.relationshipType === "FATHER",
  );
  const motherRel = familyList.find(
    (f: any) => f.relationshipType === "MOTHER",
  );
  const guardianRel = familyList.find(
    (f: any) =>
      f.relationshipType !== "FATHER" && f.relationshipType !== "MOTHER" && !f.isEmergencyContact,
  );
  const emergencyRel = familyList.find(
    (f: any) => f.isEmergencyContact,
  );

  const fatherData = fatherRel?.member;
  const motherData = motherRel?.member;

  // Ayah state
  const [fatherMode, setFatherMode] = useState<"new" | "existing">(
    fatherData?.id ? "existing" : "new",
  );
  const [fatherId, setFatherId] = useState<string | null>(
    fatherData?.id || null,
  );
  const [fatherName, setFatherName] = useState(fatherData?.fullName || "");
  const [fatherNik, setFatherNik] = useState(fatherData?.nik || "");
  const [fatherLifeStatus, setFatherLifeStatus] = useState(
    fatherData?.lifeStatus || "ALIVE",
  );
  const [fatherEducation, setFatherEducation] = useState(
    fatherData?.education || "S1",
  );
  const [fatherOccupation, setFatherOccupation] = useState(
    fatherData?.occupation || "KARYAWAN_SWASTA",
  );
  const [fatherInstitution, setFatherInstitution] = useState(
    fatherData?.institutionName || "",
  );
  const [fatherIncome, setFatherIncome] = useState(
    fatherData?.monthlyIncomeRange || "RP_2_JT_SD_5_JT",
  );
  const [fatherPhone, setFatherPhone] = useState(fatherData?.phone || "");
  const [fatherEmail, setFatherEmail] = useState(fatherData?.email || "");

  // Ibu state
  const [motherMode, setMotherMode] = useState<"new" | "existing">(
    motherData?.id ? "existing" : "new",
  );
  const [motherId, setMotherId] = useState<string | null>(
    motherData?.id || null,
  );
  const [motherName, setMotherName] = useState(motherData?.fullName || "");
  const [motherNik, setMotherNik] = useState(motherData?.nik || "");
  const [motherLifeStatus, setMotherLifeStatus] = useState(
    motherData?.lifeStatus || "ALIVE",
  );
  const [motherEducation, setMotherEducation] = useState(
    motherData?.education || "D3",
  );
  const [motherOccupation, setMotherOccupation] = useState(
    motherData?.occupation || "IBU_RUMAH_TANGGA",
  );
  const [motherInstitution, setMotherInstitution] = useState(
    motherData?.institutionName || "",
  );
  const [motherIncome, setMotherIncome] = useState(
    motherData?.monthlyIncomeRange || "TIDAK_BERPENGHASILAN",
  );
  const [motherPhone, setMotherPhone] = useState(motherData?.phone || "");
  const [motherEmail, setMotherEmail] = useState(motherData?.email || "");

  // --- Section 06: Wali & Kontak Darurat ---
  const initialPrimary = fatherRel?.isPrimaryContact
    ? "FATHER"
    : motherRel?.isPrimaryContact
      ? "MOTHER"
      : guardianRel?.isPrimaryContact
        ? "GUARDIAN"
        : "FATHER";
  const initialPayment = fatherRel?.isPaymentResponsible
    ? "FATHER"
    : motherRel?.isPaymentResponsible
      ? "MOTHER"
      : guardianRel?.isPaymentResponsible
        ? "GUARDIAN"
        : "FATHER";

  const [primaryContact, setPrimaryContact] = useState<
    "FATHER" | "MOTHER" | "GUARDIAN"
  >(initialPrimary);
  const [paymentResponsible, setPaymentResponsible] = useState<
    "FATHER" | "MOTHER" | "GUARDIAN"
  >(initialPayment);
  const [emergencyName, setEmergencyName] = useState(
    emergencyRel?.member?.fullName || "",
  );
  const [emergencyRelationship, setEmergencyRelationship] = useState(
    emergencyRel?.relationshipType === "FATHER"
      ? "AYAH_KANDUNG"
      : emergencyRel?.relationshipType === "MOTHER"
        ? "IBU_KANDUNG"
        : emergencyRel?.relationshipType || "AYAH_KANDUNG",
  );
  const [emergencyPhone, setEmergencyPhone] = useState(
    emergencyRel?.member?.phone || "",
  );

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

  // Sync Emergency Contact when Primary Changes only if emergency contact has not been set
  const hasInitializedEmergency = useRef(Boolean(emergencyRel?.member?.fullName));
  useEffect(() => {
    if (hasInitializedEmergency.current) return;
    if (primaryContact === "FATHER" && fatherName && !emergencyName) {
      setEmergencyName(fatherName);
      setEmergencyRelationship("AYAH_KANDUNG");
      setEmergencyPhone(fatherPhone);
    } else if (primaryContact === "MOTHER" && motherName && !emergencyName) {
      setEmergencyName(motherName);
      setEmergencyRelationship("IBU_KANDUNG");
      setEmergencyPhone(motherPhone);
    }
  }, [primaryContact, fatherName, fatherPhone, motherName, motherPhone, emergencyName]);

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
          canvas.toBlob(
            async (blob) => {
              if (!blob) {
                setPhotoError("Gagal memproses gambar");
                setIsProcessingPhoto(false);
                return;
              }
              // Responsive preview via local Object URL
              const localUrl = URL.createObjectURL(blob);
              if (localPreviewRef.current?.startsWith("blob:")) {
                URL.revokeObjectURL(localPreviewRef.current);
              }
              localPreviewRef.current = localUrl;
              setPhotoPreviewUrl(localUrl);

              try {
                if (!currentUserId) {
                  throw new Error("Sesi pengguna tidak valid. Silakan muat ulang halaman.");
                }
                const ext = "jpg";
                const photoFile = new File(
                  [blob],
                  `pas-foto-${Date.now()}.${ext}`,
                  { type: "image/jpeg" },
                );
                const uploaded = await upload(
                  `student-documents/${currentUserId}/${crypto.randomUUID()}.${ext}`,
                  photoFile,
                  {
                    access: "private",
                    handleUploadUrl: "/api/files/upload",
                    contentType: "image/jpeg",
                  },
                );
                setPhotoStoragePath(uploaded.pathname);
                setPhotoUrl(uploaded.pathname);
              } catch {
                // Fallback to data URL so cropped photo is preserved if upload service is offline/dev
                const compressed = canvas.toDataURL("image/jpeg", 0.85);
                setPhotoUrl(compressed);
                setPhotoStoragePath("");
              } finally {
                setIsProcessingPhoto(false);
              }
            },
            "image/jpeg",
            0.85,
          );
        } else {
          setIsProcessingPhoto(false);
        }
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
      clientKey: "m-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      id: undefined,
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
      clientKey: "a-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      id: undefined,
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

  // Calculate Completeness Score via unified engine
  const completeness = useMemo(() => {
    return calculateStudentCompleteness({
      student: {
        name,
        nis,
        nik,
        gender,
        birthDate,
        birthPlace,
        nisn,
        familyCardNumber,
      },
      address: {
        address: idAddress,
        regency: idRegency,
        transportationType,
      },
      registration: {
        classId,
        enrolledOn,
      },
      father: {
        fullName: fatherName,
        lifeStatus: fatherLifeStatus,
      },
      mother: {
        fullName: motherName,
        lifeStatus: motherLifeStatus,
      },
      emergencyContact: {
        name: emergencyName,
        phone: emergencyPhone,
      },
      health: {
        bloodType,
      },
      characteristic:
        initialFullProfile?.characteristic ||
        (characteristicTemplateId ? { status: "FILLED" } : { status: "EMPTY" }),
      documents,
    });
  }, [
    name,
    nis,
    nik,
    gender,
    birthDate,
    birthPlace,
    nisn,
    familyCardNumber,
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
    characteristicTemplateId,
    initialFullProfile,
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
        photoUrl: photoStoragePath || photoUrl || null,
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
        id: a.id && !a.id.startsWith("temp-") ? a.id : undefined,
        aidType: a.aidType,
        aidNumber: a.aidNumber || null,
        aidSource: a.aidSource || null,
        startDate: a.startDate || null,
        endDate: a.endDate || null,
        amount: a.amount ? Number(a.amount) : null,
        status: a.status || "ACTIVE",
        notes: a.notes || null,
      })),
      measurements: measurements.map((m) => ({
        id: m.id && !m.id.startsWith("temp-") ? m.id : undefined,
        academicYearId: m.academicYearId || undefined,
        semester: Number(m.semester) || 1,
        measurementDate: m.measurementDate,
        heightCm: Number(m.heightCm),
        weightKg: Number(m.weightKg),
        headCircumferenceCm: m.headCircumferenceCm
          ? Number(m.headCircumferenceCm)
          : null,
        notes: m.notes || null,
      })),
      documents: documents.map((d) => ({
        documentType: d.documentType,
        documentName: d.documentName || d.originalFilename,
        originalFilename: d.originalFilename || d.documentName,
        storagePath: d.storagePath,
        mimeType: d.mimeType || "application/pdf",
        fileSize: d.fileSize || 1024,
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
    {
      id: 1,
      title: "01. Identitas Siswa",
      icon: Users,
      complete: completeness.sections.identitas?.status === "COMPLETE",
    },
    {
      id: 2,
      title: "02. Alamat & Domisili",
      icon: MapPin,
      complete: completeness.sections.alamat?.status === "COMPLETE",
    },
    {
      id: 3,
      title: "03. Registrasi & Akademik",
      icon: School,
      complete: completeness.sections.registrasi?.status === "COMPLETE",
    },
    {
      id: 4,
      title: "04. Data Ayah Kandung",
      icon: Users,
      complete: completeness.sections.ayah?.status === "COMPLETE",
    },
    {
      id: 5,
      title: "05. Data Ibu Kandung",
      icon: Users,
      complete: completeness.sections.ibu?.status === "COMPLETE",
    },
    {
      id: 6,
      title: "06. Wali & Kontak Darurat",
      icon: Shield,
      complete: completeness.sections.wali_darurat?.status === "COMPLETE",
    },
    {
      id: 7,
      title: "07. Kesehatan & Kebutuhan Khusus",
      icon: HeartPulse,
      complete: completeness.sections.kesehatan?.status === "COMPLETE",
    },
    {
      id: 8,
      title: "08. Bantuan Pendidikan",
      icon: Award,
      complete: completeness.sections.bantuan?.status === "COMPLETE",
    },
    {
      id: 9,
      title: "09. Karakteristik & Perkembangan",
      icon: BookOpen,
      complete: completeness.sections.karakteristik?.status === "COMPLETE",
    },
    {
      id: 10,
      title: "10. Dokumen Persyaratan",
      icon: FolderOpen,
      complete: completeness.sections.dokumen?.status === "COMPLETE",
    },
  ];

  return (
    <div className="st-page-shell">
      {/* Header Card */}
      <Card className="border border-border/80 shadow-xs mb-6 overflow-hidden">
        <div className="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 bg-card">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-2xs">
              <Users className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5 font-medium">
                <span>Master Data</span>
                <span>/</span>
                <span>Siswa</span>
                <span>/</span>
                <span className="text-foreground font-semibold">
                  {mode === "tambah" ? "Tambah Siswa Baru" : "Ubah Data Siswa"}
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold font-heading text-foreground tracking-tight">
                {mode === "tambah" ? "Pendaftaran & Biodata Siswa Baru" : `Ubah Biodata: ${name || student?.name}`}
              </h1>
              <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                Lengkapi 10 bagian informasi administrasi dan data induk siswa SDIT AT-TAQWIM.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end justify-between md:justify-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-border/60 min-w-[220px]">
            <div className="w-full space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-semibold text-foreground">Kelengkapan Biodata</span>
                <UiBadge
                  variant={completeness.pct >= 80 ? "success" : "warning"}
                  className="font-bold text-[11px] px-2 py-0.5"
                >
                  {completeness.pct}%
                </UiBadge>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-300 rounded-full",
                    completeness.pct >= 80 ? "bg-emerald-600" : "bg-amber-500"
                  )}
                  style={{ width: `${completeness.pct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                <span className="inline-flex items-center gap-1">
                  <FileText className="size-3 text-primary" />
                  Dokumen: {documents.filter((d) => d.verificationStatus === "VERIFIED").length}/{documents.length || 3} Terverifikasi
                </span>
                <span>{completeness.pct >= 100 ? "Lengkap" : "Perlu Dilengkapi"}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Form 2-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-6 items-start">
        {/* Left Sidebar Nav */}
        <Card className="p-3 border border-border/80 shadow-xs lg:sticky lg:top-20 space-y-3">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/60">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
              Bagian Formulir
            </span>
            <span className="text-[11px] font-semibold text-muted-foreground">
              {activeSection}/10
            </span>
          </div>

          <div className="space-y-1">
            {sectionsList.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveSection(sec.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left group",
                    isActive
                      ? "bg-primary/10 text-primary font-bold shadow-2xs border border-primary/20"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  <span className="flex-1 truncate">
                    {sec.title}
                  </span>
                  {sec.complete ? (
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0 ml-1" />
                  ) : isActive ? (
                    <span className="size-2 rounded-full bg-primary shrink-0 ml-1 animate-pulse" />
                  ) : (
                    <span className="size-1.5 rounded-full bg-amber-500/80 shrink-0 ml-1" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Draft Note */}
          <div className="p-3 rounded-lg border border-border/60 bg-muted/40 text-left space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <HelpCircle className="size-3.5 text-primary" />
              <span>Simpan Sementara</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Draf tidak menghasilkan tagihan SPP atau kartu ujian sebelum difinalisasi.
            </p>
          </div>
        </Card>

        {/* Right Active Section Content */}
        <Card className="border border-border/80 shadow-xs overflow-hidden">
          <div className="p-6 md:p-8">
            <form onSubmit={handleFinalSubmit}>
            {/* SECTION 01: Identitas Siswa */}
            {activeSection === 1 && (
              <div className="space-y-6">
                <div className="space-y-1 pb-4 border-b border-border/60">
                  <h2 className="text-lg font-bold font-heading text-foreground">
                    01. Identitas Siswa
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Isi data identitas siswa sesuai dengan Kartu Keluarga dan Akta Kelahiran.
                  </p>
                </div>

                {/* Pas Foto Upload & Preview */}
                <Card className="border border-border/70 bg-muted/20 shadow-none">
                  <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-center sm:items-start gap-5">
                    <div className="w-[96px] h-[128px] rounded-lg bg-card border-2 border-dashed border-border flex flex-col items-center justify-center overflow-hidden shrink-0 shadow-2xs relative group">
                      {photoPreviewUrl ? (
                        <img
                          src={photoPreviewUrl}
                          alt="Pas Foto 3x4"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center text-muted-foreground p-2">
                          <Users className="size-7 mx-auto mb-1 text-muted-foreground/60" />
                          <span className="text-[10px] font-semibold">Foto 3×4</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 text-center sm:text-left space-y-2">
                      <div>
                        <h4 className="text-xs font-bold text-foreground">Pas Foto Siswa (Rasio 3:4)</h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                          Format JPG, PNG, atau WEBP. Ukuran maksimal 5 MB. Foto digunakan untuk kartu ujian ber-QR.
                        </p>
                      </div>

                      <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handlePhotoSelect(f);
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isProcessingPhoto}
                        >
                          <Upload className="size-3.5 mr-1.5" />
                          {photoPreviewUrl || photoUrl ? "Ganti Foto" : "Pilih Foto"}
                        </Button>
                        {(photoPreviewUrl || photoUrl) && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (localPreviewRef.current?.startsWith("blob:")) {
                                URL.revokeObjectURL(localPreviewRef.current);
                                localPreviewRef.current = null;
                              }
                              setPhotoUrl("");
                              setPhotoStoragePath("");
                              setPhotoPreviewUrl("");
                            }}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="size-3.5 mr-1.5" />
                            Hapus
                          </Button>
                        )}
                      </div>
                      {photoError && (
                        <p className="text-[11px] text-destructive font-medium">{photoError}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Nama Lengkap Siswa" required>
                      <Input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Sesuai dokumen Kartu Keluarga"
                        required
                      />
                    </FormField>
                    <FormField label="Nama Panggilan">
                      <Input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="Contoh: Fauzi"
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="NIS (Nomor Induk Siswa)" required>
                      <Input
                        type="text"
                        value={nis}
                        onChange={(e) => setNis(e.target.value)}
                        placeholder="Nomor induk unik sekolah"
                        required
                      />
                    </FormField>
                    <FormField label="NISN (Nomor Induk Siswa Nasional)">
                      <Input
                        type="text"
                        value={nisn}
                        maxLength={10}
                        onChange={(e) => setNisn(e.target.value.replace(/\D/g, ""))}
                        placeholder="10 digit angka jika sudah ada"
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="NIK (Nomor Induk Kependudukan)">
                      <Input
                        type="text"
                        value={nik}
                        maxLength={16}
                        onChange={(e) => setNik(e.target.value.replace(/\D/g, ""))}
                        placeholder="16 digit angka sesuai KK/KIA"
                      />
                    </FormField>
                    <FormField label="Nomor Kartu Keluarga (KK)">
                      <Input
                        type="text"
                        value={familyCardNumber}
                        maxLength={16}
                        onChange={(e) => setFamilyCardNumber(e.target.value.replace(/\D/g, ""))}
                        placeholder="16 digit angka kepala keluarga"
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Nomor Akta Kelahiran">
                      <Input
                        type="text"
                        value={birthCertificateNumber}
                        onChange={(e) => setBirthCertificateNumber(e.target.value)}
                        placeholder="Nomor register akta kelahiran"
                      />
                    </FormField>
                    <FormField label="Jenis Kelamin">
                      <div className="grid grid-cols-2 gap-3 h-10 items-center">
                        <label className={cn(
                          "flex items-center justify-center gap-2 h-10 px-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all",
                          gender === "L"
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-card border-input text-foreground hover:bg-muted"
                        )}>
                          <input
                            type="radio"
                            name="gender"
                            className="hidden"
                            checked={gender === "L"}
                            onChange={() => setGender("L")}
                          />
                          <span>Laki-laki</span>
                        </label>
                        <label className={cn(
                          "flex items-center justify-center gap-2 h-10 px-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all",
                          gender === "P"
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-card border-input text-foreground hover:bg-muted"
                        )}>
                          <input
                            type="radio"
                            name="gender"
                            className="hidden"
                            checked={gender === "P"}
                            onChange={() => setGender("P")}
                          />
                          <span>Perempuan</span>
                        </label>
                      </div>
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Tempat Lahir">
                      <Input
                        type="text"
                        value={birthPlace}
                        onChange={(e) => setBirthPlace(e.target.value)}
                        placeholder="Contoh: Bogor"
                      />
                    </FormField>
                    <FormField label="Tanggal Lahir">
                      <div className="flex items-center gap-2.5">
                        <Input
                          type="date"
                          value={birthDate}
                          onChange={(e) => setBirthDate(e.target.value)}
                          max={todayStr}
                          className="flex-1"
                        />
                        {birthDate && (
                          <UiBadge variant="neutral" className="shrink-0 h-10 px-3 text-xs">
                            Usia: {calculateAge(birthDate)}
                          </UiBadge>
                        )}
                      </div>
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Agama">
                      <Select
                        value={religion}
                        onChange={(e) => setReligion(e.target.value)}
                      >
                        <option value="Islam">Islam</option>
                        <option value="Kristen">Kristen</option>
                        <option value="Katolik">Katolik</option>
                        <option value="Hindu">Hindu</option>
                        <option value="Buddha">Buddha</option>
                        <option value="Konghucu">Konghucu</option>
                      </Select>
                    </FormField>
                    <FormField label="Kewarganegaraan">
                      <Select
                        value={citizenship}
                        onChange={(e) => setCitizenship(e.target.value)}
                      >
                        <option value="WNI">WNI (Warga Negara Indonesia)</option>
                        <option value="WNA">WNA (Warga Negara Asing)</option>
                      </Select>
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Anak ke-">
                      <Input
                        type="number"
                        min={1}
                        value={birthOrder}
                        onChange={(e) => setBirthOrder(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="1"
                      />
                    </FormField>
                    <FormField label="Jumlah Saudara Kandung">
                      <Input
                        type="number"
                        min={0}
                        value={siblingCount}
                        onChange={(e) => setSiblingCount(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="0"
                      />
                    </FormField>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 02: Alamat & Domisili */}
            {activeSection === 2 && (
              <div className="space-y-6">
                <div className="space-y-1 pb-4 border-b border-border/60">
                  <h2 className="text-lg font-bold font-heading text-foreground">
                    02. Alamat & Tempat Tinggal
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Kelola alamat kependudukan sesuai Kartu Keluarga serta alamat domisili anak saat ini.
                  </p>
                </div>

                <Card className="border border-border/80 shadow-xs">
                  <CardHeader className="py-3.5 px-5 bg-muted/30 border-b border-border/60">
                    <div className="flex items-center gap-2">
                      <MapPin className="size-4 text-primary" />
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-primary">
                        Alamat Sesuai Kartu Keluarga (KK)
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    <FormField label="Alamat Jalan / Lingkungan" required>
                      <Textarea
                        rows={2}
                        value={idAddress}
                        onChange={(e) => setIdAddress(e.target.value)}
                        placeholder="Nama jalan, nomor rumah, gang/blok"
                      />
                    </FormField>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label="RT / RW">
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="text"
                            placeholder="RT (001)"
                            value={idRt}
                            onChange={(e) => setIdRt(e.target.value)}
                          />
                          <Input
                            type="text"
                            placeholder="RW (002)"
                            value={idRw}
                            onChange={(e) => setIdRw(e.target.value)}
                          />
                        </div>
                      </FormField>
                      <FormField label="Dusun / Lingkungan">
                        <Input
                          type="text"
                          value={idHamlet}
                          onChange={(e) => setIdHamlet(e.target.value)}
                          placeholder="Dusun I"
                        />
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label="Kelurahan / Desa">
                        <Input
                          type="text"
                          value={idVillage}
                          onChange={(e) => setIdVillage(e.target.value)}
                          placeholder="Desa Benteng"
                        />
                      </FormField>
                      <FormField label="Kecamatan">
                        <Input
                          type="text"
                          value={idDistrict}
                          onChange={(e) => setIdDistrict(e.target.value)}
                          placeholder="Kecamatan Ciampea"
                        />
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label="Kabupaten / Kota">
                        <Input
                          type="text"
                          value={idRegency}
                          onChange={(e) => setIdRegency(e.target.value)}
                          placeholder="Kab. Bogor"
                        />
                      </FormField>
                      <FormField label="Kode Pos">
                        <Input
                          type="text"
                          value={idPostalCode}
                          maxLength={5}
                          onChange={(e) => setIdPostalCode(e.target.value.replace(/\D/g, ""))}
                          placeholder="16620"
                        />
                      </FormField>
                    </div>
                  </CardContent>
                </Card>

                {/* Domicile Checkbox */}
                <div>
                  <label className="flex items-center gap-3 p-3.5 rounded-lg border border-border/80 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={sameAsIdentity}
                      onChange={(e) => setSameAsIdentity(e.target.checked)}
                      className="size-4 rounded border-input text-primary accent-primary focus:ring-primary/20"
                    />
                    <span className="text-xs font-semibold text-foreground select-none">
                      Alamat tempat tinggal / domisili sama persis dengan alamat KK
                    </span>
                  </label>
                </div>

                {!sameAsIdentity && (
                  <Card className="border border-dashed border-primary/40 bg-card shadow-xs">
                    <CardHeader className="py-3 px-5 bg-primary/5 border-b border-primary/20">
                      <div className="flex items-center gap-2">
                        <MapPin className="size-4 text-primary" />
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-primary">
                          Alamat Domisili Saat Ini
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4">
                      <FormField label="Alamat Domisili">
                        <Textarea
                          rows={2}
                          value={domAddress}
                          onChange={(e) => setDomAddress(e.target.value)}
                          placeholder="Alamat domisili jika berbeda dari KK"
                        />
                      </FormField>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="Kota / Kabupaten Domisili">
                          <Input
                            type="text"
                            value={domRegency}
                            onChange={(e) => setDomRegency(e.target.value)}
                            placeholder="Kota / Kabupaten Domisili"
                          />
                        </FormField>
                        <FormField label="Kode Pos Domisili">
                          <Input
                            type="text"
                            value={domPostalCode}
                            maxLength={5}
                            onChange={(e) => setDomPostalCode(e.target.value.replace(/\D/g, ""))}
                            placeholder="Kode Pos Domisili"
                          />
                        </FormField>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Akses & Transportasi */}
                <Card className="border border-border/80 shadow-xs">
                  <CardHeader className="py-3.5 px-5 bg-muted/30 border-b border-border/60">
                    <div className="flex items-center gap-2">
                      <School className="size-4 text-primary" />
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-primary">
                        Tempat Tinggal & Akses ke Sekolah
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label="Jenis Tempat Tinggal">
                        <Select
                          value={residenceType}
                          onChange={(e) => setResidenceType(e.target.value)}
                        >
                          <option value="BERSAMA_ORANG_TUA">Bersama Orang Tua</option>
                          <option value="BERSAMA_WALI">Bersama Wali</option>
                          <option value="KOS_ASRAMA">Kost / Asrama</option>
                          <option value="PANTI_ASUHAN">Panti Asuhan</option>
                          <option value="LAINNYA">Lainnya</option>
                        </Select>
                      </FormField>
                      <FormField label="Moda Transportasi Utama">
                        <Select
                          value={transportationType}
                          onChange={(e) => setTransportationType(e.target.value)}
                        >
                          <option value="JALAN_KAKI">Jalan Kaki</option>
                          <option value="SEPEDA">Sepeda</option>
                          <option value="SEPEDA_MOTOR">Sepeda Motor</option>
                          <option value="MOBIL_PRIBADI">Mobil Pribadi</option>
                          <option value="ANTAR_JEMPUT">Antar Jemput Sekolah</option>
                          <option value="ANGKUTAN_UMUM">Angkutan Umum</option>
                        </Select>
                      </FormField>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label="Jarak ke Sekolah (km)">
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          value={distanceToSchool}
                          onChange={(e) => setDistanceToSchool(e.target.value === "" ? "" : Number(e.target.value))}
                          placeholder="Contoh: 2.5"
                        />
                      </FormField>
                      <FormField label="Waktu Tempuh (Menit)">
                        <Input
                          type="number"
                          min="0"
                          value={travelTimeMinutes}
                          onChange={(e) => setTravelTimeMinutes(e.target.value === "" ? "" : Number(e.target.value))}
                          placeholder="Contoh: 15"
                        />
                      </FormField>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* SECTION 03: Registrasi & Akademik */}
            {activeSection === 3 && (
              <div className="space-y-6">
                <div className="space-y-1 pb-4 border-b border-border/60">
                  <h2 className="text-lg font-bold font-heading text-foreground">
                    03. Registrasi & Akademik
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Tentukan nomor registrasi penerimaan, kelas penempatan aktif, dan riwayat sekolah sebelumnya.
                  </p>
                </div>

                <Card className="border border-border/80 shadow-xs">
                  <CardHeader className="py-3.5 px-5 bg-muted/30 border-b border-border/60">
                    <div className="flex items-center gap-2">
                      <School className="size-4 text-primary" />
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-primary">
                        Data Registrasi & Kelas
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label="Nomor Pendaftaran">
                        <Input
                          type="text"
                          value={registrationNumber}
                          onChange={(e) => setRegistrationNumber(e.target.value)}
                          placeholder="Contoh: REG-2026-001"
                        />
                      </FormField>
                      <FormField label="Jenis Pendaftaran">
                        <Select
                          value={registrationType}
                          onChange={(e) => setRegistrationType(e.target.value as any)}
                        >
                          <option value="NEW_STUDENT">Siswa Baru</option>
                          <option value="TRANSFER_STUDENT">Siswa Pindahan</option>
                        </Select>
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label="Tanggal Masuk Sekolah" required>
                        <Input
                          type="date"
                          value={enrolledOn}
                          onChange={(e) => setEnrolledOn(e.target.value)}
                          required
                        />
                      </FormField>
                      <FormField label="Kelas Saat Ini" required>
                        <Select
                          value={classId}
                          onChange={(e) => setClassId(e.target.value)}
                          required
                        >
                          {classes.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </Select>
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label="Pernah PAUD?">
                        <Select
                          value={attendedPaud === null ? "null" : attendedPaud ? "true" : "false"}
                          onChange={(e) =>
                            setAttendedPaud(e.target.value === "null" ? null : e.target.value === "true")
                          }
                        >
                          <option value="true">Ya, Pernah</option>
                          <option value="false">Tidak Pernah</option>
                          <option value="null">Belum Diketahui</option>
                        </Select>
                      </FormField>
                      <FormField label="Pernah TK / RA?">
                        <Select
                          value={attendedKindergarten === null ? "null" : attendedKindergarten ? "true" : "false"}
                          onChange={(e) =>
                            setAttendedKindergarten(e.target.value === "null" ? null : e.target.value === "true")
                          }
                        >
                          <option value="true">Ya, Pernah</option>
                          <option value="false">Tidak Pernah</option>
                          <option value="null">Belum Diketahui</option>
                        </Select>
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label="Nama Sekolah Asal (TK/SD)">
                        <Input
                          type="text"
                          value={previousSchoolName}
                          onChange={(e) => setPreviousSchoolName(e.target.value)}
                          placeholder="Contoh: TK IT Al-Ikhlas"
                        />
                      </FormField>
                      <FormField label="NPSN Sekolah Asal">
                        <Input
                          type="text"
                          value={previousSchoolNpsn}
                          onChange={(e) => setPreviousSchoolNpsn(e.target.value)}
                          placeholder="8 digit NPSN jika ada"
                        />
                      </FormField>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex items-start gap-3 p-3.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 text-xs leading-relaxed">
                  <AlertTriangle className="size-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <strong className="font-semibold">Proteksi Finansial:</strong> Perubahan kelas dan tanggal masuk pada siswa yang telah memiliki riwayat tagihan SPP dilindungi server demi integritas laporan keuangan.
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 04: Data Ayah Kandung */}
            {activeSection === 4 && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold font-heading text-foreground">
                      04. Data Ayah Kandung
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Data keluarga bersifat modular dan dapat dihubungkan ke beberapa siswa yang bersaudara.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowSearchFamilyModal("father");
                      setFamilySearchResults([]);
                    }}
                    className="self-start sm:self-center"
                  >
                    <Search className="size-3.5 mr-1.5" />
                    Pilih Data Ayah Terdaftar
                  </Button>
                </div>

                <Card className="border border-border/80 shadow-xs">
                  <CardHeader className="py-3.5 px-5 bg-muted/30 border-b border-border/60">
                    <div className="flex items-center gap-2">
                      <Users className="size-4 text-primary" />
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-primary">
                        Informasi Demografis Ayah
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label="Nama Lengkap Ayah">
                        <Input
                          type="text"
                          value={fatherName}
                          onChange={(e) => setFatherName(e.target.value)}
                          placeholder="Nama lengkap sesuai KTP"
                        />
                      </FormField>
                      <FormField label="NIK Ayah (16 Digit)">
                        <Input
                          type="text"
                          value={fatherNik}
                          maxLength={16}
                          onChange={(e) => setFatherNik(e.target.value.replace(/\D/g, ""))}
                          placeholder="16 digit angka"
                        />
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label="Status Hidup">
                        <Select
                          value={fatherLifeStatus}
                          onChange={(e) => setFatherLifeStatus(e.target.value)}
                        >
                          <option value="ALIVE">Masih Hidup</option>
                          <option value="DECEASED">Meninggal Dunia</option>
                          <option value="UNKNOWN">Tidak Diketahui</option>
                        </Select>
                      </FormField>
                      <FormField label="Pendidikan Terakhir">
                        <Select
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
                        </Select>
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label="Pekerjaan Utama">
                        <Select
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
                        </Select>
                      </FormField>
                      <FormField label="Penghasilan Bulanan">
                        <Select
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
                        </Select>
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label="Nomor HP / WhatsApp Ayah">
                        <Input
                          type="text"
                          value={fatherPhone}
                          onChange={(e) => setFatherPhone(e.target.value)}
                          placeholder="0812xxxxxxxx"
                        />
                      </FormField>
                      <FormField label="Email Ayah">
                        <Input
                          type="email"
                          value={fatherEmail}
                          onChange={(e) => setFatherEmail(e.target.value)}
                          placeholder="ayah@contoh.com"
                        />
                      </FormField>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* SECTION 05: Data Ibu Kandung */}
            {activeSection === 5 && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold font-heading text-foreground">
                      05. Data Ibu Kandung
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Kelola biodata ibu kandung siswa sesuai dokumen kependudukan.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowSearchFamilyModal("mother");
                      setFamilySearchResults([]);
                    }}
                    className="self-start sm:self-center"
                  >
                    <Search className="size-3.5 mr-1.5" />
                    Pilih Data Ibu Terdaftar
                  </Button>
                </div>

                <Card className="border border-border/80 shadow-xs">
                  <CardHeader className="py-3.5 px-5 bg-muted/30 border-b border-border/60">
                    <div className="flex items-center gap-2">
                      <Users className="size-4 text-primary" />
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-primary">
                        Informasi Demografis Ibu
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label="Nama Lengkap Ibu">
                        <Input
                          type="text"
                          value={motherName}
                          onChange={(e) => setMotherName(e.target.value)}
                          placeholder="Nama lengkap sesuai KTP"
                        />
                      </FormField>
                      <FormField label="NIK Ibu (16 Digit)">
                        <Input
                          type="text"
                          value={motherNik}
                          maxLength={16}
                          onChange={(e) => setMotherNik(e.target.value.replace(/\D/g, ""))}
                          placeholder="16 digit angka"
                        />
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label="Status Hidup">
                        <Select
                          value={motherLifeStatus}
                          onChange={(e) => setMotherLifeStatus(e.target.value)}
                        >
                          <option value="ALIVE">Masih Hidup</option>
                          <option value="DECEASED">Meninggal Dunia</option>
                          <option value="UNKNOWN">Tidak Diketahui</option>
                        </Select>
                      </FormField>
                      <FormField label="Pendidikan Terakhir">
                        <Select
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
                        </Select>
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label="Pekerjaan Utama">
                        <Select
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
                        </Select>
                      </FormField>
                      <FormField label="Nomor HP / WhatsApp Ibu">
                        <Input
                          type="text"
                          value={motherPhone}
                          onChange={(e) => setMotherPhone(e.target.value)}
                          placeholder="0812xxxxxxxx"
                        />
                      </FormField>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* SECTION 06: Wali & Kontak Darurat */}
            {activeSection === 6 && (
              <div className="space-y-6">
                <div className="space-y-1 pb-4 border-b border-border/60">
                  <h2 className="text-lg font-bold font-heading text-foreground">
                    06. Wali & Kontak Darurat
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Tentukan penanggung jawab administratif, penanggung jawab SPP, dan nomor kontak darurat sekolah.
                  </p>
                </div>

                <Card className="border border-border/80 shadow-xs">
                  <CardHeader className="py-3.5 px-5 bg-muted/30 border-b border-border/60">
                    <div className="flex items-center gap-2">
                      <Shield className="size-4 text-primary" />
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-primary">
                        Penanggung Jawab Administratif & Keuangan
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 space-y-5">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-2">
                        Kontak Utama / Penanggung Jawab Administratif Siswa
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { id: "FATHER", label: "Ayah Kandung" },
                          { id: "MOTHER", label: "Ibu Kandung" },
                          { id: "GUARDIAN", label: "Wali Lainnya" },
                        ].map((item) => (
                          <label
                            key={item.id}
                            className={cn(
                              "flex items-center justify-center gap-2 h-10 px-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all",
                              primaryContact === item.id
                                ? "bg-primary/10 border-primary text-primary"
                                : "bg-card border-input text-foreground hover:bg-muted"
                            )}
                          >
                            <input
                              type="radio"
                              name="primaryContact"
                              className="hidden"
                              checked={primaryContact === item.id}
                              onChange={() => setPrimaryContact(item.id as any)}
                            />
                            <span>{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-2">
                        Penanggung Jawab Tagihan SPP & Finansial
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { id: "FATHER", label: "Ayah Kandung" },
                          { id: "MOTHER", label: "Ibu Kandung" },
                          { id: "GUARDIAN", label: "Wali Lainnya" },
                        ].map((item) => (
                          <label
                            key={item.id}
                            className={cn(
                              "flex items-center justify-center gap-2 h-10 px-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all",
                              paymentResponsible === item.id
                                ? "bg-primary/10 border-primary text-primary"
                                : "bg-card border-input text-foreground hover:bg-muted"
                            )}
                          >
                            <input
                              type="radio"
                              name="paymentResponsible"
                              className="hidden"
                              checked={paymentResponsible === item.id}
                              onChange={() => setPaymentResponsible(item.id as any)}
                            />
                            <span>{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-border/80 shadow-xs">
                  <CardHeader className="py-3.5 px-5 bg-muted/30 border-b border-border/60">
                    <div className="flex items-center gap-2">
                      <Phone className="size-4 text-primary" />
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-primary">
                        Kontak Darurat (Emergency Contact)
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label="Nama Kontak Darurat" required>
                        <Input
                          type="text"
                          value={emergencyName}
                          onChange={(e) => setEmergencyName(e.target.value)}
                          placeholder="Nama orang yang dapat dihubungi segera"
                          required
                        />
                      </FormField>
                      <FormField label="Hubungan dengan Siswa">
                        <Input
                          type="text"
                          value={emergencyRelationship}
                          onChange={(e) => setEmergencyRelationship(e.target.value)}
                          placeholder="Contoh: Ayah Kandung / Paman"
                        />
                      </FormField>
                    </div>

                    <FormField label="Nomor Telepon / WhatsApp Darurat" required>
                      <Input
                        type="text"
                        value={emergencyPhone}
                        onChange={(e) => setEmergencyPhone(e.target.value)}
                        placeholder="0812xxxxxxxx"
                        required
                      />
                    </FormField>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* SECTION 07: Kesehatan & Kebutuhan Khusus */}
            {activeSection === 7 && (
              <div className="space-y-6">
                <div className="space-y-1 pb-4 border-b border-border/60">
                  <h2 className="text-lg font-bold font-heading text-foreground">
                    07. Kesehatan & Kebutuhan Khusus
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Catatan medis bersifat rahasia dan hanya digunakan untuk keselamatan serta pendampingan belajar anak.
                  </p>
                </div>

                <Card className="border border-border/80 shadow-xs">
                  <CardHeader className="py-3.5 px-5 bg-muted/30 border-b border-border/60">
                    <div className="flex items-center gap-2">
                      <HeartPulse className="size-4 text-primary" />
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-primary">
                        Informasi Medis & Alergi
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label="Golongan Darah">
                        <Select
                          value={bloodType}
                          onChange={(e) => setBloodType(e.target.value)}
                        >
                          <option value="UNKNOWN">Belum Diketahui</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="AB">AB</option>
                          <option value="O">O</option>
                        </Select>
                      </FormField>
                      <FormField label="Memiliki Kebutuhan Khusus?">
                        <Select
                          value={hasSpecialNeeds ? "true" : "false"}
                          onChange={(e) => setHasSpecialNeeds(e.target.value === "true")}
                        >
                          <option value="false">Tidak Ada</option>
                          <option value="true">Ada Kebutuhan Khusus</option>
                        </Select>
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label="Alergi Makanan">
                        <Input
                          type="text"
                          value={foodAllergies}
                          onChange={(e) => setFoodAllergies(e.target.value)}
                          placeholder="Contoh: Udang, kacang tanah"
                        />
                      </FormField>
                      <FormField label="Alergi Obat">
                        <Input
                          type="text"
                          value={drugAllergies}
                          onChange={(e) => setDrugAllergies(e.target.value)}
                          placeholder="Contoh: Penisilin, amoksisilin"
                        />
                      </FormField>
                    </div>

                    <FormField label="Riwayat Penyakit yang Pernah Diderita">
                      <Textarea
                        rows={2}
                        value={medicalHistory}
                        onChange={(e) => setMedicalHistory(e.target.value)}
                        placeholder="Contoh: Asma, kejang demam (step)"
                      />
                    </FormField>

                    <FormField label="Catatan Penanganan Darurat / Pengobatan Rutin">
                      <Textarea
                        rows={2}
                        value={emergencyHandlingNotes}
                        onChange={(e) => setEmergencyHandlingNotes(e.target.value)}
                        placeholder="Tindakan yang harus diambil jika alergi kambuh"
                      />
                    </FormField>
                  </CardContent>
                </Card>

                {/* Tabel Pengukuran Fisik */}
                <Card className="border border-border/80 shadow-xs">
                  <CardHeader className="py-3.5 px-5 bg-muted/30 border-b border-border/60 flex flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Award className="size-4 text-primary" />
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-primary">
                        Pengukuran Fisik Berkala (Tinggi & Berat Badan)
                      </CardTitle>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowMeasurementModal(true)}
                    >
                      <Plus className="size-3.5 mr-1.5" />
                      Tambah Pengukuran
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    {measurements.length === 0 ? (
                      <div className="text-center py-8 px-4 text-xs text-muted-foreground">
                        Belum ada catatan pengukuran fisik berkala.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead>
                            <tr className="border-b border-border/60 bg-muted/20 text-muted-foreground">
                              <th className="py-2.5 px-4 font-semibold">Tanggal</th>
                              <th className="py-2.5 px-4 font-semibold">Tinggi (cm)</th>
                              <th className="py-2.5 px-4 font-semibold">Berat (kg)</th>
                              <th className="py-2.5 px-4 font-semibold">Catatan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60">
                            {measurements.map((m, i) => (
                              <tr key={m.clientKey || m.id || i} className="hover:bg-muted/30 transition-colors">
                                <td className="py-3 px-4 text-foreground font-medium">{m.measurementDate}</td>
                                <td className="py-3 px-4 font-semibold text-primary">{m.heightCm} cm</td>
                                <td className="py-3 px-4 font-semibold text-primary">{m.weightKg} kg</td>
                                <td className="py-3 px-4 text-muted-foreground">{m.notes || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* SECTION 08: Bantuan Pendidikan */}
            {activeSection === 8 && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold font-heading text-foreground">
                      08. Bantuan Pendidikan
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Pencatatan KIP, PIP, PKH, atau beasiswa merupakan data administrasi dan tidak mengubah tagihan SPP secara otomatis.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAidModal(true)}
                    className="self-start sm:self-center"
                  >
                    <Plus className="size-3.5 mr-1.5" />
                    Tambah Bantuan
                  </Button>
                </div>

                {aidRecords.length === 0 ? (
                  <Card className="border border-dashed border-border/80 bg-muted/20">
                    <CardContent className="text-center py-10 px-4 space-y-2">
                      <Award className="size-8 mx-auto text-muted-foreground/60" />
                      <h4 className="text-xs font-bold text-foreground">Tidak Ada Bantuan Terdaftar</h4>
                      <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                        Siswa saat ini tercatat tidak menerima program bantuan atau beasiswa eksternal.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border border-border/80 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="border-b border-border/60 bg-muted/20 text-muted-foreground">
                            <th className="py-2.5 px-4 font-semibold">Program Bantuan</th>
                            <th className="py-2.5 px-4 font-semibold">Nomor Kartu / SK</th>
                            <th className="py-2.5 px-4 font-semibold">Sumber</th>
                            <th className="py-2.5 px-4 font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {aidRecords.map((a, i) => (
                            <tr key={a.clientKey || a.id || i} className="hover:bg-muted/30 transition-colors">
                              <td className="py-3 px-4 font-semibold text-primary">{a.aidType}</td>
                              <td className="py-3 px-4 text-foreground">{a.aidNumber || "-"}</td>
                              <td className="py-3 px-4 text-muted-foreground">{a.aidSource || "-"}</td>
                              <td className="py-3 px-4">
                                <Badge status={a.status || "ACTIVE"} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* SECTION 09: Karakteristik Anak */}
            {activeSection === 9 && (
              <div className="space-y-6">
                <div className="space-y-1 pb-4 border-b border-border/60">
                  <h2 className="text-lg font-bold font-heading text-foreground">
                    09. Karakteristik & Perkembangan Anak
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Terintegrasi dengan modul evaluasi karakteristik santri dan kebiasaan ibadah harian.
                  </p>
                </div>

                <Card className="border border-border/80 bg-muted/20 shadow-xs">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                      <BookOpen className="size-5" />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <h4 className="text-sm font-bold text-foreground">
                        Formulir Karakteristik Siswa Terpadu
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Pengisian kuesioner perkembangan anak, minat, bakat, kebiasaan belajar, kemandirian anak, kemampuan membaca Al-Qur'an, metode pembelajaran sebelumnya, serta hafalan surat/doa harian dapat dilengkapi dan diperbarui secara berkala melalui modul Karakteristik maupun portal wali murid.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* SECTION 10: Dokumen Persyaratan */}
            {activeSection === 10 && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold font-heading text-foreground">
                      10. Dokumen Persyaratan
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Dokumen disimpan secara aman pada private storage Vercel Blob dan diverifikasi oleh staf Tata Usaha.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUploadDocModal(true)}
                    className="self-start sm:self-center"
                  >
                    <Upload className="size-3.5 mr-1.5" />
                    Unggah Dokumen
                  </Button>
                </div>

                {documents.length === 0 ? (
                  <Card className="border border-dashed border-border/80 bg-muted/20">
                    <CardContent className="text-center py-10 px-4 space-y-2">
                      <FolderOpen className="size-8 mx-auto text-muted-foreground/60" />
                      <h4 className="text-xs font-bold text-foreground">Belum Ada Berkas Diunggah</h4>
                      <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                        Unggah berkas KK, Akta Kelahiran, KTP Orang Tua, atau Ijazah TK sebagai kelengkapan administrasi.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border border-border/80 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="border-b border-border/60 bg-muted/20 text-muted-foreground">
                            <th className="py-2.5 px-4 font-semibold">Jenis Dokumen</th>
                            <th className="py-2.5 px-4 font-semibold">Nama Berkas</th>
                            <th className="py-2.5 px-4 font-semibold">Status Verifikasi</th>
                            <th className="py-2.5 px-4 font-semibold text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {documents.map((doc, i) => (
                            <tr key={i} className="hover:bg-muted/30 transition-colors">
                              <td className="py-3 px-4 font-semibold text-primary">{doc.documentType}</td>
                              <td className="py-3 px-4 text-foreground">{doc.documentName || doc.originalFilename}</td>
                              <td className="py-3 px-4">
                                <Badge status={doc.verificationStatus} />
                              </td>
                              <td className="py-3 px-4 text-right">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="xs"
                                  onClick={() => {
                                    if (doc.id && !doc.id.startsWith("temp-")) {
                                      downloadStudentDocumentContent(doc);
                                    } else if (doc.storagePath?.startsWith("http")) {
                                      window.open(doc.storagePath, "_blank");
                                    } else {
                                      alert("Dokumen dapat diunduh setelah data siswa disimpan.");
                                    }
                                  }}
                                >
                                  <Eye className="size-3 mr-1" />
                                  Lihat
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* Bottom Form Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-border/70">
              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-start">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={busy}
                >
                  Batal
                </Button>
                {mode === "tambah" && onSaveDraft && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleDraftSaveClick}
                    disabled={busy}
                    className="text-primary hover:text-primary hover:bg-primary/10 border border-primary/20"
                  >
                    <Save className="size-4 mr-1.5" />
                    Simpan Draf
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                {activeSection > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveSection((s) => Math.max(1, s - 1))}
                    disabled={busy}
                  >
                    <ChevronLeft className="size-4 mr-1.5" />
                    Kembali
                  </Button>
                )}
                {activeSection < 10 ? (
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => setActiveSection((s) => Math.min(10, s + 1))}
                    disabled={busy}
                  >
                    Selanjutnya
                    <ChevronRight className="size-4 ml-1.5" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="default"
                    disabled={busy}
                    className="px-6"
                  >
                    <Check className="size-4 mr-1.5" />
                    {mode === "tambah" ? "Simpan Siswa Baru" : "Simpan Perubahan"}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>
      </Card>
    </div>

      {/* Modal Search Family Existing */}
      {showSearchFamilyModal && (
        <Modal
          title={`Pilih Data ${showSearchFamilyModal === "father" ? "Ayah" : "Ibu"} Terdaftar`}
          close={() => setShowSearchFamilyModal(null)}
        >
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Cari data orang tua yang telah terdaftar pada database sekolah untuk menghubungkan siswa bersaudara.
            </p>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Cari nama, NIK, atau nomor HP..."
                value={familySearchQuery}
                onChange={(e) => setFamilySearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchFamily()}
                className="flex-1"
              />
              <Button
                type="button"
                variant="default"
                onClick={handleSearchFamily}
                disabled={searchingFamily}
              >
                {searchingFamily ? "Mencari..." : "Cari"}
              </Button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 pt-2">
              {familySearchResults.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  {familySearchQuery ? "Tidak ditemukan anggota keluarga yang cocok" : "Ketik kata kunci pencarian nama atau NIK"}
                </div>
              ) : (
                familySearchResults.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/80 bg-card hover:bg-muted/40 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold text-xs text-primary">{m.fullName}</div>
                      <div className="text-[11px] text-muted-foreground">
                        NIK: {m.maskedNik} • HP: {m.maskedPhone} • {m.occupation || "Pekerjaan -"}
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="default"
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
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Tambah Pengukuran Fisik */}
      {showMeasurementModal && (
        <Modal
          title="Tambah Pengukuran Fisik Berkala"
          close={() => setShowMeasurementModal(false)}
        >
          <div className="space-y-4">
            <FormField label="Tanggal Pengukuran">
              <Input
                type="date"
                value={newMeasureDate}
                onChange={(e) => setNewMeasureDate(e.target.value)}
                max={todayStr}
              />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Tinggi Badan (cm)" required>
                <Input
                  type="number"
                  min="30"
                  max="250"
                  value={newHeight}
                  onChange={(e) => setNewHeight(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Contoh: 125"
                  required
                />
              </FormField>
              <FormField label="Berat Badan (kg)" required>
                <Input
                  type="number"
                  min="5"
                  max="200"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Contoh: 26.5"
                  required
                />
              </FormField>
            </div>
            <FormField label="Catatan Petugas (Opsional)">
              <Input
                type="text"
                value={newMeasureNotes}
                onChange={(e) => setNewMeasureNotes(e.target.value)}
                placeholder="Pemeriksaan berkala UKS semester 1"
              />
            </FormField>
            <div className="flex justify-end gap-2.5 pt-2 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowMeasurementModal(false)}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="default"
                onClick={handleAddMeasurement}
                disabled={!newHeight || !newWeight}
              >
                Simpan Pengukuran
              </Button>
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
          <div className="space-y-4">
            <FormField label="Jenis Program Bantuan" required>
              <Select
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
              </Select>
            </FormField>
            <FormField label="Nomor Kartu / Nomor KIP / Nomor SK">
              <Input
                type="text"
                value={newAidNumber}
                onChange={(e) => setNewAidNumber(e.target.value)}
                placeholder="Nomor kartu bantuan"
              />
            </FormField>
            <FormField label="Instansi / Sumber Pemberi">
              <Input
                type="text"
                value={newAidSource}
                onChange={(e) => setNewAidSource(e.target.value)}
                placeholder="Kementerian Pendidikan / Yayasan"
              />
            </FormField>
            <FormField label="Catatan Keterangan">
              <Textarea
                rows={2}
                value={newAidNotes}
                onChange={(e) => setNewAidNotes(e.target.value)}
                placeholder="Keterangan alokasi bantuan"
              />
            </FormField>
            <div className="flex justify-end gap-2.5 pt-2 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAidModal(false)}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="default"
                onClick={handleAddAid}
              >
                Tambahkan Bantuan
              </Button>
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
          <div className="space-y-4">
            <FormField label="Jenis Dokumen" required>
              <Select
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
              </Select>
            </FormField>

            <FormField label="Nama Dokumen / Keterangan">
              <Input
                type="text"
                value={uploadDocName}
                onChange={(e) => setUploadDocName(e.target.value)}
              />
            </FormField>

            <FormField label="Pilih Berkas (PDF, JPG, PNG maks 5 MB)" required>
              <Input
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setUploadDocFile(f);
                }}
                className="cursor-pointer file:cursor-pointer file:rounded-md file:border-0 file:bg-primary/10 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-primary hover:file:bg-primary/20"
              />
            </FormField>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowUploadDocModal(false)}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="default"
                disabled={!uploadDocFile}
                onClick={async () => {
                  if (!uploadDocFile) return;
                  if (uploadDocFile.size > 5 * 1024 * 1024) {
                    alert("Ukuran dokumen melebihi batas maksimal 5 MB");
                    return;
                  }
                  try {
                    const userId = currentUserId || "system";
                    const extensions: Record<string, string> = {
                      "image/jpeg": "jpg",
                      "image/png": "png",
                      "application/pdf": "pdf",
                      "image/webp": "webp",
                    };
                    const ext = extensions[uploadDocFile.type];
                    if (!ext) throw new Error("Pilih berkas JPG, PNG, PDF, atau WebP maksimal 5 MB");

                    if (student?.id) {
                      const createdDoc = await uploadStudentDocument(
                        uploadDocFile,
                        userId,
                        student.id,
                        uploadDocType,
                        uploadDocName,
                      );
                      setDocuments((prev) => [...prev, createdDoc]);
                    } else {
                      const blob = await upload(
                        `student-documents/${userId}/${crypto.randomUUID()}.${ext}`,
                        uploadDocFile,
                        {
                          access: "private",
                          handleUploadUrl: "/api/files/upload",
                          contentType: uploadDocFile.type,
                        },
                      );
                      const newDoc = {
                        documentType: uploadDocType,
                        documentName: uploadDocName,
                        originalFilename: uploadDocFile.name,
                        mimeType: uploadDocFile.type,
                        fileSize: uploadDocFile.size,
                        verificationStatus: "PENDING",
                        storagePath: blob.pathname,
                      };
                      setDocuments((prev) => [...prev, newDoc]);
                    }
                    setShowUploadDocModal(false);
                    setUploadDocFile(null);
                  } catch (err: any) {
                    alert(err.message || "Gagal mengunggah dokumen");
                  }
                }}
              >
                Simpan Dokumen
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
