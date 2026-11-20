export const money = (amount: number): string =>
  "Rp" + (amount || 0).toLocaleString("id-ID");

const NAMA_BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function formatDateIndo(value: string | null | undefined): string {
  if (!value) return "—";
  const str = String(value).slice(0, 10);
  const parts = str.split("-").map(Number);
  if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
    const [tahun, bulan, tanggal] = parts;
    return `${tanggal} ${NAMA_BULAN[bulan - 1]} ${tahun}`;
  }
  return value;
}

export function formatDateTimeIndo(
  value: Date | string | null | undefined,
): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return (
    new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    }).format(date) + " WIB"
  );
}

export function formatMonthName(monthString: string): string {
  if (!monthString) return "—";
  const parts = monthString.split("-");
  if (parts.length === 2) {
    const monthIndex = parseInt(parts[1], 10) - 1;
    if (monthIndex >= 0 && monthIndex < NAMA_BULAN.length) {
      return `${NAMA_BULAN[monthIndex]} ${parts[0]}`;
    }
  }
  return monthString;
}

export function calculateAge(birthDate: string | null | undefined): string {
  if (!birthDate) return "—";
  const birth = new Date(`${birthDate.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return "—";
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())
  ) {
    age -= 1;
  }
  return age >= 0 ? `${age} tahun` : "—";
}

export function whatsappUrl(phone: string): string {
  const digits = (phone || "").replace(/[^0-9]/g, "");
  const formatted = digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
  return `https://wa.me/${formatted}`;
}
