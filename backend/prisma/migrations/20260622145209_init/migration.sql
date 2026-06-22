-- CreateTable
CREATE TABLE "Platform" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "feeRate" REAL NOT NULL,
    "settleCycle" TEXT NOT NULL,
    "connected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "platformId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "grossAmount" INTEGER NOT NULL,
    "bookings" INTEGER NOT NULL DEFAULT 1,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sale_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FixedCost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "item" TEXT NOT NULL,
    "dayOfMonth" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "TaxReserve" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rate" REAL NOT NULL DEFAULT 0.18,
    "currentBalance" INTEGER NOT NULL DEFAULT 0,
    "nextFilingDate" DATETIME NOT NULL,
    "filingType" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RoiInput" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "investment" INTEGER NOT NULL,
    "monthlyFixed" INTEGER NOT NULL,
    "avgMonthlyNet" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Platform_key_key" ON "Platform"("key");
