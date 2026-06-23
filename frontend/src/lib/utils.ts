export const fmtMan = (manwon: number) =>
  `${manwon.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}만원`

export const fmtWon = (won: number) => `₩${won.toLocaleString('ko-KR')}`

export const toMan = (won: number) => Math.round(won / 10_000)
