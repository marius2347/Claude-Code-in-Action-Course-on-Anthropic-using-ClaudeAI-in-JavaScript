# UIGen — AI-Powered React Component Generator

> Built as part of the **Claude Code in Action** course by Anthropic Academy.

UIGen lets users describe React components in natural language through a chat interface. Claude AI generates JSX/TSX code into a virtual file system, and a sandboxed iframe renders the result in real-time. Users can iterate with the AI, edit code directly in a Monaco editor, and export their components.

![Initial State](initial-state.png)

---

## Features

- **AI-Powered Generation** — Describe a component in plain English and Claude builds it with Tailwind CSS
- **Live Preview** — Sandboxed iframe renders components instantly using in-browser Babel transforms
- **Code Editor** — Monaco editor with syntax highlighting and a file tree for navigation
- **Virtual File System** — All generated files live in memory (never written to disk), serialized as JSON in the database
- **Authentication** — JWT-based cookie sessions, bcrypt password hashing, anonymous mode with browser persistence
- **Project Persistence** — Authenticated users save full chat history + file system state to the database

![Generated Component](generated-component.png)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| UI | React 19 + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui (Radix primitives) |
| Database | Prisma + SQLite |
| AI / LLM | Anthropic Claude via Vercel AI SDK (`@ai-sdk/anthropic`) |
| Code Transform | Babel standalone (in-browser JSX compilation) |
| Code Editor | Monaco Editor (`@monaco-editor/react`) |
| Auth | JWT (jose) + bcrypt |
| Testing | Vitest + React Testing Library |

---

## Architecture

```
Left Panel (35%)                Right Panel (65%)
┌─────────────────┐   ↔   ┌──────────────────────────┐
│  Chat Interface  │       │  Preview  │  Code View    │
│  (AI messages)   │       │  (live)   │  (file tree   │
│                  │       │           │   + editor)    │
└─────────────────┘       └──────────────────────────┘
```

### Data Flow

```
User Chat Input
    ↓
POST /api/chat (streaming)
    ↓
Claude AI + Tools (str_replace_editor, file_manager)
    ↓
Virtual File System mutated
    ↓
Client receives stream → PreviewFrame transforms JSX → iframe renders
    ↓
(If authenticated) saved to Project in database
```

![Code View](code-view.png)

---

## Key Files

| File | Role |
|------|------|
| `src/app/api/chat/route.ts` | Streams AI responses, provides tools to Claude |
| `src/lib/file-system.ts` | Virtual file system — all generated files live in memory |
| `src/lib/tools/str-replace.ts` | Tool that lets Claude do surgical edits to files |
| `src/lib/tools/file-manager.ts` | Tool that lets Claude create/delete/rename files |
| `src/lib/prompts/generation.tsx` | System prompt for component generation |
| `src/components/preview/PreviewFrame.tsx` | Live preview rendering |
| `src/lib/contexts/file-system-context.tsx` | React context sharing VFS across components |
| `src/lib/contexts/chat-context.tsx` | Chat state management |
| `src/middleware.ts` | JWT session verification on protected routes |

---

## Database Schema

Two models in Prisma (SQLite):

```prisma
model User {
  id        String    @id @default(cuid())
  email     String    @unique
  password  String    // bcrypt hashed
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  projects  Project[]
}

model Project {
  id        String   @id @default(cuid())
  name      String
  userId    String?
  messages  String   @default("[]")  // JSON chat messages
  data      String   @default("{}")  // JSON virtual file system
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User?    @relation(fields: [userId], references: [id])
}
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Setup

1. **Optional** — Add your Anthropic API key in `.env`:

   ```
   ANTHROPIC_API_KEY=your-api-key-here
   ```

   The project runs without an API key (static code is returned instead of LLM-generated components).

2. Install dependencies and initialize the database:

   ```bash
   npm run setup
   ```

   This will install all dependencies, generate the Prisma client, and run database migrations.

3. Start the dev server:

   ```bash
   npm run dev
   ```

   Open `http://localhost:3000`.

### Usage

1. Sign up or continue as an anonymous user
2. Describe the React component you want in the chat
3. View generated components in the real-time preview
4. Switch to **Code** view to see and edit the generated files
5. Continue iterating with the AI to refine your components

---

## Claude Code Features Demonstrated

This project was built using **Claude Code** and demonstrates several course topics:

### CLAUDE.md for Context Management

Claude Code uses the `CLAUDE.md` file to understand the project structure, tech stack, and conventions — ensuring consistent, high-quality code generation across sessions.

![Database Schema Context](../database_schema.png)

### Custom Commands

Custom slash commands automate repetitive workflows. For example, the `/audit` command runs vulnerability checks and applies fixes automatically:

![Audit Command](../audit_command.png)

### Using `/init` and Describing the Project

The `/init` command bootstraps a `CLAUDE.md` with project context. Claude can then describe the full architecture:

![Describe the Project](../describe_the_project.png)

### Querying the Codebase

Claude reads the Prisma schema to answer questions about the data model directly:

![Attributes Query](../attributes.png)

### Claude Code Interface & Plugins

The Claude Code terminal interface with plugin discovery and model selection:

![Claude Interface](../claude_intefface.png)
![Claude Prompt](../claude_prompt.png)

### Tool System

Claude Code exposes standard and deferred tools for file manipulation, command execution, and code analysis:

![Tools](../hooks.png)

---

## Course Reference

**Claude Code in Action** — Anthropic Academy

Topics covered: core tools, context management (`/init`, `CLAUDE.md`), conversation flow, Plan Mode, Thinking Mode, custom commands, MCP servers, GitHub integration, and hooks.

---

## Contact

**GitHub:** https://github.com/marius2347

**Email:** mariusc0023@gmail.com
