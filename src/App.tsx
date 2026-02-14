import { useEffect, useMemo, useState } from 'react'
import './App.css'
import type { Entry, Exercise, Settings } from './domain/types'
import { getAllEntries, loadExercises, loadSettings, saveExercises, saveSettings } from './lib/db'
import {
  calcBeauty,
  calcDayStats,
  calcMonthSummary,
  calcTodaySummary,
  calcWeekSummary,
  getExerciseSummary,
  getMonthStartDateKey,
  getWeekStartDateKey,
  toDateKey,
} from './lib/metrics'

type Tab = 'dashboard' | 'history' | 'settings'

function App() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [loading, setLoading] = useState(true)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [settings, setSettingsState] = useState<Settings | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function init() {
      const [loadedExercises, loadedSettings, loadedEntries] = await Promise.all([
        loadExercises(),
        loadSettings(),
        getAllEntries(),
      ])
      setExercises(loadedExercises)
      setSettingsState(loadedSettings)
      setEntries(loadedEntries)
      setLoading(false)
    }
    void init()
  }, [])

  async function handleSaveAll() {
    if (!settings) return
    setSaving(true)
    try {
      await Promise.all([saveExercises(exercises), saveSettings(settings)])
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
        <h1>美丽打卡 Beauty Check-in</h1>
      </header>

      <nav className="app-tabs">
        <button
          type="button"
          className={tab === 'dashboard' ? 'tab active' : 'tab'}
          onClick={() => setTab('dashboard')}
        >
          首页
        </button>
        <button
          type="button"
          className={tab === 'history' ? 'tab active' : 'tab'}
          onClick={() => setTab('history')}
        >
          历史
        </button>
        <button
          type="button"
          className={tab === 'settings' ? 'tab active' : 'tab'}
          onClick={() => setTab('settings')}
        >
          设置
        </button>
      </nav>

      <main className="app-main">
        {tab === 'dashboard' && (
          <Dashboard
            entries={entries}
            setEntries={setEntries}
            exercises={exercises}
            settings={settings}
          />
        )}
        {tab === 'history' && settings && (
          <History entries={entries} settings={settings} />
        )}
        {tab === 'settings' && (
          <SettingsPanel
            exercises={exercises}
            onChangeExercises={setExercises}
            settings={settings}
            onChangeSettings={setSettingsState}
            onSaveAll={handleSaveAll}
            saving={saving}
          />
        )}
      </main>
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
      dailyGoal: settings.dailyGoal,
      achieved: todayTotal >= settings.dailyGoal,
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
}: {
  card: { label: string; totalBeauty: number; goal: number; completionRate: number; remaining: number; timeProgressRate: number }
  exerciseSummary?: string
}) {
  const pct = Math.round(card.completionRate * 100)
  const showSmiley = card.completionRate >= 1
  const showTimeProgress = card.label !== '今日'
  const rowClass = showTimeProgress ? 'summary-card-stats-row summary-card-stats-row--four' : 'summary-card-stats-row'
  return (
    <div className="summary-card">
      <div className="summary-card-label">{card.label}</div>

      <div className="summary-card-stats">
        <div className={`${rowClass} summary-card-stats-header`}>
          <span>今日</span>
          <span>目标</span>
          <span>完成率</span>
          {showTimeProgress && <span>时间进度</span>}
        </div>
        <div className={`${rowClass} summary-card-stats-values`}>
          <span className="summary-card-value">{card.totalBeauty}<span className="unit">B</span></span>
          <span>{card.goal}<span className="unit">B</span></span>
          <span>{showSmiley ? '😊' : `${pct}%`}</span>
          {showTimeProgress && (
            <span>{card.timeProgressRate >= 1 ? '✓' : `${Math.round(card.timeProgressRate * 100)}%`}</span>
          )}
        </div>
      </div>

      {exerciseSummary && (
        <div className="summary-card-exercises-block">
          <div className="summary-card-exercises-label">已运动</div>
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

// ---------- 历史记录 History ----------

interface HistoryProps {
  entries: Entry[]
  settings: Settings
}

function History({ entries, settings }: HistoryProps) {
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
              <th>力量运动</th>
              <th>有氧运动</th>
              <th>美丽值</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {byDay.map((day) => (
              <tr key={day.dateKey} className={`history-row status-${day.status}`}>
                <td>{day.dateKey.slice(5).replace('-', '/')}</td>
                <td>{day.strengthSummary || '—'}</td>
                <td>{day.cardioSummary || '—'}</td>
                <td>{day.totalBeauty}</td>
                <td className="status-cell">
                  {day.status === 'low' && <span className="face face-low" title="未达成">😢</span>}
                  {day.status === 'ok' && <span className="face face-ok" title="达成">😊</span>}
                  {day.status === 'great' && <span className="face face-great" title="超额">😄</span>}
                </td>
              </tr>
            ))}
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
  settings: Settings
  onChangeSettings: (value: Settings) => void
  onSaveAll: () => void
  saving: boolean
}

function SettingsPanel({
  exercises,
  onChangeExercises,
  settings,
  onChangeSettings,
  onSaveAll,
  saving,
}: SettingsPanelProps) {
  function handleGoalChange(field: keyof Settings, value: string) {
    const numeric = Number(value)
    if (Number.isNaN(numeric)) return
    onChangeSettings({
      ...settings,
      [field]: numeric,
    })
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

  return (
    <div className="settings-panel">
      <section className="settings-section">
        <h2>目标设置</h2>
        <div className="settings-goals">
          <label>
            日目标（B）
            <input
              type="number"
              value={settings.dailyGoal}
              onChange={(e) => handleGoalChange('dailyGoal', e.target.value)}
            />
          </label>
          <label>
            周目标（B）
            <input
              type="number"
              value={settings.weeklyGoal}
              onChange={(e) => handleGoalChange('weeklyGoal', e.target.value)}
            />
          </label>
          <label>
            月目标（B）
            <input
              type="number"
              value={settings.monthlyGoal}
              onChange={(e) => handleGoalChange('monthlyGoal', e.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="settings-section">
        <h2>运动配置（类型 / 运动 / 单位 / 每单位美丽值）</h2>
        <p className="settings-hint">这里可以增删改运动条目，所有打卡会使用这里的配置。</p>
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
                value={ex.beautyPerUnit}
                onChange={(e) => {
                  const raw = e.target.value
                  const trimmed = raw.slice(0, 4) // 限制最多 4 个字符
                  handleExerciseChange(ex.id, 'beautyPerUnit', trimmed)
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

      <div className="settings-actions">
        <button type="button" onClick={onSaveAll} disabled={saving}>
          {saving ? '保存中…' : '保存所有设置'}
        </button>
      </div>
    </div>
  )
}

export default App
