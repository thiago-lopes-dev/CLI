#!/usr/bin/env node
// =============================================================================
// cli.js — Entry point do Taskr CLI
// =============================================================================

import { program } from 'commander'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

import { registerTaskCommands }    from './commands/task.js'
import { registerProjectCommands } from './commands/project.js'
import { registerReportCommands }  from './commands/report.js'
import { initDatabase }            from './db/database.js'
import { printBanner }             from './utils/ui.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'))

// Inicializa banco de dados antes de qualquer comando
initDatabase()

program
  .name('taskr')
  .description('📋 CLI de gerenciamento de tarefas e projetos')
  .version(pkg.version, '-v, --version', 'Exibe a versão atual')
  .addHelpText('before', printBanner())

registerTaskCommands(program)
registerProjectCommands(program)
registerReportCommands(program)

// Exibe help se nenhum comando for passado
if (process.argv.length === 2) {
  program.help()
}

program.parse(process.argv)
