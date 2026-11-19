# Development Report: TGS-008 - Arrears Risk Calculator & Flexible WhatsApp Reminder Endpoint

**Date:** 2026-11-19 16:09 WIB  
**Ticket:** TGS-008  
**Feature:** `risiko-tunggakan-dan-whatsapp`  
**Status:** Completed  

---

## 1. Summary of Changes

1. **Arrears Risk Engine (`src/data.ts`):**
   - Implemented `calculateArrearsRisk(unpaidMonths)`:
     - 0 months: `NONE` ("Lancar").
     - 1 month: `LOW` ("Risiko Rendah", emerald/green).
     - 2 months: `MEDIUM` ("Risiko Sedang", yellow/orange).
     - ≥3 months: `HIGH` ("Risiko Tinggi", red/critical).

2. **Dynamic WhatsApp Template Generator (`src/data.ts`):**
   - Built `buildReminderMessage(...)` supporting 4 contextual templates:
     - `routine`: Polite monthly reminder for 1 month overdue.
     - `due_date`: Reminder emphasizing payment due date for 2 months overdue.
     - `exam_critical`: Firm reminder detailing exam eligibility and dispensation option for ≥3 months overdue.
     - `dispensation`: Reminder for students with agreed payment promises.
   - Formats overdue months transparently (e.g., "Juli 2026, Agustus 2026") and nominal in formatted Rupiah.

3. **Flexible Reminder Endpoint (`server/app.ts`):**
   - Upgraded `GET /api/students/:id/reminder`:
     - Made `examId` optional, allowing routine monthly collection outside exam periods.
     - Added support for `template` query parameter.
     - Returns structured JSON `{ message, url, phone, guardianName, studentName, className, totalAmount, unpaidMonths, risk }`.
     - Logged audit trail `WHATSAPP_REMINDER_GENERATED` with amount and risk metadata.

4. **Testing (`tests/business.test.ts`):**
   - Added unit tests for `calculateArrearsRisk()`.
   - Added integration test validating reminder generation without `examId` and checking risk metadata.

---

## 2. Verification Results

- `npm run typecheck`: Passed with 0 errors.
- `npm test`: 23 passed, 0 failed across all test suites.
