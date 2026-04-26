// =============================================================================
// utils/ui.js — Helpers de output no terminal
// =============================================================================

import chalk  from 'chalk'
import Table  from 'cli-table3'
import { formatDueDate, isOverdue, isDueToday, isDueSoon } from './date.js'
import { PRIORITY_COLORS, STATUS_ICONS, PRIORITY_ICONS } from './constants.js'

// ─── Banner ───────────────────────────────────────────────────────────────────
export function printBanner() {
  return chalk.cyan(`
  ████████╗ █████╗ ███████╗██╗  ██╗██████╗
     ██╔══╝██╔══██╗██╔════╝██║ ██╔╝██╔══██╗
     ██║   ███████║███████╗█████╔╝ ██████╔╝
     ██║   ██╔══██║╚════██║██╔═██╗ ██╔══██╗
     ██║   ██║  ██║███████║██║  ██╗██║  ██║
     ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝
  ${chalk.dim('CLI de Gerenciamento de Tarefas')}
  `)
}

// ─── Mensagens ────────────────────────────────────────────────────────────────
export const success = msg => console.log(chalk.green(`  ✔  ${msg}`))
export const error   = msg => console.log(chalk.red(`  ✖  ${msg}`))
export const warn    = msg => console.log(chalk.yellow(`  ⚠  ${msg}`))
export const info    = msg => console.log(chalk.dim(`  ℹ  ${msg}`))

// ─── Formatação de tarefa ─────────────────────────────────────────────────────
function formatPriority(priority) {
  const icon  = PRIORITY_ICONS[priority]  || '·'
  const color = PRIORITY_COLORS[priority] || '#ffffff'
  return chalk.hex(color)(`${icon} ${priority}`)
}

function formatStatus(status) {
  const icon = STATUS_ICONS[status] || '·'
  const colors = {
    todo:      '#94a3b8',
    doing:     '#3b82f6',
    done:      '#22c55e',
    cancelled: '#ef4444'
  }
  return chalk.hex(colors[status] || '#ffffff')(`${icon} ${status}`)
}

function formatDue(dueDate) {
  if (!dueDate) return chalk.dim('—')
  const label = formatDueDate(dueDate)
  if (isOverdue(dueDate))  return chalk.red(`⚑ ${label}`)
  if (isDueToday(dueDate)) return chalk.yellow(`◎ ${label}`)
  if (isDueSoon(dueDate))  return chalk.cyan(`◉ ${label}`)
  return chalk.dim(label)
}

function formatTags(tags) {
  if (!tags || tags.length === 0) return chalk.dim('—')
  return tags.map(t => chalk.bgHex('#1e293b').hex('#94a3b8')(` ${t} `)).join(' ')
}

// ─── Tabela de tarefas ────────────────────────────────────────────────────────
export function printTaskTable(tasks) {
  const table = new Table({
    head: [
      chalk.bold('#'),
      chalk.bold('Título'),
      chalk.bold('Status'),
      chalk.bold('Prioridade'),
      chalk.bold('Projeto'),
      chalk.bold('Entrega'),
      chalk.bold('Tags')
    ],
    style: {
      head:    ['cyan'],
      border:  ['dim']
    },
    colWidths: [6, 32, 14, 14, 16, 14, 20],
    wordWrap: true
  })

  for (const task of tasks) {
    table.push([
      chalk.dim(`#${task.id}`),
      task.title,
      formatStatus(task.status),
      formatPriority(task.priority),
      task.project_name
        ? chalk.hex(task.project_color || '#6366f1')(task.project_name)
        : chalk.dim('—'),
      formatDue(task.due_date),
      formatTags(task.tags)
    ])
  }

  console.log(table.toString())
}

// ─── Detalhe de tarefa ────────────────────────────────────────────────────────
export function printTaskDetail(task) {
  const sep = chalk.dim('─'.repeat(50))
  console.log(`\n${sep}`)
  console.log(`  ${chalk.bold.cyan(`#${task.id}`)}  ${chalk.bold(task.title)}`)
  console.log(sep)
  console.log(`  ${chalk.dim('Status    :')} ${formatStatus(task.status)}`)
  console.log(`  ${chalk.dim('Prioridade:')} ${formatPriority(task.priority)}`)
  console.log(`  ${chalk.dim('Projeto   :')} ${task.project_name ? chalk.hex(task.project_color)(task.project_name) : chalk.dim('—')}`)
  console.log(`  ${chalk.dim('Entrega   :')} ${formatDue(task.due_date)}`)
  console.log(`  ${chalk.dim('Tags      :')} ${formatTags(task.tags)}`)
  if (task.description) {
    console.log(`  ${chalk.dim('Descrição :')} ${task.description}`)
  }
  console.log(`  ${chalk.dim('Criado em :')} ${chalk.dim(new Date(task.created_at).toLocaleString('pt-BR'))}`)
  console.log(sep + '\n')
}

// ─── Tabela de projetos ───────────────────────────────────────────────────────
export function printProjectTable(projects) {
  const table = new Table({
    head: [
      chalk.bold('#'),
      chalk.bold('Projeto'),
      chalk.bold('Descrição'),
      chalk.bold('Total'),
      chalk.bold('Fazendo'),
      chalk.bold('Concluídas'),
      chalk.bold('A fazer')
    ],
    style: { head: ['cyan'], border: ['dim'] },
    colWidths: [6, 20, 28, 8, 10, 12, 10]
  })

  for (const p of projects) {
    table.push([
      chalk.dim(`#${p.id}`),
      chalk.hex(p.color)(p.name),
      chalk.dim(p.description || '—'),
      p.total_tasks  || 0,
      chalk.blue(p.doing_tasks  || 0),
      chalk.green(p.done_tasks  || 0),
      chalk.dim(p.todo_tasks    || 0)
    ])
  }

  console.log(table.toString())
}

// ─── Detalhe de projeto ───────────────────────────────────────────────────────
export function printProjectDetail(project) {
  const sep   = chalk.dim('─'.repeat(50))
  const total = project.total_tasks || 0
  const done  = project.done_tasks  || 0
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0

  console.log(`\n${sep}`)
  console.log(`  ${chalk.bold.hex(project.color)(`■ ${project.name}`)}  ${chalk.dim(`#${project.id}`)}`)
  console.log(sep)
  if (project.description) {
    console.log(`  ${chalk.dim('Descrição:')} ${project.description}`)
  }
  console.log(`  ${chalk.dim('Progresso:')} ${buildBar(pct)} ${pct}% (${done}/${total})`)
  console.log(`  ${chalk.dim('Fazendo  :')} ${chalk.blue(project.doing_tasks || 0)}`)
  console.log(`  ${chalk.dim('A fazer  :')} ${chalk.dim(project.todo_tasks || 0)}`)
  console.log(sep + '\n')
}

// ─── Stats ────────────────────────────────────────────────────────────────────
export function printStats({ byStatus, byPriority, overdue, dueToday }) {
  const statusMap   = Object.fromEntries(byStatus.map(r => [r.status, r.count]))
  const priorityMap = Object.fromEntries(byPriority.map(r => [r.priority, r.count]))
  const total       = byStatus.reduce((s, r) => s + r.count, 0)

  const sep = chalk.dim('─'.repeat(50))
  console.log(sep)
  console.log(`  ${chalk.bold('Por Status')}`)
  console.log(`    ${chalk.dim('A fazer  :')} ${statusMap.todo      || 0}`)
  console.log(`    ${chalk.blue('Fazendo  :')} ${statusMap.doing     || 0}`)
  console.log(`    ${chalk.green('Concluído:')} ${statusMap.done      || 0}`)
  console.log(`    ${chalk.red('Cancelado:')} ${statusMap.cancelled  || 0}`)
  console.log(`    ${chalk.bold('Total    :')} ${total}`)
  console.log(sep)
  console.log(`  ${chalk.bold('Por Prioridade')}`)
  console.log(`    ${chalk.red('Urgente  :')} ${priorityMap.urgent || 0}`)
  console.log(`    ${chalk.yellow('Alta     :')} ${priorityMap.high   || 0}`)
  console.log(`    ${chalk.blue('Média    :')} ${priorityMap.medium || 0}`)
  console.log(`    ${chalk.dim('Baixa    :')} ${priorityMap.low    || 0}`)
  console.log(sep)
  if (overdue > 0)   console.log(`  ${chalk.red(`  ⚑ ${overdue} tarefa(s) atrasada(s)`)}`)
  if (dueToday > 0)  console.log(`  ${chalk.yellow(`  ◎ ${dueToday} tarefa(s) para hoje`)}`)
  console.log(sep + '\n')
}

function buildBar(pct, width = 20) {
  const filled = Math.round((pct / 100) * width)
  return chalk.green('█'.repeat(filled)) + chalk.dim('░'.repeat(width - filled))
}
