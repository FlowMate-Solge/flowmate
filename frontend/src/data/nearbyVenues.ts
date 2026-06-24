// ─────────────────────────────────────────────────────────────
// 주변 매장 시세 비교용 큐레이션 데이터 (홍대·합정·연남 일대 파티룸)
// 실시간 크롤링이 아니라 직접 조사한 스냅샷입니다 — 화면에 조사 기준일을
// 명시해서 "실시간"으로 오해하지 않도록 합니다.
// ─────────────────────────────────────────────────────────────

export const SURVEYED_AT = '2026년 6월'
export const SURVEYED_AREA = '서울 마포구 홍대·합정·연남 일대'

export interface NearbyVenue {
  name: string
  area: string
  distanceKm: number
  pricePerHour: number // 원
  capacity: number // 기준 인원
  rating: number // 5점 만점
  platform: string
}

export const NEARBY_VENUES: NearbyVenue[] = [
  { name: '파티룸 데이지 홍대', area: '홍대', distanceKm: 0.3, pricePerHour: 19000, capacity: 8, rating: 4.6, platform: '스페이스클라우드' },
  { name: '더로비 연남', area: '연남', distanceKm: 0.9, pricePerHour: 24000, capacity: 12, rating: 4.8, platform: '스페이스클라우드' },
  { name: '스튜디오목련 합정', area: '합정', distanceKm: 1.1, pricePerHour: 26000, capacity: 10, rating: 4.5, platform: '네이버 예약' },
  { name: '라움파티룸 홍대입구', area: '홍대', distanceKm: 0.5, pricePerHour: 21000, capacity: 9, rating: 4.4, platform: '스페이스클라우드' },
  { name: '화이트가든 연남', area: '연남', distanceKm: 1.3, pricePerHour: 28000, capacity: 14, rating: 4.7, platform: '아워플레이스' },
  { name: '블랑쉬 홍대', area: '홍대', distanceKm: 0.4, pricePerHour: 23000, capacity: 10, rating: 4.3, platform: '스페이스클라우드' },
  { name: '더테라스 합정', area: '합정', distanceKm: 1.0, pricePerHour: 25000, capacity: 11, rating: 4.6, platform: '네이버 예약' },
  { name: '노트파티룸 홍대', area: '홍대', distanceKm: 0.2, pricePerHour: 18000, capacity: 7, rating: 4.2, platform: '스페이스클라우드' },
]
