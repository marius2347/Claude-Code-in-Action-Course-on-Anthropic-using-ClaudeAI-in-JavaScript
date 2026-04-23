# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Code Style

Use comments sparingly. Only comment complex code.

## Database

The database schema is defined in `prisma/schema.prisma`. Reference it anytime you need to understand the structure of data stored in the database.

## Project Overview

**UIGen** — an AI-powered React component generator with live preview. Users describe components in chat; Claude generates JSX/TSX files into a virtual file system; a sandboxed iframe renders them in real-time.

## Commands

```bash
# Initial setup (install deps + Prisma generate + migrate)
npm run setup

# Development server
npm run dev

# Run all tests
npx vitest

# Run a single test file
npx vitest src/components/editor/__tests__/file-tree.test.tsx

# Run tests in watch mode
npx vitest --watch

# Prisma commands
npx prisma migrate dev     # create/apply migrations
npx prisma generate        # regenerate client after schema changes
npx prisma studio          # GUI for the database
```

## Architecture

### Data Flow

1. User sends a message → `POST /api/chat` (`src/app/api/chat/route.ts`)
2. The API reconstructs a `VirtualFileSystem` from serialized client state, calls Claude (or mock) via Vercel AI SDK with two tools: `str_replace_editor` and `file_manager`
3. Claude streams back tool calls that mutate the VFS (create/edit/rename/delete files)
4. On stream finish, the full conversation + VFS state is persisted to the `Project` row in SQLite (authenticated users only)
5. Client-side `FileSystemContext` (`src/lib/contexts/file-system-context.tsx`) holds the live VFS and triggers a `refreshTrigger` counter whenever files change
6. `PreviewFrame` (`src/components/preview/PreviewFrame.tsx`) reacts to `refreshTrigger`, runs the JSX transformer, and writes new `srcdoc` into a sandboxed `<iframe>`

### Virtual File System

`VirtualFileSystem` (`src/lib/file-system.ts`) is an in-memory tree of `FileNode` objects (files + directories). It never touches the real disk. It serializes to/from plain `Record<string, FileNode>` for JSON transport and DB storage. A module-level singleton (`export const fileSystem`) is used for other utilities; the API route always creates a fresh instance per request.

### Preview Pipeline

`createImportMap` + `createPreviewHTML` (`src/lib/transform/jsx-transformer.ts`):
- Transforms every `.jsx/.tsx/.js/.ts` in the VFS with **Babel standalone** (automatic JSX runtime)
- Converts each transformed file into a Blob URL
- Builds an [import map](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap) so local `@/` aliases and relative imports resolve to those blob URLs
- Third-party npm packages are mapped to `https://esm.sh/<package>`
- The HTML shell loads React 19 from esm.sh and mounts the entry point (`/App.jsx` by default) via `ReactDOM.createRoot`
- Syntax errors are shown inline in the preview panel rather than crashing

### AI / Provider

`getLanguageModel()` (`src/lib/provider.ts`) returns:
- **Real**: `claude-haiku-4-5` via `@ai-sdk/anthropic` when `ANTHROPIC_API_KEY` is set
- **Mock**: `MockLanguageModel` (a hand-coded `LanguageModelV1` implementation) that generates a fixed counter/card/form component sequence — used when no API key is present

The system prompt (`src/lib/prompts/generation.tsx`) instructs Claude to always create `/App.jsx` first, use Tailwind CSS for styling, and use `@/` import aliases for local files.

### Auth

Cookie-based JWT auth via `jose` (`src/lib/auth.ts`). No third-party auth library. Sessions expire in 7 days. Passwords are stored hashed (see `src/actions/`). Anonymous users can use the app freely; their work is saved in `sessionStorage` (`src/lib/anon-work-tracker.ts`) and can be claimed on sign-up.

### Database

Prisma + SQLite (`prisma/dev.db`). Two models:
- `User` — email + hashed password
- `Project` — stores `messages` (JSON array) and `data` (serialized VFS as JSON) as text columns

The Prisma client is generated into `src/generated/prisma/` (not the default location).

### Key Contexts

- `FileSystemContext` — owns the VFS instance, exposes CRUD helpers and `refreshTrigger`
- `ChatContext` — owns message history, streams from `/api/chat`, applies incoming tool-call file mutations back to `FileSystemContext`

### UI Structure

`MainContent` (`src/app/main-content.tsx`) is the root client component. It composes:
- Left panel: `ChatInterface` (message list + input)
- Right panel: tabbed `PreviewFrame` / `CodeEditor` + `FileTree`
- Header: `HeaderActions` (auth, export, project switching)

UI components are shadcn/ui (`src/components/ui/`).
