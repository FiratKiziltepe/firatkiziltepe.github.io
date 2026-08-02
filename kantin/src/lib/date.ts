const istanbulDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Istanbul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const turkishDayFormatter = new Intl.DateTimeFormat('tr-TR', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})

const turkishLongDateFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

export function parseIsoDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

export function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function todayInIstanbul() {
  return istanbulDateFormatter.format(new Date())
}

export function addDays(value: string, days: number) {
  const date = parseIsoDate(value)
  date.setUTCDate(date.getUTCDate() + days)
  return toIsoDate(date)
}

export function getWeekStart(value = todayInIstanbul()) {
  const date = parseIsoDate(value)
  const isoDay = date.getUTCDay() === 0 ? 7 : date.getUTCDay()
  date.setUTCDate(date.getUTCDate() - (isoDay - 1))
  return toIsoDate(date)
}

export function getWeekEnd(weekStart: string) {
  return addDays(weekStart, 4)
}

export function formatWeekRange(weekStart: string) {
  const start = turkishDayFormatter.format(parseIsoDate(weekStart))
  const end = turkishDayFormatter.format(parseIsoDate(getWeekEnd(weekStart)))
  return `${start} – ${end}`
}

export function formatDate(value: string) {
  return turkishLongDateFormatter.format(parseIsoDate(value))
}

export function formatShortDate(value: string) {
  return turkishDayFormatter.format(parseIsoDate(value))
}

export function isWeekday(value: string) {
  const day = parseIsoDate(value).getUTCDay()
  return day >= 1 && day <= 5
}

export function isWithinCustomerEditWindow(value: string, today = todayInIstanbul()) {
  return isWeekday(value) && value <= today && value >= addDays(today, -2)
}

export function defaultConsumptionDate(today = todayInIstanbul()) {
  let candidate = today
  while (!isWeekday(candidate)) candidate = addDays(candidate, -1)
  return candidate
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  }).format(value)
}
