import { CURRICULUM, TOTAL_LESSONS, ENROLLED_DATE, getNextLesson, getLessonById, type Lesson } from './curriculum'

interface Env {
  AGENT_MEMORY: KVNamespace
}

interface EduState {
  enrolledAt: string  // 入学日期
  completed: string[]  // 已学课程 id 列表
  notes: Array<{ lessonId: string; note: string; learnedAt: string }>  // 学习笔记
  lastLessonAt: string | null  // 上一次学习时间
  currentGrade: number  // 当前年级
}

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
}

async function loadState(tKey: string, env: Env): Promise<EduState> {
  const raw = await env.AGENT_MEMORY.get(`adam:edu:state:${tKey}`, 'json') as EduState | null
  if (raw) return raw
  return {
    enrolledAt: new Date().toISOString(),
    completed: [],
    notes: [],
    lastLessonAt: null,
    currentGrade: 1,
  }
}

async function saveState(tKey: string, env: Env, state: EduState): Promise<void> {
  await env.AGENT_MEMORY.put(`adam:edu:state:${tKey}`, JSON.stringify(state))
}

// 北京时间今天日期字符串 'YYYY-MM-DD'
function bjToday(): string {
  return new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10)
}

// GET ?tKey=...&action=today  返回今日应学课程（若今天已学返回 null）
// GET ?tKey=...&action=progress  返回学业进度
// POST {tKey, lessonId, note}  提交学习笔记 + 标记完成
export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context
  const url = new URL(request.url)
  const tKey = url.searchParams.get('tKey') || ''
  const action = url.searchParams.get('action') || 'today'
  if (!tKey) return new Response(JSON.stringify({ error: 'tKey required' }), { status: 400, headers: CORS })

  const state = await loadState(tKey, env)

  if (action === 'progress') {
    const lesson = getNextLesson(state.completed)
    return new Response(JSON.stringify({
      enrolledAt: state.enrolledAt,
      completedCount: state.completed.length,
      total: TOTAL_LESSONS,
      progressPct: TOTAL_LESSONS > 0 ? (state.completed.length / TOTAL_LESSONS * 100).toFixed(1) + '%' : '0%',
      currentGrade: state.currentGrade,
      nextLesson: lesson ? { id: lesson.id, title: lesson.title, subject: lesson.subject, gradeName: lesson.gradeName } : null,
      recentNotes: state.notes.slice(-5),
    }), { headers: CORS })
  }

  // action === 'today' — 今日课程
  const today = bjToday()
  const lastDate = state.lastLessonAt ? state.lastLessonAt.slice(0, 10) : null
  const lastDateBJ = state.lastLessonAt ? new Date(new Date(state.lastLessonAt).getTime() + 8 * 3600000).toISOString().slice(0, 10) : null

  if (lastDateBJ === today) {
    return new Response(JSON.stringify({ lesson: null, reason: '今天已学过', alreadyLearnedToday: true }), { headers: CORS })
  }

  const lesson = getNextLesson(state.completed)
  if (!lesson) {
    return new Response(JSON.stringify({ lesson: null, reason: '所有课程已学完', graduated: true }), { headers: CORS })
  }

  return new Response(JSON.stringify({ lesson, alreadyLearnedToday: false }), { headers: CORS })
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context
  const body = await request.json() as { tKey: string; lessonId: string; note: string }
  const { tKey, lessonId, note } = body
  if (!tKey || !lessonId || !note) return new Response(JSON.stringify({ error: 'tKey, lessonId, note required' }), { status: 400, headers: CORS })

  const lesson = getLessonById(lessonId)
  if (!lesson) return new Response(JSON.stringify({ error: 'lesson not found' }), { status: 404, headers: CORS })

  const state = await loadState(tKey, env)
  if (state.completed.includes(lessonId)) {
    return new Response(JSON.stringify({ error: 'lesson already completed', state }), { status: 400, headers: CORS })
  }

  state.completed.push(lessonId)
  state.notes.push({ lessonId, note: note.slice(0, 1000), learnedAt: new Date().toISOString() })
  state.lastLessonAt = new Date().toISOString()
  // 更新当前年级（按已学课程推断）
  state.currentGrade = lesson.grade

  // 保留最近 50 条笔记
  if (state.notes.length > 50) state.notes = state.notes.slice(-50)

  await saveState(tKey, env, state)

  return new Response(JSON.stringify({
    ok: true,
    lessonId,
    completedCount: state.completed.length,
    total: TOTAL_LESSONS,
  }), { headers: CORS })
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  })
}
