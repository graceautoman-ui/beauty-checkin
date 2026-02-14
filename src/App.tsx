import { useEffect, useMemo, useState } from 'react'
import './App.css'
import type { Entry, Exercise, Settings, UglyBehavior, UglyCategory, UglyEntry, WellnessBehavior, WellnessCategory, WellnessEntry } from './domain/types'
import { addWellnessEntry, getAllEntries, getAllUglyEntries, getAllWellnessEntries, loadExercises, loadSettings, loadUglyBehaviors, loadWellnessBehaviors, saveExercises, saveSettings, saveUglyBehaviors, saveWellnessBehaviors } from './lib/db'
import {
  calcBeauty,
  calcDayStats,
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

type Tab = 'overview' | 'dashboard' | 'ugly' | 'wellness' | 'history' | 'settings'

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
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function init() {
      const [loadedExercises, loadedUgly, loadedWellness, loadedSettings, loadedEntries, loadedUglyEntries, loadedWellnessEntries] = await Promise.all([
        loadExercises(),
        loadUglyBehaviors(),
        loadWellnessBehaviors(),
        loadSettings(),
        getAllEntries(),
        getAllUglyEntries(),
        getAllWellnessEntries(),
      ])
      setExercises(loadedExercises)
      setUglyBehaviors(loadedUgly)
      setWellnessBehaviors(loadedWellness)
      setSettingsState(loadedSettings)
      setEntries(loadedEntries)
      setUglyEntries(loadedUglyEntries)
      setWellnessEntries(loadedWellnessEntries)
      setLoading(false)
    }
    void init()
  }, [])

  async function handleSaveAll() {
    if (!settings) return
    setSaving(true)
    try {
      await Promise.all([saveExercises(exercises), saveUglyBehaviors(uglyBehaviors), saveWellnessBehaviors(wellnessBehaviors), saveSettings(settings)])
      // 这里后续可以加一个轻量提示，比如 toast
    } finally {
      setSaving(false)
    }
  }

  if (loading || !settings) {
    return <div className="app-root">加载中…</div>
  }

  return (
    <div className="app-root">
      <header className="app-header">
        <h1>Healthy Check-in</h1>
      </header>

      <nav className="app-tabs">
        <button type="button" className={tab === 'dashboard' ? 'tab active' : 'tab'} onClick={() => setTab('dashboard')}>运动</button>
        <button type="button" className={tab === 'wellness' ? 'tab active tab-wellness' : 'tab tab-wellness'} onClick={() => setTab('wellness')}>养生</button>
        <button type="button" className={tab === 'ugly' ? 'tab active tab-ugly' : 'tab tab-ugly'} onClick={() => setTab('ugly')}>变丑</button>
        <button type="button" className={tab === 'overview' ? 'tab active tab-overview' : 'tab tab-overview'} onClick={() => setTab('overview')}>看板</button>
      </nav>

      <main className="app-main">
        {tab === 'overview' && settings && (
          <OverviewDashboard
            entries={entries}
            uglyEntries={uglyEntries}
            wellnessEntries={wellnessEntries}
            settings={settings}
          />
        )}
        {tab === 'dashboard' && (
          <Dashboard
            entries={entries}
            setEntries={setEntries}
            exercises={exercises}
            settings={settings}
          />
        )}
        {tab === 'ugly' && settings && (
          <UglyDashboard
            uglyEntries={uglyEntries}
            setUglyEntries={setUglyEntries}
            uglyBehaviors={uglyBehaviors}
            settings={settings}
          />
        )}
        {tab === 'wellness' && settings && (
          <WellnessDashboard
            wellnessEntries={wellnessEntries}
            setWellnessEntries={setWellnessEntries}
            wellnessBehaviors={wellnessBehaviors}
            settings={settings}
          />
        )}
        {tab === 'history' && settings && (
          <History
            entries={entries}
            uglyEntries={uglyEntries}
            wellnessEntries={wellnessEntries}
            settings={settings}
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
  settings: Settings
}

type OverviewPeriod = 'today' | 'week' | 'month'

function OverviewDashboard({ entries, uglyEntries, wellnessEntries, settings }: OverviewDashboardProps) {
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

  return (
    <div className="overview-dashboard">
      <h2 className="overview-title">健康行为，一目了然</h2>
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
          <OverviewRow variant="beauty" label="变美" unit="B" value={p.beauty.value} target={p.beauty.goal} achieved={p.beauty.value >= p.beauty.goal} detailSummary={p.beauty.summary} />
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
}

function Dashboard({ entries, setEntries, exercises, settings }: DashboardProps) {
  const [showSheet, setShowSheet] = useState(false)
  const [resultModal, setResultModal] = useState<{
    beautyGained: number
    todayTotal: number
    dailyGoal: number
    achieved: boolean
  } | null>(null)

  const todayKey = toDateKey(new Date())
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

  return (
    <div className="dashboard">
      <button type="button" className="btn-checkin" onClick={() => setShowSheet(true)}>
        又变美了
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
      {showSheet && (
        <RecordSheet
          exercises={exercises}
          onClose={() => setShowSheet(false)}
          onSubmit={handleRecordSubmit}
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
}

function RecordSheet({ exercises, onClose, onSubmit }: RecordSheetProps) {
  const [step, setStep] = useState(1)
  const [category, setCategory] = useState<'strength' | 'cardio' | null>(null)
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [amount, setAmount] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const filtered = useMemo(
    () => (category ? exercises.filter((e) => e.category === category) : []),
    [exercises, category],
  )

  function handleSubmit() {
    if (!exercise || amount <= 0) return
    setSubmitting(true)
    const now = new Date()
    const beautyGained = calcBeauty(amount, exercise.beautyPerUnit)
    const entry: Entry = {
      id: crypto.randomUUID(),
      timestamp: now.toISOString(),
      dateKey: toDateKey(now),
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
        {step === 1 && (
          <div className="sheet-step">
            <p>选择类型</p>
            <div className="sheet-buttons">
              <button type="button" onClick={() => { setCategory('strength'); setStep(2); setExercise(null); setAmount(0); }}>力量</button>
              <button type="button" onClick={() => { setCategory('cardio'); setStep(2); setExercise(null); setAmount(0); }}>有氧</button>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="sheet-step">
            <p>选择运动</p>
            <div className="sheet-list">
              {filtered.map((ex) => (
                <button key={ex.id} type="button" onClick={() => { setExercise(ex); setStep(3); setAmount(0); }}>
                  {ex.name}（{ex.unit}）
                </button>
              ))}
            </div>
            <button type="button" className="secondary" onClick={() => setStep(1)}>上一步</button>
          </div>
        )}
        {step === 3 && exercise && (
          <div className="sheet-step">
            <p>{exercise.name} · 单位：{exercise.unit}</p>
            <div className="amount-row">
              <button type="button" onClick={() => setAmount((a) => Math.max(0, a - 10))}>-10</button>
              <button type="button" onClick={() => setAmount((a) => Math.max(0, a - 1))}>-1</button>
              <input type="number" min={0} value={amount || ''} onChange={(e) => setAmount(Number(e.target.value) || 0)} />
              <button type="button" onClick={() => setAmount((a) => a + 1)}>+1</button>
              <button type="button" onClick={() => setAmount((a) => a + 10)}>+10</button>
            </div>
            <div className="sheet-actions">
              <button type="button" className="secondary" onClick={() => setStep(2)}>上一步</button>
              <button type="button" onClick={handleSubmit} disabled={amount <= 0 || submitting}>
                {submitting ? '提交中…' : '完成'}
              </button>
            </div>
          </div>
        )}
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
            <p>你本次收获美丽值 {beautyGained} B</p>
            <p>今日累计收获美丽值 {todayTotal} B，目标已达成</p>
          </>
        ) : (
          <>
            <p>你本次收获美丽值 {beautyGained} B</p>
            <p>离目标只剩 {dailyGoal - todayTotal} B，加油</p>
          </>
        )}
        <button type="button" onClick={onClose}>确定</button>
      </div>
    </div>
  )
}

// ---------- 变丑 Tab：结构参考变美 ----------

interface UglyDashboardProps {
  uglyEntries: UglyEntry[]
  setUglyEntries: (v: UglyEntry[]) => void
  uglyBehaviors: UglyBehavior[]
  settings: Settings
}

function UglyDashboard({ uglyEntries, setUglyEntries, uglyBehaviors, settings }: UglyDashboardProps) {
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

  async function handleRecordSubmit(entry: UglyEntry) {
    const { addUglyEntry, getAllUglyEntries } = await import('./lib/db')
    await addUglyEntry(entry)
    const next = await getAllUglyEntries()
    setUglyEntries(next)
    const todayTotal = next.filter((e) => e.dateKey === todayKey).reduce((s, e) => s + e.uglyGained, 0)
    setResultModal({ uglyGained: entry.uglyGained, todayTotal })
    setShowSheet(false)
  }

  return (
    <div className="dashboard dashboard-ugly">
      <button type="button" className="btn-checkin" onClick={() => setShowSheet(true)}>
        又变丑了
      </button>
      <div className="summary-cards">
        <SummaryCardView card={todaySummary} exerciseSummary={todayUglySummary} unit="U" />
        <SummaryCardView card={weekSummary} exerciseSummary={weekUglySummary} unit="U" />
        <SummaryCardView card={monthSummary} exerciseSummary={monthUglySummary} unit="U" />
      </div>
      {showSheet && (
        <RecordUglySheet
          uglyBehaviors={uglyBehaviors}
          onClose={() => setShowSheet(false)}
          onSubmit={handleRecordSubmit}
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
}

function RecordUglySheet({ uglyBehaviors, onClose, onSubmit }: RecordUglySheetProps) {
  const [step, setStep] = useState(1)
  const [category, setCategory] = useState<UglyCategory | null>(null)
  const [behavior, setBehavior] = useState<UglyBehavior | null>(null)
  const [amount, setAmount] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const filtered = useMemo(
    () => (category ? uglyBehaviors.filter((b) => b.category === category) : []),
    [uglyBehaviors, category],
  )

  function handleSubmit() {
    if (!behavior || amount <= 0) return
    setSubmitting(true)
    const now = new Date()
    const uglyGained = calcUgly(amount, behavior.uglyPerUnit)
    const entry: UglyEntry = {
      id: crypto.randomUUID(),
      timestamp: now.toISOString(),
      dateKey: toDateKey(now),
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
        {step === 1 && (
          <div className="sheet-step">
            <p>选择类型</p>
            <div className="sheet-buttons">
              <button type="button" onClick={() => { setCategory('身体'); setStep(2); setBehavior(null); setAmount(0); }}>身体</button>
              <button type="button" onClick={() => { setCategory('精神'); setStep(2); setBehavior(null); setAmount(0); }}>精神</button>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="sheet-step">
            <p>选择行为</p>
            <div className="sheet-list">
              {filtered.map((b) => (
                <button key={b.id} type="button" onClick={() => { setBehavior(b); setStep(3); setAmount(0); }}>
                  {b.name}（{b.unit}）
                </button>
              ))}
            </div>
            {filtered.length === 0 && <p className="settings-hint">该类型下暂无行为，请先在设置里添加。</p>}
            <button type="button" className="secondary" onClick={() => setStep(1)}>上一步</button>
          </div>
        )}
        {step === 3 && behavior && (
          <div className="sheet-step">
            <p>{behavior.name} · 单位：{behavior.unit}</p>
            <div className="amount-row">
              <button type="button" onClick={() => setAmount((a) => Math.max(0, a - 10))}>-10</button>
              <button type="button" onClick={() => setAmount((a) => Math.max(0, a - 1))}>-1</button>
              <input type="number" min={0} value={amount || ''} onChange={(e) => setAmount(Number(e.target.value) || 0)} />
              <button type="button" onClick={() => setAmount((a) => a + 1)}>+1</button>
              <button type="button" onClick={() => setAmount((a) => a + 10)}>+10</button>
            </div>
            <div className="sheet-actions">
              <button type="button" className="secondary" onClick={() => setStep(2)}>上一步</button>
              <button type="button" onClick={handleSubmit} disabled={amount <= 0 || submitting}>
                {submitting ? '提交中…' : '完成'}
              </button>
            </div>
          </div>
        )}
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
}

function WellnessDashboard({ wellnessEntries, setWellnessEntries, wellnessBehaviors, settings }: WellnessDashboardProps) {
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

  async function handleRecordSubmit(entry: WellnessEntry) {
    await addWellnessEntry(entry)
    const next = await getAllWellnessEntries()
    setWellnessEntries(next)
    const todayTotal = next.filter((e) => e.dateKey === todayKey).reduce((s, e) => s + e.wellnessGained, 0)
    setResultModal({ wellnessGained: entry.wellnessGained, todayTotal })
    setShowSheet(false)
  }

  return (
    <div className="dashboard dashboard-wellness">
      <button type="button" className="btn-checkin" onClick={() => setShowSheet(true)}>
        养生打卡
      </button>
      <div className="summary-cards">
        <SummaryCardView card={todaySummary} exerciseSummary={todayWellnessSummary} unit="W" />
        <SummaryCardView card={weekSummary} exerciseSummary={weekWellnessSummary} unit="W" />
        <SummaryCardView card={monthSummary} exerciseSummary={monthWellnessSummary} unit="W" />
      </div>
      {showSheet && (
        <RecordWellnessSheet
          wellnessBehaviors={wellnessBehaviors}
          onClose={() => setShowSheet(false)}
          onSubmit={handleRecordSubmit}
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
}

function RecordWellnessSheet({ wellnessBehaviors, onClose, onSubmit }: RecordWellnessSheetProps) {
  const [step, setStep] = useState(1)
  const [category, setCategory] = useState<WellnessCategory | null>(null)
  const [behavior, setBehavior] = useState<WellnessBehavior | null>(null)
  const [amount, setAmount] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const filtered = useMemo(
    () => (category ? wellnessBehaviors.filter((b) => b.category === category) : []),
    [wellnessBehaviors, category],
  )

  function handleSubmit() {
    if (!behavior || amount <= 0) return
    setSubmitting(true)
    const now = new Date()
    const wellnessGained = calcWellness(amount, behavior.wellnessPerUnit)
    const entry: WellnessEntry = {
      id: crypto.randomUUID(),
      timestamp: now.toISOString(),
      dateKey: toDateKey(now),
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
        {step === 1 && (
          <div className="sheet-step">
            <p>选择类型</p>
            <div className="sheet-buttons">
              <button type="button" onClick={() => { setCategory('补剂'); setStep(2); setBehavior(null); setAmount(0); }}>补剂</button>
              <button type="button" onClick={() => { setCategory('身体放松'); setStep(2); setBehavior(null); setAmount(0); }}>身体放松</button>
              <button type="button" onClick={() => { setCategory('精神放松'); setStep(2); setBehavior(null); setAmount(0); }}>精神放松</button>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="sheet-step">
            <p>选择行为</p>
            <div className="sheet-list">
              {filtered.map((b) => (
                <button key={b.id} type="button" onClick={() => { setBehavior(b); setStep(3); setAmount(0); }}>
                  {b.name}（{b.unit}）
                </button>
              ))}
            </div>
            {filtered.length === 0 && <p className="settings-hint">该类型下暂无行为，请先在设置里添加。</p>}
            <button type="button" className="secondary" onClick={() => setStep(1)}>上一步</button>
          </div>
        )}
        {step === 3 && behavior && (
          <div className="sheet-step">
            <p>{behavior.name} · 单位：{behavior.unit}</p>
            <div className="amount-row">
              <button type="button" onClick={() => setAmount((a) => Math.max(0, a - 10))}>-10</button>
              <button type="button" onClick={() => setAmount((a) => Math.max(0, a - 1))}>-1</button>
              <input type="number" min={0} value={amount || ''} onChange={(e) => setAmount(Number(e.target.value) || 0)} />
              <button type="button" onClick={() => setAmount((a) => a + 1)}>+1</button>
              <button type="button" onClick={() => setAmount((a) => a + 10)}>+10</button>
            </div>
            <div className="sheet-actions">
              <button type="button" className="secondary" onClick={() => setStep(2)}>上一步</button>
              <button type="button" onClick={handleSubmit} disabled={amount <= 0 || submitting}>
                {submitting ? '提交中…' : '完成'}
              </button>
            </div>
          </div>
        )}
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
  settings: Settings
}

function History({ entries, uglyEntries, wellnessEntries, settings }: HistoryProps) {
  const [period, setPeriod] = useState<'week' | 'month'>('week')
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
  const byDay = useMemo(() => {
    const map = new Map<string, Entry[]>()
    for (const e of filtered) {
      const list = map.get(e.dateKey) ?? []
      list.push(e)
      map.set(e.dateKey, list)
    }
    return Array.from(map.entries())
      .map(([, list]) => calcDayStats(list, settings))
      .sort((a, b) => b.dateKey.localeCompare(a.dateKey))
  }, [filtered, settings])

  return (
    <div className="history">
      <div className="history-filters">
        <button type="button" className={period === 'week' ? 'tab active' : 'tab'} onClick={() => setPeriod('week')}>本周</button>
        <button type="button" className={period === 'month' ? 'tab active' : 'tab'} onClick={() => setPeriod('month')}>本月</button>
      </div>
      <div className="history-table-wrap">
        <table className="history-table">
          <thead>
            <tr>
              <th>日期</th>
              <th>状态</th>
              <th>健康值(H)</th>
              <th>力量运动</th>
              <th>有氧运动</th>
              <th>美丽值</th>
              <th>丑陋行为</th>
              <th>丑陋值</th>
              <th>养生行为</th>
              <th>养生值</th>
            </tr>
          </thead>
          <tbody>
            {byDay.map((day) => {
              const dayUgly = filteredUgly.filter((e) => e.dateKey === day.dateKey)
              const dayWellness = filteredWellness.filter((e) => e.dateKey === day.dateKey)
              const uglySummary = getUglySummary(dayUgly)
              const uglyTotal = dayUgly.reduce((s, e) => s + e.uglyGained, 0)
              const wellnessSummary = getWellnessSummary(dayWellness)
              const wellnessTotal = dayWellness.reduce((s, e) => s + e.wellnessGained, 0)
              const healthValue = Math.round((day.totalBeauty - uglyTotal + wellnessTotal) * 100) / 100
              const dailyHealthGoal = getDailyHealthGoal(settings)
              const achieved = dailyHealthGoal <= 0 || healthValue >= dailyHealthGoal
              return (
                <tr key={day.dateKey} className={`history-row status-${achieved ? 'achieved' : 'not-achieved'}`}>
                  <td>{day.dateKey.slice(5).replace('-', '/')}</td>
                  <td className="status-cell">
                    {achieved ? <span className="face face-ok" title="达成">😊</span> : <span className="face face-low" title="未达成">😢</span>}
                  </td>
                  <td>{healthValue}</td>
                  <td>{day.strengthSummary || '—'}</td>
                  <td>{day.cardioSummary || '—'}</td>
                  <td>{day.totalBeauty}</td>
                  <td>{uglySummary || '—'}</td>
                  <td>{uglyTotal > 0 ? uglyTotal : '—'}</td>
                  <td>{wellnessSummary || '—'}</td>
                  <td>{wellnessTotal > 0 ? wellnessTotal : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {byDay.length === 0 && <p className="history-empty">暂无记录</p>}
      </div>
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
          美丽
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
        <p className="settings-hint">仅设定日目标，周目标=日×7、月目标=日×当月天数；健康值目标 = 美丽值 − 丑陋值 + 养生值（自动计算）。</p>
        <div className="settings-goals-grid">
          <div className="settings-goals-group">
            <h3>美丽值下限</h3>
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
        <h2>美丽配置（类型 / 运动 / 单位 / 每单位美丽值）</h2>
        <p className="settings-hint">这里可以增删改运动条目，变美打卡会使用这里的配置。</p>
        <div className="exercise-table">
          <div className="exercise-row exercise-row--header">
            <span>类型</span>
            <span>运动名称</span>
            <span>单位</span>
            <span>每单位美丽值</span>
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

export default App
