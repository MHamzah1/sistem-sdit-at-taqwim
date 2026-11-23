import "dotenv/config";
import { getDb } from "../src/db/client";
import * as s from "../src/db/schema";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";

async function main() {
  console.log("=== SDIT AT-TAQWIM: Memulai Pengisian Data Seeder Operasional ===");
  const { db, close } = getDb();

  try {
    await db.transaction(async (tx) => {
      // 1. Ambil Akun Pengguna Dasar
      const usersList = await tx.select().from(s.users);
      const userMap = new Map(usersList.map((u) => [u.email.toLowerCase(), u]));

      const adminUser = userMap.get("admin@attaqwim.sch.id");
      const tuUser = userMap.get("tu@attaqwim.sch.id");
      const kepsekUser = userMap.get("kepsek@attaqwim.sch.id");
      const waliUser = userMap.get("wali@attaqwim.sch.id");

      if (!adminUser || !tuUser || !kepsekUser || !waliUser) {
        throw new Error(
          "Akun dasar belum lengkap. Pastikan db:init telah dijalankan terlebih dahulu.",
        );
      }

      console.log("-> 1. Memeriksa identitas pengguna dasar: OK");

      // 2. Profil Sekolah (system_settings)
      await tx
        .insert(s.systemSettings)
        .values({
          key: "school",
          value: {
            schoolName: "SDIT AT-TAQWIM",
            phone: "+6281234567890",
          },
        })
        .onConflictDoUpdate({
          target: s.systemSettings.key,
          set: {
            value: {
              schoolName: "SDIT AT-TAQWIM",
              phone: "+6281234567890",
            },
            updatedAt: new Date(),
          },
        });
      console.log("-> 2. Pengaturan identitas sekolah: OK");

      // 3. Tahun Ajaran
      const [academicYear] = await tx
        .insert(s.academicYears)
        .values({
          name: "Tahun Ajaran 2026/2027",
          startDate: "2026-07-01",
          endDate: "2027-06-30",
          active: true,
        })
        .onConflictDoUpdate({
          target: s.academicYears.name,
          set: { active: true, updatedAt: new Date() },
        })
        .returning();
      console.log(`-> 3. Tahun ajaran aktif: ${academicYear.name}`);

      // 4. Konfigurasi Master Tarif SPP
      await tx
        .insert(s.sppConfigs)
        .values({
          academicYearId: academicYear.id,
          amount: 450000,
          dueDay: 10,
        })
        .onConflictDoUpdate({
          target: s.sppConfigs.academicYearId,
          set: { amount: 450000, dueDay: 10, updatedAt: new Date() },
        });
      console.log("-> 4. Master tarif SPP: Rp 450.000 / bulan (Jatuh tempo tgl 10)");

      // 5. Rombongan Belajar (Kelas)
      const classNames = [
        "Kelas 1A",
        "Kelas 1B",
        "Kelas 2A",
        "Kelas 2B",
        "Kelas 3A",
        "Kelas 6A",
      ];
      const classMap = new Map<string, string>();

      for (const name of classNames) {
        const [cls] = await tx
          .insert(s.classes)
          .values({
            name,
            academicYearId: academicYear.id,
          })
          .onConflictDoUpdate({
            target: [s.classes.academicYearId, s.classes.name],
            set: { updatedAt: new Date() },
          })
          .returning();
        classMap.set(name, cls.id);
      }
      console.log(`-> 5. Data kelas: ${classNames.length} rombel dibuat`);

      // 6. Wali Murid
      const guardianData = [
        {
          name: "Bpk. Hendra Pratama",
          phone: "+6281211112222",
          userId: waliUser.id, // Ditautkan ke akun login wali@attaqwim.sch.id
        },
        {
          name: "Ibu Rina Kusuma",
          phone: "+6281233334444",
          userId: null,
        },
        {
          name: "Bpk. Bambang Sutrisno",
          phone: "+6281255556666",
          userId: null,
        },
        {
          name: "Ibu Siti Rahmawati",
          phone: "+6281277778888",
          userId: null,
        },
        {
          name: "Bpk. Dian Permana",
          phone: "+6281299990000",
          userId: null,
        },
      ];

      const guardianMap = new Map<string, string>();
      for (const g of guardianData) {
        const existing = (
          await tx
            .select()
            .from(s.guardians)
            .where(eq(s.guardians.phone, g.phone))
        )[0];

        if (existing) {
          if (g.userId && existing.userId !== g.userId) {
            await tx
              .update(s.guardians)
              .set({ userId: g.userId, updatedAt: new Date() })
              .where(eq(s.guardians.id, existing.id));
          }
          guardianMap.set(g.name, existing.id);
        } else {
          const [inserted] = await tx
            .insert(s.guardians)
            .values(g)
            .returning();
          guardianMap.set(g.name, inserted.id);
        }
      }
      console.log(`-> 6. Profil wali murid: ${guardianData.length} orang (akun wali@attaqwim.sch.id terhubung ke Bpk. Hendra Pratama)`);

      // 7. Siswa & Penautan ke Wali Murid
      const studentData = [
        {
          nis: "202601001",
          name: "Muhammad Fatih Pratama",
          className: "Kelas 1A",
          enrolledOn: "2026-07-01",
          guardianName: "Bpk. Hendra Pratama",
        },
        {
          nis: "202502015",
          name: "Aisyah Ayudia Pratama",
          className: "Kelas 2A",
          enrolledOn: "2025-07-01",
          guardianName: "Bpk. Hendra Pratama",
        },
        {
          nis: "202601002",
          name: "Ahmad Zaki Al-Faruq",
          className: "Kelas 1A",
          enrolledOn: "2026-07-01",
          guardianName: "Ibu Rina Kusuma",
        },
        {
          nis: "202601003",
          name: "Maryam Khadijah",
          className: "Kelas 1B",
          enrolledOn: "2026-07-01",
          guardianName: "Bpk. Bambang Sutrisno",
        },
        {
          nis: "202601004",
          name: "Umar Abdul Aziz",
          className: "Kelas 1B",
          enrolledOn: "2026-07-01",
          guardianName: "Bpk. Bambang Sutrisno",
        },
        {
          nis: "202403010",
          name: "Bilal Al-Ghifari",
          className: "Kelas 3A",
          enrolledOn: "2024-07-01",
          guardianName: "Ibu Siti Rahmawati",
        },
        {
          nis: "202403011",
          name: "Fatimah Az-Zahra",
          className: "Kelas 3A",
          enrolledOn: "2024-07-01",
          guardianName: "Ibu Siti Rahmawati",
        },
        {
          nis: "202106001",
          name: "Salman Al-Farisi",
          className: "Kelas 6A",
          enrolledOn: "2021-07-01",
          guardianName: "Bpk. Dian Permana",
        },
        {
          nis: "202106002",
          name: "Khalid bin Walid",
          className: "Kelas 6A",
          enrolledOn: "2021-07-01",
          guardianName: "Bpk. Dian Permana",
        },
        {
          nis: "202502016",
          name: "Ali bin Abi Thalib",
          className: "Kelas 2A",
          enrolledOn: "2025-07-01",
          guardianName: "Ibu Rina Kusuma",
        },
      ];

      const studentMap = new Map<string, string>();
      for (const st of studentData) {
        const classId = classMap.get(st.className)!;
        const [student] = await tx
          .insert(s.students)
          .values({
            nis: st.nis,
            name: st.name,
            classId,
            enrolledOn: st.enrolledOn,
            active: true,
          })
          .onConflictDoUpdate({
            target: s.students.nis,
            set: { name: st.name, classId, updatedAt: new Date() },
          })
          .returning();
        studentMap.set(st.name, student.id);

        const guardianId = guardianMap.get(st.guardianName)!;
        await tx
          .insert(s.guardianStudents)
          .values({
            guardianId,
            studentId: student.id,
          })
          .onConflictDoNothing();
      }
      console.log(`-> 7. Data siswa: ${studentData.length} siswa dan relasi wali murid tersimpan`);

      // 8. Tagihan SPP (Invoices) — Juli s/d November 2026
      const months = [
        { month: "2026-07-01", dueDate: "2026-07-10" },
        { month: "2026-08-01", dueDate: "2026-08-10" },
        { month: "2026-09-01", dueDate: "2026-09-10" },
        { month: "2026-10-01", dueDate: "2026-10-10" },
        { month: "2026-11-01", dueDate: "2026-11-10" },
      ];

      // Definisikan status skenario per siswa per bulan
      // Pola: "P" (Paid/Cash), "PT" (Paid/Transfer), "PV" (Pending Verification), "U" (Unpaid/Overdue)
      const paymentScenario: Record<string, string[]> = {
        "Muhammad Fatih Pratama": ["P", "P", "P", "P", "P"], // Lunas penuh (Anak Wali login)
        "Aisyah Ayudia Pratama":   ["P", "PT", "PT", "PT", "U"], // Lancar, Nov belum bayar (Anak Wali login)
        "Ahmad Zaki Al-Faruq":    ["PT", "PT", "PT", "PT", "PV"], // Nov transfer pending verifikasi
        "Maryam Khadijah":        ["P", "P", "P", "U", "U"],     // Menunggak 2 bulan
        "Umar Abdul Aziz":        ["PT", "PT", "PT", "PT", "PT"], // Lunas penuh transfer
        "Bilal Al-Ghifari":       ["P", "U", "U", "U", "U"],     // Menunggak 4 bulan (Dispensasi!)
        "Fatimah Az-Zahra":       ["P", "P", "PT", "PT", "P"],   // Lunas penuh
        "Salman Al-Farisi":       ["P", "P", "P", "P", "U"],     // Nov belum bayar
        "Khalid bin Walid":       ["P", "PT", "P", "PT", "PT"],  // Lunas penuh
        "Ali bin Abi Thalib":     ["P", "P", "P", "PV", "U"],    // Okt pending, Nov menunggak
      };

      let invoiceCount = 0;
      let paymentCount = 0;

      for (const st of studentData) {
        const studentId = studentMap.get(st.name)!;
        const scenarios = paymentScenario[st.name] || ["P", "P", "P", "P", "P"];

        for (let i = 0; i < months.length; i++) {
          const { month, dueDate } = months[i];
          const scenario = scenarios[i];

          let invStatus: "PAID" | "UNPAID" | "PENDING_VERIFICATION" | "OVERDUE" = "UNPAID";
          if (scenario === "P" || scenario === "PT") {
            invStatus = "PAID";
          } else if (scenario === "PV") {
            invStatus = "PENDING_VERIFICATION";
          } else {
            invStatus = "OVERDUE";
          }

          const [invoice] = await tx
            .insert(s.invoices)
            .values({
              studentId,
              academicYearId: academicYear.id,
              month,
              dueDate,
              amount: 450000,
              status: invStatus,
            })
            .onConflictDoUpdate({
              target: [s.invoices.studentId, s.invoices.academicYearId, s.invoices.month],
              set: { status: invStatus, amount: 450000, updatedAt: new Date() },
            })
            .returning();
          invoiceCount++;

          // Jika status PAID atau PENDING_VERIFICATION, buat transaksi payment
          if (scenario === "P" || scenario === "PT" || scenario === "PV") {
            const isCash = scenario === "P";
            const isPending = scenario === "PV";
            const payStatus = isPending ? "PENDING_VERIFICATION" : "APPROVED";

            const [payment] = await tx
              .insert(s.payments)
              .values({
                studentId,
                createdBy: isCash ? tuUser.id : (st.guardianName === "Bpk. Hendra Pratama" ? waliUser.id : tuUser.id),
                idempotencyKey: randomUUID(),
                amount: 450000,
                method: isCash ? "CASH" : "TRANSFER",
                status: payStatus,
                paidOn: dueDate,
                notes: isCash
                  ? `Pembayaran Tunai Kasir SPP Bulan ${month.slice(0, 7)}`
                  : `Transfer Bank Pembayaran SPP Bulan ${month.slice(0, 7)}`,
                reviewedBy: isPending ? null : tuUser.id,
                reviewReason: isPending ? null : "Verifikasi bukti pembayaran valid",
              })
              .returning();

            await tx
              .insert(s.paymentInvoiceItems)
              .values({
                paymentId: payment.id,
                invoiceId: invoice.id,
                amount: 450000,
              })
              .onConflictDoNothing();

            paymentCount++;
          }
        }
      }
      console.log(`-> 8. Tagihan & Pembayaran SPP: ${invoiceCount} invoice dan ${paymentCount} transaksi pembayaran dicatat`);

      // 9. Master Jenis Ujian & Periode Ujian
      const [ptsType] = await tx
        .insert(s.examTypes)
        .values({ name: "Penilaian Tengah Semester (PTS)" })
        .onConflictDoUpdate({
          target: s.examTypes.name,
          set: { updatedAt: new Date() },
        })
        .returning();

      const [pasType] = await tx
        .insert(s.examTypes)
        .values({ name: "Penilaian Akhir Semester (PAS)" })
        .onConflictDoUpdate({
          target: s.examTypes.name,
          set: { updatedAt: new Date() },
        })
        .returning();

      // Periode Ujian PTS Ganjil (Aktif)
      const existingPts = (
        await tx
          .select()
          .from(s.examPeriods)
          .where(eq(s.examPeriods.name, "PTS Ganjil 2026/2027"))
      )[0];

      let ptsPeriodId = existingPts?.id;
      if (!existingPts) {
        const [ptsPeriod] = await tx
          .insert(s.examPeriods)
          .values({
            name: "PTS Ganjil 2026/2027",
            academicYearId: academicYear.id,
            examTypeId: ptsType.id,
            semester: 1,
            startDate: "2026-09-21",
            endDate: "2026-09-26",
            administrativeDeadline: "2026-09-15",
            requiredUntilMonth: "2026-09-01",
            guardianDownload: true,
          })
          .returning();
        ptsPeriodId = ptsPeriod.id;
      }

      // Periode Ujian PAS Ganjil (Mendatang)
      const existingPas = (
        await tx
          .select()
          .from(s.examPeriods)
          .where(eq(s.examPeriods.name, "PAS Ganjil 2026/2027"))
      )[0];

      let pasPeriodId = existingPas?.id;
      if (!existingPas) {
        const [pasPeriod] = await tx
          .insert(s.examPeriods)
          .values({
            name: "PAS Ganjil 2026/2027",
            academicYearId: academicYear.id,
            examTypeId: pasType.id,
            semester: 1,
            startDate: "2026-12-07",
            endDate: "2026-12-12",
            administrativeDeadline: "2026-12-01",
            requiredUntilMonth: "2026-11-01",
            guardianDownload: false,
          })
          .returning();
        pasPeriodId = pasPeriod.id;
      }
      console.log("-> 9. Master jenis & periode ujian: PTS Ganjil & PAS Ganjil 2026/2027");

      // 10. Evaluasi Kelayakan & Kartu Ujian PTS Ganjil (Syarat lunas s/d Sept 2026)
      // Siswa selain Bilal lunas s/d September 2026.
      let eligibleCount = 0;
      let cardCount = 0;

      for (const st of studentData) {
        const studentId = studentMap.get(st.name)!;

        if (st.name === "Bilal Al-Ghifari") {
          // Bilal menunggak Agustus & September 2026 -> Kasus Dispensasi Disetujui
          const [dispensation] = await tx
            .insert(s.dispensations)
            .values({
              studentId,
              examPeriodId: ptsPeriodId!,
              requestedBy: tuUser.id,
              reason: "Keluarga tertimpa musibah sakit, memohon izin mengikuti ujian dengan komitmen pelunasan.",
              status: "APPROVED",
            })
            .onConflictDoUpdate({
              target: [s.dispensations.studentId, s.dispensations.examPeriodId],
              set: { status: "APPROVED", updatedAt: new Date() },
            })
            .returning();

          await tx
            .insert(s.dispensationReviews)
            .values({
              dispensationId: dispensation.id,
              reviewerId: kepsekUser.id,
              action: "APPROVED",
              notes: "Disetujui oleh Kepala Sekolah dengan mempertimbangkan kondisi keluarga siswa.",
            })
            .onConflictDoNothing();

          await tx
            .insert(s.paymentPromises)
            .values({
              dispensationId: dispensation.id,
              amount: 900000,
              promisedOn: "2026-10-15",
            })
            .onConflictDoUpdate({
              target: s.paymentPromises.dispensationId,
              set: { amount: 900000, promisedOn: "2026-10-15", updatedAt: new Date() },
            });

          await tx
            .insert(s.studentExamEligibilities)
            .values({
              studentId,
              examPeriodId: ptsPeriodId!,
              status: "ELIGIBLE_DISPENSATION",
              reason: "Dispensasi disetujui Kepala Sekolah (Komitmen janji bayar: 15 Okt 2026)",
            })
            .onConflictDoUpdate({
              target: [s.studentExamEligibilities.studentId, s.studentExamEligibilities.examPeriodId],
              set: {
                status: "ELIGIBLE_DISPENSATION",
                reason: "Dispensasi disetujui Kepala Sekolah (Komitmen janji bayar: 15 Okt 2026)",
                updatedAt: new Date(),
              },
            });

          await tx
            .insert(s.examCards)
            .values({
              studentId,
              examPeriodId: ptsPeriodId!,
              createdBy: adminUser.id,
              verificationCode: randomUUID(),
            })
            .onConflictDoNothing();
          cardCount++;
        } else {
          // Lunas s/d Sept -> ELIGIBLE
          await tx
            .insert(s.studentExamEligibilities)
            .values({
              studentId,
              examPeriodId: ptsPeriodId!,
              status: "ELIGIBLE",
              reason: "Lunas seluruh kewajiban administrasi SPP s/d September 2026",
            })
            .onConflictDoUpdate({
              target: [s.studentExamEligibilities.studentId, s.studentExamEligibilities.examPeriodId],
              set: {
                status: "ELIGIBLE",
                reason: "Lunas seluruh kewajiban administrasi SPP s/d September 2026",
                updatedAt: new Date(),
              },
            });
          eligibleCount++;

          await tx
            .insert(s.examCards)
            .values({
              studentId,
              examPeriodId: ptsPeriodId!,
              createdBy: adminUser.id,
              verificationCode: randomUUID(),
            })
            .onConflictDoNothing();
          cardCount++;
        }
      }

      // Tambahkan dispensasi aktif untuk PAS Ganjil agar layar verifikasi TU & Kepsek memiliki antrean aktif:
      const maryamId = studentMap.get("Maryam Khadijah")!;
      await tx
        .insert(s.dispensations)
        .values({
          studentId: maryamId,
          examPeriodId: pasPeriodId!,
          requestedBy: tuUser.id,
          reason: "Usaha orang tua sedang mengalami penurunan omset, mengajukan penundaan SPP Oktober-November.",
          status: "SUBMITTED",
        })
        .onConflictDoNothing();

      const aliId = studentMap.get("Ali bin Abi Thalib")!;
      const [aliDisp] = await tx
        .insert(s.dispensations)
        .values({
          studentId: aliId,
          examPeriodId: pasPeriodId!,
          requestedBy: tuUser.id,
          reason: "Menunggu pembayaran gaji orang tua tanggal 25, memohon dispensasi PAS.",
          status: "REVIEWED",
        })
        .onConflictDoUpdate({
          target: [s.dispensations.studentId, s.dispensations.examPeriodId],
          set: { status: "REVIEWED", updatedAt: new Date() },
        })
        .returning();

      await tx
        .insert(s.dispensationReviews)
        .values({
          dispensationId: aliDisp.id,
          reviewerId: tuUser.id,
          action: "REVIEWED",
          notes: "Berkas surat permohonan telah diverifikasi staf TU. Diteruskan ke Kepala Sekolah.",
        })
        .onConflictDoNothing();

      console.log(`-> 10. Kelayakan ujian & kartu ber-QR: ${cardCount} kartu ujian terbit, 2 antrean dispensasi aktif`);

      // 11. Templat Formulir Karakteristik Siswa & Contoh Pengisian
      const existingForm = (
        await tx
          .select()
          .from(s.characteristicFormTemplates)
          .where(eq(s.characteristicFormTemplates.name, "Instrumen Karakter & Ibadah Harian Ganjil 2026/2027"))
      )[0];

      let formTemplateId = existingForm?.id;
      if (!existingForm) {
        const [formTemplate] = await tx
          .insert(s.characteristicFormTemplates)
          .values({
            name: "Instrumen Karakter & Ibadah Harian Ganjil 2026/2027",
            deadline: "2026-12-20",
            active: true,
          })
          .returning();
        formTemplateId = formTemplate.id;

        const fields = [
          { label: "Kedisiplinan Shalat Fardhu 5 Waktu di Rumah / Masjid", position: 1 },
          { label: "Capaian Hafalan Al-Qur'an (Juz / Surah Terakhir)", position: 2 },
          { label: "Rutinitas Muroja'ah dan Tilawah Mandiri", position: 3 },
          { label: "Kemandirian, Akhlak, dan Adab Terhadap Orang Tua", position: 4 },
        ];

        const fieldIds: string[] = [];
        for (const f of fields) {
          const [field] = await tx
            .insert(s.characteristicFormFields)
            .values({
              templateId: formTemplateId,
              label: f.label,
              position: f.position,
              required: true,
            })
            .returning();
          fieldIds.push(field.id);
        }

        // Contoh submission oleh wali murid untuk Muhammad Fatih Pratama
        const fatihId = studentMap.get("Muhammad Fatih Pratama")!;
        const [submission] = await tx
          .insert(s.characteristicSubmissions)
          .values({
            templateId: formTemplateId,
            studentId: fatihId,
            submittedBy: waliUser.id,
          })
          .returning();

        const answers = [
          "Alhamdulillah shalat 5 waktu tertib, subuh dan isya rutin berjamaah di masjid kompleks.",
          "Hafalan Juz 30 (An-Naba sampai An-Nas) mutqin.",
          "Muroja'ah mandiri setiap ba'da maghrib minimal 15-20 menit.",
          "Mandiri menyiapkan perlengkapan sekolah dan santun kepada orang tua.",
        ];

        for (let i = 0; i < fieldIds.length; i++) {
          await tx.insert(s.characteristicAnswers).values({
            submissionId: submission.id,
            fieldId: fieldIds[i],
            value: answers[i],
          });
        }
      }
      console.log("-> 11. Templat formulir karakteristik siswa & contoh pengisian tersimpan");

      // 12. Audit Log Inisialisasi Seeder
      await tx.insert(s.auditLogs).values({
        userId: adminUser.id,
        action: "DATA_SEED_COMPLETED",
        entity: "system",
        entityId: "seed-2026",
        after: {
          timestamp: new Date().toISOString(),
          students: studentData.length,
          classes: classNames.length,
          invoices: invoiceCount,
          payments: paymentCount,
        },
      });
      console.log("-> 12. Pencatatan audit trail seeder selesai");
    });

    console.log("\n=== SEEDER BERHASIL DIJALANKAN DENGAN SEMPURNA ===");
  } finally {
    await close();
  }
}

main().catch((err) => {
  console.error("Gagal menjalankan seeder:", err);
  process.exit(1);
});
