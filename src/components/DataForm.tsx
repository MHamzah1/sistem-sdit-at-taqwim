"use client";

import React, { useState, type FormEvent } from "react";
import { Modal } from "./Modal";

export type Field = {
  key: string;
  label: string;
  type?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  min?: number;
  max?: number;
  defaultValue?: string | number | boolean;
};

export type Values = Record<string, string | number | boolean>;

export type FormSpec = {
  title: string;
  fields: Field[];
  initial?: Values;
  submit: (values: Values) => Promise<void>;
  note?: string;
};

export function DataForm({
  spec,
  close,
}: {
  spec: FormSpec;
  close: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(e.currentTarget);
    const values: Values = {};
    for (const field of spec.fields) {
      const value = data.get(field.key);
      values[field.key] =
        field.type === "number"
          ? Number(value)
          : field.type === "checkbox"
            ? value === "on"
            : String(value || "");
    }
    try {
      await spec.submit(values);
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={spec.title} close={() => !busy && close()}>
      {spec.note && <p>{spec.note}</p>}
      <form onSubmit={submit}>
        <fieldset disabled={busy}>
          {spec.fields.map((field) => {
            const value = spec.initial?.[field.key] ?? field.defaultValue;
            return (
              <label key={field.key}>
                {field.label}
                {field.options ? (
                  <select
                    aria-label={field.label}
                    name={field.key}
                    required={field.required !== false}
                    defaultValue={String(value ?? "")}
                  >
                    <option value="">Pilih...</option>
                    {field.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === "textarea" ? (
                  <textarea
                    aria-label={field.label}
                    name={field.key}
                    defaultValue={String(value ?? "")}
                    required={field.required !== false}
                    maxLength={3000}
                    rows={4}
                  />
                ) : field.type === "checkbox" ? (
                  <input
                    aria-label={field.label}
                    name={field.key}
                    type="checkbox"
                    defaultChecked={Boolean(value)}
                  />
                ) : (
                  <input
                    aria-label={field.label}
                    name={field.key}
                    type={field.type || "text"}
                    defaultValue={String(value ?? "")}
                    required={field.required !== false}
                    min={field.min}
                    max={field.max}
                    maxLength={field.type === "password" ? 128 : 300}
                    autoComplete={
                      field.type === "password" ? "new-password" : undefined
                    }
                  />
                )}
              </label>
            );
          })}
          {error && (
            <div className="notice amber" role="alert">
              {error}
            </div>
          )}
          <button className="primary full">
            {busy ? "Menyimpan…" : "Simpan"}
          </button>
        </fieldset>
      </form>
    </Modal>
  );
}
