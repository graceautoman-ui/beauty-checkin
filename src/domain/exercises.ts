import type { Exercise } from './types'

// 默认内置的运动字典。
// 实际运行时：第一次启动用它们做「种子数据」写入本地数据库，
// 之后所有「类型 / 运动 / 单位 / 每单位美丽值」都从数据库加载，并可在页面里增改。
export const DEFAULT_EXERCISES: Exercise[] = [
  {
    id: 1,
    category: 'strength',
    name: '哑铃',
    unit: '个',
    beautyPerUnit: 0.25,
  },
  {
    id: 2,
    category: 'strength',
    name: '非标俯卧撑',
    unit: '个',
    beautyPerUnit: 0.25,
  },
  {
    id: 3,
    category: 'cardio',
    name: '跳绳/开合跳',
    unit: '个',
    beautyPerUnit: 0.25,
  },
  {
    id: 4,
    category: 'strength',
    name: '标准俯卧撑',
    unit: '个',
    beautyPerUnit: 1,
  },
  {
    id: 5,
    category: 'strength',
    name: '深蹲',
    unit: '个',
    beautyPerUnit: 0.5,
  },
  {
    id: 6,
    category: 'cardio',
    name: '快步走',
    unit: '分钟',
    beautyPerUnit: 2.5,
  },
  {
    id: 7,
    category: 'cardio',
    name: '自由舞蹈',
    unit: '分钟',
    beautyPerUnit: 2.5,
  },
  {
    id: 8,
    category: 'cardio',
    name: '户外徒步/爬山',
    unit: '分钟',
    beautyPerUnit: 2.5,
  },
  {
    id: 9,
    category: 'cardio',
    name: '瑜伽',
    unit: '分钟',
    beautyPerUnit: 5,
  },
  {
    id: 10,
    category: 'cardio',
    name: '跑步',
    unit: '分钟',
    beautyPerUnit: 5,
  },
  {
    id: 11,
    category: 'strength',
    name: '其他自重力量',
    unit: '分钟',
    beautyPerUnit: 5,
  },
]

