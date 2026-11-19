ALTER TABLE "students" ADD COLUMN "nisn" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "gender" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "birth_place" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "birth_date" date;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "photo_url" text;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "student_gender_check" CHECK ("students"."gender" IS NULL OR "students"."gender" IN ('L', 'P'));