// =============================================================================
// commands/project.js — Comandos: project add | list | show | edit | rm
// =============================================================================

import inquirer from 'inquirer'
import {
  createProject,
  findAllProjects,
  findProjectById,
  findProjectByName,
  updateProject,
  deleteProject
} from '../db/projectRepository.js'
import { findAllTasks } from '../db/taskRepository.js'
import { printProjectTable, printProjectDetail, printTaskTable, success, error, warn, info } from '../utils/ui.js'

const PROJECT_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899', '#8b5cf6', '#06b6d4']

export function registerProjectCommands(program) {
  const project = program
    .command('project')
    .alias('p')
    .description('Gerenciar projetos')

  project
    .command('add [name...]')
    .alias('a')
    .description('Criar um novo projeto')
    .option('-d, --desc <text>',    'Descrição do projeto')
    .option('-c, --color <hex>',    'Cor em hex (ex: #ff5733)')
    .option('-i, --interactive',    'Modo interativo')
    .action(addProject)

  project
    .command('list')
    .alias('ls')
    .description('Listar todos os projetos')
    .action(listProjects)

  project
    .command('show <name>')
    .description('Exibir detalhes e tarefas de um projeto')
    .option('-s, --status <status>', 'Filtrar tarefas por status')
    .action(showProject)

  project
    .command('edit <name>')
    .alias('e')
    .description('Editar um projeto')
    .action(editProject)

  project
    .command('rm <name>')
    .description('Remover um projeto')
    .option('-f, --force', 'Não pede confirmação')
    .action(removeProject)
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

async function addProject(nameParts, options) {
  let data = {}

  if (options.interactive || nameParts.length === 0) {
    data = await inquirer.prompt([
      {
        type:     'input',
        name:     'name',
        message:  'Nome do projeto:',
        default:  nameParts.join(' ') || undefined,
        validate: v => v.trim().length > 0 || 'Nome é obrigatório'
      },
      {
        type:    'input',
        name:    'description',
        message: 'Descrição (opcional):'
      },
      {
        type:    'list',
        name:    'color',
        message: 'Cor:',
        choices: PROJECT_COLORS,
        default: '#6366f1'
      }
    ])
  } else {
    data = {
      name:        nameParts.join(' '),
      description: options.desc,
      color:       options.color || '#6366f1'
    }
  }

  const existing = findProjectByName(data.name.trim())
  if (existing) return error(`Projeto "${data.name}" já existe`)

  const project = createProject({
    name:        data.name.trim(),
    description: data.description || null,
    color:       data.color
  })

  success(`Projeto "${project.name}" criado! ID: #${project.id}`)
  printProjectDetail(project)
}

function listProjects() {
  const projects = findAllProjects()
  if (projects.length === 0) {
    warn('Nenhum projeto encontrado. Use: taskr project add <nome>')
    return
  }
  printProjectTable(projects)
  info(`Total: ${projects.length} projeto(s)`)
}

function showProject(name, options) {
  const project = findProjectByName(name)
  if (!project) return error(`Projeto "${name}" não encontrado`)

  const fullProject = findProjectById(project.id)
  printProjectDetail(fullProject)

  const tasks = findAllTasks({ project_id: project.id, status: options.status })
  if (tasks.length > 0) {
    console.log('')
    info('Tarefas do projeto:')
    printTaskTable(tasks)
  } else {
    warn('Nenhuma tarefa neste projeto.')
  }
}

async function editProject(name) {
  const project = findProjectByName(name)
  if (!project) return error(`Projeto "${name}" não encontrado`)

  const answers = await inquirer.prompt([
    {
      type:    'input',
      name:    'name',
      message: 'Nome:',
      default: project.name
    },
    {
      type:    'input',
      name:    'description',
      message: 'Descrição:',
      default: project.description || ''
    },
    {
      type:    'list',
      name:    'color',
      message: 'Cor:',
      choices: PROJECT_COLORS,
      default: project.color
    }
  ])

  const updated = updateProject(project.id, {
    name:        answers.name.trim(),
    description: answers.description || null,
    color:       answers.color
  })

  success(`Projeto atualizado com sucesso!`)
  printProjectDetail(updated)
}

async function removeProject(name, options) {
  const project = findProjectByName(name)
  if (!project) return error(`Projeto "${name}" não encontrado`)

  if (!options.force) {
    const { confirm } = await inquirer.prompt([{
      type:    'confirm',
      name:    'confirm',
      message: `Remover projeto "${name}"? As tarefas serão mantidas (sem projeto).`,
      default: false
    }])
    if (!confirm) return warn('Operação cancelada.')
  }

  deleteProject(project.id)
  success(`Projeto "${name}" removido.`)
}
