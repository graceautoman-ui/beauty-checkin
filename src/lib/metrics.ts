import type { DayStats, Entry, Settings, SummaryCard, DayStatus } from '../domain/types'

// 计算单次打卡的美丽值，保留两位小数
export function calcBeauty(amount: number, beautyPerUnit: number): number {
  const raw = amount * beautyPerUnit
  return Math.round(raw * 100) / 100
}

export function getStatusFromDayTotal(dayTotal: number, dailyGoal: number): DayStatus {
  if (dailyGoal <= 0) return 'low'

  const rate = dayTotal / dailyGoal

  if (rate < 1) return 'low'
  if (rate < 1.2) return 'ok'
  return 'great'
}

// 将 Entry 列表聚合成某一天的统计（用于历史记录表格）
export function calcDayStats(entries: Entry[], settings: Settings): DayStats {
  if (entries.length === 0) {
    throw new Error('calcDayStats requires at least one entry')
  }

  const dateKey = entries[0].dateKey
  let totalBeauty = 0
  const strengthMap = new Map<string, number>()
  const cardioMap = new Map<string, number>()

  for (const entry of entries) {
    totalBeauty += entry.beautyGained
    const map = entry.category === 'strength' ? strengthMap : cardioMap
    const prev = map.get(entry.exerciseName) ?? 0
    map.set(entry.exerciseName, prev + entry.amount)
  }

  const strengthSummary = summaryFromMap(strengthMap)
  const cardioSummary = summaryFromMap(cardioMap)
  const completionRate = settings.dailyGoal > 0 ? totalBeauty / settings.dailyGoal : 0
  const status = getStatusFromDayTotal(totalBeauty, settings.dailyGoal)

  return {
    dateKey,
    totalBeauty,
    strengthSummary,
    cardioSummary,
    status,
    completionRate,
  }
}

function summaryFromMap(map: Map<string, number>): string {
  if (map.size === 0) return ''
  return Array.from(map.entries())
    .map(([name, amount]) => `${name}${amount}`)
    .join('，')
}

/** 将一批打卡记录汇总为「运动名 数量单位」列表，用于首页卡片展示 */
export function getExerciseSummary(entries: Entry[]): string {
  if (entries.length === 0) return ''
  const map = new Map<string, { amount: number; unit: string }>()
  for (const entry of entries) {
    const cur = map.get(entry.exerciseName)
    if (cur) {
      cur.amount += entry.amount
    } else {
      map.set(entry.exerciseName, { amount: entry.amount, unit: entry.unit })
    }
  }
  return Array.from(map.entries())
    .map(([name, { amount, unit }]) => `${name} ${amount}${unit}`)
    .join('，')
}

// ==== 顶部今日 / 本周 / 本月卡片 ====

export function calcTodaySummary(entries: Entry[], settings: Settings, now = new Date()): SummaryCard {
  const todayKey = toDateKey(now)
  const todayEntries = entries.filter((e) => e.dateKey === todayKey)
  const totalBeauty = todayEntries.reduce((sum, e) => sum + e.beautyGained, 0)

  const goal = settings.dailyGoal
  const completionRate = goal > 0 ? totalBeauty / goal : 0
  const remaining = Math.max(goal - totalBeauty, 0)

  // 可选：按一天 24 小时估算时间进度
  const hoursPassed = now.getHours() + now.getMinutes() / 60
  const dayProgress = hoursPassed / 24
  const theoretical = goal * dayProgress
  const timeProgressRate = theoretical > 0 ? totalBeauty / theoretical : 0

  return {
    label: '今日',
    totalBeauty,
    goal,
    completionRate,
    remaining,
    timeProgressRate,
  }
}

export function calcWeekSummary(entries: Entry[], settings: Settings, now = new Date()): SummaryCard {
  const { start, daysPassed } = getWeekWindow(now)
  const weekEntries = entries.filter((e) => {
    const d = fromDateKey(e.dateKey)
    return d >= start && d <= now
  })

  const totalBeauty = weekEntries.reduce((sum, e) => sum + e.beautyGained, 0)
  const goal = settings.weeklyGoal
  const completionRate = goal > 0 ? totalBeauty / goal : 0
  const remaining = Math.max(goal - totalBeauty, 0)

  const theoretical = goal * (daysPassed / 7)
  const timeProgressRate = theoretical > 0 ? totalBeauty / theoretical : 0

  return {
    label: '本周',
    totalBeauty,
    goal,
    completionRate,
    remaining,
    timeProgressRate,
  }
}

export function calcMonthSummary(entries: Entry[], settings: Settings, now = new Date()): SummaryCard {
  const { start, daysPassed, daysInMonth } = getMonthWindow(now)
  const monthEntries = entries.filter((e) => {
    const d = fromDateKey(e.dateKey)
    return d >= start && d <= now
  })

  const totalBeauty = monthEntries.reduce((sum, e) => sum + e.beautyGained, 0)
  const goal = settings.monthlyGoal
  const completionRate = goal > 0 ? totalBeauty / goal : 0
  const remaining = Math.max(goal - totalBeauty, 0)

  const theoretical = goal * (daysPassed / daysInMonth)
  const timeProgressRate = theoretical > 0 ? totalBeauty / theoretical : 0

  return {
    label: '本月',
    totalBeauty,
    goal,
    completionRate,
    remaining,
    timeProgressRate,
  }
}

// ==== 时间工具函数 ====

export function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function fromDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map((v) => Number.parseInt(v, 10))
  return new Date(y, m - 1, d)
}

/** 本周一的日期键 YYYY-MM-DD（周一为一周开始） */
export function getWeekStartDateKey(now = new Date()): string {
  return toDateKey(getWeekWindow(now).start)
}

/** 本月 1 号的日期键 YYYY-MM-DD */
export function getMonthStartDateKey(now = new Date()): string {
  return toDateKey(getMonthWindow(now).start)
}

function getWeekWindow(now: Date): { start: Date; daysPassed: number } {
  // 以周一为一周开始
  const day = now.getDay() || 7 // 周日为 0，转成 7
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  start.setDate(now.getDate() - (day - 1))

  const daysPassed = Math.floor((stripTime(now).getTime() - start.getTime()) / ONE_DAY_MS) + 1
  return { start, daysPassed }
}

function getMonthWindow(now: Date): { start: Date; daysPassed: number; daysInMonth: number } {
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysPassed = now.getDate()
  return { start, daysPassed, daysInMonth }
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000

function stripTime(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

