import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import type { Entry, Exercise, Settings, UglyBehavior, UglyCategory, UglyEntry, WellnessBehavior, WellnessCategory, WellnessEntry, PleasureEntry, PleasureCategoryConfig, ReadingEntry, EnglishEntry, SkillEntry, GratitudeEntry, DiscoveryEntry, SentenceEntry } from './domain/types'
import { DEFAULT_EXERCISES } from './domain/exercises'
import { DEFAULT_UGLY_BEHAVIORS } from './domain/uglyBehaviors'
import { addWellnessEntry, getAllEntries, getAllUglyEntries, getAllWellnessEntries, getAllPleasureEntries, getAllReadingEntries, getAllEnglishEntries, getAllSkillEntries, getAllGratitudeEntries, getAllDiscoveryEntries, getAllSentenceEntries, loadExercises, loadSettings, loadUglyBehaviors, loadWellnessBehaviors, loadPleasureCategories, saveExercises, saveSettings, saveUglyBehaviors, saveWellnessBehaviors, savePleasureEntries, savePleasureCategories, saveReadingEntries, saveEnglishEntries, saveSkillEntries, saveGratitudeEntries, saveDiscoveryEntries, saveSentenceEntries, saveUglyEntries, saveWellnessEntries, addReadingEntry, addEnglishEntry, addSkillEntry, addGratitudeEntry, addDiscoveryEntry, addSentenceEntry, deleteEntryById, DEFAULT_PLEASURE_CATEGORIES } from './lib/db'
import { loadUserData, onAuthStateChange, saveUserData, supabase } from './lib/supabase'
import {
  calcBeauty,
  calcMonthSummary,
  calcTodaySummary,
  calcWeekSummary,
  calcUgly,
  calcUglyMonthSummary,
  calcUglyTodaySummary,
  calcUglyWeekSummary,
  calcWellness,
  calcWellnessMonthSummary,
  calcWellnessTodaySummary,
  calcWellnessWeekSummary,
  getExerciseSummary,
  getMonthStartDateKey,
  getUglySummary,
  getDailyHealthGoal,
  getMonthlyHealthGoal,
  getWellnessSummary,
  getWeekStartDateKey,
  getWeeklyHealthGoal,
  toDateKey,
} from './lib/metrics'

type Tab = 'overview' | 'dashboard' | 'ugly' | 'wellness' | 'pleasure' | 'growth' | 'history' | 'settings'

function App() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [loading, setLoading] = useState(true)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [uglyBehaviors, setUglyBehaviors] = useState<UglyBehavior[]>([])
  const [wellnessBehaviors, setWellnessBehaviors] = useState<WellnessBehavior[]>([])
  const [settings, setSettingsState] = useState<Settings | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [uglyEntries, setUglyEntries] = useState<UglyEntry[]>([])
  const [wellnessEntries, setWellnessEntries] = useState<WellnessEntry[]>([])
  const [pleasureEntries, setPleasureEntries] = useState<PleasureEntry[]>([])
  const [pleasureCategories, setPleasureCategories] = useState<PleasureCategoryConfig[]>([])
  const [readingEntries, setReadingEntries] = useState<ReadingEntry[]>([])
  const [englishEntries, setEnglishEntries] = useState<EnglishEntry[]>([])
  const [skillEntries, setSkillEntries] = useState<SkillEntry[]>([])
  const [gratitudeEntries, setGratitudeEntries] = useState<GratitudeEntry[]>([])
  const [discoveryEntries, setDiscoveryEntries] = useState<DiscoveryEntry[]>([])
  const [sentenceEntries, setSentenceEntries] = useState<SentenceEntry[]>([])
  const [saving, setSaving] = useState(false)
  const [authUser, setAuthUser] = useState<{ email: string } | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)

  const didInitialLoad = useRef(false)

  useEffect(() => {
    async function init() {
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const data = await loadUserData()
          if (data) {
            setExercises(data.exercises?.length ? data.exercises : DEFAULT_EXERCISES)
            setUglyBehaviors(data.uglyBehaviors?.length ? data.uglyBehaviors : DEFAULT_UGLY_BEHAVIORS)
            setWellnessBehaviors(data.wellnessBehaviors ?? [])
            setSettingsState(data.settings ?? { dailyBeautyGoal: 100, dailyUglyGoal: 0, dailyWellnessGoal: 0 })
            setEntries(data.entries ?? [])
            setUglyEntries(data.uglyEntries ?? [])
            setWellnessEntries(data.wellnessEntries ?? [])
            setPleasureEntries(data.pleasureEntries ?? [])
            setPleasureCategories(
              data.pleasureCategories && data.pleasureCategories.length > 0
                ? data.pleasureCategories
                : DEFAULT_PLEASURE_CATEGORIES,
            )
            const [reading, english, skill, grat, disc, sent] = await Promise.all([getAllReadingEntries(), getAllEnglishEntries(), getAllSkillEntries(), getAllGratitudeEntries(), getAllDiscoveryEntries(), getAllSentenceEntries()])
            setReadingEntries(reading)
            setEnglishEntries(english)
            setSkillEntries(skill)
            setGratitudeEntries(grat)
            setDiscoveryEntries(disc)
            setSentenceEntries(sent)
            setAuthUser({ email: session.user.email ?? '' })
          } else {
            setExercises(DEFAULT_EXERCISES)
            setUglyBehaviors(DEFAULT_UGLY_BEHAVIORS)
            setWellnessBehaviors([])
            setSettingsState({ dailyBeautyGoal: 100, dailyUglyGoal: 0, dailyWellnessGoal: 0 })
            setEntries([])
            setUglyEntries([])
            setWellnessEntries([])
            setPleasureEntries([])
            setPleasureCategories(DEFAULT_PLEASURE_CATEGORIES)
            const [reading, english, skill, grat, disc, sent] = await Promise.all([getAllReadingEntries(), getAllEnglishEntries(), getAllSkillEntries(), getAllGratitudeEntries(), getAllDiscoveryEntries(), getAllSentenceEntries()])
            setReadingEntries(reading)
            setEnglishEntries(english)
            setSkillEntries(skill)
            setGratitudeEntries(grat)
            setDiscoveryEntries(disc)
            setSentenceEntries(sent)
            setAuthUser({ email: session.user.email ?? '' })
          }
        } else {
          const [loadedExercises, loadedUgly, loadedWellness, loadedSettings, loadedEntries, loadedUglyEntries, loadedWellnessEntries, loadedPleasureEntries, loadedPleasureCategories, loadedReadingEntries, loadedEnglishEntries, loadedSkillEntries, loadedGratitudeEntries, loadedDiscoveryEntries, loadedSentenceEntries] = await Promise.all([
            loadExercises(), loadUglyBehaviors(), loadWellnessBehaviors(), loadSettings(),
            getAllEntries(), getAllUglyEntries(), getAllWellnessEntries(), getAllPleasureEntries(), loadPleasureCategories(), getAllReadingEntries(), getAllEnglishEntries(), getAllSkillEntries(), getAllGratitudeEntries(), getAllDiscoveryEntries(), getAllSentenceEntries(),
          ])
          setExercises(loadedExercises)
          setUglyBehaviors(loadedUgly)
          setWellnessBehaviors(loadedWellness)
          setSettingsState(loadedSettings)
          setEntries(loadedEntries)
          setUglyEntries(loadedUglyEntries)
          setWellnessEntries(loadedWellnessEntries)
          setPleasureEntries(loadedPleasureEntries)
          setPleasureCategories(loadedPleasureCategories)
          setReadingEntries(loadedReadingEntries)
          setEnglishEntries(loadedEnglishEntries)
          setSkillEntries(loadedSkillEntries)
          setGratitudeEntries(loadedGratitudeEntries)
          setDiscoveryEntries(loadedDiscoveryEntries)
          setSentenceEntries(loadedSentenceEntries)
          setAuthUser(null)
        }
      } else {
        const [loadedExercises, loadedUgly, loadedWellness, loadedSettings, loadedEntries, loadedUglyEntries, loadedWellnessEntries, loadedPleasureEntries, loadedPleasureCategories, loadedReadingEntries, loadedEnglishEntries, loadedSkillEntries, loadedGratitudeEntries, loadedDiscoveryEntries, loadedSentenceEntries] = await Promise.all([
          loadExercises(), loadUglyBehaviors(), loadWellnessBehaviors(), loadSettings(),
          getAllEntries(), getAllUglyEntries(), getAllWellnessEntries(), getAllPleasureEntries(), loadPleasureCategories(), getAllReadingEntries(), getAllEnglishEntries(), getAllSkillEntries(), getAllGratitudeEntries(), getAllDiscoveryEntries(), getAllSentenceEntries(),
        ])
        setExercises(loadedExercises)
        setUglyBehaviors(loadedUgly)
        setWellnessBehaviors(loadedWellness)
        setSettingsState(loadedSettings)
        setEntries(loadedEntries)
        setUglyEntries(loadedUglyEntries)
        setWellnessEntries(loadedWellnessEntries)
        setPleasureEntries(loadedPleasureEntries)
        setPleasureCategories(loadedPleasureCategories)
        setReadingEntries(loadedReadingEntries)
        setEnglishEntries(loadedEnglishEntries)
        setSkillEntries(loadedSkillEntries)
        setGratitudeEntries(loadedGratitudeEntries)
        setDiscoveryEntries(loadedDiscoveryEntries)
        setSentenceEntries(loadedSentenceEntries)
        setAuthUser(null)
      }
      setLoading(false)
      didInitialLoad.current = true
    }
    void init()
  }, [])

  useEffect(() => {
    if (!supabase) return
    return onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setAuthUser({ email: session.user.email ?? '' })
        void loadUserData().then((data) => {
          if (data) {
            setExercises(data.exercises?.length ? data.exercises : DEFAULT_EXERCISES)
            setUglyBehaviors(data.uglyBehaviors?.length ? data.uglyBehaviors : DEFAULT_UGLY_BEHAVIORS)
            setWellnessBehaviors(data.wellnessBehaviors ?? [])
            setSettingsState(data.settings ?? { dailyBeautyGoal: 100, dailyUglyGoal: 0, dailyWellnessGoal: 0 })
            setEntries(data.entries ?? [])
            setUglyEntries(data.uglyEntries ?? [])
            setWellnessEntries(data.wellnessEntries ?? [])
            setPleasureEntries(data.pleasureEntries ?? [])
            setPleasureCategories(
              data.pleasureCategories && data.pleasureCategories.length > 0
                ? data.pleasureCategories
                : DEFAULT_PLEASURE_CATEGORIES,
            )
          }
        })
      } else if (event === 'SIGNED_OUT') {
        setAuthUser(null)
        void Promise.all([loadExercises(), loadUglyBehaviors(), loadWellnessBehaviors(), loadSettings(), getAllEntries(), getAllUglyEntries(), getAllWellnessEntries(), getAllPleasureEntries(), loadPleasureCategories(), getAllReadingEntries(), getAllEnglishEntries(), getAllSkillEntries(), getAllGratitudeEntries(), getAllDiscoveryEntries(), getAllSentenceEntries()]).then(
          ([ex, ug, wel, set, ent, ue, we, pe, pc, re, eng, sk, grat, disc, sent]) => {
            setExercises(ex)
            setUglyBehaviors(ug)
            setWellnessBehaviors(wel)
            setSettingsState(set)
            setEntries(ent)
            setUglyEntries(ue)
            setWellnessEntries(we)
            setPleasureEntries(pe)
            setPleasureCategories(pc)
            setReadingEntries(re)
            setEnglishEntries(eng)
            setSkillEntries(sk)
            setGratitudeEntries(grat)
            setDiscoveryEntries(disc)
            setSentenceEntries(sent)
          },
        )
      }
    })
  }, [])

  useEffect(() => {
    if (!didInitialLoad.current || !settings) return
    const t = setTimeout(() => {
      if (authUser && supabase) {
        void saveUserData({
          settings,
          exercises,
          uglyBehaviors,
          wellnessBehaviors,
          entries,
          uglyEntries,
          wellnessEntries,
          pleasureEntries,
          pleasureCategories,
        })
      } else {
        void Promise.all([
          saveExercises(exercises),
          saveUglyBehaviors(uglyBehaviors),
          saveWellnessBehaviors(wellnessBehaviors),
          saveSettings(settings),
          savePleasureEntries(pleasureEntries),
          savePleasureCategories(pleasureCategories),
          saveReadingEntries(readingEntries),
          saveEnglishEntries(englishEntries),
          saveSkillEntries(skillEntries),
          saveGratitudeEntries(gratitudeEntries),
          saveDiscoveryEntries(discoveryEntries),
          saveSentenceEntries(sentenceEntries),
        ])
      }
    }, 600)
    return () => clearTimeout(t)
  }, [authUser, exercises, settings, uglyBehaviors, wellnessBehaviors, entries, uglyEntries, wellnessEntries, pleasureEntries, readingEntries, englishEntries, skillEntries, gratitudeEntries, discoveryEntries, sentenceEntries])

  async function handleSaveAll() {
    if (!settings) return
    setSaving(true)
    try {
      if (authUser && supabase) {
        await saveUserData({
          settings,
          exercises,
          uglyBehaviors,
          wellnessBehaviors,
          entries,
          uglyEntries,
          wellnessEntries,
          pleasureEntries,
          pleasureCategories,
        })
      } else {
        await Promise.all([
          saveExercises(exercises),
          saveUglyBehaviors(uglyBehaviors),
          saveWellnessBehaviors(wellnessBehaviors),
          saveSettings(settings),
          savePleasureEntries(pleasureEntries),
          savePleasureCategories(pleasureCategories),
          saveReadingEntries(readingEntries),
          saveEnglishEntries(englishEntries),
          saveSkillEntries(skillEntries),
          saveGratitudeEntries(gratitudeEntries),
          saveDiscoveryEntries(discoveryEntries),
          saveSentenceEntries(sentenceEntries),
        ])
      }
    } finally {
      setSaving(false)
    }
  }

  function handleDeletePleasureEntry(id: string): void {
    const filtered = pleasureEntries.filter((p) => p.id !== id)
    setPleasureEntries(filtered)
    if (!authUser || !supabase) {
      void savePleasureEntries(filtered)
    }
    // 登录状态下会由自动保存把最新列表同步到 Supabase
  }

  function handleDeleteExerciseEntry(id: string): void {
    const filtered = entries.filter((e) => e.id !== id)
    setEntries(filtered)
    if (!authUser || !supabase) {
      void deleteEntryById(id)
    }
  }

  function handleDeleteUglyEntry(id: string): void {
    const filtered = uglyEntries.filter((e) => e.id !== id)
    setUglyEntries(filtered)
    if (!authUser || !supabase) {
      void saveUglyEntries(filtered)
    }
  }

  function handleDeleteWellnessEntry(id: string): void {
    const filtered = wellnessEntries.filter((e) => e.id !== id)
    setWellnessEntries(filtered)
    if (!authUser || !supabase) {
      void saveWellnessEntries(filtered)
    }
  }

  if (loading || !settings) {
    return <div className="app-root">加载中…</div>
  }

  return (
    <div className="app-root">
      <header className="app-header">
        <h1>Healthy Check-in</h1>
        {supabase && (
          authUser ? (
            <span className="app-auth">
              <span className="app-auth-email">{authUser.email}</span>
              <button type="button" className="app-auth-btn" onClick={() => supabase!.auth.signOut()}>退出</button>
            </span>
          ) : (
            <button type="button" className="app-auth-btn" onClick={() => setShowAuthModal(true)}>登录 / 注册</button>
          )
        )}
      </header>
      {supabase && showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => setShowAuthModal(false)}
        />
      )}

      <nav className="app-tabs">
        <button type="button" className={tab === 'dashboard' ? 'tab active' : 'tab'} onClick={() => setTab('dashboard')}>健康</button>
        <button type="button" className={tab === 'pleasure' ? 'tab active tab-pleasure' : 'tab tab-pleasure'} onClick={() => setTab('pleasure')}>愉悦</button>
        <button type="button" className={tab === 'growth' ? 'tab active' : 'tab'} onClick={() => setTab('growth')}>成长</button>
      </nav>

      <main className="app-main">
        {tab === 'overview' && settings && (
          <OverviewDashboard
            entries={entries}
            uglyEntries={uglyEntries}
            wellnessEntries={wellnessEntries}
            pleasureEntries={pleasureEntries}
            readingEntries={readingEntries}
            englishEntries={englishEntries}
            skillEntries={skillEntries}
            gratitudeEntries={gratitudeEntries}
            discoveryEntries={discoveryEntries}
            sentenceEntries={sentenceEntries}
            settings={settings}
          />
        )}
        {tab === 'dashboard' && settings && (
          <BeautyHub
            entries={entries}
            setEntries={setEntries}
            exercises={exercises}
            uglyEntries={uglyEntries}
            setUglyEntries={setUglyEntries}
            uglyBehaviors={uglyBehaviors}
            wellnessEntries={wellnessEntries}
            setWellnessEntries={setWellnessEntries}
            wellnessBehaviors={wellnessBehaviors}
            settings={settings}
            syncMode={!!authUser}
          />
        )}
        {tab === 'pleasure' && (
          <PleasureDashboard
            pleasureEntries={pleasureEntries}
            setPleasureEntries={setPleasureEntries}
            pleasureCategories={pleasureCategories}
            syncMode={!!authUser}
          />
        )}
        {tab === 'growth' && (
          <GrowthPage
            readingEntries={readingEntries}
            englishEntries={englishEntries}
            skillEntries={skillEntries}
            onAddReadingEntry={async (entry) => {
              setReadingEntries((prev) => [...prev, entry])
              await addReadingEntry(entry)
            }}
            onUpdateReadingEntry={async (updatedEntry) => {
              const next = readingEntries.map((e) => (e.id === updatedEntry.id ? updatedEntry : e))
              setReadingEntries(next)
              await saveReadingEntries(next)
            }}
            onDeleteReadingEntry={async (id) => {
              const next = readingEntries.filter((e) => e.id !== id)
              setReadingEntries(next)
              await saveReadingEntries(next)
            }}
            onAddEnglishEntry={async (entry) => {
              setEnglishEntries((prev) => [...prev, entry])
              await addEnglishEntry(entry)
            }}
            onAddSkillEntry={async (entry) => {
              setSkillEntries((prev) => [...prev, entry])
              await addSkillEntry(entry)
            }}
            onUpdateSkillEntry={async (updatedEntry) => {
              const next = skillEntries.map((e) => (e.id === updatedEntry.id ? updatedEntry : e))
              setSkillEntries(next)
              await saveSkillEntries(next)
            }}
            onDeleteSkillEntry={async (id) => {
              const next = skillEntries.filter((e) => e.id !== id)
              setSkillEntries(next)
              await saveSkillEntries(next)
            }}
            gratitudeEntries={gratitudeEntries}
            discoveryEntries={discoveryEntries}
            sentenceEntries={sentenceEntries}
            onAddGratitudeEntry={async (entry) => {
              setGratitudeEntries((prev) => [...prev, entry])
              await addGratitudeEntry(entry)
            }}
            onAddDiscoveryEntry={async (entry) => {
              setDiscoveryEntries((prev) => [...prev, entry])
              await addDiscoveryEntry(entry)
            }}
            onAddSentenceEntry={async (entry) => {
              setSentenceEntries((prev) => [...prev, entry])
              await addSentenceEntry(entry)
            }}
          />
        )}
        {/* 养生 / 变丑 Dashboard 已合并到 BeautyHub 中 */}
        {tab === 'history' && settings && (
          <History
            entries={entries}
            uglyEntries={uglyEntries}
            wellnessEntries={wellnessEntries}
            pleasureEntries={pleasureEntries}
            readingEntries={readingEntries}
            englishEntries={englishEntries}
            skillEntries={skillEntries}
            gratitudeEntries={gratitudeEntries}
            discoveryEntries={discoveryEntries}
            sentenceEntries={sentenceEntries}
            settings={settings}
            onDeleteExercise={handleDeleteExerciseEntry}
            onDeleteUgly={handleDeleteUglyEntry}
            onDeleteWellness={handleDeleteWellnessEntry}
            onDeletePleasure={handleDeletePleasureEntry}
          />
        )}
        {tab === 'settings' && (
          <SettingsPanel
            exercises={exercises}
            onChangeExercises={setExercises}
            uglyBehaviors={uglyBehaviors}
            onChangeUglyBehaviors={setUglyBehaviors}
            wellnessBehaviors={wellnessBehaviors}
            onChangeWellnessBehaviors={setWellnessBehaviors}
            settings={settings}
            onChangeSettings={setSettingsState}
            onSaveAll={handleSaveAll}
            saving={saving}
          />
        )}
      </main>

      <nav className="app-tabs app-tabs-bottom">
        <button type="button" className={tab === 'overview' ? 'tab active tab-overview' : 'tab tab-overview'} onClick={() => setTab('overview')}>看板</button>
        <button type="button" className={tab === 'history' ? 'tab active' : 'tab'} onClick={() => setTab('history')}>历史</button>
        <button type="button" className={tab === 'settings' ? 'tab active' : 'tab'} onClick={() => setTab('settings')}>设置</button>
      </nav>
    </div>
  )
}

// ---------- 看板 Overview ----------

interface OverviewDashboardProps {
  entries: Entry[]
  uglyEntries: UglyEntry[]
  wellnessEntries: WellnessEntry[]
  pleasureEntries: PleasureEntry[]
  readingEntries: ReadingEntry[]
  englishEntries: EnglishEntry[]
  skillEntries: SkillEntry[]
  gratitudeEntries: GratitudeEntry[]
  discoveryEntries: DiscoveryEntry[]
  sentenceEntries: SentenceEntry[]
  settings: Settings
}

type OverviewPeriod = 'today' | 'week' | 'month'
type OverviewTab = 'summary' | 'trend'
type TrendRange = 7 | 14 | 30
type TrendMetric = 'beauty' | 'pleasure' | 'growth'

function OverviewDashboard({ entries, uglyEntries, wellnessEntries, pleasureEntries, readingEntries, englishEntries, skillEntries, gratitudeEntries, discoveryEntries, sentenceEntries, settings }: OverviewDashboardProps) {
  const [tab, setTab] = useState<OverviewTab>('summary')
  const [period, setPeriod] = useState<OverviewPeriod>('today')
  const now = new Date()
  const todayKey = toDateKey(now)
  const weekStartKey = getWeekStartDateKey(now)
  const monthStartKey = getMonthStartDateKey(now)
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

  const periods = useMemo(() => {
    const todayEntriesFiltered = entries.filter((e) => e.dateKey === todayKey)
    const weekEntriesFiltered = entries.filter((e) => e.dateKey >= weekStartKey && e.dateKey <= todayKey)
    const monthEntriesFiltered = entries.filter((e) => e.dateKey >= monthStartKey && e.dateKey <= todayKey)
    const todayUglyFiltered = uglyEntries.filter((e) => e.dateKey === todayKey)
    const weekUglyFiltered = uglyEntries.filter((e) => e.dateKey >= weekStartKey && e.dateKey <= todayKey)
    const monthUglyFiltered = uglyEntries.filter((e) => e.dateKey >= monthStartKey && e.dateKey <= todayKey)
    const todayWellnessFiltered = wellnessEntries.filter((e) => e.dateKey === todayKey)
    const weekWellnessFiltered = wellnessEntries.filter((e) => e.dateKey >= weekStartKey && e.dateKey <= todayKey)
    const monthWellnessFiltered = wellnessEntries.filter((e) => e.dateKey >= monthStartKey && e.dateKey <= todayKey)

    const todayBeauty = todayEntriesFiltered.reduce((s, e) => s + e.beautyGained, 0)
    const todayUgly = todayUglyFiltered.reduce((s, e) => s + e.uglyGained, 0)
    const todayWellness = todayWellnessFiltered.reduce((s, e) => s + e.wellnessGained, 0)
    const weekBeauty = weekEntriesFiltered.reduce((s, e) => s + e.beautyGained, 0)
    const weekUgly = weekUglyFiltered.reduce((s, e) => s + e.uglyGained, 0)
    const weekWellness = weekWellnessFiltered.reduce((s, e) => s + e.wellnessGained, 0)
    const monthBeauty = monthEntriesFiltered.reduce((s, e) => s + e.beautyGained, 0)
    const monthUgly = monthUglyFiltered.reduce((s, e) => s + e.uglyGained, 0)
    const monthWellness = monthWellnessFiltered.reduce((s, e) => s + e.wellnessGained, 0)

    const beautyGoalDay = settings.dailyBeautyGoal
    const beautyGoalWeek = beautyGoalDay * 7
    const beautyGoalMonth = beautyGoalDay * daysInMonth
    const uglyLimitDay = settings.dailyUglyGoal
    const uglyLimitWeek = uglyLimitDay * 7
    const uglyLimitMonth = uglyLimitDay * daysInMonth
    const wellnessGoalDay = settings.dailyWellnessGoal
    const wellnessGoalWeek = wellnessGoalDay * 7
    const wellnessGoalMonth = wellnessGoalDay * daysInMonth
    const healthGoalDay = getDailyHealthGoal(settings)
    const healthGoalWeek = getWeeklyHealthGoal(settings)
    const healthGoalMonth = getMonthlyHealthGoal(settings, now)

    return [
      {
        label: '今日',
        beauty: { value: todayBeauty, goal: beautyGoalDay, summary: getExerciseSummary(todayEntriesFiltered) },
        ugly: { value: todayUgly, limit: uglyLimitDay, summary: getUglySummary(todayUglyFiltered) },
        wellness: { value: todayWellness, goal: wellnessGoalDay, summary: getWellnessSummary(todayWellnessFiltered) },
        health: { value: Math.round((todayBeauty - todayUgly + todayWellness) * 100) / 100, goal: healthGoalDay },
      },
      {
        label: '本周',
        beauty: { value: weekBeauty, goal: beautyGoalWeek, summary: getExerciseSummary(weekEntriesFiltered) },
        ugly: { value: weekUgly, limit: uglyLimitWeek, summary: getUglySummary(weekUglyFiltered) },
        wellness: { value: weekWellness, goal: wellnessGoalWeek, summary: getWellnessSummary(weekWellnessFiltered) },
        health: { value: Math.round((weekBeauty - weekUgly + weekWellness) * 100) / 100, goal: healthGoalWeek },
      },
      {
        label: '本月',
        beauty: { value: monthBeauty, goal: beautyGoalMonth, summary: getExerciseSummary(monthEntriesFiltered) },
        ugly: { value: monthUgly, limit: uglyLimitMonth, summary: getUglySummary(monthUglyFiltered) },
        wellness: { value: monthWellness, goal: wellnessGoalMonth, summary: getWellnessSummary(monthWellnessFiltered) },
        health: { value: Math.round((monthBeauty - monthUgly + monthWellness) * 100) / 100, goal: healthGoalMonth },
      },
    ]
  }, [entries, uglyEntries, wellnessEntries, settings, todayKey, weekStartKey, monthStartKey, daysInMonth])

  const periodIndex = period === 'today' ? 0 : period === 'week' ? 1 : 2
  const p = periods[periodIndex]

  const [trendRange, setTrendRange] = useState<TrendRange>(7)
  const [trendMetric, setTrendMetric] = useState<TrendMetric>('pleasure')
  const [trendBeautySub, setTrendBeautySub] = useState<null | 'exercise' | 'wellness' | 'ugly'>(null)

  const trendData = useMemo(() => {
    const days = trendRange
    const list: {
      dateKey: string
      label: string
      health: number
      exercise: number
      wellness: number
      ugly: number
      pleasure: number
      growth: number
    }[] = []
    const msPerDay = 24 * 60 * 60 * 1000
    const today = new Date()

    const countGrowth = (key: string) =>
      readingEntries.filter((e) => e.dateKey === key).length +
      englishEntries.filter((e) => e.dateKey === key).length +
      skillEntries.filter((e) => e.dateKey === key).length +
      gratitudeEntries.filter((e) => e.dateKey === key).length +
      discoveryEntries.filter((e) => e.dateKey === key).length +
      sentenceEntries.filter((e) => e.dateKey === key).length

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today.getTime() - i * msPerDay)
      const key = toDateKey(d)
      const exercise = entries.filter((e) => e.dateKey === key).reduce((s, e) => s + e.beautyGained, 0)
      const wellness = wellnessEntries.filter((e) => e.dateKey === key).reduce((s, e) => s + e.wellnessGained, 0)
      const ugly = uglyEntries.filter((e) => e.dateKey === key).reduce((s, e) => s + e.uglyGained, 0)
      const health = Math.round((exercise - ugly + wellness) * 100) / 100
      const pleasure = pleasureEntries.filter((x) => x.dateKey === key).reduce((s, e) => s + e.score, 0)
      const growth = countGrowth(key)
      list.push({
        dateKey: key,
        label: key.slice(5).replace('-', '/'),
        health,
        exercise,
        wellness,
        ugly,
        pleasure,
        growth,
      })
    }
    const maxHealth = Math.max(0, ...list.map((d) => d.health))
    const maxExercise = Math.max(0, ...list.map((d) => d.exercise))
    const maxWellness = Math.max(0, ...list.map((d) => d.wellness))
    const maxUgly = Math.max(0, ...list.map((d) => d.ugly))
    const maxPleasure = Math.max(0, ...list.map((d) => d.pleasure))
    const maxGrowth = Math.max(0, ...list.map((d) => d.growth))
    const maxAll = Math.max(maxHealth, maxExercise, maxWellness, maxUgly, maxPleasure, maxGrowth, 1)
    return { list, maxHealth, maxPleasure, maxGrowth, maxAll, maxExercise, maxWellness, maxUgly }
  }, [entries, uglyEntries, wellnessEntries, pleasureEntries, readingEntries, englishEntries, skillEntries, gratitudeEntries, discoveryEntries, sentenceEntries, trendRange])

  if (tab === 'trend') {
    const chartWidth = 320
    const chartHeight = 160
    const paddingX = 20
    const paddingY = 16
    const len = trendData.list.length
    const innerWidth = chartWidth - paddingX * 2
    const innerHeight = chartHeight - paddingY * 2

    const getCurrentValue = (d: typeof trendData.list[0]) => {
      if (trendMetric === 'beauty') {
        if (trendBeautySub === null) return d.health
        if (trendBeautySub === 'exercise') return d.exercise
        if (trendBeautySub === 'wellness') return d.wellness
        return d.ugly
      }
      if (trendMetric === 'pleasure') return d.pleasure
      return d.growth
    }
    const maxCurrent =
      trendMetric === 'beauty'
        ? trendBeautySub === null
          ? trendData.maxHealth
          : trendBeautySub === 'exercise'
            ? trendData.maxExercise
            : trendBeautySub === 'wellness'
              ? trendData.maxWellness
              : trendData.maxUgly
        : trendMetric === 'pleasure'
          ? trendData.maxPleasure
          : trendData.maxGrowth
    const maxAll = Math.max(maxCurrent, 1)

    const makeY = (v: number) => {
      if (maxAll <= 0) return paddingY + innerHeight
      const ratio = v / maxAll
      return paddingY + innerHeight - ratio * innerHeight
    }

    const makeX = (index: number) => {
      if (len <= 1) return paddingX + innerWidth / 2
      return paddingX + (innerWidth * index) / (len - 1)
    }

    const baselineY = paddingY + innerHeight

    const path = trendData.list.map((d, idx) => ({
      x: makeX(idx),
      y: makeY(getCurrentValue(d)),
    }))

    const linePoints = path.map((p) => `${p.x},${p.y}`).join(' ')
    const areaPoints =
      path.length > 1
        ? `${path.map((p) => `${p.x},${p.y}`).join(' ')} ${path[path.length - 1].x},${baselineY} ${path[0].x},${baselineY}`
        : ''

    const firstLabel = trendData.list[0]?.label ?? ''
    const midLabel = len > 2 ? trendData.list[Math.floor(len / 2)].label : ''
    const lastLabel = len > 1 ? trendData.list[len - 1].label : firstLabel

    const trendTitle =
      trendMetric === 'beauty'
        ? trendBeautySub === null
          ? '健康值趋势'
          : trendBeautySub === 'exercise'
            ? '运动（运动值）趋势'
            : trendBeautySub === 'wellness'
              ? '养生值趋势'
              : '变丑值趋势'
        : trendMetric === 'pleasure'
          ? '愉悦值趋势'
          : '成长值趋势'
    const legendLabel =
      trendMetric === 'beauty'
        ? trendBeautySub === null
          ? '健康值'
          : trendBeautySub === 'exercise'
            ? '运动值 (B)'
            : trendBeautySub === 'wellness'
              ? '养生值 (W)'
              : '变丑值 (U)'
        : trendMetric === 'pleasure'
          ? '愉悦值 (P)'
          : '成长值 (条)'
    const trendLineClass =
      trendMetric === 'beauty'
        ? trendBeautySub === null || trendBeautySub === 'exercise'
          ? 'beauty'
          : trendBeautySub === 'wellness'
            ? 'wellness'
            : 'ugly'
        : trendMetric === 'pleasure'
          ? 'pleasure'
          : 'growth'

    return (
      <div className="overview-dashboard">
        <h2 className="overview-title">趋势</h2>
        <div className="overview-tab-switch">
          <button type="button" className="overview-tab-pill" onClick={() => setTab('summary')}>
            总览
          </button>
          <button type="button" className="overview-tab-pill active">
            趋势
          </button>
        </div>
        <div className="overview-trend-metric-tabs">
          <button
            type="button"
            className={`overview-pill overview-pill-macaron overview-pill-beauty ${trendMetric === 'beauty' ? 'active' : ''}`}
            onClick={() => setTrendMetric('beauty')}
          >
            健康
          </button>
          <button
            type="button"
            className={`overview-pill overview-pill-macaron overview-pill-pleasure ${trendMetric === 'pleasure' ? 'active' : ''}`}
            onClick={() => setTrendMetric('pleasure')}
          >
            愉悦
          </button>
          <button
            type="button"
            className={`overview-pill overview-pill-macaron overview-pill-growth ${trendMetric === 'growth' ? 'active' : ''}`}
            onClick={() => setTrendMetric('growth')}
          >
            成长
          </button>
        </div>
        {trendMetric === 'beauty' && (
          <div className="overview-trend-beauty-sub-tabs">
            <button
              type="button"
              className={`overview-pill overview-pill-macaron overview-pill-exercise ${trendBeautySub === 'exercise' ? 'active' : ''}`}
              onClick={() => setTrendBeautySub('exercise')}
            >
              运动
            </button>
            <button
              type="button"
              className={`overview-pill overview-pill-macaron overview-pill-wellness ${trendBeautySub === 'wellness' ? 'active' : ''}`}
              onClick={() => setTrendBeautySub('wellness')}
            >
              养生
            </button>
            <button
              type="button"
              className={`overview-pill overview-pill-macaron overview-pill-ugly ${trendBeautySub === 'ugly' ? 'active' : ''}`}
              onClick={() => setTrendBeautySub('ugly')}
            >
              变丑
            </button>
          </div>
        )}
        <div className="overview-filters">
          <button
            type="button"
            className={trendRange === 7 ? 'overview-pill active' : 'overview-pill'}
            onClick={() => setTrendRange(7)}
          >
            最近 7 天
          </button>
          <button
            type="button"
            className={trendRange === 14 ? 'overview-pill active' : 'overview-pill'}
            onClick={() => setTrendRange(14)}
          >
            最近 2 周
          </button>
          <button
            type="button"
            className={trendRange === 30 ? 'overview-pill active' : 'overview-pill'}
            onClick={() => setTrendRange(30)}
          >
            最近 30 天
          </button>
        </div>
        <div className="overview-trend-card">
          <h3 className="overview-trend-title">{trendTitle}</h3>
          <div className="overview-trend-legend">
            <span className={`legend-item legend-${trendLineClass}`}>{legendLabel}</span>
          </div>
          <svg
            className="overview-trend-chart"
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            role="img"
          >
            <defs>
              <linearGradient id="trend-beauty-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fed7aa" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#fed7aa" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="trend-pleasure-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c7d2fe" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#c7d2fe" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="trend-growth-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6ee7b7" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#6ee7b7" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="trend-wellness-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#86efac" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#86efac" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="trend-ugly-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fda4af" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#fda4af" stopOpacity="0" />
              </linearGradient>
            </defs>
            <line
              x1={paddingX}
              y1={paddingY + innerHeight}
              x2={paddingX + innerWidth}
              y2={paddingY + innerHeight}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
            {path.length > 0 && (
              <g className={`trend-line trend-line--${trendLineClass}`}>
                {areaPoints && (
                  <polygon
                    points={areaPoints}
                    className={`overview-trend-area overview-trend-area--${trendLineClass}`}
                  />
                )}
                <polyline
                  points={linePoints}
                  fill="none"
                  className={`overview-trend-line overview-trend-line--${trendLineClass}`}
                />
                {path.map((p, idx) => (
                  <circle
                    key={trendData.list[idx].dateKey}
                    cx={p.x}
                    cy={p.y}
                    r={3}
                    className={`overview-trend-dot overview-trend-dot--${trendLineClass}`}
                  />
                ))}
              </g>
            )}
          </svg>
          <div className="overview-trend-xlabels">
            <span className="overview-trend-xlabel">{firstLabel}</span>
            <span className="overview-trend-xlabel">{midLabel}</span>
            <span className="overview-trend-xlabel">{lastLabel}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="overview-dashboard">
      <h2 className="overview-title">健康行为，一目了然</h2>
      <div className="overview-tab-switch">
        <button type="button" className="overview-tab-pill active">
          总览
        </button>
        <button type="button" className="overview-tab-pill" onClick={() => setTab('trend')}>
          趋势
        </button>
      </div>
      <div className="overview-filters">
        <button type="button" className={period === 'today' ? 'overview-pill active' : 'overview-pill'} onClick={() => setPeriod('today')}>今日</button>
        <button type="button" className={period === 'week' ? 'overview-pill active' : 'overview-pill'} onClick={() => setPeriod('week')}>本周</button>
        <button type="button" className={period === 'month' ? 'overview-pill active' : 'overview-pill'} onClick={() => setPeriod('month')}>本月</button>
      </div>
      <div className="overview-period-card">
        <div className="overview-health-result">
          {(p.health.goal <= 0 || p.health.value >= p.health.goal) && <span className="overview-achieved-smiley" aria-hidden>😄</span>}
          <div className="overview-health-result-label">健康值（美+养-丑）</div>
          <div className="overview-health-result-body">
            <span className="overview-health-value">{p.health.value}<span className="unit">H</span></span>
            <span className="overview-health-target">目标 {p.health.goal} H</span>
            <span className={`overview-health-badge ${p.health.goal <= 0 || p.health.value >= p.health.goal ? 'achieved' : 'not-achieved'}`}>
              {p.health.goal <= 0 || p.health.value >= p.health.goal ? '达成' : '未达成'}
            </span>
          </div>
          <div className="overview-health-bar-wrap">
            <div
              className={`overview-health-bar ${p.health.goal <= 0 || p.health.value >= p.health.goal ? 'achieved' : 'not-achieved'}`}
              style={{ width: (p.health.goal > 0 ? Math.min(100, (p.health.value / p.health.goal) * 100) : (p.health.value > 0 ? 100 : 0)) + '%' }}
            />
          </div>
        </div>
        <div className="overview-metrics">
          <OverviewRow variant="beauty" label="运动" unit="B" value={p.beauty.value} target={p.beauty.goal} achieved={p.beauty.value >= p.beauty.goal} detailSummary={p.beauty.summary} />
          <OverviewRow variant="wellness" label="养生" unit="W" value={p.wellness.value} target={p.wellness.goal} achieved={p.wellness.value >= p.wellness.goal} detailSummary={p.wellness.summary} />
          <OverviewRow variant="ugly" label="变丑" unit="U" value={p.ugly.value} target={p.ugly.limit} isUpperBound achieved={p.ugly.limit <= 0 || p.ugly.value <= p.ugly.limit} detailSummary={p.ugly.summary} />
        </div>
      </div>
    </div>
  )
}

function OverviewRow({
  variant,
  label,
  unit,
  value,
  target,
  isUpperBound,
  achieved,
  detailSummary,
}: {
  variant: 'beauty' | 'ugly' | 'wellness'
  label: string
  unit: string
  value: number
  target: number
  isUpperBound?: boolean
  achieved: boolean
  detailSummary?: string
}) {
  const targetLabel = isUpperBound ? '上限' : '目标'
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : (value > 0 ? 100 : 0)
  const barPct = isUpperBound ? (target <= 0 ? 0 : Math.min(100, (value / target) * 100)) : pct
  const detailBlock = detailSummary ? (
    <div className="overview-metric-detail">
      {detailSummary.split('，').filter(Boolean).map((line, i) => (
        <div key={i} className="overview-metric-detail-line">{line}</div>
      ))}
    </div>
  ) : null

  if (variant === 'ugly') {
    return (
      <div className={`overview-metric overview-metric--ugly overview-metric--ugly-row`}>
        {achieved && <span className="overview-achieved-smiley overview-achieved-smiley--card" aria-hidden>😄</span>}
        <div className="overview-metric-ugly-left">
          <div className="overview-metric-head">
            <span className="overview-metric-label">{label}</span>
            <span className={`overview-metric-badge ${achieved ? 'achieved' : 'not-achieved'}`}>
              {achieved ? '未超' : '已超'}
            </span>
          </div>
          <div className="overview-metric-body">
            <span className="overview-metric-value">{value}<span className="unit">{unit}</span></span>
            <span className="overview-metric-target">{targetLabel} {target}{unit}</span>
          </div>
          <div className="overview-metric-bar-wrap">
            <div
              className={`overview-metric-bar ${achieved ? 'achieved' : 'not-achieved'}`}
              style={{ width: barPct + '%' }}
            />
          </div>
        </div>
        <div className="overview-metric-ugly-right">
          {detailBlock}
        </div>
      </div>
    )
  }

  return (
    <div className={`overview-metric overview-metric--${variant}`}>
      {achieved && <span className="overview-achieved-smiley overview-achieved-smiley--card" aria-hidden>😄</span>}
      <div className="overview-metric-head">
        <span className="overview-metric-label">{label}</span>
        <span className={`overview-metric-badge ${achieved ? 'achieved' : 'not-achieved'}`}>
          {achieved ? '达成' : '未达成'}
        </span>
      </div>
      <div className="overview-metric-body">
        <span className="overview-metric-value">{value}<span className="unit">{unit}</span></span>
        <span className="overview-metric-target">{targetLabel} {target}{unit}</span>
      </div>
      {detailBlock}
      <div className="overview-metric-bar-wrap">
        <div
          className={`overview-metric-bar ${achieved ? 'achieved' : 'not-achieved'}`}
          style={{ width: barPct + '%' }}
        />
      </div>
    </div>
  )
}

// ---------- 首页 Dashboard ----------

interface DashboardProps {
  entries: Entry[]
  setEntries: (v: Entry[]) => void
  exercises: Exercise[]
  settings: Settings
  syncMode?: boolean
}

function Dashboard({ entries, setEntries, exercises, settings, syncMode }: DashboardProps) {
  const [showSheet, setShowSheet] = useState(false)
  const [resultModal, setResultModal] = useState<{
    beautyGained: number
    todayTotal: number
    dailyGoal: number
    achieved: boolean
  } | null>(null)

  const todayKey = toDateKey(new Date())
  const backfillToday = new Date()
  const backfillMaxDate = new Date(backfillToday.getTime() - 24 * 60 * 60 * 1000)
  const backfillMinDate = new Date(backfillToday.getTime() - 7 * 24 * 60 * 60 * 1000)
  const backfillMaxKey = toDateKey(backfillMaxDate)
  const backfillMinKey = toDateKey(backfillMinDate)
  const [sheetMode, setSheetMode] = useState<'today' | 'backfill'>('today')
  const weekStartKey = getWeekStartDateKey(new Date())
  const monthStartKey = getMonthStartDateKey(new Date())

  const todaySummary = useMemo(
    () => (entries.length >= 0 ? calcTodaySummary(entries, settings) : null),
    [entries, settings],
  )
  const weekSummary = useMemo(
    () => (entries.length >= 0 ? calcWeekSummary(entries, settings) : null),
    [entries, settings],
  )
  const monthSummary = useMemo(
    () => (entries.length >= 0 ? calcMonthSummary(entries, settings) : null),
    [entries, settings],
  )

  const todayEntries = useMemo(
    () => entries.filter((e) => e.dateKey === todayKey),
    [entries, todayKey],
  )
  const weekEntries = useMemo(
    () => entries.filter((e) => e.dateKey >= weekStartKey && e.dateKey <= todayKey),
    [entries, weekStartKey, todayKey],
  )
  const monthEntries = useMemo(
    () => entries.filter((e) => e.dateKey >= monthStartKey && e.dateKey <= todayKey),
    [entries, monthStartKey, todayKey],
  )
  const todayExerciseSummary = useMemo(() => getExerciseSummary(todayEntries), [todayEntries])
  const weekExerciseSummary = useMemo(() => getExerciseSummary(weekEntries), [weekEntries])
  const monthExerciseSummary = useMemo(() => getExerciseSummary(monthEntries), [monthEntries])

  async function handleRecordSubmit(entry: Entry) {
    if (syncMode) {
      setEntries([...entries, entry])
      const todayKey = toDateKey(new Date())
      const todayTotal = entries.filter((e) => e.dateKey === todayKey).reduce((s, e) => s + e.beautyGained, 0) + entry.beautyGained
      setResultModal({
        beautyGained: entry.beautyGained,
        todayTotal,
        dailyGoal: settings.dailyBeautyGoal,
        achieved: todayTotal >= settings.dailyBeautyGoal,
      })
      setShowSheet(false)
    } else {
      const { addEntry, getAllEntries } = await import('./lib/db')
      await addEntry(entry)
      const next = await getAllEntries()
      setEntries(next)
      const todayKey = toDateKey(new Date())
      const todayTotal = next.filter((e) => e.dateKey === todayKey).reduce((s, e) => s + e.beautyGained, 0)
      setResultModal({
        beautyGained: entry.beautyGained,
        todayTotal,
        dailyGoal: settings.dailyBeautyGoal,
        achieved: todayTotal >= settings.dailyBeautyGoal,
      })
      setShowSheet(false)
    }
  }

  return (
    <div className="dashboard">
      <button
        type="button"
        className="btn-checkin"
        onClick={() => {
          setSheetMode('today')
          setShowSheet(true)
        }}
      >
        又运动了
      </button>
      <div className="summary-cards">
        {todaySummary && (
          <SummaryCardView card={todaySummary} exerciseSummary={todayExerciseSummary} />
        )}
        {weekSummary && (
          <SummaryCardView card={weekSummary} exerciseSummary={weekExerciseSummary} />
        )}
        {monthSummary && (
          <SummaryCardView card={monthSummary} exerciseSummary={monthExerciseSummary} />
        )}
      </div>
      <button
        type="button"
        className="btn-backfill"
        onClick={() => {
          setSheetMode('backfill')
          setShowSheet(true)
        }}
      >
        补卡（最近 7 天）
      </button>
      {showSheet && (
        <RecordSheet
          exercises={exercises}
          onClose={() => setShowSheet(false)}
          onSubmit={handleRecordSubmit}
          mode={sheetMode}
          minDateKey={backfillMinKey}
          maxDateKey={backfillMaxKey}
        />
      )}
      {resultModal && (
        <ResultModal
          {...resultModal}
          onClose={() => setResultModal(null)}
        />
      )}
    </div>
  )
}

interface BeautyHubProps {
  entries: Entry[]
  setEntries: (v: Entry[]) => void
  exercises: Exercise[]
  uglyEntries: UglyEntry[]
  setUglyEntries: (v: UglyEntry[]) => void
  uglyBehaviors: UglyBehavior[]
  wellnessEntries: WellnessEntry[]
  setWellnessEntries: (v: WellnessEntry[]) => void
  wellnessBehaviors: WellnessBehavior[]
  settings: Settings
  syncMode?: boolean
}

function BeautyHub({
  entries,
  setEntries,
  exercises,
  uglyEntries,
  setUglyEntries,
  uglyBehaviors,
  wellnessEntries,
  setWellnessEntries,
  wellnessBehaviors,
  settings,
  syncMode,
}: BeautyHubProps) {
  const [view, setView] = useState<'exercise' | 'wellness' | 'ugly'>('exercise')

  return (
    <div className="beauty-hub">
      <div className="beauty-switch">
        <button
          type="button"
          className={view === 'exercise' ? 'beauty-pill active' : 'beauty-pill'}
          onClick={() => setView('exercise')}
        >
          <span className="beauty-pill-circle beauty-pill-circle--exercise">动</span>
        </button>
        <button
          type="button"
          className={view === 'wellness' ? 'beauty-pill active' : 'beauty-pill'}
          onClick={() => setView('wellness')}
        >
          <span className="beauty-pill-circle beauty-pill-circle--wellness">养</span>
        </button>
        <button
          type="button"
          className={view === 'ugly' ? 'beauty-pill active' : 'beauty-pill'}
          onClick={() => setView('ugly')}
        >
          <span className="beauty-pill-circle beauty-pill-circle--ugly">丑</span>
        </button>
      </div>

      {view === 'exercise' && (
        <Dashboard
          entries={entries}
          setEntries={setEntries}
          exercises={exercises}
          settings={settings}
          syncMode={syncMode}
        />
      )}
      {view === 'ugly' && (
        <UglyDashboard
          uglyEntries={uglyEntries}
          setUglyEntries={setUglyEntries}
          uglyBehaviors={uglyBehaviors}
          settings={settings}
          syncMode={syncMode}
        />
      )}
      {view === 'wellness' && (
        <WellnessDashboard
          wellnessEntries={wellnessEntries}
          setWellnessEntries={setWellnessEntries}
          wellnessBehaviors={wellnessBehaviors}
          settings={settings}
          syncMode={syncMode}
        />
      )}
    </div>
  )
}

function ReadingSheet({
  onClose,
  onAddReadingEntry,
  onUpdateReadingEntry,
  onDeleteReadingEntry,
  initialEntry,
  todayEntries,
}: {
  onClose: () => void
  onAddReadingEntry: (entry: ReadingEntry) => Promise<void>
  onUpdateReadingEntry: (entry: ReadingEntry) => Promise<void>
  onDeleteReadingEntry: (id: string) => Promise<void>
  initialEntry: ReadingEntry | null
  todayEntries: ReadingEntry[]
}) {
  const [bookName, setBookName] = useState(initialEntry?.bookName ?? '')
  const [durationMinutes, setDurationMinutes] = useState(initialEntry?.durationMinutes ?? 0)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleSubmit() {
    const trimmed = bookName.trim()
    if (!trimmed) return
    setSubmitting(true)
    try {
      const now = new Date()
      const dateKey = toDateKey(now)
      const timestamp = now.toISOString()
      if (initialEntry && trimmed === initialEntry.bookName) {
        const updated: ReadingEntry = { ...initialEntry, durationMinutes, timestamp }
        await onUpdateReadingEntry(updated)
      } else {
        const entry: ReadingEntry = {
          id: crypto.randomUUID(),
          timestamp,
          dateKey,
          bookName: trimmed,
          durationMinutes,
        }
        await onAddReadingEntry(entry)
      }
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet sheet-reading" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <span>阅读打卡</span>
          <button type="button" className="sheet-close" onClick={onClose}>×</button>
        </div>
        <div className="sheet-step">
          {todayEntries.length > 0 && (
            <div className="sheet-reading-recorded">
              <div className="pleasure-field-label">今日已记录</div>
              <ul className="sheet-reading-list">
                {[...todayEntries].sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1)).map((e, index) => (
                  <li key={e.id} className="sheet-reading-list-item">
                    <span className="sheet-recorded-num">{index + 1}.</span>
                    <span>{e.bookName} · {e.durationMinutes} 分钟</span>
                    <button
                      type="button"
                      className="sheet-reading-delete"
                      onClick={async () => {
                        setDeletingId(e.id)
                        try {
                          await onDeleteReadingEntry(e.id)
                        } finally {
                          setDeletingId(null)
                        }
                      }}
                      disabled={deletingId !== null}
                      title="删除"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="pleasure-field">
            <div className="pleasure-field-label">阅读书籍</div>
            <div className="pleasure-field-body">
              <input
                type="text"
                className="input-note input-pleasure-event"
                placeholder="请输入书籍名称"
                value={bookName}
                onChange={(e) => setBookName(e.target.value)}
              />
            </div>
          </div>
          <div className="pleasure-field">
            <div className="pleasure-field-label">阅读时长（分钟）</div>
            <div className="sheet-reading-duration">
              <button
                type="button"
                className="sheet-duration-btn"
                onClick={() => setDurationMinutes((m) => Math.max(0, m - 10))}
                disabled={durationMinutes <= 0}
              >
                −
              </button>
              <span className="sheet-duration-value">{durationMinutes}</span>
              <button
                type="button"
                className="sheet-duration-btn"
                onClick={() => setDurationMinutes((m) => m + 10)}
              >
                +
              </button>
            </div>
            <span className="pleasure-score-hint">以 10 分钟为梯度，默认 0。</span>
          </div>
          <div className="sheet-actions">
            <button type="button" className="secondary" onClick={onClose}>
              取消
            </button>
            <button type="button" onClick={handleSubmit} disabled={!bookName.trim() || submitting}>
              {submitting ? '提交中…' : '完成'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SkillSheet({
  onClose,
  onAddSkillEntry,
  onUpdateSkillEntry,
  onDeleteSkillEntry,
  initialEntry,
  todayEntries,
}: {
  onClose: () => void
  onAddSkillEntry: (entry: SkillEntry) => Promise<void>
  onUpdateSkillEntry: (entry: SkillEntry) => Promise<void>
  onDeleteSkillEntry: (id: string) => Promise<void>
  initialEntry: SkillEntry | null
  todayEntries: SkillEntry[]
}) {
  const [skillName, setSkillName] = useState(initialEntry?.skillName ?? '')
  const [durationMinutes, setDurationMinutes] = useState(initialEntry?.durationMinutes ?? 0)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleSubmit() {
    const trimmed = skillName.trim()
    if (!trimmed) return
    setSubmitting(true)
    try {
      const now = new Date()
      const dateKey = toDateKey(now)
      const timestamp = now.toISOString()
      if (initialEntry && trimmed === initialEntry.skillName) {
        const updated: SkillEntry = { ...initialEntry, durationMinutes, timestamp }
        await onUpdateSkillEntry(updated)
      } else {
        const entry: SkillEntry = {
          id: crypto.randomUUID(),
          timestamp,
          dateKey,
          skillName: trimmed,
          durationMinutes,
        }
        await onAddSkillEntry(entry)
      }
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet sheet-skill" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <span>技能打卡</span>
          <button type="button" className="sheet-close" onClick={onClose}>×</button>
        </div>
        <div className="sheet-step">
          {todayEntries.length > 0 && (
            <div className="sheet-reading-recorded">
              <div className="pleasure-field-label">今日已记录</div>
              <ul className="sheet-reading-list">
                {[...todayEntries].sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1)).map((e, index) => (
                  <li key={e.id} className="sheet-reading-list-item">
                    <span className="sheet-recorded-num">{index + 1}.</span>
                    <span>{e.skillName} · {e.durationMinutes} 分钟</span>
                    <button
                      type="button"
                      className="sheet-reading-delete"
                      onClick={async () => {
                        setDeletingId(e.id)
                        try {
                          await onDeleteSkillEntry(e.id)
                        } finally {
                          setDeletingId(null)
                        }
                      }}
                      disabled={deletingId !== null}
                      title="删除"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="pleasure-field">
            <div className="pleasure-field-label">技能名称</div>
            <div className="pleasure-field-body">
              <input
                type="text"
                className="input-note input-pleasure-event"
                placeholder="请输入技能名称"
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
              />
            </div>
          </div>
          <div className="pleasure-field">
            <div className="pleasure-field-label">学习时长（分钟）</div>
            <div className="sheet-reading-duration">
              <button
                type="button"
                className="sheet-duration-btn"
                onClick={() => setDurationMinutes((m) => Math.max(0, m - 10))}
                disabled={durationMinutes <= 0}
              >
                −
              </button>
              <span className="sheet-duration-value">{durationMinutes}</span>
              <button
                type="button"
                className="sheet-duration-btn"
                onClick={() => setDurationMinutes((m) => m + 10)}
              >
                +
              </button>
            </div>
            <span className="pleasure-score-hint">以 10 分钟为梯度，默认 0。</span>
          </div>
          <div className="sheet-actions">
            <button type="button" className="secondary" onClick={onClose}>
              取消
            </button>
            <button type="button" onClick={handleSubmit} disabled={!skillName.trim() || submitting}>
              {submitting ? '提交中…' : '完成'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function EnglishSheet({
  onClose,
  onAddEnglishEntry,
  todayEntries,
}: {
  onClose: () => void
  onAddEnglishEntry: (entry: EnglishEntry) => Promise<void>
  todayEntries: EnglishEntry[]
}) {
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function saveCurrent() {
    const trimmed = content.trim()
    if (!trimmed) return
    setSubmitting(true)
    try {
      const now = new Date()
      const entry: EnglishEntry = {
        id: crypto.randomUUID(),
        timestamp: now.toISOString(),
        dateKey: toDateKey(now),
        content: trimmed,
      }
      await onAddEnglishEntry(entry)
      setContent('')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleComplete() {
    const trimmed = content.trim()
    if (!trimmed) {
      onClose()
      return
    }
    setSubmitting(true)
    try {
      const now = new Date()
      const entry: EnglishEntry = {
        id: crypto.randomUUID(),
        timestamp: now.toISOString(),
        dateKey: toDateKey(now),
        content: trimmed,
      }
      await onAddEnglishEntry(entry)
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet sheet-english" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <span>今日学英语</span>
          <button type="button" className="sheet-close" onClick={onClose}>×</button>
        </div>
        <div className="sheet-step">
          {todayEntries.length > 0 && (
            <div className="sheet-reading-recorded">
              <div className="pleasure-field-label">今日已记录</div>
              <ul className="sheet-reading-list">
                {[...todayEntries].sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1)).map((e, index) => (
                  <li key={e.id} className="sheet-reading-list-item">
                    <span className="sheet-recorded-num">{index + 1}.</span>
                    <span>{e.content}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="pleasure-field">
            <div className="pleasure-field-label">已背内容：</div>
            <div className="sheet-english-input-row">
              <input
                type="text"
                className="input-note input-pleasure-event sheet-english-input"
                placeholder="输入本句内容"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <div className="sheet-english-btns">
                <button
                  type="button"
                  className="sheet-english-btn sheet-english-btn-check"
                  onClick={handleComplete}
                  disabled={submitting}
                  title="输入完成"
                >
                  ✓
                </button>
                <button
                  type="button"
                  className="sheet-english-btn sheet-english-btn-plus"
                  onClick={async () => { await saveCurrent() }}
                  disabled={submitting || !content.trim()}
                  title="输入下一句"
                >
                  +
                </button>
              </div>
            </div>
          </div>
          <div className="sheet-actions">
            <button type="button" className="secondary" onClick={onClose}>
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 通用内容列表弹层（今日感恩 / 今日发现 / 今日一句话，结构同今日学英语）
interface ContentEntryLike {
  id: string
  timestamp: string
  dateKey: string
  content: string
}

function ContentListSheet<E extends ContentEntryLike>({
  title,
  fieldLabel,
  placeholder,
  onClose,
  onAddEntry,
  todayEntries,
  createEntry,
  listThemeClass,
}: {
  title: string
  fieldLabel: string
  placeholder: string
  onClose: () => void
  onAddEntry: (entry: E) => Promise<void>
  todayEntries: E[]
  createEntry: (payload: { id: string; timestamp: string; dateKey: string; content: string }) => E
  listThemeClass?: string
}) {
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function saveCurrent() {
    const trimmed = content.trim()
    if (!trimmed) return
    setSubmitting(true)
    try {
      const now = new Date()
      const entry = createEntry({
        id: crypto.randomUUID(),
        timestamp: now.toISOString(),
        dateKey: toDateKey(now),
        content: trimmed,
      })
      await onAddEntry(entry)
      setContent('')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleComplete() {
    const trimmed = content.trim()
    if (!trimmed) {
      onClose()
      return
    }
    setSubmitting(true)
    try {
      const now = new Date()
      const entry = createEntry({
        id: crypto.randomUUID(),
        timestamp: now.toISOString(),
        dateKey: toDateKey(now),
        content: trimmed,
      })
      await onAddEntry(entry)
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className={`sheet sheet-english ${listThemeClass ?? ''}`.trim()} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <span>{title}</span>
          <button type="button" className="sheet-close" onClick={onClose}>×</button>
        </div>
        <div className="sheet-step">
          {todayEntries.length > 0 && (
            <div className="sheet-reading-recorded">
              <div className="pleasure-field-label">今日已记录</div>
              <ul className="sheet-reading-list">
                {[...todayEntries].sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1)).map((e, index) => (
                  <li key={e.id} className="sheet-reading-list-item">
                    <span className="sheet-recorded-num">{index + 1}.</span>
                    <span>{e.content}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="pleasure-field">
            <div className="pleasure-field-label">{fieldLabel}</div>
            <div className="sheet-english-input-row">
              <input
                type="text"
                className="input-note input-pleasure-event sheet-english-input"
                placeholder={placeholder}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <div className="sheet-english-btns">
                <button
                  type="button"
                  className="sheet-english-btn sheet-english-btn-check"
                  onClick={handleComplete}
                  disabled={submitting}
                  title="输入完成"
                >
                  ✓
                </button>
                <button
                  type="button"
                  className="sheet-english-btn sheet-english-btn-plus"
                  onClick={async () => { await saveCurrent() }}
                  disabled={submitting || !content.trim()}
                  title="输入下一句"
                >
                  +
                </button>
              </div>
            </div>
          </div>
          <div className="sheet-actions">
            <button type="button" className="secondary" onClick={onClose}>
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function GrowthPage({
  readingEntries,
  englishEntries,
  skillEntries,
  gratitudeEntries,
  discoveryEntries,
  sentenceEntries,
  onAddReadingEntry,
  onUpdateReadingEntry,
  onDeleteReadingEntry,
  onAddEnglishEntry,
  onAddSkillEntry,
  onUpdateSkillEntry,
  onDeleteSkillEntry,
  onAddGratitudeEntry,
  onAddDiscoveryEntry,
  onAddSentenceEntry,
}: {
  readingEntries: ReadingEntry[]
  englishEntries: EnglishEntry[]
  skillEntries: SkillEntry[]
  gratitudeEntries: GratitudeEntry[]
  discoveryEntries: DiscoveryEntry[]
  sentenceEntries: SentenceEntry[]
  onAddReadingEntry: (entry: ReadingEntry) => Promise<void>
  onUpdateReadingEntry: (entry: ReadingEntry) => Promise<void>
  onDeleteReadingEntry: (id: string) => Promise<void>
  onAddEnglishEntry: (entry: EnglishEntry) => Promise<void>
  onAddSkillEntry: (entry: SkillEntry) => Promise<void>
  onUpdateSkillEntry: (entry: SkillEntry) => Promise<void>
  onDeleteSkillEntry: (id: string) => Promise<void>
  onAddGratitudeEntry: (entry: GratitudeEntry) => Promise<void>
  onAddDiscoveryEntry: (entry: DiscoveryEntry) => Promise<void>
  onAddSentenceEntry: (entry: SentenceEntry) => Promise<void>
}) {
  const [showReadingSheet, setShowReadingSheet] = useState(false)
  const [showEnglishSheet, setShowEnglishSheet] = useState(false)
  const [showSkillSheet, setShowSkillSheet] = useState(false)
  const [showGratitudeSheet, setShowGratitudeSheet] = useState(false)
  const [showDiscoverySheet, setShowDiscoverySheet] = useState(false)
  const [showSentenceSheet, setShowSentenceSheet] = useState(false)
  const todayKey = toDateKey(new Date())
  const todayEntries = readingEntries.filter((e) => e.dateKey === todayKey)
  const todayEnglishEntries = englishEntries.filter((e) => e.dateKey === todayKey)
  const todaySkillEntries = skillEntries.filter((e) => e.dateKey === todayKey)
  const todayGratitudeEntries = gratitudeEntries.filter((e) => e.dateKey === todayKey)
  const todayDiscoveryEntries = discoveryEntries.filter((e) => e.dateKey === todayKey)
  const todaySentenceEntries = sentenceEntries.filter((e) => e.dateKey === todayKey)
  const latest = todayEntries[todayEntries.length - 1]
  const latestSkill = todaySkillEntries[todaySkillEntries.length - 1]
  const randomEnglish = useMemo(() => {
    if (todayEnglishEntries.length === 0) return null
    return todayEnglishEntries[Math.floor(Math.random() * todayEnglishEntries.length)]
  }, [todayEnglishEntries])
  const randomGratitude = useMemo(() => {
    if (todayGratitudeEntries.length === 0) return null
    return todayGratitudeEntries[Math.floor(Math.random() * todayGratitudeEntries.length)]
  }, [todayGratitudeEntries])
  const randomDiscovery = useMemo(() => {
    if (todayDiscoveryEntries.length === 0) return null
    return todayDiscoveryEntries[Math.floor(Math.random() * todayDiscoveryEntries.length)]
  }, [todayDiscoveryEntries])
  const randomSentence = useMemo(() => {
    if (todaySentenceEntries.length === 0) return null
    return todaySentenceEntries[Math.floor(Math.random() * todaySentenceEntries.length)]
  }, [todaySentenceEntries])
  const groupedByBook = todayEntries.reduce<Record<string, ReadingEntry>>((acc, entry) => {
    const existing = acc[entry.bookName]
    if (!existing || existing.timestamp < entry.timestamp) {
      acc[entry.bookName] = entry
    }
    return acc
  }, {})
  const groupedList = Object.values(groupedByBook).sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1))
  const groupedBySkill = todaySkillEntries.reduce<Record<string, SkillEntry>>((acc, entry) => {
    const existing = acc[entry.skillName]
    if (!existing || existing.timestamp < entry.timestamp) {
      acc[entry.skillName] = entry
    }
    return acc
  }, {})
  const groupedSkillList = Object.values(groupedBySkill).sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1))
  const items = [
    { label: '今日阅读', key: 'reading', enabled: true },
    { label: '今日学英语', key: 'english', enabled: true },
    { label: '今日学技能', key: 'skill', enabled: true },
    { label: '今日感恩', key: 'gratitude', enabled: true },
    { label: '今日发现', key: 'discovery', enabled: true },
    { label: '今日一句话', key: 'sentence', enabled: true },
  ]

  return (
    <div className="growth-page">
      <h2 className="growth-title">成长</h2>
      <div className="growth-list">
        {items.map(({ label, key, enabled }) => (
          <button
            key={key}
            type="button"
            className="growth-item"
            disabled={!enabled}
            onClick={
              enabled && key === 'reading'
                ? () => setShowReadingSheet(true)
                : enabled && key === 'english'
                  ? () => setShowEnglishSheet(true)
                  : enabled && key === 'skill'
                    ? () => setShowSkillSheet(true)
                    : enabled && key === 'gratitude'
                      ? () => setShowGratitudeSheet(true)
                      : enabled && key === 'discovery'
                        ? () => setShowDiscoverySheet(true)
                        : enabled && key === 'sentence'
                          ? () => setShowSentenceSheet(true)
                          : undefined
            }
          >
            <span className="growth-item-label">{label}</span>
            {key === 'reading' ? (
              <div className="growth-item-right">
                {groupedList.length > 0 ? (
                  groupedList.map((e) => (
                    <span key={e.id} className="growth-item-sub growth-item-sub--highlight">
                      {e.bookName} · {e.durationMinutes} 分钟
                    </span>
                  ))
                ) : (
                  <span className="growth-item-sub">去打卡</span>
                )}
              </div>
            ) : key === 'english' ? (
              <div className="growth-item-right growth-item-right--twoline">
                <span className="growth-item-sub">
                  {todayEnglishEntries.length > 0 ? `已背${todayEnglishEntries.length}条` : '去打卡'}
                </span>
                {randomEnglish && (
                  <span className="growth-item-sub growth-item-sub--highlight growth-item-sub--preview">
                    {randomEnglish.content}
                  </span>
                )}
              </div>
            ) : key === 'skill' ? (
              <div className="growth-item-right">
                {groupedSkillList.length > 0 ? (
                  groupedSkillList.map((e) => (
                    <span key={e.id} className="growth-item-sub growth-item-sub--highlight">
                      {e.skillName} · {e.durationMinutes} 分钟
                    </span>
                  ))
                ) : (
                  <span className="growth-item-sub">去打卡</span>
                )}
              </div>
            ) : key === 'gratitude' ? (
              <div className="growth-item-right growth-item-right--twoline">
                <span className="growth-item-sub">
                  {todayGratitudeEntries.length > 0 ? `${todayGratitudeEntries.length}条` : '去打卡'}
                </span>
                {randomGratitude && (
                  <span className="growth-item-sub growth-item-sub--highlight growth-item-sub--preview">
                    {randomGratitude.content}
                  </span>
                )}
              </div>
            ) : key === 'discovery' ? (
              <div className="growth-item-right growth-item-right--twoline">
                <span className="growth-item-sub">
                  {todayDiscoveryEntries.length > 0 ? `${todayDiscoveryEntries.length}条` : '去打卡'}
                </span>
                {randomDiscovery && (
                  <span className="growth-item-sub growth-item-sub--highlight growth-item-sub--preview">
                    {randomDiscovery.content}
                  </span>
                )}
              </div>
            ) : key === 'sentence' ? (
              <div className="growth-item-right growth-item-right--twoline">
                <span className="growth-item-sub">
                  {todaySentenceEntries.length > 0 ? `${todaySentenceEntries.length}条` : '去打卡'}
                </span>
                {randomSentence && (
                  <span className="growth-item-sub growth-item-sub--highlight growth-item-sub--preview">
                    {randomSentence.content}
                  </span>
                )}
              </div>
            ) : null}
          </button>
        ))}
      </div>
      {showReadingSheet && (
        <ReadingSheet
          onClose={() => setShowReadingSheet(false)}
          onAddReadingEntry={onAddReadingEntry}
          onUpdateReadingEntry={onUpdateReadingEntry}
          onDeleteReadingEntry={onDeleteReadingEntry}
          initialEntry={latest ?? null}
          todayEntries={todayEntries}
        />
      )}
      {showEnglishSheet && (
        <EnglishSheet
          onClose={() => setShowEnglishSheet(false)}
          onAddEnglishEntry={onAddEnglishEntry}
          todayEntries={todayEnglishEntries}
        />
      )}
      {showSkillSheet && (
        <SkillSheet
          onClose={() => setShowSkillSheet(false)}
          onAddSkillEntry={onAddSkillEntry}
          onUpdateSkillEntry={onUpdateSkillEntry}
          onDeleteSkillEntry={onDeleteSkillEntry}
          initialEntry={latestSkill ?? null}
          todayEntries={todaySkillEntries}
        />
      )}
      {showGratitudeSheet && (
        <ContentListSheet<GratitudeEntry>
          title="今日感恩"
          fieldLabel="感恩内容："
          placeholder="输入本条内容"
          onClose={() => setShowGratitudeSheet(false)}
          onAddEntry={onAddGratitudeEntry}
          todayEntries={todayGratitudeEntries}
          createEntry={(p) => ({ ...p })}
          listThemeClass="sheet-gratitude"
        />
      )}
      {showDiscoverySheet && (
        <ContentListSheet<DiscoveryEntry>
          title="今日发现"
          fieldLabel="发现内容："
          placeholder="输入本条内容"
          onClose={() => setShowDiscoverySheet(false)}
          onAddEntry={onAddDiscoveryEntry}
          todayEntries={todayDiscoveryEntries}
          createEntry={(p) => ({ ...p })}
          listThemeClass="sheet-discovery"
        />
      )}
      {showSentenceSheet && (
        <ContentListSheet<SentenceEntry>
          title="今日一句话"
          fieldLabel="一句话内容："
          placeholder="输入本条内容"
          onClose={() => setShowSentenceSheet(false)}
          onAddEntry={onAddSentenceEntry}
          todayEntries={todaySentenceEntries}
          createEntry={(p) => ({ ...p })}
          listThemeClass="sheet-sentence"
        />
      )}
    </div>
  )
}

function SummaryCardView({
  card,
  exerciseSummary,
  unit = 'B',
}: {
  card: { label: string; totalBeauty: number; goal: number; completionRate: number; remaining: number; timeProgressRate: number }
  exerciseSummary?: string
  unit?: string
}) {
  const pct = Math.round(card.completionRate * 100)
  const showSmiley = card.completionRate >= 1
  const showTimeProgress = card.label !== '今日'
  const showGoalRow = unit === 'B'
  const showUglyGoalRow = unit === 'U' && card.goal > 0
  const showWellnessGoalRow = unit === 'W' && card.goal > 0
  const uglyWithinLimit = unit === 'U' && card.totalBeauty <= card.goal
  const wellnessAchieved = unit === 'W' && card.totalBeauty >= card.goal
  const rowClass = showTimeProgress ? 'summary-card-stats-row summary-card-stats-row--four' : 'summary-card-stats-row'
  const rowClassThree = 'summary-card-stats-row'
  return (
    <div className="summary-card">
      <div className="summary-card-label">{card.label}</div>

      <div className="summary-card-stats">
        {showGoalRow ? (
          <>
            <div className={`${rowClass} summary-card-stats-header`}>
              <span>今日</span>
              <span>目标</span>
              <span>完成率</span>
              {showTimeProgress && <span>时间进度</span>}
            </div>
            <div className={`${rowClass} summary-card-stats-values`}>
              <span className="summary-card-value">{card.totalBeauty}<span className="unit">{unit}</span></span>
              <span>{card.goal}<span className="unit">{unit}</span></span>
              <span>{showSmiley ? '😊' : `${pct}%`}</span>
              {showTimeProgress && (
                <span>{card.timeProgressRate >= 1 ? '✓' : `${Math.round(card.timeProgressRate * 100)}%`}</span>
              )}
            </div>
          </>
        ) : showUglyGoalRow ? (
          <>
            <div className={`${rowClassThree} summary-card-stats-header`}>
              <span>达成值</span>
              <span>目标（上限）</span>
              <span>状态</span>
            </div>
            <div className={`${rowClassThree} summary-card-stats-values`}>
              <span className="summary-card-value">{card.totalBeauty}<span className="unit">{unit}</span></span>
              <span>{card.goal}<span className="unit">{unit}</span></span>
              <span className={uglyWithinLimit ? '' : 'summary-card-status-over'}>{uglyWithinLimit ? '未超' : '已超'}</span>
            </div>
          </>
        ) : showWellnessGoalRow ? (
          <>
            <div className={`${rowClassThree} summary-card-stats-header`}>
              <span>达成值</span>
              <span>目标（下限）</span>
              <span>状态</span>
            </div>
            <div className={`${rowClassThree} summary-card-stats-values`}>
              <span className="summary-card-value">{card.totalBeauty}<span className="unit">{unit}</span></span>
              <span>{card.goal}<span className="unit">{unit}</span></span>
              <span>{wellnessAchieved ? '已达成' : '未达成'}</span>
            </div>
          </>
        ) : (
          <div className={`${rowClass} summary-card-stats-values`}>
            <span className="summary-card-value">{card.totalBeauty}<span className="unit">{unit}</span></span>
          </div>
        )}
      </div>

      {exerciseSummary && (
        <div className="summary-card-exercises-block">
          <div className="summary-card-exercises-label">{unit === 'B' ? '已运动' : '已记录'}</div>
          <div className="summary-card-exercises">{exerciseSummary}</div>
        </div>
      )}
    </div>
  )
}

// ---------- 打卡弹窗 RecordSheet ----------

interface RecordSheetProps {
  exercises: Exercise[]
  onClose: () => void
  onSubmit: (entry: Entry) => Promise<void>
  mode?: 'today' | 'backfill'
  minDateKey?: string
  maxDateKey?: string
}

function RecordSheet({ exercises, onClose, onSubmit, mode = 'today', minDateKey, maxDateKey }: RecordSheetProps) {
  const [category, setCategory] = useState<'strength' | 'cardio' | null>('strength')
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [amount, setAmount] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const todayKey = toDateKey(new Date())
  const [dateKey, setDateKey] = useState(() => (mode === 'backfill' && maxDateKey ? maxDateKey : todayKey))

  const isBackfill = mode === 'backfill'

  const filtered = useMemo(
    () => (category ? exercises.filter((e) => e.category === category) : []),
    [exercises, category],
  )

  function handleSubmit() {
    if (!exercise || amount <= 0) return
    if (isBackfill && (!dateKey || (maxDateKey && dateKey > maxDateKey) || (minDateKey && dateKey < minDateKey))) {
      return
    }
    setSubmitting(true)
    const now = new Date()
    const entryDateKey = isBackfill ? dateKey : toDateKey(now)
    const entryTimestamp = isBackfill
      ? new Date(`${entryDateKey}T${now.toTimeString().slice(0, 8)}`).toISOString()
      : now.toISOString()
    const beautyGained = calcBeauty(amount, exercise.beautyPerUnit)
    const entry: Entry = {
      id: crypto.randomUUID(),
      timestamp: entryTimestamp,
      dateKey: entryDateKey,
      category: exercise.category,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      unit: exercise.unit,
      amount,
      beautyGained,
    }
    void onSubmit(entry).finally(() => setSubmitting(false))
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <span>记录运动</span>
          <button type="button" className="sheet-close" onClick={onClose}>×</button>
        </div>
        {isBackfill && (
          <div className="sheet-backfill-date">
            <label>
              补卡日期
              <input
                type="date"
                value={dateKey}
                min={minDateKey}
                max={maxDateKey}
                onChange={(e) => setDateKey(e.target.value)}
              />
            </label>
            <span className="sheet-backfill-hint">仅可补最近 7 天，且不能选择今天。</span>
          </div>
        )}
        <div className="sheet-step">
          <p>选择类型</p>
          <div className="sheet-buttons">
            <button
              type="button"
              className={category === 'strength' ? 'active' : ''}
              onClick={() => {
                setCategory('strength')
                setExercise(null)
                setAmount(0)
              }}
            >
              力量
            </button>
            <button
              type="button"
              className={category === 'cardio' ? 'active' : ''}
              onClick={() => {
                setCategory('cardio')
                setExercise(null)
                setAmount(0)
              }}
            >
              有氧
            </button>
          </div>

          <p>选择运动</p>
          <div className="sheet-list">
            {filtered.map((ex) => (
              <button
                key={ex.id}
                type="button"
                className={exercise && exercise.id === ex.id ? 'active' : ''}
                onClick={() => {
                  setExercise(ex)
                  setAmount(0)
                }}
              >
                {ex.name}（{ex.unit}）
              </button>
            ))}
            {filtered.length === 0 && <p className="settings-hint">该类型下暂无运动，请先在设置里添加。</p>}
          </div>

          {exercise && (
            <>
              <p>{exercise.name} · 单位：{exercise.unit}</p>
              <div className="amount-row">
                <button type="button" onClick={() => setAmount((a) => Math.max(0, a - 10))}>-10</button>
                <button type="button" onClick={() => setAmount((a) => Math.max(0, a - 1))}>-1</button>
                <input type="number" min={0} value={amount || ''} onChange={(e) => setAmount(Number(e.target.value) || 0)} />
                <button type="button" onClick={() => setAmount((a) => a + 1)}>+1</button>
                <button type="button" onClick={() => setAmount((a) => a + 10)}>+10</button>
              </div>
            </>
          )}

          <div className="sheet-actions">
            <button type="button" className="secondary" onClick={onClose}>
              取消
            </button>
            <button type="button" onClick={handleSubmit} disabled={!exercise || amount <= 0 || submitting}>
              {submitting ? '提交中…' : '完成'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ResultModal({
  beautyGained,
  todayTotal,
  dailyGoal,
  achieved,
  onClose,
}: {
  beautyGained: number
  todayTotal: number
  dailyGoal: number
  achieved: boolean
  onClose: () => void
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {achieved ? (
          <>
            <p className="modal-title">恭喜！</p>
            <p>你本次收获运动值 {beautyGained} B</p>
            <p>今日累计收获运动值 {todayTotal} B，目标已达成</p>
          </>
        ) : (
          <>
            <p>你本次收获运动值 {beautyGained} B</p>
            <p>离目标只剩 {dailyGoal - todayTotal} B，加油</p>
          </>
        )}
        <button type="button" onClick={onClose}>确定</button>
      </div>
    </div>
  )
}

// ---------- 变丑 Tab：结构参考运动 ----------

interface UglyDashboardProps {
  uglyEntries: UglyEntry[]
  setUglyEntries: (v: UglyEntry[]) => void
  uglyBehaviors: UglyBehavior[]
  settings: Settings
  syncMode?: boolean
}

function UglyDashboard({ uglyEntries, setUglyEntries, uglyBehaviors, settings, syncMode }: UglyDashboardProps) {
  const [showSheet, setShowSheet] = useState(false)
  const [resultModal, setResultModal] = useState<{ uglyGained: number; todayTotal: number } | null>(null)

  const now = new Date()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const todaySummary = useMemo(() => {
    const base = calcUglyTodaySummary(uglyEntries, now)
    return { ...base, goal: settings.dailyUglyGoal }
  }, [uglyEntries, now, settings.dailyUglyGoal])
  const weekSummary = useMemo(() => {
    const base = calcUglyWeekSummary(uglyEntries, now)
    return { ...base, goal: settings.dailyUglyGoal * 7 }
  }, [uglyEntries, now, settings.dailyUglyGoal])
  const monthSummary = useMemo(() => {
    const base = calcUglyMonthSummary(uglyEntries, now)
    return { ...base, goal: settings.dailyUglyGoal * daysInMonth }
  }, [uglyEntries, now, settings.dailyUglyGoal, daysInMonth])

  const todayKey = toDateKey(new Date())
  const weekStartKey = getWeekStartDateKey(new Date())
  const monthStartKey = getMonthStartDateKey(new Date())
  const todayUglyEntries = useMemo(() => uglyEntries.filter((e) => e.dateKey === todayKey), [uglyEntries, todayKey])
  const weekUglyEntries = useMemo(
    () => uglyEntries.filter((e) => e.dateKey >= weekStartKey && e.dateKey <= todayKey),
    [uglyEntries, weekStartKey, todayKey],
  )
  const monthUglyEntries = useMemo(
    () => uglyEntries.filter((e) => e.dateKey >= monthStartKey && e.dateKey <= todayKey),
    [uglyEntries, monthStartKey, todayKey],
  )
  const todayUglySummary = useMemo(() => getUglySummary(todayUglyEntries), [todayUglyEntries])
  const weekUglySummary = useMemo(() => getUglySummary(weekUglyEntries), [weekUglyEntries])
  const monthUglySummary = useMemo(() => getUglySummary(monthUglyEntries), [monthUglyEntries])

  const backfillToday = new Date()
  const backfillMaxDate = new Date(backfillToday.getTime() - 24 * 60 * 60 * 1000)
  const backfillMinDate = new Date(backfillToday.getTime() - 7 * 24 * 60 * 60 * 1000)
  const backfillMaxKey = toDateKey(backfillMaxDate)
  const backfillMinKey = toDateKey(backfillMinDate)
  const [sheetMode, setSheetMode] = useState<'today' | 'backfill'>('today')

  async function handleRecordSubmit(entry: UglyEntry) {
    if (syncMode) {
      setUglyEntries([...uglyEntries, entry])
      const todayTotal = uglyEntries.filter((e) => e.dateKey === todayKey).reduce((s, e) => s + e.uglyGained, 0) + entry.uglyGained
      setResultModal({ uglyGained: entry.uglyGained, todayTotal })
      setShowSheet(false)
    } else {
      const { addUglyEntry, getAllUglyEntries } = await import('./lib/db')
      await addUglyEntry(entry)
      const next = await getAllUglyEntries()
      setUglyEntries(next)
      const todayTotal = next.filter((e) => e.dateKey === todayKey).reduce((s, e) => s + e.uglyGained, 0)
      setResultModal({ uglyGained: entry.uglyGained, todayTotal })
      setShowSheet(false)
    }
  }

  return (
    <div className="dashboard dashboard-ugly">
      <button
        type="button"
        className="btn-checkin"
        onClick={() => {
          setSheetMode('today')
          setShowSheet(true)
        }}
      >
        又变丑了
      </button>
      <div className="summary-cards">
        <SummaryCardView card={todaySummary} exerciseSummary={todayUglySummary} unit="U" />
        <SummaryCardView card={weekSummary} exerciseSummary={weekUglySummary} unit="U" />
        <SummaryCardView card={monthSummary} exerciseSummary={monthUglySummary} unit="U" />
      </div>
      <button
        type="button"
        className="btn-backfill"
        onClick={() => {
          setSheetMode('backfill')
          setShowSheet(true)
        }}
      >
        补卡（最近 7 天）
      </button>
      {showSheet && (
        <RecordUglySheet
          uglyBehaviors={uglyBehaviors}
          onClose={() => setShowSheet(false)}
          onSubmit={handleRecordSubmit}
          mode={sheetMode}
          minDateKey={backfillMinKey}
          maxDateKey={backfillMaxKey}
        />
      )}
      {resultModal && (
        <ResultUglyModal
          uglyGained={resultModal.uglyGained}
          todayTotal={resultModal.todayTotal}
          onClose={() => setResultModal(null)}
        />
      )}
    </div>
  )
}

interface RecordUglySheetProps {
  uglyBehaviors: UglyBehavior[]
  onClose: () => void
  onSubmit: (entry: UglyEntry) => Promise<void>
  mode?: 'today' | 'backfill'
  minDateKey?: string
  maxDateKey?: string
}

function RecordUglySheet({ uglyBehaviors, onClose, onSubmit, mode = 'today', minDateKey, maxDateKey }: RecordUglySheetProps) {
  const [category, setCategory] = useState<UglyCategory | null>('身体')
  const [behavior, setBehavior] = useState<UglyBehavior | null>(null)
  const [amount, setAmount] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const todayKey = toDateKey(new Date())
  const [dateKey, setDateKey] = useState(() => (mode === 'backfill' && maxDateKey ? maxDateKey : todayKey))
  const isBackfill = mode === 'backfill'

  const filtered = useMemo(
    () => (category ? uglyBehaviors.filter((b) => b.category === category) : []),
    [uglyBehaviors, category],
  )

  function handleSubmit() {
    if (!behavior || amount <= 0) return
    if (isBackfill && (!dateKey || (maxDateKey && dateKey > maxDateKey) || (minDateKey && dateKey < minDateKey))) {
      return
    }
    setSubmitting(true)
    const now = new Date()
    const uglyGained = calcUgly(amount, behavior.uglyPerUnit)
    const entryDateKey = isBackfill ? dateKey : toDateKey(now)
    const entryTimestamp = isBackfill
      ? new Date(`${entryDateKey}T${now.toTimeString().slice(0, 8)}`).toISOString()
      : now.toISOString()
    const entry: UglyEntry = {
      id: crypto.randomUUID(),
      timestamp: entryTimestamp,
      dateKey: entryDateKey,
      category: behavior.category,
      behaviorId: behavior.id,
      behaviorName: behavior.name,
      unit: behavior.unit,
      amount,
      uglyGained,
    }
    void onSubmit(entry).finally(() => setSubmitting(false))
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet sheet-ugly" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <span>记录变丑</span>
          <button type="button" className="sheet-close" onClick={onClose}>×</button>
        </div>
        {isBackfill && (
          <div className="sheet-backfill-date">
            <label>
              补卡日期
              <input
                type="date"
                value={dateKey}
                min={minDateKey}
                max={maxDateKey}
                onChange={(e) => setDateKey(e.target.value)}
              />
            </label>
            <span className="sheet-backfill-hint">仅可补最近 7 天，且不能选择今天。</span>
          </div>
        )}
        <div className="sheet-step">
          <p>选择类型</p>
          <div className="sheet-buttons">
            <button
              type="button"
              className={category === '身体' ? 'active' : ''}
              onClick={() => {
                setCategory('身体')
                setBehavior(null)
                setAmount(0)
              }}
            >
              身体
            </button>
            <button
              type="button"
              className={category === '精神' ? 'active' : ''}
              onClick={() => {
                setCategory('精神')
                setBehavior(null)
                setAmount(0)
              }}
            >
              精神
            </button>
          </div>

          <p>选择行为</p>
          <div className="sheet-list">
            {filtered.map((b) => (
              <button
                key={b.id}
                type="button"
                className={behavior && behavior.id === b.id ? 'active' : ''}
                onClick={() => {
                  setBehavior(b)
                  setAmount(0)
                }}
              >
                {b.name}（{b.unit}）
              </button>
            ))}
            {filtered.length === 0 && <p className="settings-hint">该类型下暂无行为，请先在设置里添加。</p>}
          </div>

          {behavior && (
            <>
              <p>{behavior.name} · 单位：{behavior.unit}</p>
              <div className="amount-row">
                <button type="button" onClick={() => setAmount((a) => Math.max(0, a - 10))}>-10</button>
                <button type="button" onClick={() => setAmount((a) => Math.max(0, a - 1))}>-1</button>
                <input type="number" min={0} value={amount || ''} onChange={(e) => setAmount(Number(e.target.value) || 0)} />
                <button type="button" onClick={() => setAmount((a) => a + 1)}>+1</button>
                <button type="button" onClick={() => setAmount((a) => a + 10)}>+10</button>
              </div>
            </>
          )}

          <div className="sheet-actions">
            <button type="button" className="secondary" onClick={onClose}>
              取消
            </button>
            <button type="button" onClick={handleSubmit} disabled={!behavior || amount <= 0 || submitting}>
              {submitting ? '提交中…' : '完成'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ResultUglyModal({
  uglyGained,
  todayTotal,
  onClose,
}: {
  uglyGained: number
  todayTotal: number
  onClose: () => void
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-ugly" onClick={(e) => e.stopPropagation()}>
        <p>本次收获丑陋值 {uglyGained} U</p>
        <p>今日累计丑陋值 {todayTotal} U</p>
        <button type="button" onClick={onClose}>确定</button>
      </div>
    </div>
  )
}

// ---------- 养生 Tab ----------

interface WellnessDashboardProps {
  wellnessEntries: WellnessEntry[]
  setWellnessEntries: (v: WellnessEntry[]) => void
  wellnessBehaviors: WellnessBehavior[]
  settings: Settings
  syncMode?: boolean
}

function WellnessDashboard({ wellnessEntries, setWellnessEntries, wellnessBehaviors, settings, syncMode }: WellnessDashboardProps) {
  const [showSheet, setShowSheet] = useState(false)
  const [resultModal, setResultModal] = useState<{ wellnessGained: number; todayTotal: number } | null>(null)

  const now = new Date()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const todaySummary = useMemo(() => {
    const base = calcWellnessTodaySummary(wellnessEntries, now)
    return { ...base, goal: settings.dailyWellnessGoal }
  }, [wellnessEntries, now, settings.dailyWellnessGoal])
  const weekSummary = useMemo(() => {
    const base = calcWellnessWeekSummary(wellnessEntries, now)
    return { ...base, goal: settings.dailyWellnessGoal * 7 }
  }, [wellnessEntries, now, settings.dailyWellnessGoal])
  const monthSummary = useMemo(() => {
    const base = calcWellnessMonthSummary(wellnessEntries, now)
    return { ...base, goal: settings.dailyWellnessGoal * daysInMonth }
  }, [wellnessEntries, now, settings.dailyWellnessGoal, daysInMonth])

  const todayKey = toDateKey(new Date())
  const weekStartKey = getWeekStartDateKey(new Date())
  const monthStartKey = getMonthStartDateKey(new Date())
  const todayWellnessEntries = useMemo(() => wellnessEntries.filter((e) => e.dateKey === todayKey), [wellnessEntries, todayKey])
  const weekWellnessEntries = useMemo(
    () => wellnessEntries.filter((e) => e.dateKey >= weekStartKey && e.dateKey <= todayKey),
    [wellnessEntries, weekStartKey, todayKey],
  )
  const monthWellnessEntries = useMemo(
    () => wellnessEntries.filter((e) => e.dateKey >= monthStartKey && e.dateKey <= todayKey),
    [wellnessEntries, monthStartKey, todayKey],
  )
  const todayWellnessSummary = useMemo(() => getWellnessSummary(todayWellnessEntries), [todayWellnessEntries])
  const weekWellnessSummary = useMemo(() => getWellnessSummary(weekWellnessEntries), [weekWellnessEntries])
  const monthWellnessSummary = useMemo(() => getWellnessSummary(monthWellnessEntries), [monthWellnessEntries])

  const backfillToday = new Date()
  const backfillMaxDate = new Date(backfillToday.getTime() - 24 * 60 * 60 * 1000)
  const backfillMinDate = new Date(backfillToday.getTime() - 7 * 24 * 60 * 60 * 1000)
  const backfillMaxKey = toDateKey(backfillMaxDate)
  const backfillMinKey = toDateKey(backfillMinDate)
  const [sheetMode, setSheetMode] = useState<'today' | 'backfill'>('today')

  async function handleRecordSubmit(entry: WellnessEntry) {
    if (syncMode) {
      setWellnessEntries([...wellnessEntries, entry])
      const todayTotal = wellnessEntries.filter((e) => e.dateKey === todayKey).reduce((s, e) => s + e.wellnessGained, 0) + entry.wellnessGained
      setResultModal({ wellnessGained: entry.wellnessGained, todayTotal })
      setShowSheet(false)
    } else {
      await addWellnessEntry(entry)
      const next = await getAllWellnessEntries()
      setWellnessEntries(next)
      const todayTotal = next.filter((e) => e.dateKey === todayKey).reduce((s, e) => s + e.wellnessGained, 0)
      setResultModal({ wellnessGained: entry.wellnessGained, todayTotal })
      setShowSheet(false)
    }
  }

  return (
    <div className="dashboard dashboard-wellness">
      <button
        type="button"
        className="btn-checkin"
        onClick={() => {
          setSheetMode('today')
          setShowSheet(true)
        }}
      >
        又养生了
      </button>
      <div className="summary-cards">
        <SummaryCardView card={todaySummary} exerciseSummary={todayWellnessSummary} unit="W" />
        <SummaryCardView card={weekSummary} exerciseSummary={weekWellnessSummary} unit="W" />
        <SummaryCardView card={monthSummary} exerciseSummary={monthWellnessSummary} unit="W" />
      </div>
      <button
        type="button"
        className="btn-backfill"
        onClick={() => {
          setSheetMode('backfill')
          setShowSheet(true)
        }}
      >
        补卡（最近 7 天）
      </button>
      {showSheet && (
        <RecordWellnessSheet
          wellnessBehaviors={wellnessBehaviors}
          onClose={() => setShowSheet(false)}
          onSubmit={handleRecordSubmit}
          mode={sheetMode}
          minDateKey={backfillMinKey}
          maxDateKey={backfillMaxKey}
        />
      )}
      {resultModal && (
        <ResultWellnessModal
          wellnessGained={resultModal.wellnessGained}
          todayTotal={resultModal.todayTotal}
          onClose={() => setResultModal(null)}
        />
      )}
    </div>
  )
}

interface RecordWellnessSheetProps {
  wellnessBehaviors: WellnessBehavior[]
  onClose: () => void
  onSubmit: (entry: WellnessEntry) => Promise<void>
  mode?: 'today' | 'backfill'
  minDateKey?: string
  maxDateKey?: string
}

function RecordWellnessSheet({ wellnessBehaviors, onClose, onSubmit, mode = 'today', minDateKey, maxDateKey }: RecordWellnessSheetProps) {
  const [category, setCategory] = useState<WellnessCategory | null>('补剂')
  const [behavior, setBehavior] = useState<WellnessBehavior | null>(null)
  const [amount, setAmount] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const todayKey = toDateKey(new Date())
  const [dateKey, setDateKey] = useState(() => (mode === 'backfill' && maxDateKey ? maxDateKey : todayKey))
  const isBackfill = mode === 'backfill'

  const filtered = useMemo(
    () => (category ? wellnessBehaviors.filter((b) => b.category === category) : []),
    [wellnessBehaviors, category],
  )

  function handleSubmit() {
    if (!behavior || amount <= 0) return
    if (isBackfill && (!dateKey || (maxDateKey && dateKey > maxDateKey) || (minDateKey && dateKey < minDateKey))) {
      return
    }
    setSubmitting(true)
    const now = new Date()
    const wellnessGained = calcWellness(amount, behavior.wellnessPerUnit)
    const entryDateKey = isBackfill ? dateKey : toDateKey(now)
    const entryTimestamp = isBackfill
      ? new Date(`${entryDateKey}T${now.toTimeString().slice(0, 8)}`).toISOString()
      : now.toISOString()
    const entry: WellnessEntry = {
      id: crypto.randomUUID(),
      timestamp: entryTimestamp,
      dateKey: entryDateKey,
      category: behavior.category,
      behaviorId: behavior.id,
      behaviorName: behavior.name,
      unit: behavior.unit,
      amount,
      wellnessGained,
    }
    void onSubmit(entry).finally(() => setSubmitting(false))
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet sheet-wellness" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <span>记录养生</span>
          <button type="button" className="sheet-close" onClick={onClose}>×</button>
        </div>
        {isBackfill && (
          <div className="sheet-backfill-date">
            <label>
              补卡日期
              <input
                type="date"
                value={dateKey}
                min={minDateKey}
                max={maxDateKey}
                onChange={(e) => setDateKey(e.target.value)}
              />
            </label>
            <span className="sheet-backfill-hint">仅可补最近 7 天，且不能选择今天。</span>
          </div>
        )}
        <div className="sheet-step">
          <p>选择类型</p>
          <div className="sheet-buttons">
            <button
              type="button"
              className={category === '补剂' ? 'active' : ''}
              onClick={() => {
                setCategory('补剂')
                setBehavior(null)
                setAmount(0)
              }}
            >
              补剂
            </button>
            <button
              type="button"
              className={category === '身体放松' ? 'active' : ''}
              onClick={() => {
                setCategory('身体放松')
                setBehavior(null)
                setAmount(0)
              }}
            >
              身体放松
            </button>
            <button
              type="button"
              className={category === '精神放松' ? 'active' : ''}
              onClick={() => {
                setCategory('精神放松')
                setBehavior(null)
                setAmount(0)
              }}
            >
              精神放松
            </button>
          </div>

          <p>选择行为</p>
          <div className="sheet-list">
            {filtered.map((b) => (
              <button
                key={b.id}
                type="button"
                className={behavior && behavior.id === b.id ? 'active' : ''}
                onClick={() => {
                  setBehavior(b)
                  setAmount(0)
                }}
              >
                {b.name}（{b.unit}）
              </button>
            ))}
            {filtered.length === 0 && <p className="settings-hint">该类型下暂无行为，请先在设置里添加。</p>}
          </div>

          {behavior && (
            <>
              <p>{behavior.name} · 单位：{behavior.unit}</p>
              <div className="amount-row">
                <button type="button" onClick={() => setAmount((a) => Math.max(0, a - 10))}>-10</button>
                <button type="button" onClick={() => setAmount((a) => Math.max(0, a - 1))}>-1</button>
                <input type="number" min={0} value={amount || ''} onChange={(e) => setAmount(Number(e.target.value) || 0)} />
                <button type="button" onClick={() => setAmount((a) => a + 1)}>+1</button>
                <button type="button" onClick={() => setAmount((a) => a + 10)}>+10</button>
              </div>
            </>
          )}

          <div className="sheet-actions">
            <button type="button" className="secondary" onClick={onClose}>
              取消
            </button>
            <button type="button" onClick={handleSubmit} disabled={!behavior || amount <= 0 || submitting}>
              {submitting ? '提交中…' : '完成'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------- 愉悦 Tab（独立愉悦值系统） ----------

interface PleasureDashboardProps {
  pleasureEntries: PleasureEntry[]
  setPleasureEntries: (v: PleasureEntry[]) => void
  pleasureCategories: PleasureCategoryConfig[]
  syncMode?: boolean
}

function PleasureDashboard({ pleasureEntries, setPleasureEntries, pleasureCategories, syncMode }: PleasureDashboardProps) {
  const [showSheet, setShowSheet] = useState(false)
  const [sheetMode, setSheetMode] = useState<'today' | 'backfill'>('today')
  const [drawText, setDrawText] = useState<string | null>(null)

  const backfillToday = new Date()
  const backfillMaxDate = new Date(backfillToday.getTime() - 24 * 60 * 60 * 1000)
  const backfillMinDate = new Date(backfillToday.getTime() - 7 * 24 * 60 * 60 * 1000)
  const backfillMaxKey = toDateKey(backfillMaxDate)
  const backfillMinKey = toDateKey(backfillMinDate)

  async function handleRecordSubmit(entry: PleasureEntry) {
    if (syncMode) {
      setPleasureEntries([...pleasureEntries, entry])
      setShowSheet(false)
    } else {
      const { addPleasureEntry, getAllPleasureEntries } = await import('./lib/db')
      await addPleasureEntry(entry)
      const next = await getAllPleasureEntries()
      setPleasureEntries(next)
      setShowSheet(false)
    }
  }

  function handleDrawToday() {
    if (pleasureEntries.length === 0) {
      setDrawText('你还没有记录过愉悦行为，可以先去记录一条。')
      return
    }
    const candidates = pleasureEntries.filter(
      (e) => (e.activity && e.activity.trim().length > 0) || (e.category && e.category.trim().length > 0),
    )
    const pool = candidates.length > 0 ? candidates : pleasureEntries
    const random = pool[Math.floor(Math.random() * pool.length)]
    const name = (random.activity && random.activity.trim()) || random.category
    const feeling = (random.note && random.note.trim()) || ''
    if (feeling) {
      setDrawText(`去【${name}】吧，你会得到【${feeling}】`)
    } else {
      setDrawText(`去【${name}】吧`)
    }
  }

  return (
    <div className="dashboard dashboard-pleasure">
      <button
        type="button"
        className="btn-checkin"
        onClick={() => {
          setSheetMode('today')
          setShowSheet(true)
        }}
      >
        我的愉悦时刻
      </button>
      <section className="pleasure-draw-section">
        <h3>今日抽签</h3>
        <p className="settings-hint">从你历史的愉悦记录里，随机抽一条今天的灵感。</p>
        <button type="button" className="btn-draw" onClick={handleDrawToday}>
          点我抽签
        </button>
        {drawText && <p className="pleasure-draw-result">{drawText}</p>}
      </section>

      <section className="pleasure-list-section">
        <h3>最近的愉悦瞬间</h3>
        {pleasureEntries.length === 0 && <p className="history-empty">还没有记录，可以从今天的一小段愉悦开始。</p>}
        {pleasureEntries.length > 0 && (
          <ul className="pleasure-list">
            {[...pleasureEntries].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)).slice(0, 10).map((p) => (
              <li key={p.id} className="pleasure-item">
                <div className="pleasure-item-main">
                  <span className="pleasure-item-category">{p.activity || p.category}</span>
                  <span className="pleasure-item-score">
                    {p.score}
                    <span className="unit">P</span>
                  </span>
                </div>
                <div className="pleasure-item-sub">
                  <span className="pleasure-item-date">{p.dateKey}</span>
                  {p.note && <span className="pleasure-item-note">{p.note}</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <button
        type="button"
        className="btn-backfill"
        onClick={() => {
          setSheetMode('backfill')
          setShowSheet(true)
        }}
      >
        补卡（最近 7 天）
      </button>

      {showSheet && (
        <RecordPleasureSheet
          pleasureCategories={pleasureCategories}
          mode={sheetMode}
          minDateKey={backfillMinKey}
          maxDateKey={backfillMaxKey}
          onClose={() => setShowSheet(false)}
          onSubmit={handleRecordSubmit}
        />
      )}
    </div>
  )
}

interface RecordPleasureSheetProps {
  pleasureCategories: PleasureCategoryConfig[]
  onClose: () => void
  onSubmit: (entry: PleasureEntry) => Promise<void>
  mode?: 'today' | 'backfill'
  minDateKey?: string
  maxDateKey?: string
}

function RecordPleasureSheet({ pleasureCategories: _pleasureCategories, onClose, onSubmit, mode = 'today', minDateKey, maxDateKey }: RecordPleasureSheetProps) {
  const todayKey = toDateKey(new Date())
  const isBackfill = mode === 'backfill'
  const [dateKey, setDateKey] = useState(() => (isBackfill && maxDateKey ? maxDateKey : todayKey))

  const [eventText, setEventText] = useState('')
  const [score, setScore] = useState<number | null>(null)
  const [feeling, setFeeling] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const trimmedEvent = eventText.trim()
  const validScore = score != null

  function handleSubmit() {
    if (!trimmedEvent || !validScore) return
    if (isBackfill && (!dateKey || (maxDateKey && dateKey > maxDateKey) || (minDateKey && dateKey < minDateKey))) {
      return
    }

    setSubmitting(true)
    const now = new Date()
    const entryDateKey = isBackfill ? dateKey : toDateKey(now)
    const entryTimestamp = isBackfill
      ? new Date(`${entryDateKey}T${now.toTimeString().slice(0, 8)}`).toISOString()
      : now.toISOString()

    // 将 1/3/5/7/10 的愉悦值映射回 3/6/10 强度档位，兼容旧数据结构
    const raw = score!
    const clamped = Math.max(1, Math.min(10, raw))
    let intensity: 3 | 6 | 10 = 3
    if (clamped >= 8) intensity = 10
    else if (clamped >= 4) intensity = 6

    const entry: PleasureEntry = {
      id: crypto.randomUUID(),
      timestamp: entryTimestamp,
      dateKey: entryDateKey,
      category: '其他',
      activity: trimmedEvent,
      intensity,
      score: clamped,
      note: feeling.trim(),
    }

    void onSubmit(entry).finally(() => setSubmitting(false))
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet sheet-pleasure" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <span>记录愉悦</span>
          <button type="button" className="sheet-close" onClick={onClose}>×</button>
        </div>
        {isBackfill && (
          <div className="sheet-backfill-date">
            <label>
              补卡日期
              <input
                type="date"
                value={dateKey}
                min={minDateKey}
                max={maxDateKey}
                onChange={(e) => setDateKey(e.target.value)}
              />
            </label>
            <span className="sheet-backfill-hint">仅可补最近 7 天，且不能选择今天。</span>
          </div>
        )}
        <div className="sheet-step sheet-step-pleasure-free">
          <div className="pleasure-field">
            <div className="pleasure-field-label">事件</div>
            <div className="pleasure-field-body">
              <input
                type="text"
                className="input-note input-pleasure-event"
                placeholder="例如：下班路上听到一首很喜欢的歌、躺在阳光下发呆…"
                maxLength={40}
                value={eventText}
                onChange={(e) => setEventText(e.target.value)}
              />
            </div>
          </div>

          <div className="pleasure-field">
            <div className="pleasure-field-label">愉悦值</div>
            <div className="pleasure-field-body">
          <div className="sheet-buttons pleasure-score-buttons">
            {[1, 3, 5, 7, 10].map((v) => (
              <button
                key={v}
                type="button"
                className={score === v ? 'active' : ''}
                onClick={() => setScore(v)}
              >
                {v}
              </button>
            ))}
          </div>
          <span className="pleasure-score-hint">1/3/5/7/10 由低到高，按直觉选择一档即可。</span>
            </div>
          </div>

          <div className="pleasure-field">
            <div className="pleasure-field-label">感受（可选）</div>
            <div className="pleasure-field-body">
              <textarea
                className="input-note pleasure-feeling-input"
                rows={3}
                maxLength={80}
                value={feeling}
                onChange={(e) => setFeeling(e.target.value)}
                placeholder="想简单写几句当时的心情、身体感觉、脑海里的念头…"
              />
            </div>
          </div>

          <div className="sheet-actions">
            <button type="button" className="secondary" onClick={onClose}>
              取消
            </button>
            <button type="button" onClick={handleSubmit} disabled={submitting || !trimmedEvent || !validScore}>
              {submitting ? '提交中…' : '完成'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ResultWellnessModal({
  wellnessGained,
  todayTotal,
  onClose,
}: {
  wellnessGained: number
  todayTotal: number
  onClose: () => void
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wellness" onClick={(e) => e.stopPropagation()}>
        <p>本次收获养生值 {wellnessGained} W</p>
        <p>今日累计养生值 {todayTotal} W</p>
        <button type="button" onClick={onClose}>确定</button>
      </div>
    </div>
  )
}

// ---------- 历史记录 History ----------

interface HistoryProps {
  entries: Entry[]
  uglyEntries: UglyEntry[]
  wellnessEntries: WellnessEntry[]
  pleasureEntries: PleasureEntry[]
  readingEntries: ReadingEntry[]
  englishEntries: EnglishEntry[]
  skillEntries: SkillEntry[]
  gratitudeEntries: GratitudeEntry[]
  discoveryEntries: DiscoveryEntry[]
  sentenceEntries: SentenceEntry[]
  settings: Settings
  onDeleteExercise: (id: string) => void
  onDeleteUgly: (id: string) => void
  onDeleteWellness: (id: string) => void
  onDeletePleasure: (id: string) => void
}

function History({
  entries,
  uglyEntries,
  wellnessEntries,
  pleasureEntries,
  readingEntries,
  englishEntries,
  skillEntries,
  gratitudeEntries,
  discoveryEntries,
  sentenceEntries,
  settings: _settings,
  onDeleteExercise,
  onDeleteUgly,
  onDeleteWellness,
  onDeletePleasure,
}: HistoryProps) {
  const [period, setPeriod] = useState<'week' | 'month'>('week')
  const [view, setView] = useState<'exercise' | 'wellness' | 'ugly' | 'pleasure' | 'growth'>('exercise')
  const now = new Date()
  const todayKey = toDateKey(now)
  const weekStart = getWeekStartDateKey(now)
  const monthStart = getMonthStartDateKey(now)
  const startKey = period === 'week' ? weekStart : monthStart
  const filtered = useMemo(
    () => entries.filter((e) => e.dateKey >= startKey && e.dateKey <= todayKey),
    [entries, startKey, todayKey],
  )
  const filteredUgly = useMemo(
    () => uglyEntries.filter((e) => e.dateKey >= startKey && e.dateKey <= todayKey),
    [uglyEntries, startKey, todayKey],
  )
  const filteredWellness = useMemo(
    () => wellnessEntries.filter((e) => e.dateKey >= startKey && e.dateKey <= todayKey),
    [wellnessEntries, startKey, todayKey],
  )
  const filteredPleasure = useMemo(
    () => pleasureEntries.filter((e) => e.dateKey >= startKey && e.dateKey <= todayKey),
    [pleasureEntries, startKey, todayKey],
  )
  const filteredReading = useMemo(
    () => readingEntries.filter((e) => e.dateKey >= startKey && e.dateKey <= todayKey),
    [readingEntries, startKey, todayKey],
  )
  const filteredEnglish = useMemo(
    () => englishEntries.filter((e) => e.dateKey >= startKey && e.dateKey <= todayKey),
    [englishEntries, startKey, todayKey],
  )
  const filteredSkill = useMemo(
    () => skillEntries.filter((e) => e.dateKey >= startKey && e.dateKey <= todayKey),
    [skillEntries, startKey, todayKey],
  )
  const filteredGratitude = useMemo(
    () => gratitudeEntries.filter((e) => e.dateKey >= startKey && e.dateKey <= todayKey),
    [gratitudeEntries, startKey, todayKey],
  )
  const filteredDiscovery = useMemo(
    () => discoveryEntries.filter((e) => e.dateKey >= startKey && e.dateKey <= todayKey),
    [discoveryEntries, startKey, todayKey],
  )
  const filteredSentence = useMemo(
    () => sentenceEntries.filter((e) => e.dateKey >= startKey && e.dateKey <= todayKey),
    [sentenceEntries, startKey, todayKey],
  )

  const beautyList = useMemo(
    () => [...filtered].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)),
    [filtered],
  )

  const uglyList = useMemo(
    () => [...filteredUgly].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)),
    [filteredUgly],
  )

  const wellnessList = useMemo(
    () => [...filteredWellness].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)),
    [filteredWellness],
  )

  const pleasureList = useMemo(
    () => [...filteredPleasure].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)),
    [filteredPleasure],
  )

  const readingList = useMemo(() => [...filteredReading].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)), [filteredReading])
  const englishList = useMemo(() => [...filteredEnglish].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)), [filteredEnglish])
  const skillList = useMemo(() => [...filteredSkill].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)), [filteredSkill])
  const gratitudeList = useMemo(() => [...filteredGratitude].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)), [filteredGratitude])
  const discoveryList = useMemo(() => [...filteredDiscovery].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)), [filteredDiscovery])
  const sentenceList = useMemo(() => [...filteredSentence].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)), [filteredSentence])

  const hasGrowth = readingList.length > 0 || englishList.length > 0 || skillList.length > 0 || gratitudeList.length > 0 || discoveryList.length > 0 || sentenceList.length > 0

  return (
    <div className="history">
      <div className="history-filters">
        <button type="button" className={period === 'week' ? 'tab active' : 'tab'} onClick={() => setPeriod('week')}>
          本周
        </button>
        <button type="button" className={period === 'month' ? 'tab active' : 'tab'} onClick={() => setPeriod('month')}>
          本月
        </button>
      </div>

      <nav className="history-type-tabs">
        <button
          type="button"
          className={view === 'exercise' ? 'tab active' : 'tab'}
          onClick={() => setView('exercise')}
        >
          运动
        </button>
        <button
          type="button"
          className={view === 'wellness' ? 'tab active' : 'tab'}
          onClick={() => setView('wellness')}
        >
          养生
        </button>
        <button
          type="button"
          className={view === 'ugly' ? 'tab active' : 'tab'}
          onClick={() => setView('ugly')}
        >
          变丑
        </button>
        <button
          type="button"
          className={view === 'pleasure' ? 'tab active' : 'tab'}
          onClick={() => setView('pleasure')}
        >
          愉悦
        </button>
        <button
          type="button"
          className={view === 'growth' ? 'tab active' : 'tab'}
          onClick={() => setView('growth')}
        >
          成长
        </button>
      </nav>

      {view === 'exercise' && (
        <section className="history-section">
          <h2>运动历史</h2>
          {beautyList.length === 0 && <p className="history-empty">本{period === 'week' ? '周' : '月'}暂无运动记录。</p>}
          {beautyList.length > 0 && (
            <div className="history-table-wrap">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>日期</th>
                    <th>类型</th>
                    <th>运动</th>
                    <th>数量</th>
                    <th>运动值(B)</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {beautyList.map((e) => (
                    <tr key={e.id}>
                      <td>{e.dateKey.slice(5).replace('-', '/')}</td>
                      <td>{e.category === 'strength' ? '力量' : '有氧'}</td>
                      <td>{e.exerciseName}</td>
                      <td>
                        {e.amount}
                        {e.unit}
                      </td>
                      <td>{e.beautyGained}</td>
                      <td>
                        <button
                          type="button"
                          className="link-button danger"
                          onClick={() => {
                            if (window.confirm('确定要删除这条运动记录吗？')) {
                              onDeleteExercise(e.id)
                            }
                          }}
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {view === 'wellness' && (
        <section className="history-section">
          <h2>养生历史</h2>
          {wellnessList.length === 0 && <p className="history-empty">本{period === 'week' ? '周' : '月'}暂无养生记录。</p>}
          {wellnessList.length > 0 && (
            <div className="history-table-wrap">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>日期</th>
                    <th>类型</th>
                    <th>行为</th>
                    <th>数量</th>
                    <th>养生值(W)</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {wellnessList.map((e) => (
                    <tr key={e.id}>
                      <td>{e.dateKey.slice(5).replace('-', '/')}</td>
                      <td>{e.category}</td>
                      <td>{e.behaviorName}</td>
                      <td>
                        {e.amount}
                        {e.unit}
                      </td>
                      <td>{e.wellnessGained}</td>
                      <td>
                        <button
                          type="button"
                          className="link-button danger"
                          onClick={() => {
                            if (window.confirm('确定要删除这条养生记录吗？')) {
                              onDeleteWellness(e.id)
                            }
                          }}
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {view === 'ugly' && (
        <section className="history-section">
          <h2>变丑历史</h2>
          {uglyList.length === 0 && <p className="history-empty">本{period === 'week' ? '周' : '月'}暂无变丑记录。</p>}
          {uglyList.length > 0 && (
            <div className="history-table-wrap">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>日期</th>
                    <th>类型</th>
                    <th>行为</th>
                    <th>数量</th>
                    <th>丑陋值(U)</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {uglyList.map((e) => (
                    <tr key={e.id}>
                      <td>{e.dateKey.slice(5).replace('-', '/')}</td>
                      <td>{e.category}</td>
                      <td>{e.behaviorName}</td>
                      <td>
                        {e.amount}
                        {e.unit}
                      </td>
                      <td>{e.uglyGained}</td>
                      <td>
                        <button
                          type="button"
                          className="link-button danger"
                          onClick={() => {
                            if (window.confirm('确定要删除这条变丑记录吗？')) {
                              onDeleteUgly(e.id)
                            }
                          }}
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {view === 'pleasure' && (
        <section className="history-pleasure-section">
          <h2>愉悦历史</h2>
          <p className="settings-hint">范围随上方选择（本周 / 本月），可删除单条记录。</p>
          {pleasureList.length === 0 && <p className="history-empty">本{period === 'week' ? '周' : '月'}暂无愉悦记录。</p>}
          {pleasureList.length > 0 && (
            <div className="history-table-wrap">
              <table className="history-table history-table-pleasure">
                <thead>
                  <tr>
                    <th>日期</th>
                    <th>事件</th>
                    <th>愉悦值(P)</th>
                    <th>感受</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {pleasureList.map((p) => (
                    <tr key={p.id}>
                      <td>{p.dateKey.slice(5).replace('-', '/')}</td>
                      <td>{p.activity}</td>
                      <td>{p.score}</td>
                      <td>{p.note || '—'}</td>
                      <td>
                        <button
                          type="button"
                          className="link-button danger"
                          onClick={() => {
                            if (window.confirm('确定要删除这条愉悦记录吗？')) {
                              onDeletePleasure(p.id)
                            }
                          }}
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {view === 'growth' && (
        <section className="history-section history-growth-section">
          <h2>成长记录</h2>
          <p className="settings-hint">范围随上方选择（本周 / 本月），仅查看。</p>
          {!hasGrowth && <p className="history-empty">本{period === 'week' ? '周' : '月'}暂无成长记录。</p>}
          {hasGrowth && (
            <div className="history-growth-blocks">
              {readingList.length > 0 && (
                <div className="history-growth-block">
                  <h3>今日阅读</h3>
                  <ul className="history-growth-list">
                    {readingList.map((e) => (
                      <li key={e.id}>
                        <span className="history-growth-date">{e.dateKey.slice(5).replace('-', '/')}</span>
                        <span>{e.bookName} · {e.durationMinutes} 分钟</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {englishList.length > 0 && (
                <div className="history-growth-block">
                  <h3>今日学英语</h3>
                  <ul className="history-growth-list">
                    {englishList.map((e) => (
                      <li key={e.id}>
                        <span className="history-growth-date">{e.dateKey.slice(5).replace('-', '/')}</span>
                        <span>{e.content}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {skillList.length > 0 && (
                <div className="history-growth-block">
                  <h3>今日学技能</h3>
                  <ul className="history-growth-list">
                    {skillList.map((e) => (
                      <li key={e.id}>
                        <span className="history-growth-date">{e.dateKey.slice(5).replace('-', '/')}</span>
                        <span>{e.skillName} · {e.durationMinutes} 分钟</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {gratitudeList.length > 0 && (
                <div className="history-growth-block">
                  <h3>今日感恩</h3>
                  <ul className="history-growth-list">
                    {gratitudeList.map((e) => (
                      <li key={e.id}>
                        <span className="history-growth-date">{e.dateKey.slice(5).replace('-', '/')}</span>
                        <span>{e.content}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {discoveryList.length > 0 && (
                <div className="history-growth-block">
                  <h3>今日发现</h3>
                  <ul className="history-growth-list">
                    {discoveryList.map((e) => (
                      <li key={e.id}>
                        <span className="history-growth-date">{e.dateKey.slice(5).replace('-', '/')}</span>
                        <span>{e.content}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {sentenceList.length > 0 && (
                <div className="history-growth-block">
                  <h3>今日一句话</h3>
                  <ul className="history-growth-list">
                    {sentenceList.map((e) => (
                      <li key={e.id}>
                        <span className="history-growth-date">{e.dateKey.slice(5).replace('-', '/')}</span>
                        <span>{e.content}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  )
}

interface SettingsPanelProps {
  exercises: Exercise[]
  onChangeExercises: (value: Exercise[]) => void
  uglyBehaviors: UglyBehavior[]
  onChangeUglyBehaviors: (value: UglyBehavior[]) => void
  wellnessBehaviors: WellnessBehavior[]
  onChangeWellnessBehaviors: (value: WellnessBehavior[]) => void
  settings: Settings
  onChangeSettings: (value: Settings) => void
  onSaveAll: () => void
  saving: boolean
}

function SettingsPanel({
  exercises,
  onChangeExercises,
  uglyBehaviors,
  onChangeUglyBehaviors,
  wellnessBehaviors,
  onChangeWellnessBehaviors,
  settings,
  onChangeSettings,
  onSaveAll,
  saving,
}: SettingsPanelProps) {
  const [goalDisplay, setGoalDisplay] = useState(() => ({
    dailyBeautyGoal: String(settings.dailyBeautyGoal ?? 0),
    dailyUglyGoal: String(settings.dailyUglyGoal ?? 0),
    dailyWellnessGoal: String(settings.dailyWellnessGoal ?? 0),
  }))
  const [exerciseNumDisplay, setExerciseNumDisplay] = useState<Record<number, string>>({})
  const [uglyNumDisplay, setUglyNumDisplay] = useState<Record<number, string>>({})
  const [wellnessNumDisplay, setWellnessNumDisplay] = useState<Record<number, string>>({})

  useEffect(() => {
    if (settings.dailyBeautyGoal !== undefined) setGoalDisplay((prev) => ({ ...prev, dailyBeautyGoal: String(settings.dailyBeautyGoal) }))
    if (settings.dailyUglyGoal !== undefined) setGoalDisplay((prev) => ({ ...prev, dailyUglyGoal: String(settings.dailyUglyGoal) }))
    if (settings.dailyWellnessGoal !== undefined) setGoalDisplay((prev) => ({ ...prev, dailyWellnessGoal: String(settings.dailyWellnessGoal) }))
  }, [settings.dailyBeautyGoal, settings.dailyUglyGoal, settings.dailyWellnessGoal])

  function handleGoalChange(field: keyof Settings, value: string) {
    const numeric = Number(value)
    if (Number.isNaN(numeric)) return
    onChangeSettings({
      ...settings,
      [field]: numeric,
    })
  }
  function commitGoal(field: 'dailyBeautyGoal' | 'dailyUglyGoal' | 'dailyWellnessGoal', raw: string) {
    const n = Number(raw)
    const num = raw === '' || Number.isNaN(n) ? 0 : n
    handleGoalChange(field, String(num))
    setGoalDisplay((prev) => ({ ...prev, [field]: String(num) }))
  }

  function handleExerciseChange(
    id: number,
    field: keyof Exercise,
    value: string,
  ) {
    onChangeExercises(
      exercises.map((ex) => {
        if (ex.id !== id) return ex
        if (field === 'beautyPerUnit') {
          const numeric = Number(value)
          return {
            ...ex,
            beautyPerUnit: Number.isNaN(numeric) ? 0 : numeric,
          }
        }
        if (field === 'category') {
          return {
            ...ex,
            category: value === 'cardio' ? 'cardio' : 'strength',
          }
        }
        return {
          ...ex,
          [field]: value,
        }
      }),
    )
  }

  function handleAddExercise() {
    const maxId = exercises.reduce((max, ex) => Math.max(max, ex.id), 0)
    const nextId = maxId + 1
    onChangeExercises([
      ...exercises,
      {
        id: nextId,
        category: 'strength',
        name: '',
        unit: '',
        beautyPerUnit: 1,
      },
    ])
  }

  function handleRemoveExercise(id: number) {
    onChangeExercises(exercises.filter((ex) => ex.id !== id))
  }

  function handleUglyChange(id: number, field: keyof UglyBehavior, value: string) {
    onChangeUglyBehaviors(
      uglyBehaviors.map((b) => {
        if (b.id !== id) return b
        if (field === 'uglyPerUnit') {
          const numeric = Number(value)
          return { ...b, uglyPerUnit: Number.isNaN(numeric) ? 0 : numeric }
        }
        if (field === 'category') {
          const cat = value as UglyCategory
          return { ...b, category: ['身体', '精神'].includes(cat) ? cat : '身体' }
        }
        return { ...b, [field]: value }
      }),
    )
  }

  function handleAddUgly() {
    const maxId = uglyBehaviors.reduce((max, b) => Math.max(max, b.id), 0)
    onChangeUglyBehaviors([
      ...uglyBehaviors,
      { id: maxId + 1, category: '身体', name: '', unit: '', uglyPerUnit: 0 },
    ])
  }

  function handleRemoveUgly(id: number) {
    onChangeUglyBehaviors(uglyBehaviors.filter((b) => b.id !== id))
  }

  function handleWellnessChange(id: number, field: keyof WellnessBehavior, value: string) {
    onChangeWellnessBehaviors(
      wellnessBehaviors.map((b) => {
        if (b.id !== id) return b
        if (field === 'wellnessPerUnit') {
          const numeric = Number(value)
          return { ...b, wellnessPerUnit: Number.isNaN(numeric) ? 0 : numeric }
        }
        if (field === 'category') {
          const cat = value as WellnessCategory
          return { ...b, category: ['补剂', '身体放松', '精神放松'].includes(cat) ? cat : '补剂' }
        }
        return { ...b, [field]: value }
      }),
    )
  }

  function handleAddWellness() {
    const maxId = wellnessBehaviors.reduce((max, b) => Math.max(max, b.id), 0)
    onChangeWellnessBehaviors([
      ...wellnessBehaviors,
      { id: maxId + 1, category: '补剂', name: '', unit: '', wellnessPerUnit: 1 },
    ])
  }

  function handleRemoveWellness(id: number) {
    onChangeWellnessBehaviors(wellnessBehaviors.filter((b) => b.id !== id))
  }

  type SettingsTab = 'goal' | 'beauty' | 'ugly' | 'wellness'
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('goal')

  return (
    <div className="settings-panel">
      <nav className="settings-tabs">
        <button
          type="button"
          className={settingsTab === 'goal' ? 'tab active' : 'tab'}
          onClick={() => setSettingsTab('goal')}
        >
          目标
        </button>
        <button
          type="button"
          className={settingsTab === 'beauty' ? 'tab active' : 'tab'}
          onClick={() => setSettingsTab('beauty')}
        >
          健康
        </button>
        <button
          type="button"
          className={settingsTab === 'ugly' ? 'tab active' : 'tab'}
          onClick={() => setSettingsTab('ugly')}
        >
          丑陋
        </button>
        <button
          type="button"
          className={settingsTab === 'wellness' ? 'tab active' : 'tab'}
          onClick={() => setSettingsTab('wellness')}
        >
          养生
        </button>
      </nav>

      {settingsTab === 'goal' && (() => {
        const now = new Date()
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
        return (
      <section className="settings-section">
        <h2>目标设置</h2>
        <p className="settings-hint">仅设定日目标，周目标=日×7、月目标=日×当月天数；健康值目标 = 运动值 − 丑陋值 + 养生值（自动计算）。</p>
        <div className="settings-goals-grid">
          <div className="settings-goals-group">
            <h3>运动值下限</h3>
            <div className="settings-goals-row">
              <label>日（B）<input type="number" value={goalDisplay.dailyBeautyGoal} onChange={(e) => setGoalDisplay((p) => ({ ...p, dailyBeautyGoal: e.target.value }))} onBlur={(e) => commitGoal('dailyBeautyGoal', e.target.value)} /></label>
              <span className="settings-goals-readonly">周：{settings.dailyBeautyGoal * 7} B</span>
              <span className="settings-goals-readonly">月：{settings.dailyBeautyGoal * daysInMonth} B</span>
            </div>
          </div>
          <div className="settings-goals-group">
            <h3>丑陋值<span className="goal-upper-label">上限</span></h3>
            <div className="settings-goals-row">
              <label>日（U）<input type="number" value={goalDisplay.dailyUglyGoal} onChange={(e) => setGoalDisplay((p) => ({ ...p, dailyUglyGoal: e.target.value }))} onBlur={(e) => commitGoal('dailyUglyGoal', e.target.value)} /></label>
              <span className="settings-goals-readonly">周：{settings.dailyUglyGoal * 7} U</span>
              <span className="settings-goals-readonly">月：{settings.dailyUglyGoal * daysInMonth} U</span>
            </div>
          </div>
          <div className="settings-goals-group">
            <h3>养生值下限</h3>
            <div className="settings-goals-row">
              <label>日（W）<input type="number" value={goalDisplay.dailyWellnessGoal} onChange={(e) => setGoalDisplay((p) => ({ ...p, dailyWellnessGoal: e.target.value }))} onBlur={(e) => commitGoal('dailyWellnessGoal', e.target.value)} /></label>
              <span className="settings-goals-readonly">周：{settings.dailyWellnessGoal * 7} W</span>
              <span className="settings-goals-readonly">月：{settings.dailyWellnessGoal * daysInMonth} W</span>
            </div>
          </div>
        </div>
        <div className="settings-health-goal">
          <h3>健康值目标（H，自动计算）</h3>
          <div className="settings-goals-row settings-goals-row--readonly">
            <span>日：{getDailyHealthGoal(settings)} H</span>
            <span>周：{getWeeklyHealthGoal(settings)} H</span>
            <span>月：{getMonthlyHealthGoal(settings)} H</span>
          </div>
        </div>
      </section>
        )
      })()}

      {settingsTab === 'beauty' && (
      <section className="settings-section">
        <h2>运动配置（类型 / 运动 / 单位 / 每单位运动值）</h2>
        <p className="settings-hint">这里可以增删改运动条目，运动打卡会使用这里的配置。</p>
        <div className="exercise-table">
          <div className="exercise-row exercise-row--header">
            <span>类型</span>
            <span>运动名称</span>
            <span>单位</span>
            <span>每单位运动值</span>
            <span />
          </div>
          {exercises.map((ex) => (
            <div key={ex.id} className="exercise-row">
              <select
                value={ex.category}
                onChange={(e) => handleExerciseChange(ex.id, 'category', e.target.value)}
              >
                <option value="strength">力量</option>
                <option value="cardio">有氧</option>
              </select>
              <input
                type="text"
                className="input-name"
                value={ex.name}
                placeholder="如：深蹲"
                maxLength={7}
                onChange={(e) => handleExerciseChange(ex.id, 'name', e.target.value)}
              />
              <input
                type="text"
                className="input-unit"
                value={ex.unit}
                placeholder="如：个 / 分钟"
                maxLength={2}
                onChange={(e) => handleExerciseChange(ex.id, 'unit', e.target.value)}
              />
              <input
                type="number"
                step="0.01"
                className="input-beauty"
                value={exerciseNumDisplay[ex.id] ?? String(ex.beautyPerUnit)}
                onChange={(e) => {
                  const raw = e.target.value
                  const trimmed = raw.slice(0, 4)
                  setExerciseNumDisplay((p) => ({ ...p, [ex.id]: trimmed }))
                }}
                onBlur={(e) => {
                  const raw = e.target.value
                  const n = Number(raw)
                  const num = raw === '' || Number.isNaN(n) ? 0 : n
                  handleExerciseChange(ex.id, 'beautyPerUnit', String(num))
                  setExerciseNumDisplay((p) => ({ ...p, [ex.id]: String(num) }))
                }}
              />
              <button
                type="button"
                className="danger"
                onClick={() => handleRemoveExercise(ex.id)}
              >
                删除
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={handleAddExercise} className="secondary">
          新增运动
        </button>
      </section>
      )}

      {settingsTab === 'ugly' && (
      <section className="settings-section">
        <h2>丑陋配置（类型 / 行为 / 单位 / 每单位丑陋值）</h2>
        <p className="settings-hint">这里可以增删改丑陋行为（类型：身体/精神），后续变丑打卡会使用这里的配置。</p>
        <div className="exercise-table">
          <div className="exercise-row exercise-row--header">
            <span>类型</span>
            <span>行为名称</span>
            <span>单位</span>
            <span>每单位丑陋值</span>
            <span />
          </div>
          {uglyBehaviors.map((b) => (
            <div key={b.id} className="exercise-row">
              <select
                value={b.category}
                onChange={(e) => handleUglyChange(b.id, 'category', e.target.value)}
              >
                <option value="身体">身体</option>
                <option value="精神">精神</option>
              </select>
              <input
                type="text"
                className="input-name"
                value={b.name}
                placeholder="如：熬夜、外卖"
                maxLength={7}
                onChange={(e) => handleUglyChange(b.id, 'name', e.target.value)}
              />
              <input
                type="text"
                className="input-unit"
                value={b.unit}
                placeholder="如：次 / 杯"
                maxLength={2}
                onChange={(e) => handleUglyChange(b.id, 'unit', e.target.value)}
              />
              <input
                type="number"
                step="0.01"
                className="input-beauty"
                value={uglyNumDisplay[b.id] ?? String(b.uglyPerUnit)}
                onChange={(e) => {
                  const raw = e.target.value
                  const trimmed = raw.slice(0, 4)
                  setUglyNumDisplay((p) => ({ ...p, [b.id]: trimmed }))
                }}
                onBlur={(e) => {
                  const raw = e.target.value
                  const n = Number(raw)
                  const num = raw === '' || Number.isNaN(n) ? 0 : n
                  handleUglyChange(b.id, 'uglyPerUnit', String(num))
                  setUglyNumDisplay((p) => ({ ...p, [b.id]: String(num) }))
                }}
              />
              <button type="button" className="danger" onClick={() => handleRemoveUgly(b.id)}>
                删除
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={handleAddUgly} className="secondary">
          新增行为
        </button>
      </section>
      )}

      {settingsTab === 'wellness' && (
      <section className="settings-section">
        <h2>养生配置（类型 / 行为 / 单位 / 每单位养生值）</h2>
        <p className="settings-hint">这里可以增删改养生行为（补剂、身体放松等），数据独立存储。</p>
        <div className="exercise-table">
          <div className="exercise-row exercise-row--header">
            <span>类型</span>
            <span>行为名称</span>
            <span>单位</span>
            <span>每单位养生值</span>
            <span />
          </div>
          {wellnessBehaviors.map((b) => (
            <div key={b.id} className="exercise-row">
              <select
                value={b.category}
                onChange={(e) => handleWellnessChange(b.id, 'category', e.target.value)}
              >
                <option value="补剂">补剂</option>
                <option value="身体放松">身体放松</option>
                <option value="精神放松">精神放松</option>
              </select>
              <input
                type="text"
                className="input-name"
                value={b.name}
                placeholder="如：维生素、按摩"
                maxLength={7}
                onChange={(e) => handleWellnessChange(b.id, 'name', e.target.value)}
              />
              <input
                type="text"
                className="input-unit"
                value={b.unit}
                placeholder="如：粒 / 次"
                maxLength={2}
                onChange={(e) => handleWellnessChange(b.id, 'unit', e.target.value)}
              />
              <input
                type="number"
                step="0.01"
                className="input-beauty"
                value={wellnessNumDisplay[b.id] ?? String(b.wellnessPerUnit)}
                onChange={(e) => {
                  const raw = e.target.value
                  const trimmed = raw.slice(0, 4)
                  setWellnessNumDisplay((p) => ({ ...p, [b.id]: trimmed }))
                }}
                onBlur={(e) => {
                  const raw = e.target.value
                  const n = Number(raw)
                  const num = raw === '' || Number.isNaN(n) ? 0 : n
                  handleWellnessChange(b.id, 'wellnessPerUnit', String(num))
                  setWellnessNumDisplay((p) => ({ ...p, [b.id]: String(num) }))
                }}
              />
              <button type="button" className="danger" onClick={() => handleRemoveWellness(b.id)}>
                删除
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={handleAddWellness} className="secondary">
          新增行为
        </button>
      </section>
      )}

      <div className="settings-actions">
        <button type="button" onClick={onSaveAll} disabled={saving}>
          {saving ? '保存中…' : '保存所有设置'}
        </button>
      </div>
    </div>
  )
}

interface AuthModalProps {
  onClose: () => void
  onSuccess: () => void
}
function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'signup') {
        const { error: err } = await supabase!.auth.signUp({ email, password })
        if (err) throw err
        onSuccess()
      } else {
        const { error: err } = await supabase!.auth.signInWithPassword({ email, password })
        if (err) throw err
        onSuccess()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '操作失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal modal-auth" onClick={(e) => e.stopPropagation()} role="dialog">
        <h3>{mode === 'signin' ? '登录' : '注册'}</h3>
        <p className="settings-hint">登录后数据将同步到云端，电脑与手机共用同一账号即可看到相同数据。</p>
        <form onSubmit={handleSubmit}>
          <label>
            邮箱
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </label>
          <label>
            密码
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
          </label>
          {error && <p className="auth-error">{error}</p>}
          <div className="modal-actions">
            <button type="submit" disabled={loading}>{mode === 'signin' ? '登录' : '注册'}</button>
            <button type="button" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }} className="secondary">
              {mode === 'signin' ? '去注册' : '去登录'}
            </button>
            <button type="button" onClick={onClose} className="secondary">取消</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default App
