/*
  Warnings:

  - You are about to drop the `SpaceMember` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `type` on the `Section` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Section` table. All the data in the column will be lost.
  - You are about to drop the column `telegramChatId` on the `Space` table. All the data in the column will be lost.
  - Made the column `spaceId` on table `Section` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `chatId` to the `Space` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "SpaceMember_userId_spaceId_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "SpaceMember";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Item" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT,
    "fileId" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "spaceId" INTEGER NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "createdById" INTEGER,
    CONSTRAINT "Item_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Item_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Item_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Section" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "spaceId" INTEGER NOT NULL,
    "parentId" INTEGER,
    "createdById" INTEGER,
    CONSTRAINT "Section_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Section_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Section" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Section_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Section" ("createdAt", "id", "spaceId", "title", "updatedAt") SELECT "createdAt", "id", "spaceId", "title", "updatedAt" FROM "Section";
DROP TABLE "Section";
ALTER TABLE "new_Section" RENAME TO "Section";
CREATE INDEX "Section_spaceId_parentId_idx" ON "Section"("spaceId", "parentId");
CREATE TABLE "new_Space" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "chatId" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Space" ("createdAt", "id", "updatedAt") SELECT "createdAt", "id", "updatedAt" FROM "Space";
DROP TABLE "Space";
ALTER TABLE "new_Space" RENAME TO "Space";
CREATE UNIQUE INDEX "Space_chatId_key" ON "Space"("chatId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Item_spaceId_idx" ON "Item"("spaceId");

-- CreateIndex
CREATE INDEX "Item_sectionId_idx" ON "Item"("sectionId");
