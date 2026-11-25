CREATE TABLE "family_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"nik" text,
	"birth_place" text,
	"birth_date" date,
	"birth_year" integer,
	"life_status" text DEFAULT 'ALIVE' NOT NULL,
	"education" text,
	"occupation" text,
	"institution_name" text,
	"monthly_income_range" text,
	"phone" text,
	"email" text,
	"address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"address_type" text NOT NULL,
	"address" text,
	"rt" text,
	"rw" text,
	"hamlet" text,
	"province" text,
	"regency" text,
	"district" text,
	"village" text,
	"postal_code" text,
	"residence_type" text,
	"transportation_type" text,
	"distance_to_school" numeric,
	"travel_time_minutes" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_aid_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"aid_type" text NOT NULL,
	"aid_number" text,
	"aid_source" text,
	"start_date" date,
	"end_date" date,
	"amount" integer,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"notes" text,
	"supporting_document_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"document_type" text NOT NULL,
	"document_name" text NOT NULL,
	"document_number" text,
	"storage_path" text NOT NULL,
	"original_filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"verification_status" text DEFAULT 'PENDING' NOT NULL,
	"verified_by" uuid,
	"verified_at" timestamp with time zone,
	"rejection_reason" text,
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"data" jsonb NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"final_student_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"registration_number" text,
	"registration_type" text DEFAULT 'NEW_STUDENT',
	"registration_date" date,
	"accepted_date" date,
	"enrollment_date" date,
	"academic_year_id" uuid,
	"class_id" uuid,
	"entry_grade" integer,
	"attended_paud" boolean,
	"attended_kindergarten" boolean,
	"previous_school_name" text,
	"previous_school_npsn" text,
	"previous_school_address" text,
	"enrollment_status" text DEFAULT 'ACTIVE' NOT NULL,
	"effective_start_date" date,
	"effective_end_date" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_family_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"family_member_id" uuid NOT NULL,
	"relationship_type" text NOT NULL,
	"is_primary_contact" boolean DEFAULT false NOT NULL,
	"is_payment_responsible" boolean DEFAULT false NOT NULL,
	"is_emergency_contact" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_health_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"blood_type" text,
	"medical_history" text,
	"food_allergies" text,
	"drug_allergies" text,
	"has_special_needs" boolean DEFAULT false NOT NULL,
	"special_needs_types" jsonb,
	"routine_medication" text,
	"emergency_handling_notes" text,
	"assistance_needs" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "student_health_profiles_student_id_unique" UNIQUE("student_id")
);
--> statement-breakpoint
CREATE TABLE "student_periodic_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"academic_year_id" uuid,
	"semester" integer,
	"measurement_date" date NOT NULL,
	"height_cm" numeric,
	"weight_kg" numeric,
	"head_circumference_cm" numeric,
	"notes" text,
	"recorded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_profile_change_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"requested_by" uuid NOT NULL,
	"patch" jsonb NOT NULL,
	"status" text DEFAULT 'SUBMITTED' NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"reviewer_id" uuid,
	"rejection_reason" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "nickname" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "nik" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "family_card_number" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "birth_certificate_number" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "religion" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "citizenship" text DEFAULT 'WNI';--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "birth_order" integer;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "sibling_count" integer;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "daily_language" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "student_status" text DEFAULT 'ACTIVE' NOT NULL;--> statement-breakpoint
ALTER TABLE "student_addresses" ADD CONSTRAINT "student_addresses_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_aid_records" ADD CONSTRAINT "student_aid_records_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_aid_records" ADD CONSTRAINT "student_aid_records_supporting_document_id_student_documents_id_fk" FOREIGN KEY ("supporting_document_id") REFERENCES "public"."student_documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_documents" ADD CONSTRAINT "student_documents_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_documents" ADD CONSTRAINT "student_documents_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_documents" ADD CONSTRAINT "student_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_drafts" ADD CONSTRAINT "student_drafts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_drafts" ADD CONSTRAINT "student_drafts_final_student_id_students_id_fk" FOREIGN KEY ("final_student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_family_members" ADD CONSTRAINT "student_family_members_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_family_members" ADD CONSTRAINT "student_family_members_family_member_id_family_members_id_fk" FOREIGN KEY ("family_member_id") REFERENCES "public"."family_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_health_profiles" ADD CONSTRAINT "student_health_profiles_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_periodic_data" ADD CONSTRAINT "student_periodic_data_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_periodic_data" ADD CONSTRAINT "student_periodic_data_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_periodic_data" ADD CONSTRAINT "student_periodic_data_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_profile_change_requests" ADD CONSTRAINT "student_profile_change_requests_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_profile_change_requests" ADD CONSTRAINT "student_profile_change_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_profile_change_requests" ADD CONSTRAINT "student_profile_change_requests_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fam_member_nik_idx" ON "family_members" USING btree ("nik");--> statement-breakpoint
CREATE INDEX "address_student_idx" ON "student_addresses" USING btree ("student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "student_address_type_idx" ON "student_addresses" USING btree ("student_id","address_type");--> statement-breakpoint
CREATE INDEX "aid_student_idx" ON "student_aid_records" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "doc_student_idx" ON "student_documents" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "draft_user_idx" ON "student_drafts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "enroll_student_idx" ON "student_enrollments" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "fam_rel_student_idx" ON "student_family_members" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "fam_rel_member_idx" ON "student_family_members" USING btree ("family_member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "student_fam_member_rel_idx" ON "student_family_members" USING btree ("student_id","family_member_id","relationship_type");--> statement-breakpoint
CREATE INDEX "health_student_idx" ON "student_health_profiles" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "periodic_student_idx" ON "student_periodic_data" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "change_req_student_idx" ON "student_profile_change_requests" USING btree ("student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "students_nik_idx" ON "students" USING btree ("nik");--> statement-breakpoint
CREATE UNIQUE INDEX "students_nisn_idx" ON "students" USING btree ("nisn");