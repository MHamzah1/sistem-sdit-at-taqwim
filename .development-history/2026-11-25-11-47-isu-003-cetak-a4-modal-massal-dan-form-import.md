# ISU-003: A4 Biodata Print Gender/Religion, Bulk Exam Card Modal Overflow, Parent Form Defaults & XLSX Template

- **Date:** 2026-11-25 11:47 WIB
- **Object:** `ISU-003` ([rencana-perbaikan.md](../docs/isu/ISU-003-cetak-a4-modal-massal-dan-form-import/rencana-perbaikan.md))
- **Verdict:** **LULUS** (Completed)

## Task Summary
Fix A4 student biodata preview defaulting `gender === null` to `"Perempuan / Islam"`, fix horizontal clipping inside `BulkCardsModal`, allow saving students without filling optional parent/emergency sections, add spacing to form completeness labels, and align the XLSX import template with active class names and `TANGGAL_MASUK`.

## Relevant Previous Context
`UJI-001` identified incorrect A4 output (`Perempuan / Islam` for `Muhammad Fatih Pratama`), horizontal overflow on `Rombel / Kelas` inside `BulkCardsModal`, false `422` errors from default `fatherMode`/`motherMode = "new"` (and `emergencyContact.phone = ""`), cramped header text, and `"1-A Abu Bakar"` / missing `TANGGAL_MASUK` in the XLSX import template.

## Changes Made
1. **`src/app/(app)/master/siswa/_components/StudentDetailView.tsx`:** Updated A4 gender rendering (`"L" -> "Laki-laki"`, `"P" -> "Perempuan"`, else `"—"`) and religion fallback (`"—"`).
2. **`src/components/modals/BulkCardsModal.tsx` & `src/production.css`:** Expanded dialog width (`max-w-4xl`), switched filter grid to responsive layout with `min-w-0`, and replaced fixed `width: 95vw; max-width: 1000px` on `.bulk-modal-wrapper` with `width: 100%; max-width: 100%`.
3. **`src/app/(app)/master/siswa/_components/StudentFormView.tsx` & `server/studentMaster.ts`:** Automatically sent `mode: "none"` for empty father/mother sections and omitted empty `emergencyContact`; relaxed optional empty `emergencyContact.phone` Zod transform while keeping invalid-phone rejection intact; added `gap-3 flex-wrap` on form completeness row.
4. **`server/studentMaster.ts` & `src/app/(app)/master/siswa/page.tsx` & `tests/student-master.test.ts`:** Updated `generateStudentImportTemplateXlsx` with `TANGGAL_MASUK` (`"2026-07-13"`) and sample class `"Kelas 1A"`, unified frontend download via `/api/students/import/template`, and expanded `TC-94` assertions.

## Files Affected
- `src/app/(app)/master/siswa/_components/StudentDetailView.tsx`
- `src/components/modals/BulkCardsModal.tsx`
- `src/production.css`
- `src/app/(app)/master/siswa/_components/StudentFormView.tsx`
- `src/app/(app)/master/siswa/page.tsx`
- `server/studentMaster.ts`
- `tests/student-master.test.ts`

## Technical Decisions
- Reused `/api/students/import/template` as the single source of truth for XLSX template generation instead of maintaining duplicate client-side worksheet arrays in `master/siswa/page.tsx`.

## Verification Performed
- `npm run typecheck`: **0 errors**
- `npm test`: **67 passed, 0 failed** (including updated `TC-94`)
- `npm run build`: **Compiled successfully (exit code 0)**
- Live Playwright Chromium (`headless: false`) on `http://localhost:3002`:
  - `TC-18`: A4 modal shows `— / —` (no `Perempuan / Islam`).
  - `TC-18b`: `Cetak Massal` modal `dialogOverflow: false`, `clippedRight: false`.
  - `TC-11`: Submitting new student without filling Father/Mother/Emergency returned HTTP `201`.
  - `TC-13`: Downloaded XLSX contains `TANGGAL_MASUK` and `KELAS = "Kelas 1A"`.

## Final Result & Known Limitations
All `ISU-003` data presentation, modal layout, form payload, and XLSX template defects are resolved.
