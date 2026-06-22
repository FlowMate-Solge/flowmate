-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Platform" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "feeRate" REAL NOT NULL,
    "settleCycle" TEXT NOT NULL,
    "connected" BOOLEAN NOT NULL DEFAULT false,
    "occupancy" REAL NOT NULL DEFAULT 0,
    "vacancy" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Platform" ("color", "connected", "createdAt", "feeRate", "id", "key", "name", "settleCycle") SELECT "color", "connected", "createdAt", "feeRate", "id", "key", "name", "settleCycle" FROM "Platform";
DROP TABLE "Platform";
ALTER TABLE "new_Platform" RENAME TO "Platform";
CREATE UNIQUE INDEX "Platform_key_key" ON "Platform"("key");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
