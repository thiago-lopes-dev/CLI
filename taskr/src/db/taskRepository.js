// =============================================================================
// db/taskRepository.js — Queries de tarefas
// =============================================================================

import { getDb } from './database.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const parseTags  = row => row ? { ...row, tags: JSON.parse(row.tags || '[]') } : null
const parseRows  = rows => rows.map(parseTags)
const now        = () => new Date().toISOString()

// ─── CREATE ───────────────────────────────────────────────────────────────────
export function createTask({ title, description, priority = 'medium', project_id, due_date, tags = [] }) {
  const db = getDb()
  const stmt = db.prepare(`
    INSERT INTO tasks (title, description, priority, project_id, due_date, tags)
    VALUES (@title, @description, @priority, @project_id, @due_date, @tags)
  `)
  const result = stmt.run({
    title,
    description: description || null,
    priority,
    project_id:  project_id || null,
    due_date:    due_date || null,
    tags:        JSON.stringify(tags)
  })
  return findTaskById(result.lastInsertRowid)
}

// ─── READ ─────────────────────────────────────────────────────────────────────
export function findTaskById(id) {
  const db = getDb()
  const row = db.prepare(`
    SELECT t.*, p.name AS project_name, p.color AS project_color
    FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE t.id = ?
  `).get(id)
  return parseTags(row)
}

export function findAllTasks({ status, priority, project_id, tag, search, sort = 'created_at', order = 'DESC' } = {}) {
  const db     = getDb()
  const where  = ['1=1']
  const params = []

  if (status)     { where.push('t.status = ?');     params.push(status) }
  if (priority)   { where.push('t.priority = ?');   params.push(priority) }
  if (project_id) { where.push('t.project_id = ?'); params.push(project_id) }
  if (tag)        { where.push("t.tags LIKE ?");    params.push(`%"${tag}"%`) }
  if (search)     { where.push('t.title LIKE ?');   params.push(`%${search}%`) }

  const validSorts  = ['created_at', 'due_date', 'priority', 'status', 'title']
  const validOrders = ['ASC', 'DESC']
  const safeSort  = validSorts.includes(sort)   ? sort  : 'created_at'
  const safeOrder = validOrders.includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC'

  const rows = db.prepare(`
    SELECT t.*, p.name AS project_name, p.color AS project_color
    FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE ${where.join(' AND ')}
    ORDER BY t.${safeSort} ${safeOrder}
  `).all(...params)

  return parseRows(rows)
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────
export function updateTask(id, fields) {
  const db      = getDb()
  const allowed = ['title', 'description', 'status', 'priority', 'project_id', 'due_date', 'tags']
  const updates = []
  const values  = []

  for (const [key, val] of Object.entries(fields)) {
    if (!allowed.includes(key)) continue
    updates.push(`${key} = ?`)
    values.push(key === 'tags' ? JSON.stringify(val) : val)
  }

  if (updates.length === 0) return findTaskById(id)

  updates.push('updated_at = ?')
  values.push(now(), id)

  db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...values)
  return findTaskById(id)
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export function deleteTask(id) {
  const db = getDb()
  const task = findTaskById(id)
  if (!task) return null
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id)
  return task
}

// ─── STATS ────────────────────────────────────────────────────────────────────
export function getTaskStats() {
  const db = getDb()
  const byStatus   = db.prepare(`SELECT status, COUNT(*) as count FROM tasks GROUP BY status`).all()
  const byPriority = db.prepare(`SELECT priority, COUNT(*) as count FROM tasks GROUP BY priority`).all()
  const overdue    = db.prepare(`
    SELECT COUNT(*) as count FROM tasks
    WHERE due_date < date('now') AND status NOT IN ('done', 'cancelled')
  `).get()
  const dueToday   = db.prepare(`
    SELECT COUNT(*) as count FROM tasks
    WHERE due_date = date('now') AND status NOT IN ('done', 'cancelled')
  `).get()

  return { byStatus, byPriority, overdue: overdue.count, dueToday: dueToday.count }
}
