-- CreateTable
CREATE TABLE "Business" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "yearsOpen" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" DATETIME NOT NULL
);
