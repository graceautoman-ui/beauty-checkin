import type { Entry, Settings, Exercise, UglyBehavior, UglyEntry, WellnessBehavior, WellnessEntry, PleasureEntry, PleasureCategoryConfig, ReadingEntry, EnglishEntry, SkillEntry, GratitudeEntry, DiscoveryEntry, SentenceEntry } from '../domain/types'
import { DEFAULT_EXERCISES } from '../domain/exercises'
import { DEFAULT_UGLY_BEHAVIORS } from '../domain/uglyBehaviors'

const DB_NAME = 'beauty-checkin'
const DB_VERSION = 1
const KV_STORE = 'kv'
const ENTRIES_STORE = 'entries'

interface KVRecord<T = unknown> {
  key: string
  value: T
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(KV_STORE)) {
        db.createObjectStore(KV_STORE, { keyPath: 'key' })
      }
      if (!db.objectStoreNames.contains(ENTRIES_STORE)) {
        db.createObjectStore(ENTRIES_STORE, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function withStore<T>(
  mode: IDBTransactionMode,
  storeName: string,
  fn: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T | void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode)
    const store = tx.objectStore(storeName)
    const request = fn(store)

    if (!request) {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      return
    }

    request.onsuccess = () => resolve(request.result as T)
    request.onerror = () => reject(request.error)
  })
}

// ---------- KV 辅助 ----------

async function getKV<T>(key: string): Promise<T | undefined> {
  const record = (await withStore<KVRecord<T> | undefined>('readonly', KV_STORE, (store) =>
    store.get(key),
  )) as KVRecord<T> | undefined
  return record?.value
}

async function setKV<T>(key: string, value: T): Promise<void> {
  await withStore('readwrite', KV_STORE, (store) =>
    store.put({
      key,
      value,
    } as KVRecord<T>),
  )
}

// ---------- Settings ----------

const DEFAULT_SETTINGS: Settings = {
  dailyBeautyGoal: 100,
  dailyUglyGoal: 0,
  dailyWellnessGoal: 0,
}

/** 旧版目标迁移：仅保留日目标，周/月由日×7、日×当月天数计算 */
function migrateSettings(stored: Record<string, unknown>): Settings {
  const dailyB = Number(stored.dailyBeautyGoal ?? stored.dailyGoal)
  const weeklyB = Number(stored.weeklyBeautyGoal ?? stored.weeklyGoal)
  const monthlyB = Number(stored.monthlyBeautyGoal ?? stored.monthlyGoal)
  const dailyU = Number(stored.dailyUglyGoal ?? 0)
  const dailyW = Number(stored.dailyWellnessGoal ?? 0)
  const beauty = !Number.isNaN(dailyB) ? dailyB : !Number.isNaN(weeklyB) ? weeklyB / 7 : !Number.isNaN(monthlyB) ? monthlyB / 31 : DEFAULT_SETTINGS.dailyBeautyGoal
  return {
    dailyBeautyGoal: Math.round(beauty * 100) / 100,
    dailyUglyGoal: Number.isNaN(dailyU) ? 0 : dailyU,
    dailyWellnessGoal: Number.isNaN(dailyW) ? 0 : dailyW,
  }
}

export async function loadSettings(): Promise<Settings> {
  const stored = await getKV<Settings & { dailyGoal?: number; weeklyBeautyGoal?: number }>('settings')
  if (!stored) {
    await setKV('settings', DEFAULT_SETTINGS)
    return DEFAULT_SETTINGS
  }
  if ('weeklyBeautyGoal' in stored && stored.weeklyBeautyGoal != null) {
    const migrated = migrateSettings(stored as unknown as Record<string, unknown>)
    await setKV('settings', migrated)
    return migrated
  }
  if (typeof stored.dailyBeautyGoal === 'number') {
    return {
      dailyBeautyGoal: stored.dailyBeautyGoal,
      dailyUglyGoal: typeof stored.dailyUglyGoal === 'number' ? stored.dailyUglyGoal : 0,
      dailyWellnessGoal: typeof stored.dailyWellnessGoal === 'number' ? stored.dailyWellnessGoal : 0,
    }
  }
  const migrated = migrateSettings(stored as unknown as Record<string, unknown>)
  await setKV('settings', migrated)
  return migrated
}

export async function saveSettings(settings: Settings): Promise<void> {
  await setKV('settings', settings)
}

// ---------- Exercises 可配置运动字典 ----------

export async function loadExercises(): Promise<Exercise[]> {
  const stored = await getKV<Exercise[]>('exercises')
  if (stored && stored.length > 0) return stored

  await setKV('exercises', DEFAULT_EXERCISES)
  return DEFAULT_EXERCISES
}

export async function saveExercises(exercises: Exercise[]): Promise<void> {
  await setKV('exercises', exercises)
}

// ---------- 丑陋配置（独立存储，与运动配置互不影响） ----------

/** 旧类型迁移为 身体/精神，保证选择「身体」时能筛出已配置行为 */
function migrateUglyCategory(category: string): UglyBehavior['category'] {
  if (category === '身体' || category === '精神') return category
  if (category === '熬夜' || category === '久坐') return '身体'
  if (category === '垃圾食品') return '精神'
  return '身体'
}

export async function loadUglyBehaviors(): Promise<UglyBehavior[]> {
  const stored = await getKV<UglyBehavior[]>('uglyBehaviors')
  if (stored == null || stored.length === 0) {
    await setKV('uglyBehaviors', DEFAULT_UGLY_BEHAVIORS)
    return DEFAULT_UGLY_BEHAVIORS
  }
  const needsMigration = stored.some(
    (b) => b.category !== '身体' && b.category !== '精神',
  )
  if (needsMigration) {
    const migrated = stored.map((b) => ({
      ...b,
      category: migrateUglyCategory(b.category as string),
    }))
    await setKV('uglyBehaviors', migrated)
    return migrated
  }
  return stored
}

export async function saveUglyBehaviors(behaviors: UglyBehavior[]): Promise<void> {
  await setKV('uglyBehaviors', behaviors)
}

// ---------- 变丑打卡记录（存 KV 数组，与运动 entries 独立） ----------

export async function getAllUglyEntries(): Promise<UglyEntry[]> {
  const stored = await getKV<UglyEntry[]>('uglyEntries')
  return stored ?? []
}

export async function addUglyEntry(entry: UglyEntry): Promise<void> {
  const list = await getAllUglyEntries()
  list.push(entry)
  await setKV('uglyEntries', list)
}

export async function saveUglyEntries(list: UglyEntry[]): Promise<void> {
  await setKV('uglyEntries', list)
}

// ---------- 养生配置（独立存储） ----------

export async function loadWellnessBehaviors(): Promise<WellnessBehavior[]> {
  const stored = await getKV<WellnessBehavior[]>('wellnessBehaviors')
  return stored ?? []
}

export async function saveWellnessBehaviors(behaviors: WellnessBehavior[]): Promise<void> {
  await setKV('wellnessBehaviors', behaviors)
}

// ---------- 养生打卡记录（存 KV 数组） ----------

export async function getAllWellnessEntries(): Promise<WellnessEntry[]> {
  const stored = await getKV<WellnessEntry[]>('wellnessEntries')
  return stored ?? []
}

export async function addWellnessEntry(entry: WellnessEntry): Promise<void> {
  const list = await getAllWellnessEntries()
  list.push(entry)
  await setKV('wellnessEntries', list)
}

export async function saveWellnessEntries(list: WellnessEntry[]): Promise<void> {
  await setKV('wellnessEntries', list)
}

// ---------- 愉悦打卡记录（存 KV 数组，独立于健康值公式） ----------

export async function getAllPleasureEntries(): Promise<PleasureEntry[]> {
  const stored = await getKV<PleasureEntry[]>('pleasureEntries')
  return stored ?? []
}

export async function addPleasureEntry(entry: PleasureEntry): Promise<void> {
  const list = await getAllPleasureEntries()
  list.push(entry)
  await setKV('pleasureEntries', list)
}

export async function savePleasureEntries(entries: PleasureEntry[]): Promise<void> {
  await setKV('pleasureEntries', entries)
}

// ---------- 愉悦类别配置（可在设置页增删改） ----------

const DEFAULT_PLEASURE_CATEGORIES: PleasureCategoryConfig[] = [
  { id: 1, name: '身体放松', examples: '性爱 / 泡澡 / 拉伸 / 晒太阳' },
  { id: 2, name: '感官享受', examples: '美景 / 音乐 / 电影 / 茶 / 咖啡' },
  { id: 3, name: '心智触动', examples: '阅读触动 / 写想法' },
  { id: 4, name: '创造表达', examples: '写作 / 画画 / 输出' },
  { id: 5, name: '纯发呆', examples: '什么都不做，发呆放空' },
  { id: 6, name: '其他', examples: '自定义的愉悦活动' },
]

export async function loadPleasureCategories(): Promise<PleasureCategoryConfig[]> {
  const stored = await getKV<PleasureCategoryConfig[]>('pleasureCategories')
  if (stored && stored.length > 0) return stored
  await setKV('pleasureCategories', DEFAULT_PLEASURE_CATEGORIES)
  return DEFAULT_PLEASURE_CATEGORIES
}

export async function savePleasureCategories(categories: PleasureCategoryConfig[]): Promise<void> {
  await setKV('pleasureCategories', categories)
}

export { DEFAULT_PLEASURE_CATEGORIES }

// ---------- 成长 · 阅读打卡 ----------
export async function getAllReadingEntries(): Promise<ReadingEntry[]> {
  const stored = await getKV<ReadingEntry[]>('readingEntries')
  return stored ?? []
}

export async function addReadingEntry(entry: ReadingEntry): Promise<void> {
  const list = await getAllReadingEntries()
  list.push(entry)
  await setKV('readingEntries', list)
}

export async function saveReadingEntries(entries: ReadingEntry[]): Promise<void> {
  await setKV('readingEntries', entries)
}

// ---------- 成长 · 今日学英语 ----------
export async function getAllEnglishEntries(): Promise<EnglishEntry[]> {
  const stored = await getKV<EnglishEntry[]>('englishEntries')
  return stored ?? []
}

export async function addEnglishEntry(entry: EnglishEntry): Promise<void> {
  const list = await getAllEnglishEntries()
  list.push(entry)
  await setKV('englishEntries', list)
}

export async function saveEnglishEntries(entries: EnglishEntry[]): Promise<void> {
  await setKV('englishEntries', entries)
}

// ---------- 成长 · 今日学技能 ----------
export async function getAllSkillEntries(): Promise<SkillEntry[]> {
  const stored = await getKV<SkillEntry[]>('skillEntries')
  return stored ?? []
}

export async function addSkillEntry(entry: SkillEntry): Promise<void> {
  const list = await getAllSkillEntries()
  list.push(entry)
  await setKV('skillEntries', list)
}

export async function saveSkillEntries(entries: SkillEntry[]): Promise<void> {
  await setKV('skillEntries', entries)
}

// ---------- 成长 · 今日感恩 ----------
export async function getAllGratitudeEntries(): Promise<GratitudeEntry[]> {
  const stored = await getKV<GratitudeEntry[]>('gratitudeEntries')
  return stored ?? []
}

export async function addGratitudeEntry(entry: GratitudeEntry): Promise<void> {
  const list = await getAllGratitudeEntries()
  list.push(entry)
  await setKV('gratitudeEntries', list)
}

export async function saveGratitudeEntries(entries: GratitudeEntry[]): Promise<void> {
  await setKV('gratitudeEntries', entries)
}

// ---------- 成长 · 今日发现 ----------
export async function getAllDiscoveryEntries(): Promise<DiscoveryEntry[]> {
  const stored = await getKV<DiscoveryEntry[]>('discoveryEntries')
  return stored ?? []
}

export async function addDiscoveryEntry(entry: DiscoveryEntry): Promise<void> {
  const list = await getAllDiscoveryEntries()
  list.push(entry)
  await setKV('discoveryEntries', list)
}

export async function saveDiscoveryEntries(entries: DiscoveryEntry[]): Promise<void> {
  await setKV('discoveryEntries', entries)
}

// ---------- 成长 · 今日一句话 ----------
export async function getAllSentenceEntries(): Promise<SentenceEntry[]> {
  const stored = await getKV<SentenceEntry[]>('sentenceEntries')
  return stored ?? []
}

export async function addSentenceEntry(entry: SentenceEntry): Promise<void> {
  const list = await getAllSentenceEntries()
  list.push(entry)
  await setKV('sentenceEntries', list)
}

export async function saveSentenceEntries(entries: SentenceEntry[]): Promise<void> {
  await setKV('sentenceEntries', entries)
}

// ---------- Entries 打卡记录 ----------

export async function addEntry(entry: Entry): Promise<void> {
  await withStore('readwrite', ENTRIES_STORE, (store) => store.put(entry))
}

export async function getAllEntries(): Promise<Entry[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ENTRIES_STORE, 'readonly')
    const store = tx.objectStore(ENTRIES_STORE)
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result as Entry[])
    request.onerror = () => reject(request.error)
  })
}

export async function deleteEntryById(id: string): Promise<void> {
  await withStore('readwrite', ENTRIES_STORE, (store) => store.delete(id))
}

