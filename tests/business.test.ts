import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { fixture } from "./fixture";
import * as s from "../src/db/schema";
import {
  evaluate,
  monthsBetween,
  normalizePhone,
  today,
} from "../server/business";
import { hashPassword, verifyPassword } from "../server/security";
import { validateSignature } from "../server/files";
import { handle } from "../server/app";
import {
  terbilang,
  receiptNumber,
  examParticipantNumber,
  calculateArrearsRisk,
} from "../src/data";
test("eligibility checks missing invoices, old debt, and dispensations separately", () => {
  const required = monthsBetween("2026-08-15", "2026-11-01");
  assert.equal(required.length, 4);
  const invoices = required.map((month) => ({
    month,
    status: month === "2026-08-01" ? "UNPAID" : "PAID",
  }));
  assert.equal(evaluate(required, invoices, false).status, "NOT_ELIGIBLE");
  assert.equal(
    evaluate(required, invoices, true).status,
    "ELIGIBLE_DISPENSATION",
  );
  assert.equal(
    evaluate(required, invoices.slice(1), false).status,
    "NOT_ELIGIBLE",
  );
  assert.equal(
    evaluate(
      required,
      required.map((month) => ({ month, status: "PAID" })),
      false,
    ).status,
    "ELIGIBLE",
  );
  assert.equal(
    evaluate(
      required,
      required.map((month) => ({ month, status: "PAID" })),
      false,
      [],
    ).status,
    "NOT_ELIGIBLE",
    "Invoices from another academic year cannot replace missing current-year invoices",
  );
});
test("phone normalization, signatures, password hashing", async () => {
  assert.equal(normalizePhone("0812 3456 7890"), "6281234567890");
  assert.throws(() => normalizePhone("javascript:alert(1)"));
  assert.equal(
    validateSignature(Buffer.from("%PDF-1.7"), "application/pdf"),
    true,
  );
  assert.equal(validateSignature(Buffer.from("<html>"), "image/jpeg"), false);
  const password = randomUUID();
  const hash = await hashPassword(password);
  assert.notEqual(hash, password);
  assert.equal(await verifyPassword(password, hash), true);
  assert.equal(await verifyPassword("wrong", hash), false);
  assert.equal(terbilang(450000), "Empat Ratus Lima Puluh Ribu Rupiah");
  assert.equal(terbilang(150000), "Seratus Lima Puluh Ribu Rupiah");
  assert.equal(terbilang(1000000), "Satu Juta Rupiah");
  assert.equal(terbilang(0), "Nol Rupiah");
  assert.equal(
    receiptNumber("2026-11-19", "abc12345-0000"),
    "KW-20261119-ABC123",
  );
});
test("PostgreSQL migration and all critical API flows", async (t) => {
  const f = await fixture();
  const { db, cookie, request } = f;
  let yearId = "";
  let classId = "";
  let studentId = "";
  let otherStudentId = "";
  let examId = "";
  let guardianId = "";
  let guardianCookie = "";
  let tuCookie = "";
  let principalCookie = "";
  let transferId = "";
  let rejectedId = "";
  let dispensationId = "";
  const year = Number(today().slice(0, 4));
  const begin = `${year}-01-01`;
  const end = `${year}-12-31`;
  const post = async (
    path: string,
    body: unknown,
    session = cookie,
    expected = 201,
  ) => {
    const response = await request(path, "POST", body, session);
    const data = await response.json();
    assert.equal(response.status, expected, JSON.stringify(data));
    return data;
  };
  try {
    await t.test(
      "migration creates all relational tables, health queries DB, no dummy records",
      async () => {
        const health = await request("health");
        assert.deepEqual(await health.json(), {
          status: "ok",
          database: "connected",
        });
        const count = await db.execute(
          sql`select count(*)::int as count from information_schema.tables where table_schema = 'public'`,
        );
        assert.equal(count.rows[0].count, 30);
        assert.equal((await db.select().from(s.students)).length, 0);
      },
    );
    await t.test("authentication and unauthorized endpoints", async () => {
      assert.equal((await request("students")).status, 401);
      assert.equal(
        (
          await request("auth/login", "POST", {
            email: f.email,
            password: "wrong",
          })
        ).status,
        401,
      );
      const me = await request("auth/me", "GET", undefined, cookie);
      assert.equal(me.status, 200);
      assert.ok(!(await me.text()).includes("passwordHash"));
      const csrf = await handle(
        new Request("http://localhost:3000/api/students", {
          method: "POST",
          headers: {
            cookie,
            origin: "https://evil.example",
            "content-type": "application/json",
          },
          body: "{}",
        }),
        db,
      );
      assert.equal(csrf.status, 403);
    });
    await t.test(
      "CRUD academic years, classes, guardians, students with constraints",
      async () => {
        yearId = (
          await post("academic-years", {
            name: `Test ${year}`,
            startDate: begin,
            endDate: end,
            active: true,
          })
        ).id;
        classId = (
          await post("classes", { name: "Test A", academicYearId: yearId })
        ).id;
        studentId = (
          await post("students", {
            name: "Siswa Pertama",
            nis: "TEST-1",
            classId,
            enrolledOn: begin,
            active: true,
          })
        ).id;
        otherStudentId = (
          await post("students", {
            name: "Siswa Kedua",
            nis: "TEST-2",
            classId,
            enrolledOn: begin,
            active: true,
          })
        ).id;
        await post(
          "students",
          { name: "Duplicate", nis: "TEST-1", classId, enrolledOn: begin },
          cookie,
          409,
        );
        const updated = await request(
          `students/${studentId}`,
          "PATCH",
          {
            name: "Siswa Pertama Edit",
            nis: "TEST-1",
            classId,
            enrolledOn: begin,
            active: true,
          },
          cookie,
        );
        assert.equal(updated.status, 200);
        await post(
          "students",
          {
            name: "Invalid NISN",
            nis: "TEST-INVALID-NISN",
            nisn: "12345",
            classId,
            enrolledOn: begin,
          },
          cookie,
          422,
        );
        await post(
          "students",
          {
            name: "Invalid Gender",
            nis: "TEST-INVALID-GENDER",
            gender: "X",
            classId,
            enrolledOn: begin,
          },
          cookie,
          422,
        );
        const updatedWithIdentity = await request(
          `students/${studentId}`,
          "PATCH",
          {
            name: "Siswa Pertama Edit",
            nis: "TEST-1",
            nisn: "0123456789",
            gender: "L",
            birthPlace: "Tangerang",
            birthDate: "2018-05-15",
            photoUrl: "https://example.com/student.jpg",
            classId,
            enrolledOn: begin,
            active: true,
          },
          cookie,
        );
        assert.equal(updatedWithIdentity.status, 200);
        const savedStudent = await updatedWithIdentity.json();
        assert.equal(savedStudent.nisn, "0123456789");
        assert.equal(savedStudent.gender, "L");
        assert.equal(savedStudent.birthPlace, "Tangerang");
        assert.equal(savedStudent.birthDate, "2018-05-15");
        assert.equal(savedStudent.photoUrl, "https://example.com/student.jpg");
        const temp = await post("students", {
          name: "Temporary",
          nis: "TEST-DELETE",
          classId,
          enrolledOn: begin,
        });
        assert.equal(
          (await request(`students/${temp.id}`, "DELETE", undefined, cookie))
            .status,
          200,
        );
        const tempGuardian = await post("guardians", {
          name: "Temporary Guardian",
          phone: "081234567890",
        });
        assert.equal(
          (
            await request(
              `guardians/${tempGuardian.id}`,
              "DELETE",
              undefined,
              cookie,
            )
          ).status,
          200,
        );
      },
    );
    await t.test(
      "role accounts and guardian ownership enforced server side",
      async () => {
        async function account(role: string) {
          const email = `${role.toLowerCase()}@example.test`;
          const user = await post("users", {
            name: role,
            email,
            password: f.password,
            role,
          });
          const response = await request("auth/login", "POST", {
            email,
            password: f.password,
          });
          assert.equal(response.status, 200);
          return {
            id: user.id,
            cookie: response.headers.get("set-cookie")!.split(";")[0],
          };
        }
        const guardian = await account("WALI_MURID");
        guardianCookie = guardian.cookie;
        tuCookie = (await account("TU_KEUANGAN")).cookie;
        principalCookie = (await account("KEPALA_SEKOLAH")).cookie;
        guardianId = (
          await post("guardians", {
            name: "Wali Pertama",
            phone: "081234567890",
            userId: guardian.id,
          })
        ).id;
        const updatedGuardian = await request(
          `guardians/${guardianId}`,
          "PATCH",
          {
            name: "Wali Pertama",
            phone: "+62 812 3456 7890",
            userId: guardian.id,
          },
          cookie,
        );
        assert.equal(updatedGuardian.status, 200);
        assert.equal((await updatedGuardian.json()).phone, "6281234567890");
        await post("guardian-students", { guardianId, studentId }, cookie, 200);
        const state = await (
          await request("state", "GET", undefined, guardianCookie)
        ).json();
        assert.equal(state.students.length, 1);
        assert.equal(state.students[0].id, studentId);
        assert.equal(state.users.length, 0);
        assert.equal(state.auditLogs.length, 0);
        await post(
          "students",
          { name: "Forbidden", nis: "NO", classId, enrolledOn: begin },
          guardianCookie,
          403,
        );
        await post("users", {}, tuCookie, 403);
      },
    );
    await t.test(
      "Master SPP and duplicate-safe invoice generation",
      async () => {
        await post("spp/config", {
          academicYearId: yearId,
          amount: 125000,
          dueDay: 10,
        });
        for (const month of ["01", "02", "03", "04"])
          await post("invoices/generate", {
            academicYearId: yearId,
            month: `${year}-${month}-01`,
          });
        assert.equal(
          (
            await post("invoices/generate", {
              academicYearId: yearId,
              month: begin,
            })
          ).created,
          0,
        );
        assert.equal((await db.select().from(s.invoices)).length, 8);
        const config = (await db.select().from(s.sppConfigs))[0];
        await request(
          `spp/config/${config.id}`,
          "PATCH",
          { academicYearId: yearId, amount: 150000, dueDay: 10 },
          cookie,
        );
        assert.ok(
          (await db.select().from(s.invoices)).every(
            (i) => i.amount === 125000,
          ),
        );
      },
    );
    await t.test("exam period and missing invoice eligibility", async () => {
      const type = await post("exam-types", { name: "Test Exam" });
      examId = (
        await post("exams", {
          name: "Test Ujian",
          academicYearId: yearId,
          examTypeId: type.id,
          semester: 1,
          startDate: `${year}-06-10`,
          endDate: `${year}-06-15`,
          administrativeDeadline: `${year}-06-01`,
          requiredUntilMonth: `${year}-04-01`,
          guardianDownload: true,
        })
      ).id;
      const results = await post(
        `exams/${examId}/eligibility`,
        { studentId },
        cookie,
        200,
      );
      assert.equal(results[0].status, "NOT_ELIGIBLE");
      await post(
        `exams/${examId}/eligibility`,
        { studentId: otherStudentId },
        guardianCookie,
        403,
      );
      await post(
        "exam-cards",
        { studentId, examPeriodId: examId },
        guardianCookie,
        409,
      );
    });
    await t.test(
      "cash payment uses database amounts and retries are idempotent",
      async () => {
        const invoice = (
          await db
            .select()
            .from(s.invoices)
            .where(eq(s.invoices.studentId, studentId))
        )[0];
        const input = {
          studentId,
          invoiceIds: [invoice.id],
          method: "CASH",
          paidOn: today(),
          idempotencyKey: randomUUID(),
        };
        await post("payments", { ...input, amount: 1 }, cookie, 422);
        const payment = await post("payments", input, tuCookie);
        assert.equal(payment.amount, 125000);
        assert.equal(payment.status, "APPROVED");
        assert.equal((await post("payments", input, tuCookie)).id, payment.id);
        await post(
          "payments",
          { ...input, idempotencyKey: randomUUID() },
          tuCookie,
          409,
        );
        assert.equal(
          (
            await db
              .select()
              .from(s.invoices)
              .where(eq(s.invoices.id, invoice.id))
          )[0].status,
          "PAID",
        );
        await post(
          "payments",
          { ...input, idempotencyKey: randomUUID() },
          guardianCookie,
          403,
        );
      },
    );
    await t.test(
      "transfer requires proof ownership, invoice remains pending",
      async () => {
        const actor = await (
          await request("auth/me", "GET", undefined, guardianCookie)
        ).json();
        const invoice = (
          await db
            .select()
            .from(s.invoices)
            .where(eq(s.invoices.studentId, studentId))
        ).find((i) => i.status !== "PAID")!;
        const input = {
          studentId,
          invoiceIds: [invoice.id],
          method: "TRANSFER",
          paidOn: today(),
          idempotencyKey: randomUUID(),
        };
        await post("payments", input, guardianCookie, 422);
        // Blob integration is tested separately against a real private store; this fixture supplies verified metadata.
        const [proof] = await db
          .insert(s.paymentProofs)
          .values({
            url: "https://test.private.blob.vercel-storage.com/proof.pdf",
            pathname: "test/proof.pdf",
            filename: "proof.pdf",
            mimeType: "application/pdf",
            size: 100,
            uploaderId: actor.actor.id,
          })
          .returning();
        await post("payments", { ...input, proofId: proof.id }, tuCookie, 409);
        const payment = await post(
          "payments",
          { ...input, proofId: proof.id },
          guardianCookie,
        );
        transferId = payment.id;
        assert.equal(payment.status, "PENDING_VERIFICATION");
        assert.equal(
          (
            await db
              .select()
              .from(s.invoices)
              .where(eq(s.invoices.id, invoice.id))
          )[0].status,
          "PENDING_VERIFICATION",
        );
        await post(
          `payments/${transferId}/approve`,
          { reason: "Unauthorized" },
          guardianCookie,
          403,
        );
      },
    );
    await t.test("approve transfer exactly once", async () => {
      await post(
        `payments/${transferId}/approve`,
        { reason: "Valid" },
        tuCookie,
        200,
      );
      await post(
        `payments/${transferId}/approve`,
        { reason: "Replay" },
        tuCookie,
        409,
      );
      const guardianState = await (
        await request("state", "GET", undefined, guardianCookie)
      ).json();
      const approvedPayment = guardianState.payments.find(
        (p: { id: string }) => p.id === transferId,
      );
      assert.equal(approvedPayment?.status, "APPROVED");
      const items = guardianState.paymentItems.filter(
        (it: { paymentId: string }) => it.paymentId === transferId,
      );
      assert.ok(items.length > 0);
    });
    await t.test(
      "rejected transfer releases invoice without marking paid",
      async () => {
        const actor = await (
          await request("auth/me", "GET", undefined, guardianCookie)
        ).json();
        const invoice = (
          await db
            .select()
            .from(s.invoices)
            .where(eq(s.invoices.studentId, studentId))
        ).find((i) => i.status !== "PAID")!;
        const [proof] = await db
          .insert(s.paymentProofs)
          .values({
            url: "https://test.private.blob.vercel-storage.com/reject.pdf",
            pathname: "test/reject.pdf",
            filename: "reject.pdf",
            mimeType: "application/pdf",
            size: 100,
            uploaderId: actor.actor.id,
          })
          .returning();
        rejectedId = (
          await post(
            "payments",
            {
              studentId,
              invoiceIds: [invoice.id],
              method: "TRANSFER",
              paidOn: today(),
              proofId: proof.id,
              idempotencyKey: randomUUID(),
            },
            guardianCookie,
          )
        ).id;
        await post(
          `payments/${rejectedId}/reject`,
          { reason: "" },
          tuCookie,
          422,
        );
        await post(
          `payments/${rejectedId}/reject`,
          { reason: "Bukti tidak sesuai" },
          tuCookie,
          200,
        );
        assert.equal(
          (
            await db
              .select()
              .from(s.invoices)
              .where(eq(s.invoices.id, invoice.id))
          )[0].status,
          "UNPAID",
        );
      },
    );
    await t.test("financial rollback when audit insert fails", async () => {
      const invoices = await db
        .select()
        .from(s.invoices)
        .where(eq(s.invoices.studentId, otherStudentId));
      await db.execute(
        sql`create function fail_audit_test() returns trigger language plpgsql as $$ begin if NEW.action = 'PAYMENT_CREATED' then raise exception 'test rollback'; end if; return NEW; end; $$`,
      );
      await db.execute(
        sql`create trigger test_audit_failure before insert on audit_logs for each row execute function fail_audit_test()`,
      );
      const input = {
        studentId: otherStudentId,
        invoiceIds: [invoices[0].id],
        method: "CASH",
        paidOn: today(),
        idempotencyKey: randomUUID(),
      };
      await post("payments", input, tuCookie, 503);
      assert.equal(
        (
          await db
            .select()
            .from(s.payments)
            .where(eq(s.payments.idempotencyKey, input.idempotencyKey))
        ).length,
        0,
      );
      assert.notEqual(
        (
          await db
            .select()
            .from(s.invoices)
            .where(eq(s.invoices.id, invoices[0].id))
        )[0].status,
        "PAID",
      );
      await db.execute(sql`drop trigger test_audit_failure on audit_logs`);
    });
    await t.test(
      "TU review required, principal approval only, dispensation never pays invoices",
      async () => {
        dispensationId = (
          await post(
            "dispensations",
            {
              studentId,
              examPeriodId: examId,
              reason: "Permohonan cicilan keluarga",
              amount: 50000,
              promisedOn: end,
            },
            guardianCookie,
          )
        ).id;
        await post(
          `dispensations/${dispensationId}/approve`,
          { notes: "Belum review" },
          principalCookie,
          409,
        );
        await post(
          `dispensations/${dispensationId}/review`,
          { notes: "Sudah diperiksa TU" },
          tuCookie,
          200,
        );
        await post(
          `dispensations/${dispensationId}/approve`,
          { notes: "TU cannot approve" },
          tuCookie,
          403,
        );
        const before = await db
          .select()
          .from(s.invoices)
          .where(eq(s.invoices.studentId, studentId));
        await post(
          `dispensations/${dispensationId}/approve`,
          { notes: "Disetujui Kepala Sekolah" },
          principalCookie,
          200,
        );
        assert.deepEqual(
          (
            await db
              .select()
              .from(s.invoices)
              .where(eq(s.invoices.studentId, studentId))
          ).map((i) => i.status),
          before.map((i) => i.status),
        );
        const eligibility = (
          await db
            .select()
            .from(s.studentExamEligibilities)
            .where(eq(s.studentExamEligibilities.studentId, studentId))
        )[0];
        assert.equal(eligibility.status, "ELIGIBLE_DISPENSATION");
        await post(
          `dispensations/${dispensationId}/approve`,
          { notes: "Replay" },
          principalCookie,
          409,
        );
      },
    );
    await t.test(
      "exam cards authorized, persisted, and revalidated",
      async () => {
        const card = await post(
          "exam-cards",
          { studentId, examPeriodId: examId },
          guardianCookie,
        );
        const validated = await (
          await request(
            `exam-cards/${card.verificationCode}/validate`,
            "GET",
            undefined,
            tuCookie,
          )
        ).json();
        assert.equal(validated.valid, true);
        await post(
          "exam-cards",
          { studentId: otherStudentId, examPeriodId: examId },
          guardianCookie,
          403,
        );
        await db
          .update(s.examPeriods)
          .set({ guardianDownload: false })
          .where(eq(s.examPeriods.id, examId));
        await post(
          "exam-cards",
          { studentId, examPeriodId: examId },
          guardianCookie,
          403,
        );
      },
    );
    await t.test(
      "bulk exam card generation for eligible students in class, skips ineligible",
      async () => {
        await post(
          "exam-cards/bulk",
          { examPeriodId: examId },
          guardianCookie,
          403,
        );
        const bulkRes = await post(
          "exam-cards/bulk",
          { examPeriodId: examId },
          tuCookie,
          200,
        );
        assert.ok(bulkRes.totalStudents >= 2);
        assert.ok(bulkRes.eligibleCount >= 1);
        assert.ok(Array.isArray(bulkRes.cards));
        assert.equal(bulkRes.cards.length, bulkRes.eligibleCount);

        const classBulk = await post(
          "exam-cards/bulk",
          { examPeriodId: examId, classId },
          tuCookie,
          200,
        );
        assert.ok(classBulk.totalStudents >= 1);
        assert.ok(Array.isArray(classBulk.cards));
      },
    );
    await t.test(
      "WhatsApp reminder uses persisted amount, name, exam and deadline",
      async () => {
        const result = await (
          await request(
            `students/${studentId}/reminder?examId=${examId}`,
            "GET",
            undefined,
            tuCookie,
          )
        ).json();
        assert.ok(result.url.startsWith("https://wa.me/6281234567890?text="));
        const message = decodeURIComponent(result.url);
        assert.ok(message.includes("Siswa Pertama Edit"));
        assert.ok(message.includes("250.000"));
        assert.ok(message.includes("Test Ujian"));

        // Test without examId (routine reminder)
        const routineResult = await (
          await request(
            `students/${studentId}/reminder`,
            "GET",
            undefined,
            tuCookie,
          )
        ).json();
        assert.ok(
          routineResult.url.startsWith("https://wa.me/6281234567890?text="),
        );
        assert.ok(routineResult.message.includes("Siswa Pertama Edit"));
        assert.ok(routineResult.risk);
        assert.equal(routineResult.risk.level, "MEDIUM");
      },
    );
    await t.test(
      "arrears risk level calculation is accurate and categorized",
      () => {
        assert.equal(calculateArrearsRisk(0).level, "NONE");
        assert.equal(calculateArrearsRisk(1).level, "LOW");
        assert.equal(calculateArrearsRisk(2).level, "MEDIUM");
        assert.equal(calculateArrearsRisk(3).level, "HIGH");
        assert.equal(calculateArrearsRisk(5).level, "HIGH");
      },
    );
    await t.test("form template, answers and owner validation", async () => {
      const template = await post(
        "forms",
        {
          name: "Karakteristik Test",
          deadline: end,
          fields: [{ label: "Kebiasaan anak", required: true }],
        },
        tuCookie,
      );
      const fields = await db
        .select()
        .from(s.characteristicFormFields)
        .where(eq(s.characteristicFormFields.templateId, template.id));
      await post(
        "form-submissions",
        { templateId: template.id, studentId, answers: [] },
        guardianCookie,
        422,
      );
      await post(
        "form-submissions",
        {
          templateId: template.id,
          studentId,
          answers: [{ fieldId: fields[0].id, value: "Membaca" }],
        },
        guardianCookie,
      );
      await post(
        "form-submissions",
        {
          templateId: template.id,
          studentId: otherStudentId,
          answers: [{ fieldId: fields[0].id, value: "IDOR" }],
        },
        guardianCookie,
        403,
      );
    });
    await t.test("reports, audit logs and file IDOR", async () => {
      assert.equal(
        (await request("reports/spp", "GET", undefined, principalCookie))
          .status,
        200,
      );
      const logs = await (
        await request("audit-logs", "GET", undefined, cookie)
      ).json();
      assert.ok(
        logs.some(
          (l: { action: string }) => l.action === "DISPENSATION_APPROVED",
        ),
      );
      assert.ok(!JSON.stringify(logs).includes(f.password));
      assert.equal(
        (await request("audit-logs", "GET", undefined, guardianCookie)).status,
        403,
      );
      await post(
        "files",
        { pathname: "proofs/someone-else/file.pdf" },
        guardianCookie,
        403,
      );
      await post(
        "settings",
        { schoolName: "Test School", phone: "081234567890" },
        cookie,
        200,
      );
    });
    await t.test(
      "logout revokes session and cross-session persistence remains",
      async () => {
        await post("auth/logout", {}, guardianCookie, 200);
        assert.equal(
          (await request("state", "GET", undefined, guardianCookie)).status,
          401,
        );
        const response = await request("auth/login", "POST", {
          email: f.email,
          password: f.password,
        });
        const freshCookie = response.headers.get("set-cookie")!.split(";")[0];
        const state = await (
          await request("state", "GET", undefined, freshCookie)
        ).json();
        assert.equal(state.students.length, 2);
        assert.ok(state.payments.length >= 3);
        assert.ok(state.paymentItems.length >= 3);
        assert.ok(Array.isArray(state.examCards));
        const invalid = await request(
          "students?page=-1",
          "GET",
          undefined,
          cookie,
        );
        assert.equal(invalid.status, 422);
      },
    );
    await t.test(
      "exam participant number formatting is deterministic and alphabetical",
      () => {
        const classStudents = [
          { id: "s-2", name: "Budi Santoso" },
          { id: "s-1", name: "Ahmad Fauzi" },
          { id: "s-3", name: "Citra Lestari" },
        ];
        const numAhmad = examParticipantNumber(
          "Penilaian Tengah Semester 1",
          "2026/2027",
          "Kelas 1A",
          "s-1",
          classStudents,
        );
        assert.equal(numAhmad, "PTS26-1A-001");

        const numBudi = examParticipantNumber(
          "Penilaian Tengah Semester 1",
          "2026/2027",
          "Kelas 1A",
          "s-2",
          classStudents,
        );
        assert.equal(numBudi, "PTS26-1A-002");

        const numCitra = examParticipantNumber(
          "Penilaian Akhir Semester Ganjil",
          "2026/2027",
          "1A",
          "s-3",
          classStudents,
        );
        assert.equal(numCitra, "PAS26-1A-003");
      },
    );
  } finally {
    await f.pg.close();
  }
});
