# Development Report: TGS-001 — Payment Items State & Indonesian Currency Speller

- **Task ID:** TGS-001
- **Feature Slug:** `kuitansi-pembayaran-spp`
- **Date & Time:** 2026-11-19 14:30 WIB
- **Target:** Backend State (`server/state.ts`), Data Helpers (`src/data.ts`), Test Suite (`tests/business.test.ts`)

---

## 1. Task Summary

TGS-001 establishes the data foundation and formatting utilities for official fee payment receipts. It exposes the relational mapping of paid invoice items (`paymentInvoiceItems`) via `readState()` in `server/state.ts` while enforcing strict guardian scoping (anti-IDOR). It also introduces Indonesian number-to-words spelling (`terbilang()`) and deterministic receipt number generation (`receiptNumber()`) in `src/data.ts`.

---

## 2. Relevant Previous Context

Previously, `payments` records in `AppState` only provided aggregate payment totals and student IDs. The client application had no direct visibility into which specific invoice months were covered by a payment without guessing. Furthermore, the frontend lacked an official Indonesian currency verbalizer (*terbilang*) required for formal receipt documentation.

---

## 3. Changes Made

1. **Exposed Scoped Payment Items in `server/state.ts`:**
   - Queried `s.paymentInvoiceItems` filtered by the active, scoped `payments.map(p => p.id)`.
   - Guaranteed that `WALI_MURID` users only receive items linked to payments of their connected students.
   - Added `paymentItems` to the `readState()` return payload and exported `AppState` type.
2. **Implemented Receipt Utilities in `src/data.ts`:**
   - Added `angkaKeKata(n: number)` and `terbilang(amount: number): string` handling zero, units, tens, hundreds, thousands, millions, billions, and trillions followed by `"Rupiah"`.
   - Added `receiptNumber(paidOn: string, id: string): string` generating deterministic reference codes matching `KW-YYYYMMDD-[6-char-ID]`.
3. **Automated Verification in `tests/business.test.ts`:**
   - Added unit test assertions verifying verbalizer outputs (e.g. `450000` -> `"Empat Ratus Lima Puluh Ribu Rupiah"`).
   - Added assertions ensuring `state.paymentItems` is delivered and properly populated.

---

## 4. Files Affected

- `server/state.ts` (modified)
- `src/data.ts` (modified)
- `tests/business.test.ts` (modified)
- `docs/fitur/kuitansi-pembayaran-spp/tugas/TGS-001-state-item-pembayaran-dan-terbilang.md` (status updated to `selesai`)
- `docs/fitur/kuitansi-pembayaran-spp/4-urutan-tugas.md` (status updated to `selesai`)

---

## 5. Technical Decisions

- **Deterministic Receipt Numbering:** Adopted `KW-YYYYMMDD-[ID.slice(0,6).toUpperCase()]` to prevent concurrency bottlenecks or sequence number table requirements while guaranteeing uniqueness and bi-directional traceability.
- **Strict Scoping Reuse:** Leveraged existing `scoped(s.payments.studentId)` logic so that item queries inherently inherit zero-leak protection without repeating SQL where-clauses.

---

## 6. Verification Performed

- **TypeScript Typecheck:** `npm run typecheck` passed with 0 errors.
- **Test Suite:** `npm test` ran 20 tests with 0 failures (100% pass rate).
- **Audit Diff:** Clean git diff with no secret leaks, no console logs, and parameterized queries.

---

## 7. Final Result & Known Limitations

- **Result:** TGS-001 is completed and verified. Data and utility functions are ready for UI consumption in TGS-002.
- **Known Limitations:** None.
