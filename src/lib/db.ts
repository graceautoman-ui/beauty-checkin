import type { Entry, Settings, Exercise } from '../domain/types'
import { DEFAULT_EXERCISES } from '../domain/exercises'

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
  dailyGoal: 100,
  weeklyGoal: 700,
  monthlyGoal: 3000,
}

export async function loadSettings(): Promise<Settings> {
  const stored = await getKV<Settings>('settings')
  if (stored) return stored
  await setKV('settings', DEFAULT_SETTINGS)
  return DEFAULT_SETTINGS
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

