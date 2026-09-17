export const ymd = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const parseYmd = (s: string): Date => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const addDays = (s: string, n: number): string => {
  const d = parseYmd(s)
  d.setDate(d.getDate() + n)
  return ymd(d)
}

export const daysBetween = (a: string, b: string): number =>
  Math.round((parseYmd(b).getTime() - parseYmd(a).getTime()) / 86400000)

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export const pretty = (s: string): string => {
  const d = parseYmd(s)
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

export const today = (): string => ymd(new Date())

export const isWeekend = (s: string): boolean => {
  const day = parseYmd(s).getDay()
  return day === 0 || day === 6
}

export const clamp = (s: string, lo: string, hi: string): string =>
  s < lo ? lo : s > hi ? hi : s
