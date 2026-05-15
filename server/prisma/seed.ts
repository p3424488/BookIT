import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ─── Clean existing data ──────────────────────────────
  await prisma.activity.deleteMany();
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.seat.deleteMany();
  await prisma.event.deleteMany();

  console.log('Cleaned existing events and seats...');

  // ─── Create Events ────────────────────────────────────
  const events = await Promise.all([

    prisma.event.create({
      data: {
        title: 'Dune: Part Three',
        category: 'Movie',
        venue: 'PVR Cinemas Andheri',
        city: 'Mumbai',
        dateTime: new Date('2026-05-01T19:00:00Z'),
        description: 'The epic saga continues as Paul Atreides faces his ultimate destiny across the sands of Arrakis.',
        language: 'English',
        durationMins: 165,
        status: 'active',
      },
    }),

    prisma.event.create({
      data: {
        title: 'Coldplay World Tour',
        category: 'Concert',
        venue: 'DY Patil Stadium',
        city: 'Mumbai',
        dateTime: new Date('2026-05-15T18:00:00Z'),
        description: 'Experience the magic of Coldplay live. Stunning lights, iconic songs, a night you will never forget.',
        language: 'English',
        durationMins: 180,
        status: 'active',
      },
    }),

    prisma.event.create({
      data: {
        title: 'MI vs CSK IPL 2026',
        category: 'Sports',
        venue: 'Wankhede Stadium',
        city: 'Mumbai',
        dateTime: new Date('2026-05-10T19:30:00Z'),
        description: 'The biggest rivalry in Indian cricket. Mumbai Indians take on Chennai Super Kings.',
        language: 'Hindi',
        durationMins: 240,
        status: 'active',
      },
    }),

    prisma.event.create({
      data: {
        title: 'Kalki 2898-AD',
        category: 'Movie',
        venue: 'INOX Forum Mall',
        city: 'Chennai',
        dateTime: new Date('2026-05-05T18:30:00Z'),
        description: 'A mythological hero in a dystopian future. The most ambitious Indian blockbuster ever made.',
        language: 'Telugu',
        durationMins: 178,
        status: 'active',
      },
    }),

    prisma.event.create({
      data: {
        title: 'Arijit Singh Live',
        category: 'Concert',
        venue: 'Jawaharlal Nehru Stadium',
        city: 'Delhi',
        dateTime: new Date('2026-05-20T19:00:00Z'),
        description: 'An unforgettable evening with Bollywood\'s most beloved voice. Live in concert.',
        language: 'Hindi',
        durationMins: 150,
        status: 'active',
      },
    }),

  prisma.event.create({
  data: {
    title: 'Pushpa 3',
    category: 'Movie',
    venue: 'INOX GVK One',
    city: 'Hyderabad',
    dateTime: new Date('2026-06-01T18:00:00Z'),
    description: 'The biggest Telugu blockbuster returns for an epic third chapter.',
    language: 'Telugu',
    durationMins: 180,
    status: 'active',
  },
}),

  ]);

  console.log(`Created ${events.length} events`);

  // ─── Create Seats for each event ─────────────────────
  const rows = ['A', 'B', 'C', 'D', 'E'];
  const columns = [1, 2, 3, 4, 5, 6, 7, 8];

  for (const event of events) {
    const seats = [];

    for (const row of rows) {
      for (const col of columns) {

        let category = 'Bronze';
        let price = 250;

        if (row === 'A' || row === 'B') {
          category = 'Gold';
          price = 450;
        } else if (row === 'C' || row === 'D') {
          category = 'Silver';
          price = 350;
        }

        seats.push({
          eventId: event.id,
          row,
          column: col,
          category,
          price,
          isBooked: false,
        });
      }
    }

    await prisma.seat.createMany({ data: seats });
    console.log(`Created ${seats.length} seats for ${event.title}`);
  }

  console.log('Seeding completed successfully!');
}

main()
  .then(() => {
    prisma.$disconnect();
  })
  .catch((e) => {
    console.error('Seeding error:', e);
    prisma.$disconnect();
  });