# VoxForge AI — Voice Agent Studio

VoxForge AI is a no-code Voice AI Agent Builder designed to rapidly describe, compile, test, refine, and deploy autonomous conversational agents powered by ElevenLabs Conversational AI architecture.

The interface features a cinematic holographic dark theme (`#030810`, cyan `#00E5FF`, electric blue `#1677FF`, and teal `#00CDBA`) accompanied by an animated voice field, dimensional orb presence, and audio waveforms.

---

## 🛠 Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19)
- **Language**: TypeScript (Strict type checking)
- **Styling**: Tailwind CSS & PostCSS
- **Aesthetic**: Holographic HUD voice studio (`#030810`, `#00E5FF`, `#1677FF`, `#00CDBA`)
- **Visuals**: Sliced frame atlas (`Frame-idle`, `Frame-ready`, `Frame-listening`, `Frame-processing`, `Frame-speaking`, `Frame-ambient`, `Frame-cinematic`, `Frame-particles`)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Validation**: [Zod](https://zod.dev/)
- **Persistence**: `LocalStorageAgentRepository` with SSR fallback, corrupt record mitigation, and segregated demo data
- **AI Generation Engine**: `AgentGenerationService` with `MockAgentGenerationProvider` (deterministic rule-based generator) and future-ready `GeminiAgentGenerationProvider` (server-side API route `/api/generate-agent`)
- **Package Manager**: npm

---

## 🚀 Getting Started

### Prerequisites

- Node.js `v20+` or `v24+`
- npm `v10+` or `v11+`

### Installation

```bash
# Clone the repository and navigate to workspace
cd VoxForgeAI

# Install dependencies
npm install
```

### Development Server

Start the local Next.js development server:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to open the application shell.

### Available Scripts

| Script | Command | Purpose |
| :--- | :--- | :--- |
| `npm run dev` | `next dev --webpack` | Launches development server on port 3000 |
| `npm run build` | `next build --webpack` | Compiles optimized production bundle |
| `npm run start` | `next start` | Runs built production server |
| `npm run lint` | `eslint` | Performs ESLint static analysis |
| `npm run typecheck` | `tsc --noEmit` | Runs strict TypeScript compiler check |

---

## 🏛 Project Architecture & Structure

```
c:/Projects/VoxForgeAI/
├── public/visuals/frames/         # Sliced visual atlas frames (idle, speaking, cinematic, etc.)
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout with dark theme & Suspense boundary
│   │   ├── globals.css            # Custom CSS tokens & holographic HUD variables
│   │   ├── page.tsx               # Overview dashboard (voice field hero, metrics, recent agents)
│   │   ├── api/
│   │   │   └── generate-agent/
│   │   │       └── route.ts       # Secure server-side agent generation API route
│   │   ├── agents/
│   │   │   ├── page.tsx           # My Agents directory with search, filter, delete, clear demo
│   │   │   └── [id]/
│   │   │       ├── page.tsx       # Agent Details inspector (persona, goals, instructions, steps)
│   │   │       └── edit/
│   │   │           └── page.tsx   # Comprehensive configuration editor with inline Zod validation
│   │   ├── create/
│   │   │   └── page.tsx           # Create Agent studio with natural language generation & review screen
│   │   ├── playground/
│   │   │   └── page.tsx           # Voice Playground console with explicit provider status
│   │   ├── analytics/
│   │   │   └── page.tsx           # Session Intelligence & transcript viewer
│   │   └── settings/
│   │       └── page.tsx           # Studio defaults and provider connection status
│   ├── components/
│   │   ├── visual/
│   │   │   ├── ambient-background.tsx # Ambient canvas background
│   │   │   └── voice-field.tsx        # Multi-state animated holographic voice canvas
│   │   ├── voice/
│   │   │   ├── voice-orb.tsx          # Dimensional luminous voice intelligence orb
│   │   │   └── audio-wave-visualizer.tsx # Dynamic audio waveform bar visualizer
│   │   ├── layout/
│   │   │   ├── app-shell.tsx      # Responsive dashboard container
│   │   │   ├── sidebar.tsx        # Holographic navigation sidebar with active indicators
│   │   │   └── header.tsx         # Top bar with environment telemetry badge
│   │   └── ui/
│   │       ├── badge.tsx          # Status tags (draft, testing, published, archived)
│   │       ├── button.tsx         # Primary, secondary, outline, danger button styles
│   │       ├── card.tsx           # Elevated HUD surface cards
│   │       ├── empty-state.tsx    # Standardized empty states with action CTAs
│   │       └── metric-card.tsx    # Metric KPI cards with demo indicators
│   ├── lib/
│   │   ├── utils.ts               # Class merging utilities (`cn`)
│   │   ├── demo-data.ts           # Explicitly labeled sample agents and sessions
│   │   ├── providers/
│   │   │   ├── agent-generation-provider.ts # MockAgentGenerationProvider & GeminiAgentGenerationProvider
│   │   │   └── voice-provider.ts            # Voice provider abstraction (mock / disconnected)
│   │   ├── services/
│   │   │   └── agent-generation-service.ts  # AgentGenerationService validating input & Zod output
│   │   └── repositories/
│   │       ├── agent-repository.ts          # LocalStorageAgentRepository with Zod validation & SSR safety
│   │       └── session-repository.ts        # In-memory session repository
│   └── types/
│       ├── agent.ts               # Domain types & Zod schemas (Agent, AgentConfig, Guardrails)
│       ├── providers.ts           # AgentRepository, SessionRepository, AgentGenerationProvider, VoiceProvider
│       └── index.ts               # Re-exports
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔒 Security & Data Principles

1. **No Hardcoded Secrets**: Secrets such as `ELEVENLABS_API_KEY` or `GEMINI_API_KEY` are reserved strictly for server-side environment variables and are never surfaced in the browser or saved to localStorage.
2. **Honest State Communication**: In M3, the generator clearly identifies whether it is operating in deterministic rule-based mode or querying the Gemini API. Voice provider explicitly communicates disconnected status until Milestone 4.
3. **Transparent Demo Data**: Demo templates and metrics are segregated in storage, labeled `[DEMO]`, and can be individually cleared or restored without affecting custom user-created agents.
4. **Resilient Local Persistence**: Every agent is validated against `AgentConfigSchema` on synthesis, save, and load; invalid or corrupted items are gracefully skipped, preventing app crashes.

---

## 🗺 Implementation Roadmap

- [x] **M1: Application Foundation** (Complete)
  - Dark SaaS visual system, App Router shell, and responsive sidebar navigation.
  - Domain models with Zod validation (`Agent`, `AgentConfig`, `ConversationSession`).
  - Repository interfaces (`AgentRepository`, `SessionRepository`, `VoiceProvider`).
  - Overview Dashboard, My Agents workspace, Prompt Entry, Voice Console, Analytics, and Settings.
- [x] **M2: Persistent Agent Management & Configuration Editor** (Complete)
  - Browser-local persistence via `LocalStorageAgentRepository` adhering to `AgentRepository`.
  - SSR safety, corrupted payload mitigation, and segregation of demo data.
  - Full CRUD operations with instant persistence across refreshes.
  - Configuration editor (`/agents/[id]/edit`) with live Zod validation for persona, instructions, steps, guardrails, and escalation rules.
  - Agent removal with confirmation modal; clear and restore demo data actions.
- [x] **M3: AI-Powered Agent Generation** (Complete)
  - Natural language prompt description interface on `/create` with quick example domain prompts.
  - `AgentGenerationService` orchestrating input validation, synthesis delegation, and Zod enforcement.
  - Intelligent deterministic `MockAgentGenerationProvider` mapping business domain, persona, goals, workflow steps, safety guardrails, and escalation handoff triggers.
  - Future-ready `GeminiAgentGenerationProvider` with server-side endpoint `/api/generate-agent`.
  - Structured 8-section agent review screen allowing users to inspect, edit, regenerate, discard, or save drafts.
  - Direct integration into existing `LocalStorageAgentRepository` without breaking M2 CRUD workflows.
- [x] **M3.1: Agent Generation Reliability Improvements** (Complete)
  - **Enhanced Mock Generation Quality**: Added deterministic NLP-free parameter parsing for domain, persona, target audience, explicit responsibilities, negative constraints, and escalation policies.
  - **Native Multilingual Support**: Authentically localized welcome greetings, spoken directives, and refusal responses across English (`en-US`), Hindi (`hi-IN`), Spanish (`es-ES`), French (`fr-FR`), German (`de-DE`), and Japanese (`ja-JP`).
  - **Dedicated Safety Guardrails**: Deterministic detection for credentials/passwords/OTPs, medical diagnosis/prescriptions, pricing/discounts, refunds, and confidential records with custom polite refusal responses.
  - **Domain-Specific Conversation Steps**: Tailored 4-stage guided workflows for dental clinics, college placements, tech support, hotel concierges, real estate leasing, and sales outreach.
  - **Provider Architecture & Transparent Fallback**: Clean provider selection (`setProvider`, `getProviderName`) and UI badge clearly displaying engine source (`Rule-Based Mock`, `Real LLM (Gemini 2.5)`, or `Fallback Demo Engine`).
  - **Strict Input Validation**: Zod-validated `/api/generate-agent` endpoint enforcing non-empty trimmed prompts (min 10, max 5000 characters) and returning structured HTTP 400 errors on invalid payloads.
- [x] **M4: Conversational Agent Refinement** (Complete)
  - Dedicated conversational refinement studio at `/agents/[id]/refine`.
  - `AgentRefinementService` and `MockAgentRefinementProvider` supporting targeted natural-language updates.
  - Strict preservation of unrelated fields (e.g. persona updates do not touch guardrails, steps, or goals).
  - Proposed changes review interface with side-by-side field diff inspection before committing.
  - Apply and Reject approval workflow integrating directly with `LocalStorageAgentRepository`.
  - Interactive Undo stack reverting the most recently applied refinement session.
  - Multi-turn conversation history tracking user requests, explanations, and applied status.
- [ ] **M5: ElevenLabs Conversational AI Integration**
  - Bi-directional WebSockets audio streaming.
  - ElevenLabs agent synchronization and remote publishing.
- [ ] **M6: Analytics & Production Hardening**
  - Session replay, turn latencies, sentiment evaluation, and export.
