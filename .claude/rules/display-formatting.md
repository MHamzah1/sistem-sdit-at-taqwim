# Display Formatting (Format Tampilan)

> Berlaku untuk: Seluruh format mata uang, tanggal, status, dan nomor telepon (`src/data.ts`, `src/components.tsx`, `src/main.tsx`).

---

## 1. Format Uang Rupiah (`money`)

- Semua nominal uang Rupiah yang ditampilkan ke pengguna **wajib** menggunakan helper `money()` dari `src/data.ts`:
  ```ts
  import { money } from "@/src/data";

  money(150000); // Hasil: "Rp150.000"
  ```
- **Aturan:**
  - Jangan membuat fungsi formatter Rupiah lokal baru.
  - Jangan menampilkan desimal/sen (,00) karena SPP sekolah menggunakan angka bulat penuh.

---

## 2. Format Status (`statusLabels`)

Gunakan kamus status resmi dari `src/data.ts` untuk menampilkan label status dalam Bahasa Indonesia yang baku:

| Kode Internal | Label Tampilan |
|---|---|
| `UNPAID` | Belum bayar |
| `PENDING_VERIFICATION` | Menunggu verifikasi |
| `PAID` | Lunas |
| `OVERDUE` | Lewat jatuh tempo |
| `APPROVED` | Disetujui |
| `REJECTED` | Ditolak |
| `SUBMITTED` | Diajukan |
| `REVIEWED` | Direview TU |
| `NOT_EVALUATED` | Belum dievaluasi |
| `NOT_ELIGIBLE` | Belum layak |
| `ELIGIBLE` | Layak ujian |
| `ELIGIBLE_DISPENSATION` | Layak · Dispensasi |

---

## 3. Format Tanggal & Waktu (WIB)

1. **Zona Waktu Terpatok:**
   - Semua kalkulasi dan tanggal sistem dipatok pada zona waktu **WIB (`Asia/Jakarta`)**.
2. **Penyajian Tampilan:**
   - Tanggal tampilan tabel: `new Date(dateString).toLocaleDateString("id-ID")` atau `toLocaleString("id-ID")`.
   - Format form input `type="date"`: selalu `YYYY-MM-DD` (ISO string).
   - Format bulan tagihan: selalu `YYYY-MM-01`.

---

## 4. Normalisasi Nomor Telepon (`normalizePhone`)

- Nomor telepon wali murid atau kontak sekolah dinormalisasi ke format internasional Indonesia tanpa karakter pemisah:
  - Input: `0812-3456-7890` → Output: `6281234567890`.
  - Format ini digunakan untuk menghasilkan tautan pesan WhatsApp reminder:
    ```ts
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(pesan)}`;
    ```
