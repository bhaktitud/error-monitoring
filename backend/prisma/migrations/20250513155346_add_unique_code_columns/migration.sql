/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `ErrorGroup` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `Event` will be added. If there are existing duplicate values, this will fail.

*/
-- Langkah 1: Menambahkan kolom kode sebagai opsional
ALTER TABLE "ErrorGroup" ADD COLUMN "code" TEXT;
ALTER TABLE "Event" ADD COLUMN "code" TEXT;

-- Langkah 2: Mengisi data yang sudah ada dengan kode unik
-- Untuk ErrorGroup: menggunakan format ERG-[6 karakter acak]-[4 digit terakhir ID]
UPDATE "ErrorGroup"
SET "code" = CONCAT('ERG-', 
                    SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6), 
                    '-', 
                    SUBSTRING(id FROM LENGTH(id) - 3))
WHERE "code" IS NULL;

-- Untuk Event: menggunakan format EVT-[6 karakter acak]-[4 digit terakhir ID]
UPDATE "Event"
SET "code" = CONCAT('EVT-', 
                    SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6), 
                    '-', 
                    SUBSTRING(id FROM LENGTH(id) - 3))
WHERE "code" IS NULL;

-- Langkah 3: Membuat kolom kode menjadi wajib
ALTER TABLE "ErrorGroup" ALTER COLUMN "code" SET NOT NULL;
ALTER TABLE "Event" ALTER COLUMN "code" SET NOT NULL;

-- Langkah 4: Menambahkan constraint unik
CREATE UNIQUE INDEX "ErrorGroup_code_key" ON "ErrorGroup"("code");
CREATE UNIQUE INDEX "Event_code_key" ON "Event"("code");
