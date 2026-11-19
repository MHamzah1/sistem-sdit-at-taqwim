# Development Report: TGS-005 - Bulk Exam Cards Endpoint & Multi-Card Print Sheet

**Date:** 2026-11-19 15:22 WIB  
**Ticket:** TGS-005  
**Feature:** `nomor-peserta-dan-cetak-massal-kartu`  
**Status:** Completed  

---

## 1. Summary of Changes

1. **Backend Bulk Generation Endpoint (`server/app.ts`):**
   - Added endpoint `POST /api/exam-cards/bulk` accepting `{ examPeriodId, classId? }`.
   - Strictly enforced staff-only access (403 for guardians, requires `read` grant).
   - Recalculates up-to-date eligibility for every student in the selection.
   - Automatically skips students who are not eligible (`NOT_ELIGIBLE`), returning summary counts (`totalStudents`, `eligibleCount`, `ineligibleCount`).
   - Inserts exam cards idempotently using `onConflictDoNothing()` and records audit event `EXAM_CARDS_BULK_GENERATED`.

2. **Frontend UI & Printing (`src/main.tsx`, `src/production.css`):**
   - Added `"Cetak Massal Kartu"` button to the exam card page (`/ujian/kartu`).
   - Built interactive `BulkCardsModal`:
     - Select Exam Period and Class filter (or "Semua Kelas").
     - Generates QR codes in parallel with `Promise.all()`.
     - Displays informative summary badge: shows number of eligible cards ready to print and number of ineligible students automatically skipped.
     - Formats layout into pages of exactly **2 cards per A4 sheet** with dashed cut line (`.bulk-cut-line` with `✂ Gunting di sini`).
     - Triggers native `window.print()` cleanly with print isolation.

3. **Print Stylesheet (`src/production.css`):**
   - Added `.bulk-cards-sheet`, `.bulk-card-page`, `.bulk-card-item`, and `.bulk-cut-line`.
   - Configured print media query `@media print` with `.bulk-cards-sheet` isolation, page break rules (`page-break-after: always`), and hiding all web app shell chrome.

4. **Integration Test Suite (`tests/business.test.ts`):**
   - Added integration test validating bulk endpoint permission enforcement, full generation of cards for eligible students, class filtering, and skipping ineligible students.

---

## 2. Verification Results

- `npm run typecheck`: Passed with 0 errors.
- `npm test`: 22 passed, 0 failed across all critical test suites.
- `npm run build`: Production Next.js build compiled successfully in standalone mode.
