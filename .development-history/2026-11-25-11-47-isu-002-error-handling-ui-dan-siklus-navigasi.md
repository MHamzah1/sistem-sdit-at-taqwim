# ISU-002: Global/Local Error Handling UI & Auth/State Navigation Cycle Optimization

- **Date:** 2026-11-25 11:47 WIB
- **Object:** `ISU-002` ([rencana-perbaikan.md](../docs/isu/ISU-002-error-handling-ui-dan-siklus-navigasi/rencana-perbaikan.md))
- **Verdict:** **LULUS** (Completed)

## Task Summary
Ensure API failures (such as `409 RELATION_VIOLATION` on delete or submit rejections) are surfaced visibly in UI alerts without triggering `unhandledRejection` overlays, prevent unauthenticated `/api/student-drafts 401` fetches on `/master/siswa`, and stop `AppContext` from refetching `/api/state` on every sidebar route change.

## Relevant Previous Context
`UJI-001` (`TC-05`, `TC-06`, `TC-11`, `TC-01`, `TC-04`) showed `AppShell` ignored `error` from `useApp()`, `handleDelete`/`handleFinalSubmit` left `run()`/`onSave()` errors uncaught, unauthenticated `/master/siswa` fired API fetches prior to `/masuk` redirect, and `AppContext.refresh` recreated itself on `pathname` changes.

## Changes Made
1. **`src/components/AppShell.tsx`:** Destructured `error` and `setError` from `useApp()` and rendered a dismissible `role="alert"` error banner inside `<main>`.
2. **`src/lib/context/AppContext.tsx`:** Replaced `pathname` dependency in `refresh` with `pathnameRef` so sidebar navigation reuses cached state cleanly while keeping `401 -> /masuk` redirect and explicit mutation/manual refresh intact; auto-cleared stale `error` on pathname change / 8s timeout.
3. **`src/app/(app)/master/siswa/page.tsx`, `[id]/page.tsx`, `master/kelas/page.tsx`:** Guarded initial Student Master background fetches behind `if (!state?.actor) return;` and wrapped `handleDelete` in `try/catch` with modal-scoped `deleteError` alerts.
4. **`src/app/(app)/master/siswa/_components/StudentFormView.tsx`:** Added `submitError` state with `try/catch` around `onSave` & `onSaveDraft` and rendered an inline form alert banner.

## Files Affected
- `src/components/AppShell.tsx`
- `src/lib/context/AppContext.tsx`
- `src/app/(app)/master/siswa/page.tsx`
- `src/app/(app)/master/siswa/[id]/page.tsx`
- `src/app/(app)/master/kelas/page.tsx`
- `src/app/(app)/master/siswa/_components/StudentFormView.tsx`

## Technical Decisions
- Kept `run()` re-throwing in `AppContext` so modals/forms can still decide whether to close or display contextual inline errors, while guaranteeing both global (`AppShell`) and local alerts handle errors cleanly without uncaught promise rejections.

## Verification Performed
- `npm run typecheck`: **0 errors**
- `npm test`: **67 passed, 0 failed**
- `npm run build`: **Compiled successfully (exit code 0)**
- Live Playwright Chromium (`headless: false`) on `http://localhost:3002`:
  - `TC-01`: Unauth `/master/siswa -> /masuk` with `0` `/api/student-drafts` `401` calls.
  - `TC-05` & `TC-06`: Delete protected student & `Kelas 1A` showed `"Data masih digunakan atau relasi tidak ditemukan"` in both modal alert and `AppShell` banner with `0` `unhandledRejection`.
  - Final session `pageErrors: []`, `unhandledRejections: 0`.

## Final Result & Known Limitations
All `ISU-002` UI error visibility, uncaught rejection, and navigation fetch cycle defects are resolved.
