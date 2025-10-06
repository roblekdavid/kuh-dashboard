/*
  Warnings:

  - You are about to drop the column `stieren` on the `kuehe` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_kuehe" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "tiernummer" TEXT NOT NULL,
    "ist_kalbin" BOOLEAN NOT NULL DEFAULT false,
    "erstes_kalben" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'brunst_beobachten',
    "letzte_brunst" DATETIME,
    "besamung_datum" DATETIME,
    "besamung_versuche" INTEGER NOT NULL DEFAULT 0,
    "belegt" DATETIME,
    "kontrolle" DATETIME,
    "kontroll_status" TEXT,
    "trockengestellt_am" DATETIME,
    "abgekalbt_am" DATETIME,
    "trockengestellt" BOOLEAN NOT NULL DEFAULT false,
    "abgekalbt" BOOLEAN NOT NULL DEFAULT false,
    "klauenpflege" BOOLEAN NOT NULL DEFAULT false,
    "aktiv" BOOLEAN NOT NULL DEFAULT true,
    "abgangsdatum" DATETIME,
    "abgangsgrund" TEXT,
    "notizen" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_kuehe" ("abgangsdatum", "abgangsgrund", "abgekalbt", "abgekalbt_am", "aktiv", "belegt", "createdAt", "erstes_kalben", "id", "ist_kalbin", "klauenpflege", "kontrolle", "name", "notizen", "status", "tiernummer", "trockengestellt", "trockengestellt_am", "updatedAt") SELECT "abgangsdatum", "abgangsgrund", "abgekalbt", "abgekalbt_am", "aktiv", "belegt", "createdAt", "erstes_kalben", "id", "ist_kalbin", "klauenpflege", "kontrolle", "name", "notizen", "status", "tiernummer", "trockengestellt", "trockengestellt_am", "updatedAt" FROM "kuehe";
DROP TABLE "kuehe";
ALTER TABLE "new_kuehe" RENAME TO "kuehe";
CREATE UNIQUE INDEX "kuehe_tiernummer_key" ON "kuehe"("tiernummer");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
