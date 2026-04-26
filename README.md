# 📋 Taskr — CLI & Web Dashboard de Gerenciamento de Tarefas

Ferramenta profissional para gerenciar tarefas e projetos diretamente no terminal ou através de um dashboard web moderno.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)
![SQLite](https://img.shields.io/badge/Database-SQLite-003B57?logo=sqlite)
![React](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## ✨ Funcionalidades

- ✅ Criar, listar, editar e remover tarefas
- 📁 Organizar tarefas em projetos
- 🎯 Prioridades: `low`, `medium`, `high`, `urgent`
- 🔄 Status: `todo`, `doing`, `done`, `cancelled`
- 🏷️ Tags para categorização
- 📅 Datas de entrega com alertas visuais
- 📊 Relatórios: hoje, semana, atrasadas, resumo geral
- 💾 Banco SQLite local (`~/.taskr/taskr.db`)
- 🎨 Output colorido e bem formatado no terminal
- 🌐 **Web Dashboard** interativo (React + Vite)
- 🚀 **API Server** integrado para acesso remoto

---

## 🚀 Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/ruok-dev/CLI.git
cd CLI/taskr

# 2. Instale as dependências do CLI/Server
npm install

# 3. Instale globalmente (opcional)
npm install -g .

# 4. Instale as dependências do Web Dashboard
cd taskr-web
npm install
```

---

## 📖 Uso

### Tarefas

```bash
# Adicionar tarefa
taskr task add "Estudar Node.js"
taskr task add "Deploy em produção" --priority urgent --due amanhã --project backend
taskr task add -i   # modo interativo com prompts

# Listar tarefas
taskr task list                        # apenas ativas (todo + doing)
taskr task list --all                  # todas incluindo done/cancelled
taskr task list --status doing         # filtrar por status
taskr task list --priority high        # filtrar por prioridade
taskr task list --project backend      # filtrar por projeto
taskr task list --tag bug              # filtrar por tag
taskr task list --search "deploy"      # buscar por título
taskr task list --sort due_date --asc  # ordenar por data de entrega

# Ver detalhes de uma tarefa
taskr task show 5

# Mudar status
taskr task start 5    # → doing
taskr task done 5     # → done

# Editar (modo interativo)
taskr task edit 5

# Remover
taskr task rm 5
taskr task rm 5 --force  # sem confirmação

# Estatísticas
taskr task stats
```

### Dashboard & API

```bash
# Iniciar o servidor API
npm run server

# Iniciar o dashboard web (em outra aba)
cd taskr-web
npm run dev
```

---

## 📅 Formatos de Data

| Input         | Significado            |
|---------------|------------------------|
| `hoje`        | Data atual             |
| `amanhã`      | Amanhã                 |
| `depois`      | Depois de amanhã       |
| `+7`          | Daqui a 7 dias         |
| `31/12/2025`  | Formato brasileiro     |
| `2025-12-31`  | Formato ISO            |

---

## 📁 Estrutura do Projeto

```
taskr/
├── src/
│   ├── cli.js                  # Entry point do CLI
│   ├── server.js               # Servidor Express API
│   ├── commands/
│   │   ├── task.js             # Comandos de tarefas
│   │   ├── project.js          # Comandos de projetos
│   │   ├── report.js           # Relatórios
│   │   └── dashboard.js        # Controle do Dashboard
│   ├── db/
│   │   ├── database.js         # Inicialização + migrations SQLite
│   │   ├── taskRepository.js   # CRUD de tarefas
│   │   └── projectRepository.js# CRUD de projetos
│   └── utils/
│       ├── ui.js               # Output, tabelas, cores
│       ├── date.js             # Helpers de data
│       └── constants.js        # Constantes globais
├── taskr-web/                  # Dashboard Web (React)
├── test/                       # Testes unitários
├── .env.example                # Exemplo de variáveis de ambiente
├── .gitignore                  # Arquivos ignorados pelo Git
├── package.json
└── README.md
```

---

## 🧪 Testes

```bash
npm test              # Executa os testes
npm run test:coverage # Com relatório de cobertura
```

---

## 💡 Próximas Melhorias

- [ ] Exportar tarefas para CSV/JSON
- [ ] Notificações via `notify-send` (Linux)
- [ ] Sincronização com Google Tasks / Notion
- [ ] Modo Kanban no terminal (com `blessed`)
- [ ] Aliases customizáveis pelo usuário
- [ ] Importar tarefas de arquivo Markdown
