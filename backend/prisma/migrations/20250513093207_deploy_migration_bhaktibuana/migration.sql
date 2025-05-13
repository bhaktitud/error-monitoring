-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "headers" JSONB,
ADD COLUMN     "ip" TEXT,
ADD COLUMN     "language" TEXT,
ADD COLUMN     "method" TEXT DEFAULT 'GET',
ADD COLUMN     "params" JSONB,
ADD COLUMN     "path" TEXT,
ADD COLUMN     "query" JSONB,
ADD COLUMN     "referrer" TEXT,
ADD COLUMN     "screenSize" TEXT,
ADD COLUMN     "url" TEXT DEFAULT '';

-- AlterTable
ALTER TABLE "SourceMap" ADD COLUMN     "source" TEXT,
ADD COLUMN     "version" TEXT;
