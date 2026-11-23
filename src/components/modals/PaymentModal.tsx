"use client";

import React, { useState, type FormEvent } from "react";
import type { AppState } from "@/server/state";
import { Modal } from "../Modal";
import { Select } from "../ui/select";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { money } from "@/src/lib/formatters";
import { api, uploadProof } from "@/src/lib/api";
import { Loader2, AlertCircle, ReceiptText, Check } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface PaymentModalProps {
  data: AppState;
  initialStudent: string;
  close: () => void;
  saved: () => Promise<void>;
}

export function PaymentModal({
  data,
  initialStudent,
  close,
  saved,
}: PaymentModalProps) {
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

  const totalSelectedAmount = available
    .filter((i) => selected.includes(i.id))
    .reduce((sum, i) => sum + i.amount, 0);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected.length) {
      setError("Pilih minimal satu tagihan untuk dibayar");
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
    <Modal title="Catat Pembayaran SPP" close={() => !busy && close()}>
      <form onSubmit={submit} className="space-y-4">
        <fieldset disabled={busy} className="space-y-4 border-0 p-0 m-0">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground/90">
              Pilih Siswa
            </label>
            <Select
              required
              value={studentId}
              onChange={(e) => {
                setStudentId(e.target.value);
                setSelected([]);
              }}
            >
              <option value="">Pilih siswa...</option>
              {data.students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · NIS: {s.nis}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground/90">
              Metode Pembayaran
            </label>
            <Select value={method} onChange={(e) => setMethod(e.target.value)}>
              {!guardian && <option value="CASH">Tunai (Kasir Sekolah)</option>}
              <option value="TRANSFER">Transfer Bank</option>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-foreground/90">
              Daftar Tagihan Belum Lunas
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {available.map((i) => {
                const isChecked = selected.includes(i.id);
                return (
                  <label
                    key={i.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer text-xs",
                      isChecked
                        ? "bg-primary/5 border-primary/40 shadow-2xs"
                        : "bg-card border-border/70 hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                          setSelected((ids) =>
                            e.target.checked
                              ? [...ids, i.id]
                              : ids.filter((id) => id !== i.id),
                          )
                        }
                        className="size-4 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
                      />
                      <span className="font-medium text-foreground">
                        Bulan {i.month.slice(0, 7)}
                      </span>
                    </div>
                    <strong className="font-semibold text-primary">
                      {money(i.amount)}
                    </strong>
                  </label>
                );
              })}
              {!available.length && (
                <div className="flex items-center gap-2 p-3 rounded-lg border border-border/60 bg-muted/20 text-xs text-muted-foreground">
                  <ReceiptText className="size-4 shrink-0 text-muted-foreground/70" />
                  <span>Tidak ada tagihan tertunggak untuk siswa ini.</span>
                </div>
              )}
            </div>

            {selected.length > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-primary/10 text-primary font-medium text-xs">
                <span>Total Dipilih ({selected.length} tagihan):</span>
                <span className="text-sm font-bold">{money(totalSelectedAmount)}</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground/90">
              Tanggal Pembayaran
            </label>
            <Input
              type="date"
              name="paidOn"
              defaultValue={new Date().toISOString().slice(0, 10)}
              required
            />
          </div>

          {method === "TRANSFER" && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground/90">
                Unggah Bukti Transfer
              </label>
              <Input
                type="file"
                name="proof"
                accept="image/*,application/pdf"
                required
                className="cursor-pointer file:cursor-pointer file:mr-3 file:py-0.5 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground/90">
              Catatan Transaksi (Opsional)
            </label>
            <textarea
              name="notes"
              placeholder="Nomor referensi atau catatan tambahan..."
              rows={2}
              className="flex w-full rounded-lg border border-input bg-card px-3 py-2 text-xs text-foreground shadow-xs transition-all outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 resize-y"
            />
          </div>

          {error && (
            <div
              className="flex items-center gap-2 p-3 text-xs rounded-lg border border-destructive/20 bg-destructive/10 text-destructive font-medium"
              role="alert"
            >
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              disabled={!selected.length || busy}
              className="w-full h-10 text-xs font-semibold shadow-sm"
            >
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1.5" />
                  Menyimpan Transaksi...
                </>
              ) : (
                "Simpan Pembayaran"
              )}
            </Button>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}
