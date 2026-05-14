# Multi-Agent AI Collaboration System

A multi-agent AI system where specialized agents collaborate to solve complex tasks. Each agent can use a **different AI provider simultaneously** — Groq, OpenAI, Anthropic, and Google.

---

## Overview

This system takes a user query — such as *"Build a FastAPI todo app"* — and routes it through a team of specialized AI agents, each doing a focused job. The agents talk to each other through a shared memory store and a tool-call protocol managed by the Manager.

**What you get as output** is a final synthesized response from the Manager — for coding tasks that means complete, reviewed, copy-paste-ready code with dependencies and usage instructions. For research tasks it is a structured report. For mixed tasks it is both.

### Full flow for a coding task

```text
You type:  "Build a Python REST API with FastAPI"

1. Manager    reads the query and decides on a plan
2. Planner    breaks the task into phases and subtasks
3. Researcher looks up best practices and relevant patterns
4. Manager    stores the research findings in shared memory
5. Coder      reads the plan + research, writes the full implementation
6. Reviewer   checks the code for bugs, security issues, and quality
              ↓ if issues found → Coder rewrites → Reviewer re-checks (up to 3 cycles)
7. Manager    synthesizes everything into a final response

FINAL RESULT:
  - Complete working code (ready to copy and run)
  - Dependencies list
  - Usage / run instructions
  - Reviewer notes
```

### What each agent does

| Agent | What it does | Output |
| --- | --- | --- |
| **Manager** | Orchestrates the team, decides who does what and when | Final synthesized response |
| **Planner** | Breaks the task into phases and subtasks | Structured execution plan |
| **Researcher** | Gathers information and best practices | Research report |
| **Coder** | Writes production-ready code from the plan | Full code implementation |
| **Reviewer** | Reviews code for bugs, security, and quality | APPROVED / CHANGES REQUESTED verdict |

### Shared memory

Agents do not talk directly to each other. Instead the Manager stores intermediate results (research findings, plans, code drafts) in a shared memory store and passes them as context when calling the next agent. This keeps each agent focused and the conversation clean.

---

## Supported Providers

Each agent can be assigned its own provider. You only need API keys for the providers you actually use.

| Provider | Manager Model | Agent Model | API Key |
| --- | --- | --- | --- |
| `groq` (default) | `llama-3.3-70b-versatile` | `llama-3.1-8b-instant` | `GROQ_API_KEY` |
| `openai` | `gpt-4o` | `gpt-4o-mini` | `OPENAI_API_KEY` |
| `anthropic` | `claude-sonnet-4-6` | `claude-haiku-4-5-20251001` | `ANTHROPIC_API_KEY` |
| `google` | `gemini-1.5-pro` | `gemini-1.5-flash` | `GOOGLE_API_KEY` |

Best-fit assignment example:

```text
Manager    → OpenAI    (GPT-4o  — best at reasoning and orchestration)
Planner    → Groq      (Llama   — fast and free)
Researcher → Google    (Gemini  — strong factual recall)
Coder      → Anthropic (Claude  — excellent at writing code)
Reviewer   → Anthropic (Claude  — excellent at reviewing code)
```

---

## Setup

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd Multi-Agent-AI-Collaboration-System-Using-Multi-Provider-
pip install -r requirements.txt
```

### 2. Configure API keys and providers

Edit `.env` — you only need keys for the providers you plan to use:

```env
# Global fallback — used when no per-agent override is set
AI_PROVIDER=groq

# Per-agent overrides (uncomment to activate)
# MANAGER_PROVIDER=openai
# PLANNER_PROVIDER=groq
# RESEARCHER_PROVIDER=google
# CODER_PROVIDER=anthropic
# REVIEWER_PROVIDER=anthropic

# API keys
GROQ_API_KEY=your_groq_key_here
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
GOOGLE_API_KEY=your_google_key_here
```

---

## Changing providers — only edit `.env`

You never need to touch the code. All provider routing is controlled from `.env`.

**Use one provider for all agents:**

```env
AI_PROVIDER=groq
```

```env
AI_PROVIDER=openai
```

**Use a mixed setup — uncomment and set any agent line:**

```env
AI_PROVIDER=groq            # fallback for any agent not listed below

MANAGER_PROVIDER=openai
CODER_PROVIDER=anthropic
REVIEWER_PROVIDER=anthropic
# Planner and Researcher are not set → they fall back to groq
```

**Rules:**

- Any `*_PROVIDER` line that is commented out or missing falls back to `AI_PROVIDER`
- `AI_PROVIDER` itself falls back to `groq` if not set
- Valid values: `groq`, `openai`, `anthropic`, `google`
- Only add API keys for the providers you actually use

Save `.env` and run `python main.py` — the startup banner confirms what each agent will use before any work begins.

---

## Usage

### Interactive mode

```bash
# Uses provider config from .env
python main.py

# Force all agents to use one provider
python main.py --provider openai
python main.py -p anthropic
```

### Single query

```bash
python main.py -q "Build a Python REST API with FastAPI"
python main.py -p google -q "Implement a rate limiter using the token bucket algorithm"
```

### Quiet mode (suppress agent activity logs)

```bash
python main.py --quiet -q "Your query here"
```

When running without `--provider`, the startup banner shows each agent's active provider:

```text
  Multi-Agent AI Collaboration System
  Per-agent providers:
  Manager      → openai
  Planner      → groq
  Researcher   → google
  Coder        → anthropic
  Reviewer     → anthropic
```

Verbose logs also show the provider for every agent call:

```text
[Manager/openai] Starting orchestration...
  [Planner/groq] Planning: ...
  [Coder/anthropic] Implementing: ...
  [Reviewer/anthropic] Reviewing submission...
```

---

## Provider resolution order

For each agent, the provider is resolved in this priority:

1. Explicit param passed to `ManagerAgent()` in code
2. Agent-specific env var (`PLANNER_PROVIDER`, `CODER_PROVIDER`, etc.)
3. `AI_PROVIDER` global fallback
4. Default: `groq`

---

## Using providers in code

```python
from providers import get_provider
from agents import ManagerAgent

# All agents use the same provider
manager = ManagerAgent(provider=get_provider("openai"))

# Per-agent assignment via constructor params
manager = ManagerAgent(
    provider=get_provider("openai"),
    planner_provider=get_provider("groq"),
    researcher_provider=get_provider("google"),
    coder_provider=get_provider("anthropic"),
    reviewer_provider=get_provider("anthropic"),
)

# Per-agent assignment via .env (no code changes needed)
# Set MANAGER_PROVIDER, PLANNER_PROVIDER, etc. in .env, then:
manager = ManagerAgent()

result = manager.orchestrate("Build a FastAPI todo app")
```

---

## Project Structure

```text
├── agents/
│   ├── base_agent.py         # Base class — wraps provider, handles tool loops
│   ├── manager_agent.py      # Orchestrator — per-agent provider resolution
│   ├── planner_agent.py      # Task decomposition
│   ├── research_agent.py     # Information gathering with web search tool
│   ├── coder_agent.py        # Code generation
│   └── reviewer_agent.py     # Code review and QA
├── providers/
│   ├── base_provider.py      # Abstract BaseProvider + unified response types
│   ├── groq_provider.py      # Groq (Llama models)
│   ├── openai_provider.py    # OpenAI (GPT models)
│   ├── anthropic_provider.py # Anthropic (Claude models)
│   ├── google_provider.py    # Google (Gemini via OpenAI-compatible endpoint)
│   └── __init__.py           # get_provider() factory
├── core/
│   └── shared_memory.py      # Thread-safe key-value store for cross-agent context
├── tools/
│   └── search_tool.py        # Web search tool (mock)
├── main.py                   # CLI entry point
├── requirements.txt
└── .env
```

---

## Docker

```bash
docker-compose up --build
```

Set your API keys and provider config in `.env` before running.

---

## Requirements

- Python 3.10+
- `groq>=1.2.0`
- `openai>=1.0.0`
- `anthropic>=0.25.0`
- `python-dotenv>=1.0.0`
