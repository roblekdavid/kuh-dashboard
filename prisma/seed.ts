import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

async function main() {
  await prisma.kuh.deleteMany()

  const kuhNamen = [
    'Bella', 'Daisy', 'Molly', 'Rosa', 'Luna', 'Emma', 'Sophie', 'Lilly', 
    'Paula', 'Mira', 'Nora', 'Stella', 'Greta', 'Frieda', 'Hanna', 'Ida',
    'Julia', 'Karla', 'Lisa', 'Maria', 'Nina', 'Olga', 'Petra', 'Rita',
    'Sandra', 'Tanja', 'Ursula', 'Vera', 'Wilma', 'Xenia', 'Yvonne', 'Zara',
    'Amelie', 'Bianca', 'Clara', 'Diana', 'Elsa', 'Fiona', 'Gloria', 'Helena',
    'Iris', 'Jana', 'Kira', 'Lara', 'Mona', 'Nadine', 'Olivia', 'Pamela',
    'Romy', 'Silvia'
  ]

  const kuehe = []
  const heute = new Date()

  // 10 Kalbinnen
  console.log('Erstelle 10 Kalbinnen...')
  for (let i = 0; i < 10; i++) {
    const erstes_kalben = addDays(heute, Math.floor(Math.random() * 180) + 30)
    kuehe.push({
      name: kuhNamen[i],
      tiernummer: (8000 + i).toString(),
      ist_kalbin: true,
      erstes_kalben: erstes_kalben,
      status: 'kalbin',
      besamung_datum: addDays(erstes_kalben, -280),
      belegt: addDays(erstes_kalben, -280),
      besamung_versuche: 1,
      trockengestellt: false,
      abgekalbt: false,
      klauenpflege: false,
      aktiv: true,
    })
  }

  // 35 Produzierende Kühe (verschiedene Status)
  console.log('Erstelle 35 produzierende Kühe...')
  for (let i = 10; i < 45; i++) {
    const statusChoice = Math.random()
    let kuhData: any = {
      name: kuhNamen[i],
      tiernummer: (1000 + i).toString(),
      ist_kalbin: false,
      status: 'brunst_beobachten',
      besamung_versuche: 0,
      trockengestellt: false,
      abgekalbt: false,
      klauenpflege: Math.random() > 0.85,
      aktiv: true,
    }

    if (statusChoice < 0.15) {
      // 15% - Gerade abgekalbt
      kuhData.status = 'abgekalbt'
      kuhData.abgekalbt = true
      kuhData.abgekalbt_am = addDays(heute, -Math.floor(Math.random() * 30))
    } else if (statusChoice < 0.3) {
      // 15% - Brunst beobachten
      kuhData.status = 'brunst_beobachten'
      kuhData.letzte_brunst = addDays(heute, -Math.floor(Math.random() * 10))
    } else if (statusChoice < 0.45) {
      // 15% - Besamt, wartet auf Kontrolle
      kuhData.status = 'besamt'
      kuhData.besamung_datum = addDays(heute, -Math.floor(Math.random() * 40))
      kuhData.letzte_brunst = addDays(kuhData.besamung_datum, -1)
      kuhData.kontrolle = addDays(kuhData.besamung_datum, 45)
      kuhData.besamung_versuche = 1
    } else if (statusChoice < 0.70) {
      // 25% - Trächtig
      kuhData.status = 'traechtig'
      const besamung = addDays(heute, -Math.floor(Math.random() * 150) - 50)
      kuhData.besamung_datum = besamung
      kuhData.belegt = besamung
      kuhData.letzte_brunst = addDays(besamung, -1)
      kuhData.besamung_versuche = 1
      kuhData.kontroll_status = 'positiv'
    } else if (statusChoice < 0.85) {
      // 15% - Trockengestellt
      kuhData.status = 'trocken'
      const besamung = addDays(heute, -Math.floor(Math.random() * 60) - 220)
      kuhData.besamung_datum = besamung
      kuhData.belegt = besamung
      kuhData.trockengestellt = true
      kuhData.trockengestellt_am = addDays(heute, -Math.floor(Math.random() * 30))
      kuhData.besamung_versuche = 1
    } else {
      // 15% - Kurz vor Abkalben
      kuhData.status = 'trocken'
      const besamung = addDays(heute, -270)
      kuhData.besamung_datum = besamung
      kuhData.belegt = besamung
      kuhData.trockengestellt = true
      kuhData.trockengestellt_am = addDays(heute, -50)
      kuhData.besamung_versuche = 1
    }

    kuehe.push(kuhData)
  }

  // 5 Inaktive Kühe
  console.log('Erstelle 5 abgegangene Tiere...')
  for (let i = 45; i < 50; i++) {
    const abgangsgruende = ['verkauft', 'verendet', 'geschlachtet']
    kuehe.push({
      name: kuhNamen[i],
      tiernummer: (1000 + i).toString(),
      ist_kalbin: false,
      status: 'abgegangen',
      besamung_versuche: 0,
      trockengestellt: false,
      abgekalbt: false,
      klauenpflege: false,
      aktiv: false,
      abgangsdatum: addDays(heute, -Math.floor(Math.random() * 60)),
      abgangsgrund: abgangsgruende[Math.floor(Math.random() * abgangsgruende.length)],
    })
  }

  // Daten einfügen
  for (const kuh of kuehe) {
    await prisma.kuh.create({ data: kuh })
  }

  console.log('\n✅ Testdaten erfolgreich eingefügt!')
  console.log(`   → 10 Kalbinnen (trächtig, erstes Kalben)`)
  console.log(`   → 35 Produzierende Kühe (verschiedene Status)`)
  console.log(`   → 5 Abgegangene Tiere`)
  console.log(`   → GESAMT: ${kuehe.length} Tiere\n`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })