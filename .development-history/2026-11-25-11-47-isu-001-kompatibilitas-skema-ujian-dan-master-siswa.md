# ISU-001: Schema Compatibility for Exam Cards, Finance, & Student Master (`BASE_30` / `V3`)

- **Date:** 2026-11-25 11:47 WIB
- **Object:** `ISU-001` ([rencana-perbaikan.md](../docs/isu/ISU-001-kompatibilitas-skema-ujian-dan-master-siswa/rencana-perbaikan.md))
- **Verdict:** **LULUS** (Completed)

## Task Summary
Resolve HTTP `503 SCHEMA_NOT_READY` failures across `POST /api/exam-cards`, `POST /api/exam-cards/bulk`, invoice/payment/dispensation recalculation, Student Master endpoints, and 15 failing tests in `tests/business.test.ts` caused by Drizzle queries selecting V3 columns not yet present on 30-table/13-column databases and incomplete SQLSTATE `cause.code` checks.

## Relevant Previous Context
During live browser testing (`UJI-001`), the active Neon DB had 30 tables / 13 `students` columns while `src/db/schema.ts` declared 23 `students` columns and 10 V3 tables. Subsequently at 11:31 WIB, migration `migrations/postgres/0002_same_dark_beast.sql` was added and applied to Neon DB (upgrading runtime & PGlite test migrations to 40 tables / V3). Compatibility helpers ensure both 40-table V3 and 30-table `BASE_30` environments execute cleanly without `503 SCHEMA_NOT_READY`.

## Changes Made
1. **`server/state.ts`:** Added `STUDENT_BASE_COLUMNS`, `StudentSchemaMode` (`"V3" | "BASE_30"`), `detectStudentSchemaMode()`, and `toCompatStudentRow()`, and refactored `readState()`'s `42703` fallback to reuse them.
2. **`server/business.ts` & `server/app.ts`:** Replaced `.select().from(s.students)` in `lockStudent`, `recalculate`, `generateInvoices`, and `POST /api/exam-cards/bulk` with `STUDENT_BASE_COLUMNS`; updated `GET /api/student-drafts` to detect schema mode and return `{ drafts, schemaMode }`.
3. **`server/studentMaster.ts`:** Updated `getStudentDrafts` & `getProfileChangeRequests` catch blocks to use `isSchemaNotReady(err)` (handles `err.cause.code`); added `detectStudentSchemaMode` routing and parameterized `BASE_30` SQL fallbacks to `createStudentAtomic`, `getStudentFullProfile`, `updateStudentProfile`, `previewStudentImport`, `commitStudentImport`, and `getStudentsCompletenessSummary`.
4. **`src/app/(app)/master/siswa/page.tsx` & `tambah/page.tsx`:** Added `localStorage` fallback support for drafts when `BASE_30` / `SCHEMA_NOT_READY` occurs and fixed DB draft title fallback to display `d.data?.student?.name`.
5. **`tests/business.test.ts` & `tests/student-master.test.ts`:** Updated schema table assertion to `40` + `STUDENT_BASE_COLUMNS` and added end-to-end regression tests for wrapped `cause.code = 42P01`, `V3`, and simulated `BASE_30` environments.

## Files Affected
- `server/state.ts`
- `server/business.ts`
- `server/app.ts`
- `server/studentMaster.ts`
- `src/app/(app)/master/siswa/page.tsx`
- `src/app/(app)/master/siswa/tambah/page.tsx`
- `tests/business.test.ts`
- `tests/student-master.test.ts`

## Technical Decisions
- Chose runtime capability detection (`detectStudentSchemaMode` via `information_schema`) before entering transactions so PostgreSQL transactions never hit SQL errors (`25P02` abort state), using Drizzle `sql` parameterized `INSERT` when running in `BASE_30` fallback mode.

## Verification Performed
- `npm run typecheck`: **0 errors**
- `npm test`: **67 passed, 0 failed** (including all 20 business integration subtests and `ISU-001` regression tests)
- `npm run build`: **Compiled successfully (exit code 0)**
- Live Playwright Chromium (`headless: false`) on `http://localhost:3002`: `POST /api/exam-cards -> 201` (QR visible), `GET /api/students/:id/profile -> 200`, `POST /api/student-drafts -> 201`, `POST /api/students/profile -> 201`, `/ubah` loaded cleanly, `0` HTTP 5xx errors.

## Final Result & Known Limitations
All `ISU-001` symptoms are resolved. In environments that intentionally remain on `BASE_30` (30 tables), V3-only sections cannot persist to PostgreSQL tables until `0002` is migrated and rely on local browser drafts.
