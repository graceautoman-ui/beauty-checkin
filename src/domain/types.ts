export type Category = 'strength' | 'cardio'

// 固定的运动字典模型（来自 PRD）
export interface Exercise {
  id: number
  category: Category
  name: string
  unit: string
  beautyPerUnit: number
}

// 丑陋配置的类型（与美丽值的力量/有氧无关）
export type UglyCategory = '身体' | '精神'

// 丑陋配置：与美丽配置结构一致，独立存储，供后续「变丑」打卡使用
export interface UglyBehavior {
  id: number
  category: UglyCategory
  name: string
  unit: string
  uglyPerUnit: number
}

// 养生配置的类型
export type WellnessCategory = '补剂' | '身体放松' | '精神放松'

// 养生配置：结构同丑陋/美丽配置，独立存储
export interface WellnessBehavior {
  id: number
  category: WellnessCategory
  name: string
  unit: string
  wellnessPerUnit: number
}

// 每一条变丑打卡记录
export interface UglyEntry {
  id: string
  timestamp: string
  dateKey: string
  category: UglyCategory
  behaviorId: number
  behaviorName: string
  unit: string
  amount: number
  uglyGained: number
}

// 每一条养生打卡记录
export interface WellnessEntry {
  id: string
  timestamp: string
  dateKey: string
  category: WellnessCategory
  behaviorId: number
  behaviorName: string
  unit: string
  amount: number
  wellnessGained: number
}

// 每一条打卡记录（变美）
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

// 目标设置：仅设定日目标，周目标=日×7，月目标=日×当月天数；健康值目标=美−丑+养（自动计算）
export interface Settings {
  dailyBeautyGoal: number
  dailyUglyGoal: number   // 丑陋值目标（上限）
  dailyWellnessGoal: number
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

