-- Create the minting_queue_items table
CREATE TABLE IF NOT EXISTS "public"."minting_queue_items" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "wallet_address" VARCHAR(42) NOT NULL,
  "device_id" VARCHAR NULL,
  "type" VARCHAR NOT NULL DEFAULT 'first_time',
  "amount" DECIMAL(36, 18) NOT NULL DEFAULT 0,
  "status" VARCHAR NOT NULL DEFAULT 'pending',
  "transaction_hash" VARCHAR NULL,
  "error_message" TEXT NULL,
  "retry_count" INTEGER NOT NULL DEFAULT 0,
  "max_retries" INTEGER NOT NULL DEFAULT 3,
  "ip_address" VARCHAR NULL,
  "metadata" JSONB NULL,
  "merkle_proof" TEXT NULL,
  "signature" TEXT NULL,
  "process_after" TIMESTAMP NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  "processed_at" TIMESTAMP NULL,
  "processing_started_at" TIMESTAMP NULL, 
  "completed_at" TIMESTAMP NULL,
  "merkle_root" VARCHAR NULL,
  "priority" INTEGER NOT NULL DEFAULT 0
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_minting_queue_wallet_address" ON "public"."minting_queue_items"("wallet_address");
CREATE INDEX IF NOT EXISTS "idx_minting_queue_status" ON "public"."minting_queue_items"("status");
CREATE INDEX IF NOT EXISTS "idx_minting_queue_user_id" ON "public"."minting_queue_items"("user_id");
CREATE INDEX IF NOT EXISTS "idx_minting_queue_created_at" ON "public"."minting_queue_items"("created_at");
CREATE INDEX IF NOT EXISTS "idx_minting_queue_priority" ON "public"."minting_queue_items"("priority");

-- Add a comment to explain the table purpose
COMMENT ON TABLE "public"."minting_queue_items" IS 'Stores token minting queue items for processing by the backend';