# CONTEXT.md

> Seed written from the codebase at setup time. Expand and correct it as the
> domain becomes clearer — consumer rules are in `docs/agents/domain.md`.

## What this is

The day-1 app for the "Deep Search in TypeScript" course (ai-hero): a web app
that performs deep searches — querying an external search API, processing
results, and rendering them — built as a T3 Stack application.

## Stack

- **Framework**: Next.js 15 (App Router, turbopack dev) + React 18 + TypeScript.
- **Database**: PostgreSQL via Drizzle ORM (`drizzle/`, `src/server/`); Docker helper `start-database.sh`.
- **Cache/queues**: Redis via `ioredis` (`start-redis.sh`, `test-redis.js`).
- **Auth**: next-auth v5 (beta) with the Drizzle adapter.
- **Search**: Serper (Google Search API) client in `src/serper.ts`.
- **Rendering**: `react-markdown` + `rehype-raw` for markdown output; `jstoxml`, `robots-parser`, `simple-icons` as search-related utilities.
- **Evals**: `evalite` + `autoevals` on Vitest for LLM evaluation.

## Open questions

- Exact product flow (what a "search session" looks like end to end) — to be documented once implemented.
- How Redis is used concretely (caching vs. job queue vs. rate limiting).
