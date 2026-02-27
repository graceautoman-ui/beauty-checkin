import { createClient } from '@supabase/supabase-js'
import type { Entry, Settings, Exercise, UglyBehavior, UglyEntry, WellnessBehavior, WellnessEntry, PleasureEntry } from '../domain/types'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase = url && anonKey ? createClient(url, anonKey) : null

/** 从 Supabase 读出的行（列名为 snake_case） */
export interface UserDataRow {
  id: string
  settings: Settings
  exercises: Exercise[]
  ugly_behaviors: UglyBehavior[]
  wellness_behaviors: WellnessBehavior[]
  entries: Entry[]
  ugly_entries: UglyEntry[]
  wellness_entries: WellnessEntry[]
  pleasure_entries: PleasureEntry[]
  updated_at: string
}

/** 应用内使用的全量数据（camelCase） */
export interface UserData {
  settings: Settings
  exercises: Exercise[]
  uglyBehaviors: UglyBehavior[]
  wellnessBehaviors: WellnessBehavior[]
  entries: Entry[]
  uglyEntries: UglyEntry[]
  wellnessEntries: WellnessEntry[]
  pleasureEntries: PleasureEntry[]
}

function rowToData(row: UserDataRow): UserData {
  return {
    settings: row.settings,
    exercises: row.exercises ?? [],
    uglyBehaviors: row.ugly_behaviors ?? [],
    wellnessBehaviors: row.wellness_behaviors ?? [],
    entries: row.entries ?? [],
    uglyEntries: row.ugly_entries ?? [],
    wellnessEntries: row.wellness_entries ?? [],
    pleasureEntries: row.pleasure_entries ?? [],
  }
}

export async function loadUserData(): Promise<UserData | null> {
  if (!supabase) return null
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('user_data')
    .select('*')
    .eq('id', user.id)
    .single()
  if (error || !data) return null
  return rowToData(data as unknown as UserDataRow)
}

export async function saveUserData(payload: UserData): Promise<boolean> {
  if (!supabase) return false
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { error } = await supabase
    .from('user_data')
    .upsert({
      id: user.id,
      settings: payload.settings,
      exercises: payload.exercises,
      ugly_behaviors: payload.uglyBehaviors,
      wellness_behaviors: payload.wellnessBehaviors,
      entries: payload.entries,
      ugly_entries: payload.uglyEntries,
      wellness_entries: payload.wellnessEntries,
      pleasure_entries: payload.pleasureEntries,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
  return !error
}

export function onAuthStateChange(callback: (event: string, session: { user: { email?: string } } | null) => void) {
  if (!supabase) return () => {}
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
  return () => subscription.unsubscribe()
}
