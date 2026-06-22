import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// frontend/src/data/mock.ts 의 데모 시나리오를 그대로 옮긴 시드 데이터.
// 기준일 2026-06-19, 파티룸 "무드살롱 홍대점", 3개 플랫폼 운영.
const platforms = [
  {
    key: 'spacecloud',
    name: '스페이스클라우드',
    color: '#3366ff',
    feeRate: 0.1,
    settleCycle: '익월 10일',
    connected: true,
    occupancy: 85,
    vacancy: 15,
  },
  {
    key: 'naver',
    name: '네이버 예약',
    color: '#16a34a',
    feeRate: 0.033,
    settleCycle: '결제 후 2일',
    connected: true,
    occupancy: 78,
    vacancy: 22,
  },
  {
    key: 'ourplace',
    name: '아워플레이스',
    color: '#f59e0b',
    feeRate: 0.12,
    settleCycle: '익월 15일',
    connected: false,
    occupancy: 68,
    vacancy: 32,
  },
]

// 월별 매출(만원) → 시드에서는 각 월 1건의 합계 매출 거래로 단순화
const monthlyGross: Record<string, number[]> = {
  spacecloud: [257, 237, 301, 341, 376, 420],
  naver: [153, 141, 179, 203, 223, 250],
  ourplace: [110, 102, 130, 146, 161, 180],
}
const bookingsByPlatform: Record<string, number> = {
  spacecloud: 56,
  naver: 32,
  ourplace: 22,
}
const months = ['01', '02', '03', '04', '05', '06']

async function main() {
  await prisma.sale.deleteMany()
  await prisma.platform.deleteMany()
  await prisma.fixedCost.deleteMany()
  await prisma.taxReserve.deleteMany()
  await prisma.roiInput.deleteMany()

  for (const p of platforms) {
    const created = await prisma.platform.create({ data: p })

    for (let i = 0; i < months.length; i++) {
      const isCurrentMonth = i === months.length - 1
      const grossManwon = monthlyGross[p.key][i]
      await prisma.sale.create({
        data: {
          platformId: created.id,
          date: new Date(`2026-${months[i]}-28`),
          grossAmount: grossManwon * 10_000,
          bookings: isCurrentMonth ? bookingsByPlatform[p.key] : Math.round(bookingsByPlatform[p.key] * 0.85),
          source: 'manual',
        },
      })
    }
  }

  await prisma.fixedCost.createMany({
    data: [
      { item: '가게 월세', dayOfMonth: 25, amount: 2_800_000 },
      { item: '공과금', dayOfMonth: 26, amount: 120_000 },
      { item: '소모품', dayOfMonth: 27, amount: 110_000 },
      { item: '알바 급여', dayOfMonth: 30, amount: 450_000 },
    ],
  })

  await prisma.taxReserve.create({
    data: {
      rate: 0.18,
      currentBalance: 400_000,
      nextFilingDate: new Date('2026-07-25'),
      filingType: '부가가치세 1기 확정신고',
    },
  })

  await prisma.roiInput.create({
    data: {
      investment: 50_000_000,
      monthlyFixed: 4_150_000,
      avgMonthlyNet: 6_950_000,
    },
  })

  console.log('Seed complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
