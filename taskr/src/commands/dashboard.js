import { exec } from 'child_process'
import ora from 'ora'
import chalk from 'chalk'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export function registerDashboardCommands(program) {
  program
    .command('dashboard')
    .description('🚀 Launch the Taskr Pro Web Dashboard')
    .action(async () => {
      const spinner = ora('Starting Taskr Pro Services...').start()
      
      // Start the server in the background
      const serverPath = join(__dirname, '../server.js')
      const server = exec(`node ${serverPath}`, (error) => {
        if (error) {
          spinner.fail(`Failed to start API server: ${error.message}`)
        }
      })

      // Wait a bit for the server to start
      setTimeout(() => {
        spinner.succeed('Taskr API Server is running at http://localhost:3000')
        console.log(chalk.cyan('\n  Note: You can access the UI at http://localhost:5173 after starting the web dev server.'))
        console.log(chalk.dim('  (Run "cd taskr-web && npm run dev" to start the frontend)\n'))
        
        // In a real production tool, we'd bundle the frontend and serve it from the Express server.
        // For this reform, we'll keep them separate for development clarity.
      }, 2000)
    })
}
