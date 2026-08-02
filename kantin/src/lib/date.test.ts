import { addDays, getWeekStart, isWithinCustomerEditWindow } from './date'

describe('hafta ve tarih kuralları', () => {
  it('haftayı pazartesi günü başlatır', () => {
    expect(getWeekStart('2026-08-06')).toBe('2026-08-03')
    expect(getWeekStart('2026-08-09')).toBe('2026-08-03')
  })

  it('gün eklerken ay geçişini doğru yapar', () => {
    expect(addDays('2026-07-31', 2)).toBe('2026-08-02')
  })

  it('müşteri için iki günlük pencereyi uygular', () => {
    expect(isWithinCustomerEditWindow('2026-07-31', '2026-08-02')).toBe(true)
    expect(isWithinCustomerEditWindow('2026-07-30', '2026-08-02')).toBe(false)
    expect(isWithinCustomerEditWindow('2026-08-01', '2026-08-02')).toBe(false)
  })
})
