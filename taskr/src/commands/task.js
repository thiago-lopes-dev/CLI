// =============================================================================
// commands/task.js — Comandos: task add | list | done | edit | rm | show
// =============================================================================

import { Command }   from 'commander'
import inquirer      from 'inquirer'
import ora           from 'ora'

import {
  createTask,
  findAllTasks,
  findTaskById,
  updateTask,
  deleteTask,
  getTaskStats
} from '../db/taskRepository.js'

import { findAllProjects, findProjectByName } from '../db/projectRepository.js'
import { printTaskTable, printTaskDetail, printStats, success, error, warn, info } from '../utils/ui.js'
import { formatDueDate, parseDateInput } from '../utils/date.js'
import { PRIORITIES, STATUSES } from '../utils/constants.js'

// ─── Registro de subcomandos ──────────────────────────────────────────────────
export function registerTaskCommands(program) {
  const task = program
    .command('task')
    .alias('t')
    .description('Gerenciar tarefas')

  task
    .command('add [title...]')
    .alias('a')
    .description('Adicionar uma nova tarefa')
    .option('-p, --priority <level>', `Prioridade: ${PRIORITIES.join(', ')}`, 'medium')
    .option('-P, --project <name>',   'Nome do projeto')
    .option('-d, --due <date>',       'Data de entrega (ex: hoje, amanhã, 2025-12-31)')
    .option('-t, --tags <tags>',      'Tags separadas por vírgula')
    .option('-D, --desc <text>',      'Descrição da tarefa')
    .option('-i, --interactive',      'Modo interativo com prompts')
    .action(addTask)

  task
    .command('list')
    .alias('ls')
    .description('Listar tarefas')
    .option('-s, --status <status>',   `Filtrar por status: ${STATUSES.join(', ')}`)
    .option('-p, --priority <level>',  'Filtrar por prioridade')
    .option('-P, --project <name>',    'Filtrar por projeto')
    .option('-t, --tag <tag>',         'Filtrar por tag')
    .option('-q, --search <query>',    'Buscar por título')
    .option('--sort <field>',          'Ordenar por: created_at, due_date, priority, status', 'created_at')
    .option('--asc',                   'Ordem crescente')
    .option('--all',                   'Incluir tarefas concluídas e canceladas')
    .action(listTasks)

  task
    .command('show <id>')
    .description('Exibir detalhes de uma tarefa')
    .action(showTask)

  task
    .command('done <id>')
    .alias('d')
    .description('Marcar tarefa como concluída')
    .action(doneTask)

  task
    .command('start <id>')
    .description('Marcar tarefa como em andamento')
    .action(startTask)

  task
    .command('edit <id>')
    .alias('e')
    .description('Editar uma tarefa (modo interativo)')
    .action(editTask)

  task
    .command('rm <id>')
    .description('Remover uma tarefa')
    .option('-f, --force', 'Não pede confirmação')
    .action(removeTask)

  task
    .command('stats')
    .description('Estatísticas das tarefas')
    .action(showStats)
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

async function addTask(titleParts, options) {
  let data = {}

  if (options.interactive || titleParts.length === 0) {
    const projects = findAllProjects()
    const answers  = await inquirer.prompt([
      {
        type:     'input',
        name:     'title',
        message:  'Título da tarefa:',
        default:  titleParts.join(' ') || undefined,
        validate: v => v.trim().length > 0 || 'Título é obrigatório'
      },
      {
        type:    'input',
        name:    'description',
        message: 'Descrição (opcional):'
      },
      {
        type:    'list',
        name:    'priority',
        message: 'Prioridade:',
        choices: PRIORITIES,
        default: 'medium'
      },
      {
        type:    'list',
        name:    'project',
        message: 'Projeto:',
        choices: ['(nenhum)', ...projects.map(p => p.name)],
        default: '(nenhum)'
      },
      {
        type:    'input',
        name:    'due',
        message: 'Data de entrega (ex: hoje, amanhã, 2025-12-31):'
      },
      {
        type:    'input',
        name:    'tags',
        message: 'Tags (separadas por vírgula):'
      }
    ])
    data = answers
  } else {
    data = {
      title:       titleParts.join(' '),
      description: options.desc,
      priority:    options.priority,
      project:     options.project,
      due:         options.due,
      tags:        options.tags
    }
  }

  if (!PRIORITIES.includes(data.priority)) {
    return error(`Prioridade inválida: "${data.priority}". Use: ${PRIORITIES.join(', ')}`)
  }

  let project_id = null
  if (data.project && data.project !== '(nenhum)') {
    const project = findProjectByName(data.project)
    if (!project) return error(`Projeto "${data.project}" não encontrado`)
    project_id = project.id
  }

  const spinner = ora('Criando tarefa...').start()
  const task = createTask({
    title:       data.title.trim(),
    description: data.description || null,
    priority:    data.priority,
    project_id,
    due_date:    data.due ? parseDateInput(data.due) : null,
    tags:        data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : []
  })
  spinner.stop()

  success(`Tarefa criada com sucesso! ID: #${task.id}`)
  printTaskDetail(task)
}

function listTasks(options) {
  const filters = {
    status:     options.status,
    priority:   options.priority,
    tag:        options.tag,
    search:     options.search,
    sort:       options.sort,
    order:      options.asc ? 'ASC' : 'DESC'
  }

  if (options.project) {
    const project = findProjectByName(options.project)
    if (!project) return error(`Projeto "${options.project}" não encontrado`)
    filters.project_id = project.id
  }

  // Por padrão, esconde done e cancelled
  if (!options.all && !options.status) {
    filters.status = undefined // será tratado abaixo
  }

  let tasks = findAllTasks(filters)

  if (!options.all && !options.status) {
    tasks = tasks.filter(t => !['done', 'cancelled'].includes(t.status))
  }

  if (tasks.length === 0) {
    warn('Nenhuma tarefa encontrada.')
    return
  }

  printTaskTable(tasks)
  info(`Total: ${tasks.length} tarefa(s)`)
}

function showTask(id) {
  const task = findTaskById(Number(id))
  if (!task) return error(`Tarefa #${id} não encontrada`)
  printTaskDetail(task)
}

function doneTask(id) {
  const task = findTaskById(Number(id))
  if (!task) return error(`Tarefa #${id} não encontrada`)
  if (task.status === 'done') return warn(`Tarefa #${id} já está concluída`)

  updateTask(Number(id), { status: 'done' })
  success(`Tarefa #${id} marcada como concluída! ✓`)
}

function startTask(id) {
  const task = findTaskById(Number(id))
  if (!task) return error(`Tarefa #${id} não encontrada`)
  if (task.status === 'doing') return warn(`Tarefa #${id} já está em andamento`)

  updateTask(Number(id), { status: 'doing' })
  success(`Tarefa #${id} marcada como em andamento 🚀`)
}

async function editTask(id) {
  const task = findTaskById(Number(id))
  if (!task) return error(`Tarefa #${id} não encontrada`)

  const projects = findAllProjects()

  const answers = await inquirer.prompt([
    {
      type:    'input',
      name:    'title',
      message: 'Título:',
      default: task.title
    },
    {
      type:    'input',
      name:    'description',
      message: 'Descrição:',
      default: task.description || ''
    },
    {
      type:    'list',
      name:    'status',
      message: 'Status:',
      choices: STATUSES,
      default: task.status
    },
    {
      type:    'list',
      name:    'priority',
      message: 'Prioridade:',
      choices: PRIORITIES,
      default: task.priority
    },
    {
      type:    'list',
      name:    'project',
      message: 'Projeto:',
      choices: ['(nenhum)', ...projects.map(p => p.name)],
      default: task.project_name || '(nenhum)'
    },
    {
      type:    'input',
      name:    'due',
      message: 'Data de entrega:',
      default: task.due_date || ''
    },
    {
      type:    'input',
      name:    'tags',
      message: 'Tags (separadas por vírgula):',
      default: task.tags.join(', ')
    }
  ])

  let project_id = null
  if (answers.project !== '(nenhum)') {
    const project = findProjectByName(answers.project)
    if (project) project_id = project.id
  }

  const updated = updateTask(Number(id), {
    title:       answers.title.trim(),
    description: answers.description || null,
    status:      answers.status,
    priority:    answers.priority,
    project_id,
    due_date:    answers.due ? parseDateInput(answers.due) : null,
    tags:        answers.tags.split(',').map(t => t.trim()).filter(Boolean)
  })

  success(`Tarefa #${id} atualizada com sucesso!`)
  printTaskDetail(updated)
}

async function removeTask(id, options) {
  const task = findTaskById(Number(id))
  if (!task) return error(`Tarefa #${id} não encontrada`)

  if (!options.force) {
    const { confirm } = await inquirer.prompt([{
      type:    'confirm',
      name:    'confirm',
      message: `Remover tarefa #${id}: "${task.title}"?`,
      default: false
    }])
    if (!confirm) return warn('Operação cancelada.')
  }

  deleteTask(Number(id))
  success(`Tarefa #${id} removida.`)
}

function showStats() {
  const stats = getTaskStats()
  printStats(stats)
}
