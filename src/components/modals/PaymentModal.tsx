"use client";

import React, { useState, type FormEvent } from "react";
import type { AppState } from "@/server/state";
import { Modal } from "../Modal";
import { money } from "@/src/lib/formatters";
import { api, uploadProof } from "@/src/lib/api";

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
                  Bulan {i.month.slice(0, 7)} · {money(i.amount)}
                </span>
              </label>
            ))}
            {!available.length && (
              <p>Tidak ada tagihan tertunggak untuk siswa ini.</p>
            )}
          </div>
          <label>
            Tanggal bayar
            <input
              type="date"
              name="paidOn"
              defaultValue={new Date().toISOString().slice(0, 10)}
              required
            />
          </label>
          {method === "TRANSFER" && (
            <label>
              Bukti transfer
              <input
                type="file"
                name="proof"
                accept="image/*,application/pdf"
                required
              />
            </label>
          )}
          <label>
            Catatan
            <textarea name="notes" placeholder="Catatan transaksi..." />
          </label>
          {error && <div className="notice red">{error}</div>}
          <button
            type="submit"
            className="primary"
            disabled={!selected.length || busy}
          >
            {busy ? "Menyimpan..." : "Simpan pembayaran"}
          </button>
        </fieldset>
      </form>
    </Modal>
  );
}
