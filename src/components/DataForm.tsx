"use client";

import React, { useState, type FormEvent } from "react";
import { Modal } from "./Modal";
import { Input } from "./ui/input";
import { Select } from "./ui/select";
import { Button } from "./ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/src/lib/utils";

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
      {spec.note && (
        <p className="text-xs text-muted-foreground leading-relaxed -mt-1 mb-4">
          {spec.note}
        </p>
      )}

      <form onSubmit={submit} className="space-y-4">
        <fieldset disabled={busy} className="space-y-4 border-0 p-0 m-0">
          {spec.fields.map((field) => {
            const value = spec.initial?.[field.key] ?? field.defaultValue;

            if (field.type === "checkbox") {
              return (
                <label
                  key={field.key}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border/80 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                >
                  <input
                    aria-label={field.label}
                    name={field.key}
                    type="checkbox"
                    defaultChecked={Boolean(value)}
                    className="size-4 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
                  />
                  <span className="text-xs font-medium text-foreground select-none">
                    {field.label}
                  </span>
                </label>
              );
            }

            return (
              <div key={field.key} className="space-y-1.5">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <label
                    htmlFor={field.key}
                    className="text-xs font-semibold text-foreground cursor-pointer"
                  >
                    {field.label}
                  </label>
                  {field.required !== false && (
                    <span className="text-destructive font-bold text-xs select-none leading-none" title="Wajib diisi">
                      *
                    </span>
                  )}
                </div>

                {field.options ? (
                  <Select
                    id={field.key}
                    aria-label={field.label}
                    name={field.key}
                    required={field.required !== false}
                    defaultValue={String(value ?? "")}
                  >
                    <option value="">Pilih opsi...</option>
                    {field.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                ) : field.type === "textarea" ? (
                  <textarea
                    id={field.key}
                    aria-label={field.label}
                    name={field.key}
                    defaultValue={String(value ?? "")}
                    required={field.required !== false}
                    maxLength={3000}
                    rows={4}
                    data-slot="textarea"
                    className="block w-full min-w-0 rounded-lg border border-input bg-card px-3.5 py-2.5 text-xs sm:text-sm text-foreground shadow-xs transition-all duration-150 outline-none leading-normal focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 resize-y"
                  />
                ) : (
                  <Input
                    id={field.key}
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
              </div>
            );
          })}

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
              variant="default"
              disabled={busy}
              className="w-full h-10 text-xs sm:text-sm font-semibold shadow-sm bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1.5" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Data"
              )}
            </Button>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}
