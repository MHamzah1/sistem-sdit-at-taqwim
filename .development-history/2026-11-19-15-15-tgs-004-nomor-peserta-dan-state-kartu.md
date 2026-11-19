# Development Report: TGS-004 - Exam Participant Number & Card State Integration

**Date:** 2026-11-19 15:15 WIB  
**Ticket:** TGS-004  
**Feature:** `nomor-peserta-dan-cetak-massal-kartu`  
**Status:** Completed  

---

## 1. Summary of Changes

1. **State Integration (`server/state.ts`):**
   - Added query for `s.examCards` within `readState()` protected by guardian scoping `scoped(s.examCards.studentId)`.
   - Exposed `examCards` in `AppState` for fast client-side presence check and batch card rendering.

2. **Exam Participant Number Generator (`src/data.ts`):**
   - Implemented `examParticipantNumber(examName, yearName, className, studentId, classStudents)` according to locked decisions KT-1, KT-2, and KT-3:
     - Formats as `[ExamCode][Year2Digit]-[ClassCode]-[Sequence3Digit]`, e.g. `PTS26-1A-001`.
     - Sequences students strictly alphabetically (A-Z) by name within the class.
     - Supports clean abbreviations for standard exams (`PTS`, `PAS`, `PAT`, `UAS`) and fallback acronym extraction.

3. **UI Integration (`src/main.tsx`, `src/production.css`):**
   - Integrated participant number badge display inside individual Exam Card modal preview.
   - Styled `.participant-badge` and `.participant-number` with monospace font and prominent school emerald theme.

4. **Testing (`tests/business.test.ts`):**
   - Added unit tests for alphabetical determinism and pattern validation of `examParticipantNumber()`.
   - Added assertion checking that `state.examCards` is always returned as an array.

---

## 2. Verification Results

- `npm run typecheck`: Passed with 0 errors.
- `npm test`: 21 passed, 0 failed across all critical API flows and unit tests.
