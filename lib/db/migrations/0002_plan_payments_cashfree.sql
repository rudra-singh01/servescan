CREATE TABLE IF NOT EXISTS "plan_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"plan" text NOT NULL,
	"order_id" text NOT NULL,
	"cashfree_order_id" text,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plan_payments_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
ALTER TABLE "plan_payments" ADD CONSTRAINT "plan_payments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "plan_payments_tenant_idx" ON "plan_payments" USING btree ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "plan_payments_order_idx" ON "plan_payments" USING btree ("order_id");
--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "cashfree_order_id" text;
