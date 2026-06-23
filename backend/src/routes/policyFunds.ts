import { Router } from 'express'
import { policyFundNote, policyFunds as fallbackFunds } from '../lib/actData.js'

const router = Router()

// 기업마당 API 응답 → 공통 형태로 변환
function normalizeBizinfo(items: any[]): typeof fallbackFunds {
  return items.map((item: any) => ({
    name: item.pblancNm ?? item.title ?? '',
    org: item.jrsdInsttNm ?? item.intrrOrgnNm ?? '',
    desc: item.bsnsSumryCn ?? item.description ?? '',
    target: item.trgetNm ?? '소상공인',
    deadline: formatDate(item.reqstEndDe) ?? '상시',
    url: item.pbancUrl ?? item.link ?? 'https://www.bizinfo.go.kr',
  }))
}

function formatDate(yyyymmdd?: string): string | null {
  if (!yyyymmdd || yyyymmdd.length < 8) return null
  return `${yyyymmdd.slice(0, 4)}.${yyyymmdd.slice(4, 6)}.${yyyymmdd.slice(6, 8)}`
}

// GET /api/policy-funds
// BIZINFO_API_KEY 환경변수가 있으면 실시간 기업마당 API 호출, 없으면 큐레이션 데이터 반환
router.get('/', async (_req, res) => {
  const apiKey = process.env.BIZINFO_API_KEY

  if (apiKey) {
    try {
      const url = new URL('https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do')
      url.searchParams.set('feedType', 'JSON')
      url.searchParams.set('numOfRows', '10')
      url.searchParams.set('pageNo', '1')
      url.searchParams.set('crtfcKey', apiKey)
      // 소상공인 업종으로 필터
      url.searchParams.set('bizTyNm', '소상공인')

      const raw = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(5000),
      })
      const data = await raw.json() as any

      const items: any[] = data?.items ?? data?.data?.items ?? []
      if (items.length > 0) {
        return res.json({ funds: normalizeBizinfo(items), note: '기업마당 실시간', source: 'live' })
      }
    } catch {
      // API 실패 → fallback
    }
  }

  res.json({ funds: fallbackFunds, note: policyFundNote, source: 'curated' })
})

export default router
