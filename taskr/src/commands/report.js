// =============================================================================
// commands/report.js — Relatórios: today | week | overdue | summary
// =============================================================================

import { findAllTasks, getTaskStats } from '../db/taskRepository.js'
import { findAllProjects }            from '../db/projectRepository.js'
import { printTaskTable, printStats, info, warn, success } from '../utils/ui.js'
import { startOfWeek, endOfWeek, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import chalk from 'chalk'

export function registerReportCommands(program) {
  const report = program
    .command('report')
    .alias('r')
    .description('Relatórios e resumos')

  report
    .command('today')
    .description('Tarefas com entrega hoje')
    .action(reportToday)

  report
    .command('week')
    .description('Tarefas com entrega esta semana')
    .action(reportWeek)

  report
    .command('overdue')
    .description('Tarefas atrasadas')
    .action(reportOverdue)

  report
    .command('summary')
    .alias('s')
    .description('Resumo geral do sistema')
    .action(reportSummary)
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

function reportToday() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const tasks = findAllTasks().filter(t =>
    t.due_date === today && !['done', 'cancelled'].includes(t.status)
  )

  console.log(chalk.bold.cyan(`\n📅 Tarefas para hoje (${format(new Date(), "dd 'de' MMMM", { locale: ptBR })})\n`))

  if (tasks.length === 0) {
    warn('Nenhuma tarefa com entrega hoje. 🎉')
    return
  }

  printTaskTable(tasks)
  info(`${tasks.length} tarefa(s) para hoje`)
}

function reportWeek() {
  const now   = new Date()
  const start = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const end   = format(endOfWeek(now,   { weekStartsOn: 1 }), 'yyyy-MM-dd')

  const tasks = findAllTasks().filter(t =>
    t.due_date >= start &&
    t.due_date <= end   &&
    !['done', 'cancelled'].includes(t.status)
  )

  console.log(chalk.bold.cyan(`\n📆 Tarefas desta semana (${start} → ${end})\n`))

  if (tasks.length === 0) {
    warn('Nenhuma tarefa para esta semana.')
    return
  }

  printTaskTable(tasks)
  info(`${tasks.length} tarefa(s) esta semana`)
}

function reportOverdue() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const tasks = findAllTasks().filter(t =>
    t.due_date &&
    t.due_date < today &&
    !['done', 'cancelled'].includes(t.status)
  )

  console.log(chalk.bold.red('\n⚠️  Tarefas atrasadas\n'))

  if (tasks.length === 0) {
    success('Nenhuma tarefa atrasada! 🎉')
    return
  }

  printTaskTable(tasks)
  warn(`${tasks.length} tarefa(s) atrasada(s)`)
}

function reportSummary() {
  const stats    = getTaskStats()
  const projects = findAllProjects()

  console.log(chalk.bold.cyan('\n📊 Resumo Geral\n'))
  printStats(stats)

  if (projects.length > 0) {
    console.log(chalk.bold('\n📁 Projetos:\n'))
    for (const p of projects) {
      const done    = p.done_tasks  || 0
      const total   = p.total_tasks || 0
      const pct     = total > 0 ? Math.round((done / total) * 100) : 0
      const bar     = buildProgressBar(pct)
      console.log(`  ${chalk.hex(p.color)('■')} ${chalk.bold(p.name.padEnd(20))} ${bar} ${pct}% (${done}/${total})`)
    }
    console.log('')
  }
}

function buildProgressBar(pct, width = 20) {
  const filled = Math.round((pct / 100) * width)
  const empty  = width - filled
  return chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty))
}
