import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { initDatabase, getDb } from './db/database.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// Initialize DB
initDatabase()

// --- Routes ---

// Get all tasks with project info
app.get('/api/tasks', (req, res) => {
  try {
    const db = getDb()
    const tasks = db.prepare(`
      SELECT t.*, p.name as project_name, p.color as project_color 
      FROM tasks t 
      LEFT JOIN projects p ON t.project_id = p.id
      ORDER BY t.created_at DESC
    `).all()
    
    // Parse tags JSON
    const parsedTasks = tasks.map(t => ({
      ...t,
      tags: JSON.parse(t.tags || '[]')
    }))
    
    res.json(parsedTasks)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get all projects
app.get('/api/projects', (req, res) => {
  try {
    const db = getDb()
    const projects = db.prepare(`
      SELECT p.*, 
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as total_tasks,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done') as done_tasks
      FROM projects p
    `).all()
    res.json(projects)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get stats
app.get('/api/stats', (req, res) => {
  try {
    const db = getDb()
    const stats = {
      byStatus: db.prepare('SELECT status, COUNT(*) as count FROM tasks GROUP BY status').all(),
      byPriority: db.prepare('SELECT priority, COUNT(*) as count FROM tasks GROUP BY priority').all(),
      totalTasks: db.prepare('SELECT COUNT(*) as count FROM tasks').get().count,
      totalProjects: db.prepare('SELECT COUNT(*) as count FROM projects').get().count
    }
    res.json(stats)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`🚀 Taskr API Server running at http://localhost:${PORT}`)
})
