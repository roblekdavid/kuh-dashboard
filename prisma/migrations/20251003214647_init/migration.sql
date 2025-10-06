-- CreateTable
CREATE TABLE "kuehe" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "tiernummer" TEXT NOT NULL,
    "ist_kalbin" BOOLEAN NOT NULL DEFAULT false,
    "erstes_kalben" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'brunst_beobachten',
    "stieren" DATETIME,
    "belegt" DATETIME,
    "kontrolle" DATETIME,
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

-- CreateTable
CREATE TABLE "melkstand_positionen" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "position" INTEGER NOT NULL,
    "kuhId" INTEGER,
    "kuhName" TEXT,
    "kuhNummer" TEXT,
    "zeitstempel" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "kuehe_tiernummer_key" ON "kuehe"("tiernummer");
