export type Category = 'strength' | 'cardio'

// 固定的运动字典模型（来自 PRD）
export interface Exercise {
  id: number
  category: Category
  name: string
  unit: string
  beautyPerUnit: number
}

// 每一条打卡记录
export interface Entry {
  id: string
  timestamp: string // ISO 字符串，例如 2026-02-13T21:30:00.000Z
  dateKey: string // YYYY-MM-DD，本地日期键
  category: Category
  exerciseId: number
  exerciseName: string
  unit: string
  amount: number
  beautyGained: number
}

// 目标设置
export interface Settings {
  dailyGoal: number
  weeklyGoal: number
  monthlyGoal: number
}

// 用于统计展示的类型
export type DayStatus = 'low' | 'ok' | 'great'

// 单天汇总，用于历史列表
export interface DayStats {
  dateKey: string
  totalBeauty: number
  strengthSummary: string
  cardioSummary: string
  status: DayStatus
  completionRate: number
}

// 顶部今日 / 本周 / 本月卡片
export interface SummaryCard {
  label: string
  totalBeauty: number
  goal: number
  completionRate: number
  remaining: number
  // 时间进度：1 表示正好跟理论进度一致，>1 领先，<1 落后
  timeProgressRate: number
}

