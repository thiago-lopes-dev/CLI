# 📋 Taskr Pro v2.0

> A professional, high-performance CLI & Web Dashboard for task management.

Taskr has been completely reformed to provide a premium productivity experience. Now featuring a robust CLI and a stunning Web Dashboard to visualize your progress.

![Taskr Banner](https://img.shields.io/badge/Taskr-Pro_v2.0-blue?style=for-the-badge&logo=task)

## ✨ Features

-   **Professional CLI**: Command-line interface built for speed and efficiency.
-   **Modern Web Dashboard**: Real-time visualization of your tasks and projects.
-   **Local SQLite Storage**: Your data stays on your machine.
-   **Secure by Design**: Environment variable support and protected sensitive data.
-   **Rich Aesthetics**: Vibrant colors, progress bars, and high-end terminal UI.

## 🚀 Quick Start

### Installation

```bash
cd taskr
npm install
npm link # To use the 'taskr' command globally
```

### CLI Usage

```bash
taskr --help
taskr task list
taskr project list
```

### Web Dashboard

To launch the web dashboard:

1.  Start the API server:
    ```bash
    npm run server
    ```
2.  Start the frontend:
    ```bash
    cd taskr-web
    npm run dev
    ```

## 🔒 Security & Data Protection

-   **Environment Variables**: Use `.env` (see `.env.example`) to configure sensitive settings.
-   **Data Location**: Database is stored in `~/.taskr/taskr.db` by default, outside the git repository.
-   **Git Security**: Pre-configured `.gitignore` ensures no sensitive data is leaked.

## 🛠️ Tech Stack

-   **Core**: Node.js, Better-SQLite3
-   **CLI UI**: Commander.js, Chalk, Inquirer, Ora, cli-table3
-   **Web UI**: React, Vite, CSS Modules
-   **API**: Express, CORS, Dotenv

---

Built with ❤️ for productivity.
