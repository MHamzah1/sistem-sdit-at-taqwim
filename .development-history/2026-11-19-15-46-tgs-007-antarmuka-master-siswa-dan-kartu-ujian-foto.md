# Development Report: TGS-007 - Student Master UI & 3x4 Exam Card Photo Integration

**Date:** 2026-11-19 15:46 WIB  
**Ticket:** TGS-007  
**Feature:** `kelengkapan-identitas-siswa`  
**Status:** Completed  

---

## 1. Summary of Changes

1. **Student Master Dialog & Form Fields (`src/main.tsx`):**
   - Expanded `studentFields` to support:
     - NISN (10 digits, optional).
     - Gender (`L` for Laki-laki, `P` for Perempuan).
     - Place of birth (`birthPlace`).
     - Date of birth (`birthDate`, datepicker).
     - Photo URL (`photoUrl`, optional).
     - Class (`classId`), enrollment date (`enrolledOn`), and active status (`active`).

2. **Master Student Table & Search Enhancement (`src/main.tsx`, `src/production.css`):**
   - Configured `studentTable` with thumbnail photo avatar (`.avatar-img`) with fallback to initial letter badge colored by gender (`.gender-badge.gender-l` / `.gender-badge.gender-p`).
   - Extended `searchText` in `DataTable` so users can search students by Name, NIS, NISN, Place of Birth, or Class.

3. **3x4 Photo & NISN Integration on Exam Cards (`src/main.tsx`, `src/production.css`):**
   - Updated both Individual Card modal and Bulk Exam Cards Print modal (`BulkCardsModal`):
     - Displays official NIS and NISN (`NIS: ... · NISN: ...`).
     - Added 3x4 photo frame container (`.student-photo-frame`, 75x100px) supporting sharp student photo or an elegant placeholder box (`.student-photo-placeholder`) if not yet uploaded.
     - Positioned alongside the validation QR code in `.exam-card-media`.
     - Added print stylesheet support (`print-color-adjust: exact`) so photos and placeholders print sharply on A4 sheets.

---

## 2. Verification Results

- `npm run typecheck`: Passed with 0 errors.
- `npm test`: 22 passed, 0 failed.
- `npm run build`: Production Next.js build compiled successfully in standalone mode.
