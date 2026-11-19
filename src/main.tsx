"use client";

import {
  StrictMode,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { createRoot } from "react-dom/client";
import {
  LayoutDashboard,
  Users,
  ContactRound,
  School,
  Wallet,
  ReceiptText,
  ArrowLeftRight,
  BadgeCheck,
  CircleDollarSign,
  CalendarDays,
  ShieldCheck,
  FileCheck2,
  IdCard,
  ClipboardList,
  BarChart3,
  Settings,
  ChevronRight,
  Plus,
  Download,
  ArrowRight,
  Menu,
  LogOut,
  Printer,
  RefreshCw,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import QRCode from "qrcode";
import type { AppState } from "../server/state";
import {
  api,
  ApiError,
  csvCell,
  downloadProof,
  saveFile,
  uploadProof,
} from "./lib/api";
import {
  money,
  menuGroups,
  statusLabels,
  terbilang,
  receiptNumber,
} from "./data";
import {
  Badge,
  Brand,
  DataForm,
  DataTable,
  Modal,
  Panel,
  type Field,
  type FormSpec,
  type Values,
} from "./components";
import "./styles.css";
import "./production.css";
const icons: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  students: Users,
  guardians: ContactRound,
  classes: School,
  master: Wallet,
  invoices: ReceiptText,
  payments: ArrowLeftRight,
  verify: BadgeCheck,
  arrears: CircleDollarSign,
  exams: CalendarDays,
  eligibility: ShieldCheck,
  dispensation: FileCheck2,
  cards: IdCard,
  forms: ClipboardList,
  reports: BarChart3,
  settings: Settings,
  audit: ClipboardList,
};
const today = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
type Student = AppState["students"][number];
type Card = {
  verificationCode: string;
  studentId: string;
  exam: AppState["exams"][number];
  eligibility: AppState["eligibilities"][number];
};
function Login({ success }: { success: () => void }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      await api("auth/login", "POST", {
        email: data.get("email"),
        password: data.get("password"),
      });
      success();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal masuk");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login-shell">
      <section className="panel login-panel">
        <Brand />
        <h1>Masuk ke akun sekolah</h1>
        <p>Administrasi SPP dan kelayakan ujian.</p>
        <form onSubmit={login}>
          <label>
            Email
            <input name="email" type="email" autoComplete="username" required />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={128}
            />
          </label>
          {error && (
            <div className="notice amber" role="alert">
              {error}
            </div>
          )}
          <button className="primary full" disabled={busy}>
            {busy ? "Memeriksa akun…" : "Masuk"}
          </button>
        </form>
        <small>Hubungi administrator sekolah jika belum memiliki akun.</small>
      </section>
    </div>
  );
}
export function App() {
  const [state, setState] = useState<AppState | null>(null);
  const [signedOut, setSignedOut] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [path, setPath] = useState(
    typeof window !== "undefined" && window.location.pathname !== "/"
      ? window.location.pathname
      : "/dashboard",
  );
  const [sidebar, setSidebar] = useState(false);
  const [form, setForm] = useState<FormSpec | null>(null);
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const [paymentStudent, setPaymentStudent] = useState<string | null>(null);
  const [card, setCard] = useState<Card | null>(null);
  const [receiptPayment, setReceiptPayment] = useState<
    AppState["payments"][number] | null
  >(null);
  const [qr, setQr] = useState("");
  const [examId, setExamId] = useState("");
  const [yearId, setYearId] = useState("");
  const [period, setPeriod] = useState(today().slice(0, 7));
  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const data = await api<AppState>("state");
      setState(data);
      setSignedOut(false);
      setExamId((id) =>
        data.exams.some((e) => e.id === id) ? id : data.exams[0]?.id || "",
      );
      setYearId((id) =>
        data.academicYears.some((y) => y.id === id)
          ? id
          : data.academicYears.find((y) => y.active)?.id ||
            data.academicYears[0]?.id ||
            "",
      );
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setSignedOut(true);
        setState(null);
      } else setError(e instanceof Error ? e.message : "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void refresh();
    const listener = () => setPath(location.pathname);
    window.addEventListener("popstate", listener);
    return () => window.removeEventListener("popstate", listener);
  }, []);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  useEffect(() => {
    if (card)
      void QRCode.toDataURL(
        `${location.origin}/ujian/kartu?code=${card.verificationCode}`,
        { width: 160 },
      ).then(setQr);
    else setQr("");
  }, [card]);
  function navigate(p: string) {
    history.pushState({}, "", p);
    setPath(p.split("?")[0]);
    setSidebar(false);
  }
  async function run(
    action: () => Promise<unknown>,
    message = "Data tersimpan",
  ) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await action();
      await refresh();
      setToast(message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Permintaan gagal");
    } finally {
      setBusy(false);
    }
  }
  async function save(endpoint: string, values: unknown, id?: string) {
    await api(endpoint + (id ? "/" + id : ""), id ? "PATCH" : "POST", values);
    await refresh();
    setToast("Data tersimpan");
  }
  if (signedOut)
    return (
      <Login
        success={() => {
          navigate(
            location.pathname === "/"
              ? "/dashboard"
              : location.pathname + location.search,
          );
          void refresh();
        }}
      />
    );
  if (!state)
    return (
      <div className="login-shell">
        <section className="panel login-panel">
          <Brand />
          {loading ? (
            <p role="status">Menghubungkan ke server…</p>
          ) : (
            <>
              <div className="notice amber" role="alert">
                {error || "Server belum tersedia"}
              </div>
              <button className="primary" onClick={() => void refresh()}>
                Coba kembali
              </button>
            </>
          )}
        </section>
      </div>
    );
  const data = state;
  const can = (permission: string) =>
    data.actor.permissions.includes(permission);
  const guardian = !can("read");
  const section = menuGroups.flatMap((g) => g.items).find((i) => i[1] === path);
  const kind = guardian
    ? path === "/keuangan/pembayaran"
      ? "payments"
      : path === "/ujian/dispensasi"
        ? "dispensation"
        : path === "/karakteristik/template"
          ? "forms"
          : path === "/system/configuration"
            ? "settings"
            : "guardian"
    : section?.[2] || (path === "/wali" ? "guardian" : "unknown");
  const title =
    kind === "guardian"
      ? "Portal Wali Murid"
      : section?.[0] || "Halaman tidak ditemukan";
  const year = data.academicYears.find((y) => y.id === yearId);
  const exam = data.exams.find((e) => e.id === examId);
  const studentName = (id: string) =>
    data.students.find((s) => s.id === id)?.name || "Siswa";
  const className = (id: string) =>
    data.classes.find((c) => c.id === id)?.name || "—";
  const yearName = (id: string) =>
    data.academicYears.find((y) => y.id === id)?.name || "—";
  const debts = (id: string) =>
    data.invoices.filter((i) => i.studentId === id && i.status !== "PAID");
  const balance = (id: string) =>
    debts(id).reduce((sum, i) => sum + i.amount, 0);
  const eligibility = (id: string) =>
    data.eligibilities.find(
      (e) => e.studentId === id && e.examPeriodId === examId,
    );
  const roster = data.students.filter(
    (s) =>
      data.classes.find((c) => c.id === s.classId)?.academicYearId === yearId,
  );
  const examRoster = data.students.filter(
    (s) =>
      data.classes.find((c) => c.id === s.classId)?.academicYearId ===
      exam?.academicYearId,
  );
  const unpaid = data.invoices.filter((i) => i.status !== "PAID");
  const pending = data.payments.filter(
    (p) => p.status === "PENDING_VERIFICATION",
  );
  const totalDebt = unpaid.reduce((sum, i) => sum + i.amount, 0);
  const arrears = data.students
    .filter((s) => balance(s.id) > 0)
    .sort((a, b) => balance(b.id) - balance(a.id));
  const opts = (rows: { id: string; name: string }[]) =>
    rows.map((r) => ({ value: r.id, label: r.name }));
  const yearField: Field = {
    key: "academicYearId",
    label: "Tahun ajaran",
    options: opts(data.academicYears),
    defaultValue: yearId,
  };
  const studentField: Field = {
    key: "studentId",
    label: "Siswa",
    options: opts(data.students),
  };
  const examField: Field = {
    key: "examPeriodId",
    label: "Periode ujian",
    options: opts(data.exams),
    defaultValue: examId,
  };
  function edit(
    resource: string,
    title: string,
    fields: Field[],
    row?: { id: string },
  ) {
    setForm({
      title,
      fields,
      initial: row ? (row as unknown as Values) : undefined,
      submit: (values) => save(resource, values, row?.id),
    });
  }
  function remove(resource: string, row: { id: string }, name: string) {
    if (
      confirm(
        `Hapus ${name}? Data yang masih digunakan transaksi tidak dapat dihapus.`,
      )
    )
      void run(() => api(resource + "/" + row.id, "DELETE"), "Data dihapus");
  }
  const studentFields: Field[] = [
    { key: "nis", label: "NIS" },
    { key: "name", label: "Nama siswa" },
    {
      key: "classId",
      label: "Kelas",
      options: data.classes.map((c) => ({
        value: c.id,
        label: c.name + " · " + yearName(c.academicYearId),
      })),
    },
    {
      key: "enrolledOn",
      label: "Tanggal masuk",
      type: "date",
      defaultValue: today(),
    },
    {
      key: "active",
      label: "Siswa aktif",
      type: "checkbox",
      defaultValue: true,
    },
  ];
  const guardianFields: Field[] = [
    { key: "name", label: "Nama wali" },
    { key: "phone", label: "Nomor WhatsApp" },
    ...(can("users")
      ? [
          {
            key: "userId",
            label: "Akun wali (buat akun di Pengaturan)",
            options: opts(data.users),
            required: false,
          } as Field,
        ]
      : []),
  ];
  const examFields: Field[] = [
    { key: "name", label: "Nama periode ujian" },
    yearField,
    { key: "examTypeId", label: "Jenis ujian", options: opts(data.examTypes) },
    { key: "semester", label: "Semester", type: "number", min: 1, max: 2 },
    { key: "startDate", label: "Tanggal mulai", type: "date" },
    { key: "endDate", label: "Tanggal selesai", type: "date" },
    {
      key: "administrativeDeadline",
      label: "Batas administrasi",
      type: "date",
    },
    {
      key: "requiredUntilMonth",
      label: "SPP wajib lunas sampai bulan",
      type: "month",
    },
    {
      key: "guardianDownload",
      label: "Izinkan wali mengunduh kartu",
      type: "checkbox",
    },
  ];
  function editExam(row?: AppState["exams"][number]) {
    setForm({
      title: row ? "Edit periode ujian" : "Buat periode ujian",
      fields: examFields,
      initial: row
        ? ({
            ...row,
            requiredUntilMonth: row.requiredUntilMonth.slice(0, 7),
          } as unknown as Values)
        : undefined,
      submit: (values) =>
        save(
          "exams",
          { ...values, requiredUntilMonth: values.requiredUntilMonth + "-01" },
          row?.id,
        ),
    });
  }
  function requestDispensation(student?: Student) {
    setForm({
      title: "Ajukan dispensasi",
      note: "Review TU dilanjutkan keputusan final Kepala Sekolah. Dispensasi tidak melunasi invoice.",
      fields: [
        studentField,
        examField,
        { key: "reason", label: "Alasan pengajuan", type: "textarea" },
        {
          key: "amount",
          label: "Kemampuan bayar (Rp)",
          type: "number",
          min: 0,
        },
        { key: "promisedOn", label: "Tanggal janji bayar", type: "date" },
      ],
      initial: student ? { studentId: student.id } : undefined,
      submit: (values) => save("dispensations", values),
    });
  }
  function review(resource: string, id: string, action: string) {
    setForm({
      title:
        { review: "Review TU", approve: "Setujui", reject: "Tolak" }[action] ||
        action,
      fields: [
        {
          key: resource === "payments" ? "reason" : "notes",
          label: "Catatan keputusan",
          type: "textarea",
        },
      ],
      submit: (values) => save(`${resource}/${id}/${action}`, values),
    });
  }
  function generate() {
    setForm({
      title: "Generate tagihan bulanan",
      note: "Nominal memakai Master SPP tahun ajaran. Invoice yang sudah terbit tidak digandakan.",
      fields: [
        yearField,
        {
          key: "month",
          label: "Bulan tagihan",
          type: "month",
          defaultValue: period,
        },
      ],
      submit: (values) =>
        save("invoices/generate", { ...values, month: values.month + "-01" }),
    });
  }
  function cardFor(student: Student) {
    if (!exam) {
      setError("Pilih periode ujian terlebih dahulu");
      return;
    }
    void run(async () => {
      const result = await api<Card>("exam-cards", "POST", {
        studentId: student.id,
        examPeriodId: exam.id,
      });
      setCard(result);
    }, "Kartu ujian siap dicetak");
  }
  function reminder(student: Student) {
    if (!exam) {
      setError("Pilih periode ujian terlebih dahulu");
      return;
    }
    const tab = window.open("about:blank", "_blank");
    if (tab) tab.opener = null;
    void run(async () => {
      try {
        const result = await api<{ url: string }>(
          `students/${student.id}/reminder?examId=${exam.id}`,
        );
        if (tab) tab.location.href = result.url;
        else throw new Error("Izinkan popup untuk membuka WhatsApp");
      } catch (e) {
        tab?.close();
        throw e;
      }
    }, "Pengingat WhatsApp dibuka");
  }
  function exportReport() {
    const rows = [
      [
        "NIS",
        "Nama siswa",
        "Kelas",
        "Total belum lunas",
        "Periode ujian",
        "Kelayakan",
      ],
      ...roster.map((s) => [
        s.nis,
        s.name,
        className(s.classId),
        balance(s.id),
        exam?.name || "",
        statusLabels[eligibility(s.id)?.status || "NOT_EVALUATED"],
      ]),
    ];
    saveFile(
      new Blob(
        ["\ufeff" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n")],
        { type: "text/csv;charset=utf-8" },
      ),
      "Laporan-SPP-AT-TAQWIM.csv",
    );
  }
  const button = (label: string, action: () => void, primary = false) => (
    <button
      className={primary ? "primary" : "outline tiny"}
      disabled={busy}
      onClick={action}
    >
      {label}
    </button>
  );
  function studentTable(rows: Student[], compact = false) {
    return (
      <DataTable
        rows={compact ? rows.slice(0, 5) : rows}
        columns={[
          {
            label: "Nama siswa",
            render: (s) => (
              <div className="student-name">
                <span className="avatar av1">{s.name.slice(0, 1)}</span>
                <span>
                  <strong>{s.name}</strong>
                  <small>NIS {s.nis}</small>
                </span>
              </div>
            ),
          },
          {
            label: "Kelas",
            render: (s) => (
              <span className="class-tag">{className(s.classId)}</span>
            ),
          },
          {
            label: "Tunggakan",
            render: (s) => (
              <>
                <strong>{money(balance(s.id))}</strong>
                <small>{debts(s.id).length} invoice belum lunas</small>
              </>
            ),
          },
          {
            label: "Status ujian",
            render: (s) => (
              <>
                <Badge status={eligibility(s.id)?.status || "NOT_EVALUATED"} />
                <small>{eligibility(s.id)?.reason}</small>
              </>
            ),
          },
        ]}
        actions={(s) => (
          <>
            {kind === "students" && can("master") && (
              <>
                {button("Edit", () =>
                  edit("students", "Edit siswa", studentFields, s),
                )}
                {button("Hapus", () => remove("students", s, s.name))}
              </>
            )}
            {(can("finance") || guardian) &&
              button("Bayar", () => setPaymentStudent(s.id))}
            {exam &&
              button(
                "Evaluasi",
                () =>
                  void run(
                    () =>
                      api(`exams/${exam.id}/eligibility`, "POST", {
                        studentId: s.id,
                      }),
                    "Kelayakan diperbarui",
                  ),
              )}
            {["cards", "guardian"].includes(kind) &&
              button("Kartu", () => cardFor(s))}
            {can("finance") && button("WhatsApp", () => reminder(s))}
          </>
        )}
      />
    );
  }
  const examNotice = (
    <div className="notice">
      <ShieldCheck size={20} />
      <span>
        {exam ? (
          <>
            <strong>
              {exam.name} · {exam.startDate} – {exam.endDate}
            </strong>
            <br />
            SPP wajib lunas sampai {exam.requiredUntilMonth.slice(0, 7)}. Batas
            administrasi {exam.administrativeDeadline}.
          </>
        ) : (
          "Belum ada periode ujian. Buat periode sebelum mengevaluasi kelayakan."
        )}
      </span>
    </div>
  );
  function dashboard() {
    const periodInvoices = data.invoices.filter((i) =>
      i.month.startsWith(period),
    );
    const received = data.payments
      .filter((p) => p.status === "APPROVED" && p.paidOn.startsWith(period))
      .reduce((sum, p) => sum + p.amount, 0);
    const buckets = Array.from({ length: 6 }, (_, i) => {
      const date = new Date(period + "-01T00:00:00Z");
      date.setUTCMonth(date.getUTCMonth() - (5 - i));
      const month = date.toISOString().slice(0, 7);
      return {
        month,
        paid: data.payments
          .filter((p) => p.status === "APPROVED" && p.paidOn.startsWith(month))
          .reduce((sum, p) => sum + p.amount, 0),
        debt: data.invoices
          .filter((v) => v.month.startsWith(month) && v.status !== "PAID")
          .reduce((sum, p) => sum + p.amount, 0),
      };
    });
    const maximum = Math.max(1, ...buckets.flatMap((b) => [b.paid, b.debt]));
    const eligible = examRoster.filter(
      (s) => eligibility(s.id)?.status === "ELIGIBLE",
    ).length;
    const dispensed = examRoster.filter(
      (s) => eligibility(s.id)?.status === "ELIGIBLE_DISPENSATION",
    ).length;
    const total = examRoster.length || 1;
    return (
      <>
        <div className="metrics">
          {[
            {
              label: "Total tagihan SPP",
              value: money(
                periodInvoices.reduce((sum, i) => sum + i.amount, 0),
              ),
              note: `Tagihan ${period}`,
              icon: Wallet,
            },
            {
              label: "Pembayaran bulan ini",
              value: money(received),
              note: "Pembayaran yang disetujui",
              icon: CircleDollarSign,
            },
            {
              label: "Total tunggakan",
              value: money(totalDebt),
              note: "Seluruh invoice belum lunas",
              icon: ReceiptText,
            },
            {
              label: "Siswa menunggak",
              value: String(arrears.length),
              note: "Perlu tindak lanjut",
              icon: Users,
            },
          ].map((metric, i) => (
            <button
              key={metric.label}
              className={"metric metric-" + (i < 2 ? "green" : "amber")}
              onClick={() =>
                navigate(
                  i === 0
                    ? "/keuangan/tagihan"
                    : i === 1
                      ? "/keuangan/pembayaran"
                      : "/keuangan/tunggakan",
                )
              }
            >
              <div className="metric-top">
                <span>{metric.label}</span>
                <span className="metric-icon green">
                  <metric.icon size={18} />
                </span>
              </div>
              <div className="metric-value">{metric.value}</div>
              <div className="metric-bottom">{metric.note}</div>
            </button>
          ))}
        </div>
        <div className="dashboard-middle">
          <Panel title="Tren pembayaran SPP">
            <div className="chart-tools">
              <div className="legend">
                <span>
                  <i className="green-dot" />
                  Pembayaran disetujui
                </span>
                <span>
                  <i className="pale-dot" />
                  Belum lunas
                </span>
              </div>
            </div>
            <div className="chart">
              <div className="y-axis">
                <span>{money(maximum)}</span>
                <span>{money(Math.round(maximum / 2))}</span>
                <span>Rp0</span>
              </div>
              <div className="plot">
                <div className="grid-lines">
                  <i />
                  <i />
                  <i />
                </div>
                <div className="chart-columns">
                  {buckets.map((b) => (
                    <button
                      key={b.month}
                      className="chart-column"
                      title={`${b.month}: diterima ${money(b.paid)}, belum lunas ${money(b.debt)}`}
                      onClick={() => setPeriod(b.month)}
                    >
                      <div className="bar-pair">
                        <i
                          className="bar-paid"
                          style={{ height: (b.paid / maximum) * 100 + "%" }}
                        />
                        <i
                          className="bar-arrears"
                          style={{ height: (b.debt / maximum) * 100 + "%" }}
                        />
                      </div>
                      <span>{b.month}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="chart-foot">
              Berdasarkan tanggal pembayaran dan bulan invoice aktual.
            </div>
          </Panel>
          <Panel title="Kelayakan ujian">
            <div className="exam-label">
              <CalendarDays size={20} />
              <strong>{exam?.name || "Belum ada periode"}</strong>
            </div>
            <div className="donut-wrap">
              <div
                className="donut"
                style={{
                  background: `conic-gradient(#17694c 0 ${(eligible / total) * 100}%,#d7b665 ${(eligible / total) * 100}% ${((eligible + dispensed) / total) * 100}%,#e9eeee ${((eligible + dispensed) / total) * 100}% 100%)`,
                }}
              >
                <div>
                  <span>Total siswa</span>
                  <strong>{examRoster.length}</strong>
                  <small>tahun ajaran ujian</small>
                </div>
              </div>
            </div>
            <div className="eligibility-legend">
              {[
                ["Layak ujian", eligible],
                ["Layak dengan dispensasi", dispensed],
                [
                  "Belum layak / belum dievaluasi",
                  examRoster.length - eligible - dispensed,
                ],
              ].map(([label, count]) => (
                <button
                  key={label}
                  onClick={() => navigate("/ujian/kelayakan")}
                >
                  <span>{label}</span>
                  <strong>{count}</strong>
                </button>
              ))}
            </div>
            <div className="deadline">
              Batas administrasi: {exam?.administrativeDeadline || "—"}
            </div>
          </Panel>
        </div>
        <div className="dashboard-bottom">
          <Panel title="Prioritas tindak lanjut">
            {studentTable(arrears, true)}
          </Panel>
          <div>
            <Panel title="Tindak lanjut">
              <button
                className="follow-item"
                onClick={() => navigate("/keuangan/verifikasi")}
              >
                <BadgeCheck size={20} />
                <span>{pending.length} transfer menunggu verifikasi</span>
                <ArrowRight size={15} />
              </button>
              <button
                className="follow-item"
                onClick={() => navigate("/ujian/dispensasi")}
              >
                <FileCheck2 size={20} />
                <span>
                  {
                    data.dispensations.filter((d) =>
                      ["SUBMITTED", "REVIEWED"].includes(d.status),
                    ).length
                  }{" "}
                  dispensasi perlu diproses
                </span>
              </button>
            </Panel>
            <div className="quick-card">
              <h3>Administrasi terhubung</h3>
              <p>
                Perbarui master sekolah, terbitkan invoice, dan pantau kelayakan
                dari transaksi aktual.
              </p>
              <button onClick={() => navigate("/master/kelas")}>
                Buka master sekolah
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
        <Panel title="Aktivitas terbaru">
          <div className="activity-items">
            {data.auditLogs.slice(0, 3).map((log) => (
              <div key={log.id}>
                <ClipboardList size={18} />
                <p>
                  <strong>{log.action}</strong>
                  <span>{log.entity}</span>
                  <small>
                    {new Date(log.createdAt).toLocaleString("id-ID")}
                  </small>
                </p>
              </div>
            ))}
            {!data.auditLogs.length && <p>Belum ada aktivitas.</p>}
          </div>
        </Panel>
      </>
    );
  }
  function content(): ReactNode {
    if (kind === "dashboard") return dashboard();
    if (
      ["students", "arrears", "eligibility", "cards", "reports"].includes(kind)
    )
      return (
        <>
          {["eligibility", "cards"].includes(kind) && examNotice}
          <div className="page-actions space-bottom">
            {kind === "students" &&
              can("master") &&
              button(
                "Tambah siswa",
                () => edit("students", "Tambah siswa", studentFields),
                true,
              )}
            {kind === "reports" && (
              <>
                {button("Ekspor CSV", exportReport)}
                {button("Cetak / PDF", () => window.print())}
              </>
            )}
            {kind === "cards" &&
              button("Validasi kode QR", () =>
                setForm({
                  title: "Validasi kartu ujian",
                  fields: [
                    {
                      key: "code",
                      label: "Kode verifikasi (UUID) atau URL QR",
                      defaultValue:
                        new URLSearchParams(location.search).get("code") || "",
                    },
                  ],
                  submit: async (values) => {
                    let code = String(values.code);
                    if (code.startsWith("http"))
                      code = new URL(code).searchParams.get("code") || "";
                    const result = await api<{
                      valid: boolean;
                      eligibility: { reason: string };
                    }>(`exam-cards/${encodeURIComponent(code)}/validate`);
                    setToast(
                      (result.valid ? "Kartu valid: " : "Kartu tidak valid: ") +
                        result.eligibility.reason,
                    );
                  },
                }),
              )}
          </div>
          <Panel title={title}>
            {studentTable(
              kind === "arrears"
                ? arrears
                : ["eligibility", "cards"].includes(kind)
                  ? examRoster
                  : roster,
            )}
          </Panel>
        </>
      );
    if (kind === "guardians")
      return (
        <>
          <div className="page-actions space-bottom">
            {can("master") && (
              <>
                {button(
                  "Tambah wali",
                  () =>
                    setForm({
                      title: "Tambah wali",
                      fields: guardianFields,
                      submit: (values) =>
                        save("guardians", {
                          ...values,
                          ...(can("users")
                            ? { userId: values.userId || null }
                            : {}),
                        }),
                    }),
                  true,
                )}
                {button("Hubungkan wali & siswa", () =>
                  setForm({
                    title: "Hubungkan wali & siswa",
                    fields: [
                      {
                        key: "guardianId",
                        label: "Wali",
                        options: opts(data.guardians),
                      },
                      studentField,
                    ],
                    submit: (values) => save("guardian-students", values),
                  }),
                )}
              </>
            )}
          </div>
          <Panel title="Data wali murid">
            <DataTable
              rows={data.guardians}
              columns={[
                { label: "Nama wali", render: (g) => g.name },
                { label: "WhatsApp", render: (g) => g.phone },
                {
                  label: "Siswa terhubung",
                  render: (g) =>
                    data.guardianStudents
                      .filter((l) => l.guardianId === g.id)
                      .map((l) => (
                        <div key={l.studentId}>
                          {studentName(l.studentId)}{" "}
                          {can("master") &&
                            button("Lepas relasi", () => {
                              if (confirm("Lepas akses wali ke siswa ini?"))
                                void run(() =>
                                  api("guardian-students", "DELETE", {
                                    guardianId: g.id,
                                    studentId: l.studentId,
                                  }),
                                );
                            })}
                        </div>
                      )),
                },
              ]}
              actions={
                can("master")
                  ? (g) => (
                      <>
                        {button("Edit", () =>
                          setForm({
                            title: "Edit wali",
                            fields: guardianFields,
                            initial: g as unknown as Values,
                            submit: (values) =>
                              save(
                                "guardians",
                                {
                                  ...values,
                                  ...(can("users")
                                    ? { userId: values.userId || null }
                                    : {}),
                                },
                                g.id,
                              ),
                          }),
                        )}
                        {button("Hapus", () => remove("guardians", g, g.name))}
                      </>
                    )
                  : undefined
              }
            />
          </Panel>
        </>
      );
    if (kind === "classes")
      return (
        <>
          <div className="page-actions space-bottom">
            {can("master") && (
              <>
                {button(
                  "Tambah tahun ajaran",
                  () =>
                    edit("academic-years", "Tambah tahun ajaran", [
                      { key: "name", label: "Nama tahun ajaran" },
                      { key: "startDate", label: "Mulai", type: "date" },
                      { key: "endDate", label: "Selesai", type: "date" },
                      {
                        key: "active",
                        label: "Aktif",
                        type: "checkbox",
                        defaultValue: true,
                      },
                    ]),
                  true,
                )}
                {button("Tambah kelas", () =>
                  edit("classes", "Tambah kelas", [
                    { key: "name", label: "Nama kelas" },
                    yearField,
                  ]),
                )}
              </>
            )}
          </div>
          <Panel title="Tahun ajaran">
            <DataTable
              rows={data.academicYears}
              columns={[
                { label: "Tahun ajaran", render: (y) => y.name },
                { label: "Mulai", render: (y) => y.startDate },
                { label: "Selesai", render: (y) => y.endDate },
                { label: "Aktif", render: (y) => (y.active ? "Ya" : "Tidak") },
              ]}
              actions={
                can("master")
                  ? (y) => (
                      <>
                        {button("Edit", () =>
                          edit(
                            "academic-years",
                            "Edit tahun ajaran",
                            [
                              { key: "name", label: "Nama" },
                              {
                                key: "startDate",
                                label: "Mulai",
                                type: "date",
                              },
                              {
                                key: "endDate",
                                label: "Selesai",
                                type: "date",
                              },
                              {
                                key: "active",
                                label: "Aktif",
                                type: "checkbox",
                              },
                            ],
                            y,
                          ),
                        )}
                        {button("Hapus", () =>
                          remove("academic-years", y, y.name),
                        )}
                      </>
                    )
                  : undefined
              }
            />
          </Panel>
          <Panel title="Kelas">
            <DataTable
              rows={data.classes}
              columns={[
                { label: "Kelas", render: (c) => c.name },
                {
                  label: "Tahun ajaran",
                  render: (c) => yearName(c.academicYearId),
                },
                {
                  label: "Jumlah siswa",
                  render: (c) =>
                    data.students.filter((s) => s.classId === c.id).length,
                },
              ]}
              actions={
                can("master")
                  ? (c) => (
                      <>
                        {button("Edit", () =>
                          edit(
                            "classes",
                            "Edit kelas",
                            [{ key: "name", label: "Nama" }, yearField],
                            c,
                          ),
                        )}
                        {button("Hapus", () => remove("classes", c, c.name))}
                      </>
                    )
                  : undefined
              }
            />
          </Panel>
        </>
      );
    if (kind === "master") {
      const fields: Field[] = [
        yearField,
        {
          key: "amount",
          label: "Nominal SPP per bulan (Rp)",
          type: "number",
          min: 1,
          max: 100000000,
        },
        {
          key: "dueDay",
          label: "Tanggal jatuh tempo setiap bulan",
          type: "number",
          min: 1,
          max: 28,
        },
      ];
      return (
        <>
          <div className="notice">
            Perubahan Master SPP berlaku untuk invoice baru. Invoice yang sudah
            terbit mempertahankan nominalnya.
          </div>
          <div className="page-actions space-bottom">
            {can("finance") &&
              button(
                "Tambah Master SPP",
                () => edit("spp/config", "Master SPP", fields),
                true,
              )}
          </div>
          <Panel title="Konfigurasi SPP">
            <DataTable
              rows={data.sppConfigs}
              columns={[
                {
                  label: "Tahun ajaran",
                  render: (c) => yearName(c.academicYearId),
                },
                { label: "Nominal", render: (c) => money(c.amount) },
                { label: "Jatuh tempo", render: (c) => "Tanggal " + c.dueDay },
              ]}
              actions={
                can("finance")
                  ? (c) =>
                      button("Edit", () =>
                        edit("spp/config", "Edit Master SPP", fields, c),
                      )
                  : undefined
              }
            />
          </Panel>
        </>
      );
    }
    if (kind === "invoices")
      return (
        <>
          <div className="page-actions space-bottom">
            {can("finance") && button("Generate tagihan", generate, true)}
          </div>
          <Panel title="Invoice siswa">
            <DataTable
              rows={data.invoices.filter((i) => i.academicYearId === yearId)}
              columns={[
                { label: "Siswa", render: (i) => studentName(i.studentId) },
                { label: "Bulan", render: (i) => i.month.slice(0, 7) },
                { label: "Jatuh tempo", render: (i) => i.dueDate },
                { label: "Nominal", render: (i) => money(i.amount) },
                { label: "Status", render: (i) => <Badge status={i.status} /> },
              ]}
              searchText={(i) => studentName(i.studentId) + i.month + i.status}
              actions={
                can("finance")
                  ? (i) =>
                      ["UNPAID", "OVERDUE"].includes(i.status) &&
                      button("Bayar", () => setPaymentStudent(i.studentId))
                  : undefined
              }
            />
          </Panel>
        </>
      );
    if (["payments", "verify"].includes(kind))
      return (
        <>
          <div className="page-actions space-bottom">
            {(can("finance") || guardian) &&
              button(
                "Catat pembayaran",
                () => setPaymentStudent(data.students[0]?.id || ""),
                true,
              )}
          </div>
          <Panel title={title}>
            <DataTable
              rows={kind === "verify" ? pending : data.payments}
              columns={[
                { label: "Siswa", render: (p) => studentName(p.studentId) },
                { label: "Tanggal", render: (p) => p.paidOn },
                { label: "Nominal", render: (p) => money(p.amount) },
                {
                  label: "Metode",
                  render: (p) => (p.method === "CASH" ? "Tunai" : "Transfer"),
                },
                {
                  label: "Status",
                  render: (p) => (
                    <>
                      <Badge status={p.status} />
                      <small>{p.reviewReason}</small>
                    </>
                  ),
                },
              ]}
              searchText={(p) => studentName(p.studentId) + p.status + p.paidOn}
              actions={(p) => (
                <>
                  {data.proofs
                    .filter((f) => f.paymentId === p.id)
                    .map((proof) => (
                      <button
                        className="outline tiny"
                        key={proof.id}
                        onClick={() =>
                          void run(() => downloadProof(proof), "Bukti diunduh")
                        }
                      >
                        <Download size={12} />
                        Bukti
                      </button>
                    ))}
                  {p.status === "APPROVED" && (
                    <button
                      className="outline tiny"
                      onClick={() => setReceiptPayment(p)}
                    >
                      <ReceiptText size={12} />
                      Kuitansi
                    </button>
                  )}
                  {p.status === "PENDING_VERIFICATION" && can("finance") && (
                    <>
                      {button("Setujui", () =>
                        review("payments", p.id, "approve"),
                      )}
                      {button("Tolak", () =>
                        review("payments", p.id, "reject"),
                      )}
                    </>
                  )}
                </>
              )}
            />
          </Panel>
        </>
      );
    if (kind === "exams")
      return (
        <>
          <div className="page-actions space-bottom">
            {can("master") && (
              <>
                {button("Tambah jenis ujian", () =>
                  edit("exam-types", "Jenis ujian", [
                    { key: "name", label: "Nama jenis ujian" },
                  ]),
                )}
                {button("Buat periode ujian", () => editExam(), true)}
              </>
            )}
          </div>
          <div className="exam-grid">
            {data.exams.map((e) => (
              <section key={e.id} className="panel exam-detail">
                <span className="large-icon">
                  <CalendarDays size={26} />
                </span>
                <h2>{e.name}</h2>
                <p>
                  {yearName(e.academicYearId)} · Semester {e.semester}
                </p>
                <dl>
                  <div>
                    <dt>Pelaksanaan</dt>
                    <dd>
                      {e.startDate} – {e.endDate}
                    </dd>
                  </div>
                  <div>
                    <dt>Batas administrasi</dt>
                    <dd>{e.administrativeDeadline}</dd>
                  </div>
                  <div>
                    <dt>SPP wajib lunas</dt>
                    <dd>Sampai {e.requiredUntilMonth.slice(0, 7)}</dd>
                  </div>
                  <div>
                    <dt>Unduh kartu wali</dt>
                    <dd>
                      {e.guardianDownload ? "Diizinkan" : "Belum diizinkan"}
                    </dd>
                  </div>
                </dl>
                <div className="row-actions">
                  {button(
                    "Lihat kelayakan",
                    () => {
                      setExamId(e.id);
                      navigate("/ujian/kelayakan");
                    },
                    true,
                  )}
                  {can("master") && button("Edit", () => editExam(e))}
                </div>
              </section>
            ))}
          </div>
          {!data.exams.length && (
            <div className="empty">Belum ada periode ujian.</div>
          )}
        </>
      );
    if (kind === "dispensation")
      return (
        <>
          {examNotice}
          <div className="notice amber">
            Persetujuan final Kepala Sekolah dilakukan setelah review TU.
            Invoice tetap belum lunas.
          </div>
          <div className="page-actions space-bottom">
            {(can("finance") || guardian) &&
              button("Ajukan dispensasi", () => requestDispensation(), true)}
          </div>
          <Panel title="Pengajuan dispensasi">
            <DataTable
              rows={data.dispensations}
              columns={[
                {
                  label: "Siswa / ujian",
                  render: (d) => (
                    <>
                      {studentName(d.studentId)}
                      <small>
                        {data.exams.find((e) => e.id === d.examPeriodId)?.name}
                      </small>
                    </>
                  ),
                },
                { label: "Alasan", render: (d) => d.reason },
                {
                  label: "Janji bayar",
                  render: (d) => {
                    const p = data.promises.find(
                      (p) => p.dispensationId === d.id,
                    );
                    return (
                      p && (
                        <>
                          {money(p.amount)}
                          <small>{p.promisedOn}</small>
                        </>
                      )
                    );
                  },
                },
                {
                  label: "Status / review",
                  render: (d) => (
                    <>
                      <Badge status={d.status} />
                      {data.reviews
                        .filter((r) => r.dispensationId === d.id)
                        .map((r) => (
                          <small key={r.id}>
                            {r.action}: {r.notes}
                          </small>
                        ))}
                    </>
                  ),
                },
              ]}
              actions={(d) => (
                <>
                  {d.status === "SUBMITTED" &&
                    can("finance") &&
                    button("Review TU", () =>
                      review("dispensations", d.id, "review"),
                    )}
                  {d.status === "REVIEWED" && can("principal") && (
                    <>
                      {button("Setujui", () =>
                        review("dispensations", d.id, "approve"),
                      )}
                      {button("Tolak", () =>
                        review("dispensations", d.id, "reject"),
                      )}
                    </>
                  )}
                </>
              )}
            />
          </Panel>
        </>
      );
    if (kind === "guardian")
      return (
        <>
          {examNotice}
          <div className="exam-grid">
            {data.students.map((s) => (
              <section className="panel exam-detail" key={s.id}>
                <div className="row-between">
                  <span className="avatar av1">{s.name[0]}</span>
                  <Badge
                    status={eligibility(s.id)?.status || "NOT_EVALUATED"}
                  />
                </div>
                <h2>{s.name}</h2>
                <p>
                  NIS {s.nis} · Kelas {className(s.classId)}
                </p>
                <dl>
                  <div>
                    <dt>Belum lunas</dt>
                    <dd>{money(balance(s.id))}</dd>
                  </div>
                </dl>
                {debts(s.id).map((i) => (
                  <div className="row-between invoice-line" key={i.id}>
                    <span>
                      {i.month.slice(0, 7)} · {money(i.amount)}
                    </span>
                    <Badge status={i.status} />
                  </div>
                ))}
                {(() => {
                  const studentApprovedPayments = data.payments.filter(
                    (p) => p.studentId === s.id && p.status === "APPROVED",
                  );
                  if (studentApprovedPayments.length === 0) return null;
                  return (
                    <div style={{ marginTop: 14 }}>
                      <small
                        style={{
                          fontWeight: 600,
                          color: "#497458",
                          textTransform: "uppercase",
                          display: "block",
                          marginBottom: 4,
                        }}
                      >
                        Kuitansi Pembayaran Sah
                      </small>
                      {studentApprovedPayments.map((p) => (
                        <div
                          key={p.id}
                          className="row-between"
                          style={{
                            padding: "6px 8px",
                            background: "#f0fdf4",
                            border: "1px solid #bbf7d0",
                            borderRadius: 6,
                            marginTop: 6,
                            fontSize: 11,
                          }}
                        >
                          <div>
                            <strong>{receiptNumber(p.paidOn, p.id)}</strong>
                            <small
                              style={{ display: "block", color: "#166534" }}
                            >
                              {p.paidOn} · {money(p.amount)}
                            </small>
                          </div>
                          <button
                            className="outline tiny"
                            onClick={() => setReceiptPayment(p)}
                          >
                            <ReceiptText size={12} />
                            Kuitansi
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })()}
                <div className="row-actions wrap">
                  {button(
                    "Upload pembayaran",
                    () => setPaymentStudent(s.id),
                    true,
                  )}
                  {button("Dispensasi", () => requestDispensation(s))}
                  {button("Kartu ujian", () => cardFor(s))}
                  {exam &&
                    button(
                      "Evaluasi",
                      () =>
                        void run(() =>
                          api(`exams/${exam.id}/eligibility`, "POST", {
                            studentId: s.id,
                          }),
                        ),
                    )}
                </div>
              </section>
            ))}
          </div>
          {!data.students.length && (
            <div className="empty">
              Akun belum terhubung ke siswa. Hubungi TU sekolah.
            </div>
          )}
        </>
      );
    if (kind === "forms")
      return (
        <>
          <div className="page-actions space-bottom">
            {can("master") &&
              button(
                "Buat template",
                () =>
                  setForm({
                    title: "Template karakteristik",
                    fields: [
                      { key: "name", label: "Nama template" },
                      {
                        key: "deadline",
                        label: "Batas pengisian",
                        type: "date",
                      },
                      {
                        key: "questions",
                        label: "Pertanyaan wajib (satu per baris)",
                        type: "textarea",
                      },
                    ],
                    submit: (values) =>
                      save("forms", {
                        name: values.name,
                        deadline: values.deadline,
                        fields: String(values.questions)
                          .split("\n")
                          .filter((q) => q.trim())
                          .map((label) => ({ label, required: true })),
                      }),
                  }),
                true,
              )}
          </div>
          <div className="class-grid">
            {data.templates.map((t) => (
              <section key={t.id} className="panel class-card">
                <ClipboardList size={25} />
                <h2>{t.name}</h2>
                <p>Batas pengisian: {t.deadline}</p>
                <p>
                  {data.submissions.filter((s) => s.templateId === t.id).length}{" "}
                  jawaban tersimpan
                </p>
                {button("Isi form", () =>
                  setForm({
                    title: t.name,
                    fields: [
                      studentField,
                      ...data.fields
                        .filter((f) => f.templateId === t.id)
                        .map((f) => ({
                          key: f.id,
                          label: f.label,
                          required: f.required,
                          type: "textarea",
                        })),
                    ],
                    submit: (values) =>
                      save("form-submissions", {
                        templateId: t.id,
                        studentId: values.studentId,
                        answers: data.fields
                          .filter((f) => f.templateId === t.id)
                          .map((f) => ({
                            fieldId: f.id,
                            value: String(values[f.id] || ""),
                          })),
                      }),
                  }),
                )}
              </section>
            ))}
          </div>
          <Panel title="Jawaban tersimpan">
            <DataTable
              rows={data.submissions}
              columns={[
                { label: "Siswa", render: (r) => studentName(r.studentId) },
                {
                  label: "Template",
                  render: (r) =>
                    data.templates.find((t) => t.id === r.templateId)?.name,
                },
                {
                  label: "Jawaban",
                  render: (r) =>
                    data.answers
                      .filter((a) => a.submissionId === r.id)
                      .map((a) => (
                        <p key={a.id}>
                          {data.fields.find((f) => f.id === a.fieldId)?.label}:{" "}
                          {a.value}
                        </p>
                      )),
                },
              ]}
            />
          </Panel>
        </>
      );
    if (kind === "settings")
      return (
        <>
          <Panel title="Akun & keamanan">
            <div className="settings-actions">
              {button("Ubah password", () =>
                setForm({
                  title: "Ubah password",
                  note: "Minimal 12 karakter. Semua sesi akan dikeluarkan setelah password diubah.",
                  fields: [
                    {
                      key: "currentPassword",
                      label: "Password saat ini",
                      type: "password",
                    },
                    {
                      key: "newPassword",
                      label: "Password baru",
                      type: "password",
                    },
                  ],
                  submit: async (values) => {
                    await api("auth/password", "POST", values);
                    await refresh();
                  },
                }),
              )}
              {can("settings") &&
                button("Identitas sekolah", () => {
                  const setting = data.settings.find((s) => s.key === "school")
                    ?.value as Values | undefined;
                  setForm({
                    title: "Identitas sekolah",
                    fields: [
                      {
                        key: "schoolName",
                        label: "Nama sekolah",
                        defaultValue: "SDIT AT-TAQWIM",
                      },
                      { key: "phone", label: "WhatsApp sekolah" },
                    ],
                    initial: setting,
                    submit: (values) => save("settings", values),
                  });
                })}
              {can("users") &&
                button(
                  "Buat akun pengguna",
                  () =>
                    setForm({
                      title: "Buat akun",
                      note: "Hubungkan akun WALI_MURID ke data wali dan siswa melalui menu Wali Murid.",
                      fields: [
                        { key: "name", label: "Nama" },
                        { key: "email", label: "Email", type: "email" },
                        {
                          key: "password",
                          label: "Password awal (minimal 12 karakter)",
                          type: "password",
                        },
                        {
                          key: "role",
                          label: "Role",
                          options: [
                            "SUPER_ADMIN",
                            "TU_KEUANGAN",
                            "KEPALA_SEKOLAH",
                            "WALI_MURID",
                          ].map((value) => ({ value, label: value })),
                        },
                      ],
                      submit: (values) => save("users", values),
                    }),
                  true,
                )}
            </div>
          </Panel>
          {can("users") && (
            <Panel title="Pengguna">
              <DataTable
                rows={data.users}
                columns={[
                  { label: "Nama", render: (u) => u.name },
                  { label: "Email", render: (u) => u.email },
                  {
                    label: "Aktif",
                    render: (u) => (u.active ? "Ya" : "Tidak"),
                  },
                ]}
              />
            </Panel>
          )}
        </>
      );
    if (kind === "audit")
      return can("audit") ? (
        <AuditPage />
      ) : (
        <div className="notice amber">Anda tidak memiliki akses audit.</div>
      );
    return (
      <div className="empty">
        Halaman tidak ditemukan.{" "}
        {button("Kembali ke dashboard", () => navigate("/dashboard"))}
      </div>
    );
  }
  const visibleMenu = (key: string) =>
    guardian
      ? ["payments", "dispensation", "forms", "settings"].includes(key)
      : key === "audit"
        ? can("audit")
        : key === "settings"
          ? true
          : ["master", "verify", "guardians", "classes"].includes(key)
            ? can("master") || can("finance")
            : true;
  return (
    <div className="app-shell">
      <aside className={"sidebar " + (sidebar ? "open" : "")}>
        <Brand />
        <div className="school-space">
          <span className="school-square">
            <School size={17} />
          </span>
          <div>
            <strong>Administrasi Sekolah</strong>
            <small>Workspace sekolah</small>
          </div>
        </div>
        <nav>
          {guardian && (
            <button
              className={"nav-item " + (kind === "guardian" ? "active" : "")}
              onClick={() => navigate("/wali")}
            >
              <Users size={17} />
              Portal Wali Murid
            </button>
          )}
          {menuGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              {group.items.some((i) => visibleMenu(i[2])) && group.label && (
                <div className="nav-label">{group.label}</div>
              )}
              {group.items
                .filter((i) => visibleMenu(i[2]))
                .map(([label, url, key]) => {
                  const Icon = icons[key];
                  return (
                    <button
                      key={key}
                      className={"nav-item " + (kind === key ? "active" : "")}
                      onClick={() => navigate(url)}
                    >
                      <Icon size={17} />
                      <span>{label}</span>
                      {key === "verify" && pending.length > 0 && (
                        <b>{pending.length}</b>
                      )}
                    </button>
                  );
                })}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button
            onClick={() =>
              void run(async () => {
                await api("auth/logout", "POST", {});
                setState(null);
                setSignedOut(true);
              }, "Sesi diakhiri")
            }
          >
            <LogOut size={17} />
            Keluar
          </button>
          <div className="sidebar-version">
            <span className="live-dot" />
            Administrasi sekolah
          </div>
        </div>
      </aside>
      {sidebar && (
        <div className="mobile-overlay" onClick={() => setSidebar(false)} />
      )}
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-btn mobile-menu"
              aria-label="Buka navigasi"
              onClick={() => setSidebar(!sidebar)}
            >
              <Menu size={21} />
            </button>
            <LayoutDashboard size={16} />
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>{title}</strong>
          </div>
          <div className="topbar-actions">
            <button
              className="icon-btn"
              aria-label="Muat ulang"
              disabled={loading || busy}
              onClick={() => void refresh()}
            >
              <RefreshCw size={17} />
            </button>
            <span className="top-divider" />
            <div className="profile">
              <span className="profile-avatar">
                {data.actor.name.slice(0, 2).toUpperCase()}
              </span>
              <span>
                <strong>{data.actor.name}</strong>
                <small>{data.actor.roles.join(", ")}</small>
              </span>
            </div>
          </div>
        </header>
        <main>
          <div className="welcome">
            <div>
              <div className="eyebrow">ADMINISTRASI SEKOLAH</div>
              <h1>
                {kind === "dashboard"
                  ? `Selamat datang, ${data.actor.name}`
                  : title}
              </h1>
              <p>Kelola SPP dan persiapan ujian SDIT AT-TAQWIM.</p>
            </div>
            {can("finance") && kind === "dashboard" && (
              <button
                className="primary"
                onClick={() => setPaymentStudent(data.students[0]?.id || "")}
              >
                <Plus size={16} />
                Catat pembayaran
              </button>
            )}
          </div>
          <div className="filter-strip">
            <label>
              Tahun ajaran{" "}
              <select
                aria-label="Tahun ajaran aktif"
                value={yearId}
                onChange={(e) => setYearId(e.target.value)}
              >
                <option value="">Pilih tahun ajaran</option>
                {data.academicYears.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Periode ujian{" "}
              <select
                aria-label="Periode ujian aktif"
                value={examId}
                onChange={(e) => setExamId(e.target.value)}
              >
                <option value="">Pilih periode ujian</option>
                {data.exams.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </label>
            {kind === "dashboard" && (
              <label>
                Bulan{" "}
                <input
                  aria-label="Bulan dashboard"
                  type="month"
                  value={period}
                  onChange={(e) => e.target.value && setPeriod(e.target.value)}
                />
              </label>
            )}
          </div>
          {error && (
            <div className="notice amber" role="alert">
              {error}
              <button onClick={() => setError("")}>Tutup</button>
            </div>
          )}
          {loading && <p role="status">Memuat data terbaru…</p>}
          {!year && !guardian && (
            <div className="notice">
              Mulai dengan membuat tahun ajaran, kelas, siswa, wali, dan Master
              SPP melalui menu Master Data.
            </div>
          )}
          <fieldset className="page-content" disabled={busy}>
            {content()}
          </fieldset>
          <footer>
            <div>
              <img src="/attachment-0.png" alt="" />
              <span>© {new Date().getFullYear()} SDIT AT-TAQWIM</span>
            </div>
            <span>Sistem SPP & Kelayakan Ujian</span>
          </footer>
        </main>
      </div>
      {form && (
        <DataForm
          key={form.title + JSON.stringify(form.initial)}
          spec={form}
          close={() => setForm(null)}
        />
      )}
      {paymentStudent !== null && (
        <PaymentModal
          data={data}
          initialStudent={paymentStudent}
          close={() => setPaymentStudent(null)}
          saved={async () => {
            await refresh();
            setToast("Pembayaran tersimpan");
          }}
        />
      )}{" "}
      {card && (
        <Modal title="Kartu peserta ujian" close={() => setCard(null)}>
          <div className="print-card">
            <Brand />
            <div className="card-heading">
              <h2>KARTU PESERTA UJIAN</h2>
              <p>
                {card.exam.name} · {yearName(card.exam.academicYearId)}
              </p>
            </div>
            <div className="exam-card-body">
              <div>
                <h3>{studentName(card.studentId)}</h3>
                <p>
                  NIS: {data.students.find((s) => s.id === card.studentId)?.nis}
                </p>
                <p>
                  Kelas:{" "}
                  {className(
                    data.students.find((s) => s.id === card.studentId)
                      ?.classId || "",
                  )}
                </p>
                <Badge status={card.eligibility.status} />
              </div>
              {qr && (
                <img
                  src={qr}
                  alt="QR validasi kartu ujian"
                  width={140}
                  height={140}
                />
              )}
            </div>
            <p>
              Pelaksanaan: {card.exam.startDate} – {card.exam.endDate}
            </p>
            <small>Kode verifikasi: {card.verificationCode}</small>
            <p>Validasi QR oleh petugas sekolah yang sudah masuk.</p>
          </div>
          <button
            className="primary full no-print"
            onClick={() => window.print()}
          >
            <Printer size={16} />
            Cetak / Simpan PDF
          </button>
        </Modal>
      )}
      {receiptPayment && (
        <Modal
          title="Kuitansi Pembayaran SPP"
          close={() => setReceiptPayment(null)}
        >
          <div className="print-receipt">
            <div className="receipt-header">
              <Brand />
              <div className="receipt-title">
                <h2>BUKTI PEMBAYARAN SPP</h2>
                <small>Kuitansi Resmi SDIT AT-TAQWIM</small>
              </div>
            </div>
            <div className="receipt-meta">
              <div>
                <span>Nomor Registrasi</span>
                <strong>
                  {receiptNumber(receiptPayment.paidOn, receiptPayment.id)}
                </strong>
              </div>
              <div>
                <span>Tanggal Bayar</span>
                <strong>{receiptPayment.paidOn}</strong>
              </div>
              <div>
                <span>Metode Pembayaran</span>
                <strong>
                  {receiptPayment.method === "CASH"
                    ? "Tunai (Kasir Sekolah)"
                    : "Transfer Bank"}
                </strong>
              </div>
            </div>
            <div className="receipt-student">
              <div>
                <span>Nama Siswa</span>
                <strong>{studentName(receiptPayment.studentId)}</strong>
              </div>
              <div>
                <span>NIS</span>
                <strong>
                  {data.students.find((s) => s.id === receiptPayment.studentId)
                    ?.nis || "—"}
                </strong>
              </div>
              <div>
                <span>Kelas</span>
                <strong>
                  {className(
                    data.students.find((s) => s.id === receiptPayment.studentId)
                      ?.classId || "",
                  )}
                </strong>
              </div>
            </div>
            <table className="receipt-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>No</th>
                  <th>Uraian Pembayaran</th>
                  <th style={{ textAlign: "right", width: 140 }}>Nominal</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const items = data.paymentItems.filter(
                    (it) => it.paymentId === receiptPayment.id,
                  );
                  if (items.length === 0) {
                    return (
                      <tr>
                        <td>1</td>
                        <td>Iuran SPP Sekolah</td>
                        <td style={{ textAlign: "right" }}>
                          {money(receiptPayment.amount)}
                        </td>
                      </tr>
                    );
                  }
                  return items.map((it, idx) => {
                    const inv = data.invoices.find(
                      (i) => i.id === it.invoiceId,
                    );
                    return (
                      <tr key={it.invoiceId}>
                        <td>{idx + 1}</td>
                        <td>
                          Iuran SPP Bulan {inv ? inv.month.slice(0, 7) : "—"}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {money(it.amount)}
                        </td>
                      </tr>
                    );
                  });
                })()}
                <tr className="receipt-total-row">
                  <td colSpan={2}>
                    <strong>TOTAL PEMBAYARAN</strong>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <strong>{money(receiptPayment.amount)}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="receipt-words">
              <span>Terbilang:</span>
              <em>{terbilang(receiptPayment.amount)}</em>
            </div>
            {receiptPayment.notes && (
              <div className="receipt-notes">
                <span>Catatan:</span> {receiptPayment.notes}
              </div>
            )}
            <div className="receipt-footer">
              <div className="receipt-stamp">
                <span className="stamp-badge">LUNAS / DITERIMA</span>
                <small>SDIT AT-TAQWIM</small>
              </div>
              <div className="receipt-sign">
                <span>Petugas Kasir / Verifikator,</span>
                <div className="sign-space" />
                <strong>
                  {data.users.find(
                    (u) =>
                      u.id ===
                      (receiptPayment.reviewedBy || receiptPayment.createdBy),
                  )?.name || "Kasir Tata Usaha"}
                </strong>
              </div>
            </div>
            <div className="receipt-legal">
              <small>
                Dokumen ini merupakan bukti pembayaran resmi yang diterbitkan
                secara digital oleh Sistem SDIT AT-TAQWIM.
              </small>
            </div>
          </div>
          <button
            className="primary full no-print"
            onClick={() => window.print()}
          >
            <Printer size={16} />
            Cetak / Simpan PDF
          </button>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
function PaymentModal({
  data,
  initialStudent,
  close,
  saved,
}: {
  data: AppState;
  initialStudent: string;
  close: () => void;
  saved: () => Promise<void>;
}) {
  const guardian = !data.actor.permissions.includes("read");
  const [studentId, setStudentId] = useState(initialStudent);
  const [method, setMethod] = useState(guardian ? "TRANSFER" : "CASH");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [key] = useState(() => crypto.randomUUID());
  const available = data.invoices.filter(
    (i) =>
      i.studentId === studentId && ["UNPAID", "OVERDUE"].includes(i.status),
  );
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected.length) {
      setError("Pilih minimal satu invoice");
      return;
    }
    setBusy(true);
    setError("");
    const values = new FormData(e.currentTarget);
    try {
      const proof =
        method === "TRANSFER"
          ? await uploadProof(values.get("proof") as File, data.actor.id)
          : undefined;
      await api("payments", "POST", {
        studentId,
        invoiceIds: selected,
        method,
        paidOn: values.get("paidOn"),
        notes: values.get("notes"),
        proofId: proof?.id,
        idempotencyKey: key,
      });
      await saved();
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan pembayaran");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Catat pembayaran SPP" close={() => !busy && close()}>
      <form onSubmit={submit}>
        <fieldset disabled={busy}>
          <label>
            Siswa
            <select
              required
              value={studentId}
              onChange={(e) => {
                setStudentId(e.target.value);
                setSelected([]);
              }}
            >
              <option value="">Pilih siswa</option>
              {data.students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {s.nis}
                </option>
              ))}
            </select>
          </label>
          <label>
            Metode
            <select value={method} onChange={(e) => setMethod(e.target.value)}>
              {!guardian && <option value="CASH">Tunai</option>}
              <option value="TRANSFER">Transfer</option>
            </select>
          </label>
          <div className="invoice-picker">
            {available.map((i) => (
              <label className="invoice-choice" key={i.id}>
                <input
                  type="checkbox"
                  checked={selected.includes(i.id)}
                  onChange={(e) =>
                    setSelected((ids) =>
                      e.target.checked
                        ? [...ids, i.id]
                        : ids.filter((id) => id !== i.id),
                    )
                  }
                />
                <span>
                  {i.month.slice(0, 7)} · {money(i.amount)}
                </span>
              </label>
            ))}
            {!available.length && (
              <div className="notice">
                Tidak ada invoice yang dapat dibayar. Invoice pending perlu
                diverifikasi terlebih dahulu.
              </div>
            )}
          </div>
          <label>
            Tanggal pembayaran
            <input
              name="paidOn"
              type="date"
              required
              defaultValue={today()}
              max={today()}
            />
          </label>
          {method === "TRANSFER" && (
            <>
              <label>
                Bukti pembayaran (JPG, PNG, PDF · maks. 5 MB)
                <input
                  type="file"
                  name="proof"
                  required
                  accept="image/jpeg,image/png,application/pdf"
                />
              </label>
              <div className="notice amber">
                Transfer menunggu verifikasi TU. Invoice belum dianggap lunas.
              </div>
            </>
          )}
          <label>
            Catatan
            <textarea name="notes" maxLength={2000} />
          </label>
          <div className="payment-total">
            <span>Total invoice dipilih</span>
            <strong>
              {money(
                available
                  .filter((i) => selected.includes(i.id))
                  .reduce((sum, i) => sum + i.amount, 0),
              )}
            </strong>
          </div>
          {error && (
            <div className="notice amber" role="alert">
              {error}
            </div>
          )}
          <button className="primary full" disabled={!selected.length}>
            {busy ? "Mengunggah / menyimpan…" : "Simpan pembayaran"}
          </button>
        </fieldset>
      </form>
    </Modal>
  );
}
function AuditPage() {
  const [rows, setRows] = useState<
    {
      id: string;
      action: string;
      entity: string;
      entityId: string;
      userId: string;
      createdAt: string;
      before: unknown;
      after: unknown;
    }[]
  >([]);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  useEffect(() => {
    api<typeof rows>(`audit-logs?page=${page}`)
      .then(setRows)
      .catch((e) => setError(e.message));
  }, [page]);
  return (
    <Panel title="Audit log">
      {error && <div role="alert">{error}</div>}
      <DataTable
        rows={rows}
        columns={[
          {
            label: "Waktu",
            render: (r) => new Date(r.createdAt).toLocaleString("id-ID"),
          },
          { label: "Aksi", render: (r) => r.action },
          {
            label: "Entity",
            render: (r) => (
              <>
                {r.entity}
                <small>{r.entityId}</small>
              </>
            ),
          },
          { label: "User", render: (r) => r.userId },
          {
            label: "Detail",
            render: (r) => (
              <details>
                <summary>Lihat perubahan</summary>
                <pre>
                  {JSON.stringify(
                    { before: r.before, after: r.after },
                    null,
                    2,
                  )}
                </pre>
              </details>
            ),
          },
        ]}
      />
      <div className="pagination">
        <span>Batch {page}</span>
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>
          Batch sebelumnya
        </button>
        <button disabled={rows.length < 50} onClick={() => setPage(page + 1)}>
          Batch berikutnya
        </button>
      </div>
    </Panel>
  );
}
if (typeof document !== "undefined") {
  const rootElement = document.getElementById("root");
  if (rootElement && rootElement.dataset.standalone === "true") {
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  }
}

