# Logging & Audit Trail

> Berlaku untuk: `server/**`, `app/**`, `src/**`

Sistem mengimplementasikan audit log terstruktur berbasis database untuk menjaga akuntabilitas setiap perubahan finansial dan data akademik.

---

## 1. Audit Trail Bisnis (`audit_logs`)

Setiap tindakan perubahan data penting dicatat ke tabel `audit_logs` melalui fungsi helper `audit()` di `server/security.ts`:

```ts
await audit(tx, context, {
  action: "CREATE" | "UPDATE" | "DELETE" | "APPROVE" | "REJECT",
  entity: "payment" | "invoice" | "student" | "dispensation" | "setting",
  entityId: targetId,
  before: snapshotLama || null,
  after: snapshotBaru || null,
});
```

Informasi yang otomatis direkam oleh sistem:
- ID Pengguna (`userId`) dan peran.
- Alamat IP (`ip`) dan User Agent (`userAgent`).
- Payload sebelum (`before`) dan sesudah (`after`) dalam format JSONB.
- Waktu kejadian (`createdAt` dengan timezone).

---

## 2. Aturan Larangan Keras (Zero Secret Leak)

1. **Dilarang Mencatat Data Rahasia:**
   - Dilarang mencatat kata sandi mentah (*plain password*), salt, atau hash scrypt.
   - Dilarang mencatat token sesi acak, secret cookie, atau `AUTH_SECRET`.
   - Dilarang mencatat connection string database (`DATABASE_URL`) atau token Vercel Blob.
2. **Respon Error Aman:**
   - Respon HTTP ke client hanya mengembalikan pesan status ringkas dan deskriptif.
   - Dilarang mengembalikan stack trace error sistem, potongan query SQL, atau nama tabel internal ke respon client publik.
3. **Pembersihan Log Debug:**
   - Dilarang meninggalkan pernyataan `console.log` atau `console.debug` sementara di file route dan service setelah selesai implementasi.
