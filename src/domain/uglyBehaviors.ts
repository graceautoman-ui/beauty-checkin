import type { UglyBehavior } from './types'

/** 丑陋配置默认种子：类型 身体/精神，对应行为。单位与每单位丑陋值初始为空/0，由前端配置时填写。 */
export const DEFAULT_UGLY_BEHAVIORS: UglyBehavior[] = [
  { id: 1, category: '身体', name: '熬夜', unit: '', uglyPerUnit: 0 },
  { id: 2, category: '身体', name: '久坐', unit: '', uglyPerUnit: 0 },
  { id: 3, category: '身体', name: '外卖', unit: '', uglyPerUnit: 0 },
  { id: 4, category: '身体', name: '饮酒', unit: '', uglyPerUnit: 0 },
  { id: 5, category: '精神', name: '长时间刷手机', unit: '', uglyPerUnit: 0 },
]
