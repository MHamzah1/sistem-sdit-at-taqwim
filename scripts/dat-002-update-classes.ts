import "dotenv/config";
import { getDb } from "../src/db/client";
import * as s from "../src/db/schema";
import { eq, and } from "drizzle-orm";

// Mode format:
// "with-prefix" (default): "Kelas 1A", "Kelas 1B", "Kelas 2A", "Kelas 3A", "Kelas 6A"
// "short": "1A", "1B", "2A", "3A", "6A"
const isShort = process.argv.includes("short");
const include2b = process.argv.includes("with-2b");

const classMapping: Record<string, { prefix: string; short: string }> = {
  "b8b301a4-e99b-4bee-87c6-fdfaec46e999": { prefix: "Kelas 1A", short: "1A" },
  "e38dd387-244a-49a6-9837-00458e189201": { prefix: "Kelas 1B", short: "1B" },
  "b154024b-684d-4691-acc6-9e937efac701": { prefix: "Kelas 2A", short: "2A" },
  "3b012820-f98b-498b-9649-cbda5aedf6aa": { prefix: "Kelas 3A", short: "3A" },
  "7ba869d5-82d7-4fec-8e2a-50fc412c5b75": { prefix: "Kelas 6A", short: "6A" },
};

async function main() {
  console.log(`=== DAT-002: Memulai Pembaruan Format Nama Kelas ===`);
  console.log(`-> Format: ${isShort ? "Abjad Singkat (1A, 2B, ...)" : "Awalan Kelas (Kelas 1A, Kelas 2B, ...)"}`);
  console.log(`-> Sertakan Rombel 2B: ${include2b ? "Ya" : "Hanya perbarui 5 rombel eksisting"}`);
  
  const { db, close } = getDb();

  try {
    await db.transaction(async (tx) => {
      // 1. Perbarui 5 kelas eksisting
      for (const [id, names] of Object.entries(classMapping)) {
        const newName = isShort ? names.short : names.prefix;
        const [updated] = await tx
          .update(s.classes)
          .set({
            name: newName,
            updatedAt: new Date(),
          })
          .where(eq(s.classes.id, id))
          .returning();

        if (updated) {
          console.log(`-> Berhasil perbarui kelas [${id}]: "${updated.name}"`);
        } else {
          console.warn(`-> Peringatan: Kelas [${id}] tidak ditemukan.`);
        }
      }

      // 2. Tambah Kelas 2B jika diminta
      if (include2b) {
        const targetYearId = "9e5fbbeb-2058-472a-bc27-aee77568619d"; // Tahun Ajaran 2026/2027
        const name2b = isShort ? "2B" : "Kelas 2B";
        const existing2b = (
          await tx
            .select()
            .from(s.classes)
            .where(
              and(
                eq(s.classes.academicYearId, targetYearId),
                eq(s.classes.name, name2b),
              ),
            )
        )[0];

        if (!existing2b) {
          const [newCls] = await tx
            .insert(s.classes)
            .values({
              name: name2b,
              academicYearId: targetYearId,
            })
            .returning();
          console.log(`-> Berhasil menambahkan rombel baru [${newCls.id}]: "${newCls.name}"`);
        } else {
          console.log(`-> Rombel "${name2b}" sudah ada di database.`);
        }
      }
    });

    console.log("=== DAT-002: Pembaruan Nama Kelas Selesai dengan Sukses ===");
  } catch (error) {
    console.error("=== DAT-002: Pembaruan GAGAL ===", error);
    process.exit(1);
  } finally {
    await close();
  }
}

main().catch(console.error);
