# .claude — Konfigurasi Claude Code SDIT AT-TAQWIM

Sumber kebenaran skill & rules untuk Claude Code pada sistem **SDIT AT-TAQWIM — Sistem SPP & Kelayakan Ujian**.
Stack resmi: **Next.js 15 (App Router)**, **React 19**, **TypeScript**, **Drizzle ORM**, **Neon PostgreSQL**, dan **Private Vercel Blob**.

---

## 1. Sistem Objek & Penamaan

Setiap pekerjaan dikelompokkan ke dalam tepat satu **objek**. Nama skill = `[objek]-[aksi]`, dan awalan skill = awalan ID = nama folder.
Aturan lengkap: [`rules/alur-kerja.md`](rules/alur-kerja.md).

| Objek | Kapan Digunakan | ID | Direktori Dokumen |
|---|---|---|---|
| **Fitur** | Kemampuan baru yang belum ada di sistem | `slug` kebab-case | `docs/fitur/[slug]/` |
| **Tugas** | Potongan kerja vertikal (*vertical slice*) dari fitur | `TGS-NNN` | `docs/fitur/[slug]/tugas/TGS-NNN-[nama].md` |
| **Isu** | Fitur sudah ada, tapi rusak/salah/bug | `ISU-NNN` | `docs/isu/ISU-NNN-[nama]/` |
| **Revisi** | Fitur sudah ada dan benar, tetapi ingin diubah alurnya | `REV-NNN` | `docs/revisi/REV-NNN-[nama].md` |
| **Data** | Perubahan skema atau migrasi data PostgreSQL | `DAT-NNN` | `docs/data/DAT-NNN-[nama].md` |
| **Uji** | Uji live browser (Playwright) | `UJI-NNN` (`TC-NN`) | `docs/uji/UJI-NNN-[menu]/` |

---

## 2. Siklus Pengerjaan (Peta Alur)

Setiap permintaan masuk diklasifikasikan berdasarkan objeknya, lalu mengikuti siklus:
**Rencana → Persetujuan Pengguna → Eksekusi → Verifikasi → Laporan.**

```mermaid
flowchart TD
    START(["Permintaan masuk"]) --> Q{"Objeknya apa?"}

    Q -->|"belum ada"| F1["/fitur-riset<br/>1-riset.md"]
    F1 --> F2["/fitur-wawancara<br/>2-wawancara.md"]
    F2 --> F3["/fitur-spesifikasi<br/>3-spesifikasi.md"]
    F3 --> F4["/fitur-pecah-tugas<br/>TGS-NNN"]
    F4 --> GT{{"setujui TGS-NNN"}}
    GT --> TK["/tugas-kerjakan"]

    Q -->|"rusak / salah"| I1["/isu-diagnosa<br/>ISU-NNN"]
    I1 --> GI{{"setujui ISU-NNN"}}
    GI --> IP["/isu-perbaiki<br/>reproduksi → RED → GREEN"]

    Q -->|"benar, ingin diubah"| R1["/revisi-wawancara<br/>REV-NNN"]
    R1 --> GR{{"setujui REV-NNN"}}
    GR --> RT["/revisi-terapkan"]

    Q -->|"skema / data DB"| D1["/data-periksa<br/>rencana DAT-NNN"]
    D1 --> GD{{"setujui DAT-NNN"}}
    GD --> DC["/data-jalankan DAT-NNN<br/>migrasi Drizzle + cocokkan"]

    Q -->|"uji tampilan & alur"| U1["/uji-browser<br/>UJI-NNN"]
    U1 -->|"TC gagal"| I1
    Q -->|"sapuan kode"| AK["/audit-kode<br/>hasil di chat"]
    AK -->|"temuan"| I1

    TK --> V["/verifikasi<br/>typecheck · test · next build"]
    IP --> V
    RT --> V
    V --> VQ{"Vonis"}
    VQ -->|"GAGAL / SEBAGIAN"| FIX["perbaiki via<br/>skill eksekusi"]
    FIX -.-> V
    VQ -->|"LULUS"| L["/laporan<br/>.development-history · status selesai"]
    DC -->|"hasil cocok"| L
    L --> CLR(["Selesai / Lanjut Siklus Berikutnya"])

    classDef rencana fill:#f3e8ff,stroke:#9333ea,color:#3b0764
    classDef bacasaja fill:#dbeafe,stroke:#2563eb,color:#172554
    classDef gerbang fill:#fef3c7,stroke:#d97706,color:#451a03
    classDef eksekusi fill:#ffedd5,stroke:#ea580c,color:#431407
    classDef penutup fill:#dcfce7,stroke:#16a34a,color:#052e16
    classDef netral fill:#f3f4f6,stroke:#6b7280,color:#111827
    class F1,F2,F3,F4,R1,U1 rencana
    class I1,D1,DC,AK bacasaja
    class GT,GI,GR,GD gerbang
    class TK,IP,RT,FIX eksekusi
    class V,VQ,L penutup
    class START,Q,CLR netral
```

---

## 3. Siklus Status Dokumen

Berlaku untuk `TGS`, `ISU` (`rencana-perbaikan.md`), `REV`, `DAT`, dan `UJI`:

```mermaid
stateDiagram-v2
    direction LR
    [*] --> usulan: skill rencana menulis dokumen
    usulan --> disetujui: user menyetujui ID-nya
    usulan --> ditolak: user menolak
    disetujui --> berjalan: skill eksekusi mulai
    berjalan --> terblokir: ada penghalang
    terblokir --> berjalan: penghalang selesai
    berjalan --> selesai: LULUS verifikasi → /laporan
    selesai --> [*]
    ditolak --> [*]
```

---

## 4. Daftar Skill (`commands/`)

| Kelompok | Skill | Fungsi | Hak Akses |
|---|---|---|---|
| **Fitur** | `/fitur-riset` | Riset codebase & dokumen sistem → `1-riset.md` | Tulis docs |
| | `/fitur-wawancara` | Wawancara terstruktur + rekomendasi terbaik → `2-wawancara.md` | Tulis docs |
| | `/fitur-spesifikasi` | Spesifikasi final fitur sekolah → `3-spesifikasi.md` | Tulis docs |
| | `/fitur-pecah-tugas` | Pecah spesifikasi jadi potongan tugas vertical slice `TGS-NNN` | Tulis docs |
| **Tugas** | `/tugas-kerjakan` | Kerjakan satu TGS yang disetujui (mendukung mode batch) | Ubah source |
| **Isu** | `/isu-diagnosa` | Telusuri akar masalah bug sampai baris file | **Read-only** |
| | `/isu-perbaiki` | Perbaiki bug yang disetujui (reproduksi → test regresi RED → GREEN) | Ubah source |
| **Revisi** | `/revisi-wawancara` | Rekam kebutuhan revisi alur existing → `REV-NNN` | Tulis docs |
| | `/revisi-terapkan` | Terapkan revisi yang disetujui | Ubah source |
| **Data** | `/data-periksa` | Periksa skema/data DB dev → rencana migrasi `DAT-NNN` | **Read-only** |
| | `/data-jalankan` | Jalankan migrasi Drizzle/script DAT yang disetujui | Ubah DB dev |
| | `/db-bandingkan` | Bandingkan skema `schema.ts` terhadap migrasi | **Read-only** |
| | `/db-sinkron` | Terapkan migrasi tertunda ke DB development | Ubah DB dev |
| **Uji** | `/uji-browser` | Test case P0–P5, Playwright Chromium, tangkapan layar | Baca & UI |
| **Verifikasi** | `/verifikasi` | Jalankan `typecheck`, `test` (PGlite), `next build`, audit diff | Baca & Run |
| | `/laporan` | Tutup tiket ke `.development-history/` dan status selesai | Tulis docs |
| **Audit** | `/audit-kode` | Sapuan bug berisiko, celah otorisasi, dan debt (di chat) | Read-only |
| | `/audit-progres` | Evaluasi kelengkapan menu & modul SDIT AT-TAQWIM (di chat) | Read-only |
| | `/logging` | Panduan audit trail tabel `audit_logs` dan larangan log rahasia | — |

---

## 5. Daftar Aturan Baku (`rules/`)

- [`alur-kerja.md`](rules/alur-kerja.md): Konvensi objek, ID, status, dan aturan persetujuan pengguna.
- [`project-context.md`](rules/project-context.md): Konteks arsitektur Next.js 15, batasan scope, dan hard rules.
- [`kelayakan-dan-keuangan.md`](rules/kelayakan-dan-keuangan.md): Logika SPP, evaluasi ujian 3-syarat, dispensasi, dan kartu QR.
- [`backend-serverless.md`](rules/backend-serverless.md): Route Handlers Next.js, Web Fetch API, Drizzle ORM, autentikasi HMAC, dan Vercel Blob.
- [`database.md`](rules/database.md): Standar Drizzle ORM, migrasi PostgreSQL Neon, transaksi, dan isolasi PGlite.
- [`frontend-react.md`](rules/frontend-react.md): Standar Next.js App Router, React 19, komponen modular, dan client API helper.
- [`form.md`](rules/form.md): Standar form `DataForm`, `Field`, `Modal`, validasi input nominal dan berkas.
- [`list-table.md`](rules/list-table.md): Standar tabel `DataTable`, filter pencarian, dan badge semantik.
- [`display-formatting.md`](rules/display-formatting.md): Format mata uang `money()`, status sekolah, tanggal WIB, dan normalisasi telepon.
- [`tests.md`](rules/tests.md): Pengujian unit `node:test` berfokus pada logika risiko tinggi dengan database PGlite.
- [`logging.md`](rules/logging.md): Pencatatan audit trail ke tabel `audit_logs` dan larangan kebocoran data rahasia.
