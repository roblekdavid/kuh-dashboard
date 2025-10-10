import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

async function main() {
  console.log('🌱 Starte Seed-Prozess...');

  const heute = new Date();
  const testKuehe = [
    // ==================== BRUNST BEOBACHTEN ====================
    // Kalbinnen über 14 Monate ohne bekannte Brunst
    {
      name: 'Kalbin Rosa',
      tiernummer: 'K001',
      geburtsdatum: addDays(heute, -450), // 15 Monate alt
      ist_kalbin: true,
      status: 'brunst_beobachten'
    },
    {
      name: 'Kalbin Lisa',
      tiernummer: 'K002',
      geburtsdatum: addDays(heute, -500), // 16,5 Monate alt
      ist_kalbin: true,
      status: 'brunst_beobachten'
    },
    
    // Kühe ohne bekannte letzte Brunst
    {
      name: 'Bella',
      tiernummer: 'K100',
      geburtsdatum: addDays(heute, -1800),
      ist_kalbin: false,
      status: 'brunst_beobachten'
    },
    {
      name: 'Emma',
      tiernummer: 'K101',
      geburtsdatum: addDays(heute, -2000),
      ist_kalbin: false,
      status: 'brunst_beobachten'
    },
    
    // Tiere mit Status "nicht trächtig"
    {
      name: 'Martha',
      tiernummer: 'K102',
      geburtsdatum: addDays(heute, -1600),
      ist_kalbin: false,
      kontroll_status: 'negativ',
      status: 'brunst_beobachten'
    },
    
    // Tiere mit Status "Trächtigkeit unsicher"
    {
      name: 'Paula',
      tiernummer: 'K103',
      geburtsdatum: addDays(heute, -1700),
      ist_kalbin: false,
      besamung_datum: addDays(heute, -50),
      besamung_versuche: 1,
      kontroll_status: 'unsicher',
      status: 'besamt'
    },
    
    // Gerade abgekalbt
    {
      name: 'Sophie',
      tiernummer: 'K104',
      geburtsdatum: addDays(heute, -2100),
      ist_kalbin: false,
      abgekalbt: true,
      abgekalbt_am: addDays(heute, -5),
      status: 'abgekalbt'
    },
    
    // ==================== BRUNST NÄCHSTEN 2 TAGE ====================
    {
      name: 'Molly',
      tiernummer: 'K105',
      geburtsdatum: addDays(heute, -1500),
      ist_kalbin: false,
      letzte_brunst: addDays(heute, -20), // Zyklus morgen (Tag 21)
      status: 'brunst_beobachten'
    },
    {
      name: 'Daisy',
      tiernummer: 'K106',
      geburtsdatum: addDays(heute, -1700),
      ist_kalbin: false,
      letzte_brunst: addDays(heute, -19), // Zyklus in 2 Tagen
      status: 'brunst_beobachten'
    },
    {
      name: 'Lotte',
      tiernummer: 'K107',
      geburtsdatum: addDays(heute, -1900),
      ist_kalbin: false,
      abgekalbt_am: addDays(heute, -21), // Zyklus heute
      status: 'brunst_beobachten'
    },
    
    // ==================== KONTROLLE ====================
    // Kühe 45+ Tage nach Besamung
    {
      name: 'Luna',
      tiernummer: 'K108',
      geburtsdatum: addDays(heute, -1600),
      ist_kalbin: false,
      besamung_datum: addDays(heute, -46),
      besamung_versuche: 1,
      belegt: addDays(heute, -46),
      kontrolle: addDays(heute, -1),
      status: 'besamt'
    },
    {
      name: 'Stella',
      tiernummer: 'K109',
      geburtsdatum: addDays(heute, -2100),
      ist_kalbin: false,
      besamung_datum: addDays(heute, -50),
      besamung_versuche: 1,
      belegt: addDays(heute, -50),
      kontrolle: addDays(heute, -5),
      status: 'besamt'
    },
    
    // ==================== TROCKENSTELLEN ====================
    // 220 Tage nach Besamung (innerhalb 14 Tage)
    {
      name: 'Heidi',
      tiernummer: 'K110',
      geburtsdatum: addDays(heute, -1900),
      ist_kalbin: false,
      besamung_datum: addDays(heute, -215), // In 5 Tagen trockenstellen
      besamung_versuche: 1,
      belegt: addDays(heute, -215),
      kontroll_status: 'positiv',
      status: 'besamt'
    },
    {
      name: 'Greta',
      tiernummer: 'K111',
      geburtsdatum: addDays(heute, -2200),
      ist_kalbin: false,
      besamung_datum: addDays(heute, -210), // In 10 Tagen
      besamung_versuche: 1,
      belegt: addDays(heute, -210),
      kontroll_status: 'positiv',
      status: 'besamt'
    },
    
    // ==================== ABKALBEN ====================
    // 280 Tage nach Besamung (innerhalb 30 Tage)
    {
      name: 'Frieda',
      tiernummer: 'K112',
      geburtsdatum: addDays(heute, -1800),
      ist_kalbin: false,
      besamung_datum: addDays(heute, -270), // In 10 Tagen kalben
      besamung_versuche: 1,
      belegt: addDays(heute, -270),
      trockengestellt: true,
      trockengestellt_am: addDays(heute, -50),
      status: 'trocken'
    },
    {
      name: 'Anna',
      tiernummer: 'K113',
      geburtsdatum: addDays(heute, -2400),
      ist_kalbin: false,
      besamung_datum: addDays(heute, -260), // In 20 Tagen
      besamung_versuche: 1,
      belegt: addDays(heute, -260),
      trockengestellt: true,
      trockengestellt_am: addDays(heute, -40),
      status: 'trocken'
    },
    
    // Kalbin die bald kalbt
    {
      name: 'Kalbin Mia',
      tiernummer: 'K003',
      geburtsdatum: addDays(heute, -650), // ~21 Monate
      ist_kalbin: true,
      erstes_kalben: addDays(heute, 15),
      besamung_datum: addDays(heute, -265),
      besamung_versuche: 1,
      belegt: addDays(heute, -265),
      trockengestellt: true,
      trockengestellt_am: addDays(heute, -45),
      status: 'trocken'
    },
    
    // ==================== KLAUENPFLEGE ====================
    {
      name: 'Klara',
      tiernummer: 'K114',
      geburtsdatum: addDays(heute, -1900),
      ist_kalbin: false,
      klauenpflege: true,
      status: 'brunst_beobachten'
    },
    {
      name: 'Berta',
      tiernummer: 'K115',
      geburtsdatum: addDays(heute, -2300),
      ist_kalbin: false,
      klauenpflege: true,
      besamung_datum: addDays(heute, -100),
      besamung_versuche: 1,
      belegt: addDays(heute, -100),
      kontroll_status: 'positiv',
      status: 'besamt'
    },
    
    // ==================== WEITERE KÜHE FÜR BELEGUNGSPLAN ====================
    ...Array.from({ length: 45 }, (_, i) => ({
      name: `Kuh ${i + 116}`,
      tiernummer: `K${i + 116}`,
      geburtsdatum: addDays(heute, -(1000 + i * 50)),
      ist_kalbin: false,
      abgekalbt_am: addDays(heute, -(30 + i * 2)),
      status: 'brunst_beobachten'
    }))
  ];

  // Kühe erstellen
  for (const kuh of testKuehe) {
    await prisma.kuh.upsert({
      where: { tiernummer: kuh.tiernummer },
      update: kuh,
      create: kuh as any
    });
  }

  console.log(`✅ ${testKuehe.length} Testkühe erstellt`);
  console.log('🎉 Seed-Prozess abgeschlossen!');
  console.log('\n📊 Verteilung:');
  console.log('   - Brunst beobachten: 7 Kühe');
  console.log('   - Brunst nächsten 2 Tage: 3 Kühe');
  console.log('   - Kontrolle: 2 Kühe');
  console.log('   - Trockenstellen: 2 Kühe');
  console.log('   - Abkalben: 3 Kühe');
  console.log('   - Klauenpflege: 2 Kühe');
  console.log('   - Weitere: 45 Kühe');
  console.log('   GESAMT: 64 Kühe\n');
}

main()
  .catch((e) => {
    console.error('❌ Fehler beim Seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });