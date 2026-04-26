// =============================================================================
// db/projectRepository.js — Queries de projetos
// =============================================================================

import { getDb } from './database.js'

const now = () => new Date().toISOString()

export function createProject({ name, description, color = '#6366f1' }) {
  const db = getDb()
  const result = db.prepare(`
    INSERT INTO projects (name, description, color)
    VALUES (@name, @description, @color)
  `).run({ name, description: description || null, color })
  return findProjectById(result.lastInsertRowid)
}

export function findProjectById(id) {
  const db = getDb()
  return db.prepare(`
    SELECT p.*,
      COUNT(t.id)                                          AS total_tasks,
      SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END)  AS done_tasks,
      SUM(CASE WHEN t.status = 'todo' THEN 1 ELSE 0 END)  AS todo_tasks,
      SUM(CASE WHEN t.status = 'doing' THEN 1 ELSE 0 END) AS doing_tasks
    FROM projects p
    LEFT JOIN tasks t ON p.id = t.project_id
    WHERE p.id = ?
    GROUP BY p.id
  `).get(id)
}

export function findProjectByName(name) {
  const db = getDb()
  return db.prepare('SELECT * FROM projects WHERE name = ?').get(name)
}

export function findAllProjects() {
  const db = getDb()
  return db.prepare(`
    SELECT p.*,
      COUNT(t.id)                                          AS total_tasks,
      SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END)  AS done_tasks,
      SUM(CASE WHEN t.status = 'todo' THEN 1 ELSE 0 END)  AS todo_tasks,
      SUM(CASE WHEN t.status = 'doing' THEN 1 ELSE 0 END) AS doing_tasks
    FROM projects p
    LEFT JOIN tasks t ON p.id = t.project_id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `).all()
}

export function updateProject(id, fields) {
  const db      = getDb()
  const allowed = ['name', 'description', 'color']
  const updates = []
  const values  = []

  for (const [key, val] of Object.entries(fields)) {
    if (!allowed.includes(key)) continue
    updates.push(`${key} = ?`)
    values.push(val)
  }

  if (updates.length === 0) return findProjectById(id)

  updates.push('updated_at = ?')
  values.push(now(), id)

  db.prepare(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`).run(...values)
  return findProjectById(id)
}

export function deleteProject(id) {
  const db = getDb()
  const project = findProjectById(id)
  if (!project) return null
  db.prepare('DELETE FROM projects WHERE id = ?').run(id)
  return project
}
