# StoryMaster SAAS Platform: End-to-End Plan

This document outlines a practical, end-to-end plan to convert the BMAD creative-writing expansion pack into a multi-tenant SaaS product where users can draft, iterate, and publish stories using BMAD “agents” (writers’ room, editor, plot generator, etc.).

## 1. Core Idea / Product Concept

A web app where writers sign up, create a “Story Project” and interact with BMAD agents via conversational UI + structured editors. Each Story Project stores a BMAD story file (structured .md) that preserves agent context, revision history, and artifacts (characters, plot beats, scene drafts). Agents (plot generator, continuity agent, tone editor, etc.) are orchestrated server-side using BMAD workflows.

## 2. High-level Architecture (Components)

*   **Frontend (SPA):** React + Tailwind (or your preferred framework). Pages: Dashboard, Project editor (story view + scene editor), Writers’ room (chat with agents), Assets (characters/location sheets), Publish/Export.
*   **API Layer:** REST/GraphQL endpoints for projects, users, billing, webhooks.
*   **Orchestration Service (BMAD engine):** Server-side service that runs BMAD workflows/agents (maps to the repo’s agent definitions and templates), calls LLM provider(s), maintains conversation state and story-file generation.
*   **LLM Provider(s):** OpenAI, Anthropic, etc. (pluggable) with rate-limited calls and provider-fallback.
*   **Storage:** DB for structured data (Postgres), object store for attachments/exports (S3), and versioned story file store.
*   **Auth & Billing:** OAuth/sign-in, subscription management (Stripe).
*   **Worker Queue:** Background workers for long-running tasks (batch editing, export, compile/publish).
*   **Analytics & Telemetry:** Usage, tokens, agent performance.

## 3. Key Product Features (MVP vs Later)

### MVP (Launchable):

*   Sign-up + subscription (free tier + paid).
*   Create Project / Story (uses BMAD story file template).
*   Writers’ room chat UI (converse with single “Master Writing Agent” that delegates to subagents like plot/character/editor).
*   Scene editor with versioned drafts and “Apply Agent Suggestions” button.
*   Character & World sheets auto-generated from story.
*   Export to Markdown / EPUB / PDF.
*   Usage dashboard (token usage / activity).

### Later:

*   Multi-user collaboration (real-time cursors).
*   Team workspaces + roles.
*   Marketplace of expansion packs / paid persona agents.
*   Git-style branching/merging for stories.
*   Built-in publication/publishing APIs.

## 4. How BMAD Maps into SaaS Runtime

*   **Agents as micro-workflows:** Treat the BMAD agent files as templates that your Orchestration Service loads and executes. Each user action (e.g., “improve tone of scene”) triggers a workflow that runs the relevant agents, composes prompts, calls the LLM, and returns structured output stored in the story file.
*   **Story File System:** Persist story files in versioned form (e.g. {epic}.{story}.{title}.md) so agents always have the complete context to avoid context loss between calls. This matches BMAD’s recommended approach.

## 5. Data Model (Core Entities)

*   **User** (id, email, plan, roles)
*   **Organization/Team** (optional)
*   **Project** (id, title, visibility, owner_id)
*   **StoryFile** (project_id, filename, content_markdown, version_id, metadata)
*   **Scene** (storyfile_id, order, text, draft_versions)
*   **AgentSession** (storyfile_id, agent_type, inputs, outputs, LLM_metadata) — important for audit + replay
*   **Asset** (character, location) — auto-extracted and editable
*   **BillingRecord / Usage** (tokens used, cost per call)

## 6. LLM Orchestration & Cost Control

*   Prompt templates come from BMAD agent files; instrument them to measure prompt + completion tokens per call.
*   **Caching:** Cache repeated agent outputs for identical inputs to reduce cost.
*   **Cost-aware features:** Let users choose “fast (cheaper)” vs “high-quality (costlier)” models for a given operation.
*   **Provider abstraction:** Create a small provider interface to swap providers and implement batching/fan-out for multi-agent runs.

## 7. Security, Compliance, and Safety

*   **Prompt injection / sandboxing:** Never execute raw code or system commands from agent output. Validate and sanitize any agent-generated markup before rendering or executing.
*   **User data privacy:** Allow account-level data retention and export. Implement encryption at rest for sensitive storage.
*   **Copyright & content policy:** Add TOS and content-moderation — clearly state who owns generated text (your policy). Consider optional user opt-in to let anonymized content be used to improve models.
*   **Rate limits & abuse detection:** Per-user and per-org quotas.

## 8. MVP Roadmap (Milestones)

*   **Milestone A:** Core backend + BMAD orchestration service that can load an expansion-pack agent and execute a prompt -> LLM call -> produce structured output.
*   **Milestone B:** Authentication, Projects, Story File storage + editor UI, simple Writers’ Room chat.
*   **Milestone C:** Billing + usage tracking, export formats, basic analytics.
*   **Milestone D:** Multi-user collaboration, marketplace for expansion packs, advanced editor features.

## 9. Tech Stack Suggestions

*   **Frontend:** React + Tailwind (or Next.js if you want SSR).
*   **Backend:** Node.js/TypeScript (Express/Nest) or Python (FastAPI).
*   **Orchestration:** Lightweight service (worker + message broker — RabbitMQ or Redis Queue).
*   **DB:** Postgres (JSONB for flexible agent outputs).
*   **Object store:** S3-compatible.
*   **Auth/Billing:** Auth0 or NextAuth + Stripe.
*   **Deploy:** Docker + Kubernetes or managed services (Vercel + Heroku/Railway + managed DB) depending on scale.

## 10. Pricing / Monetization Ideas

*   **Freemium:** Small monthly free token allotment + watermarked exports.
*   **Per-use credits:** Buy tokens for heavy LLM runs (e.g., long full-book rewrites).
*   **Subscription tiers:** Personal, pro (higher token incl.), team (multi-seat).
*   **Marketplace revenue share:** Third-party premium expansion packs (split revenue).

## 11. Operational Costs & Monitoring

*   Track token usage by feature and model. Expose cost per action to admins so you don’t blow budget on agent orchestration.
*   Monitor model latency, failure rates, and user feedback loops so you can tune agent prompts and fallbacks.

## 12. Legal & Licensing

*   Verify any license terms for BMAD code and templates in the repo before using them in a commercial product.
*   Add a clear copyright clause in your TOS about whether the user or the platform owns AI-generated content.

## 13. Implementation Checklist (Concrete Tasks)

1.  Clone BMAD repo and extract creative-writing expansion pack agent files and templates.
2.  Implement provider abstraction (OpenAI, Anthropic).
3.  Build Orchestration Service that loads agent templates and executes them.
4.  Build story-file store with versioning.
5.  Build React UI: Dashboard, Story Editor, Writers’ Room.
6.  Add auth + Stripe billing.
7.  Add monitoring, token accounting, and admin dashboard.
8.  Run internal beta and tune agent prompts for consistent outputs.