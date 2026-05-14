#!/usr/bin/env python3
import argparse
import os
import sys

from dotenv import load_dotenv

load_dotenv()

from providers import SUPPORTED_PROVIDERS

EXAMPLE_QUERIES = [
    "Build a Python REST API with FastAPI that manages a todo list with CRUD operations",
    "Research the best practices for securing JWT tokens and implement a Python JWT utility",
    "Create a Python web scraper that extracts product prices from an e-commerce page",
    "Design and implement a rate limiter in Python using the token bucket algorithm",
]

_ENV_KEYS = {
    "groq":      ("GROQ_API_KEY",      "https://console.groq.com/keys"),
    "openai":    ("OPENAI_API_KEY",     "https://platform.openai.com/api-keys"),
    "anthropic": ("ANTHROPIC_API_KEY",  "https://console.anthropic.com/"),
    "claude":    ("ANTHROPIC_API_KEY",  "https://console.anthropic.com/"),
    "google":    ("GOOGLE_API_KEY",     "https://aistudio.google.com/app/apikey"),
    "gemini":    ("GOOGLE_API_KEY",     "https://aistudio.google.com/app/apikey"),
}

# Env vars that select a provider per agent
_AGENT_PROVIDER_VARS = [
    "AI_PROVIDER",
    "MANAGER_PROVIDER",
    "PLANNER_PROVIDER",
    "RESEARCHER_PROVIDER",
    "CODER_PROVIDER",
    "REVIEWER_PROVIDER",
]


def _collect_active_providers(override: str = None) -> set:
    """Return the set of provider names that will actually be used."""
    if override:
        return {override.lower()}
    names = set()
    for var in _AGENT_PROVIDER_VARS:
        val = os.getenv(var)
        if val:
            names.add(val.lower())
    return names or {"groq"}


def check_env(provider_override: str = None) -> bool:
    """Verify that API keys are present for every provider that will be used."""
    providers = _collect_active_providers(provider_override)
    ok = True
    for prov in providers:
        key_name, key_url = _ENV_KEYS.get(prov, ("GROQ_API_KEY", "https://console.groq.com/keys"))
        if not os.getenv(key_name):
            print(
                f"Error: {key_name} is not set (required for provider '{prov}').\n"
                f"Get a key at: {key_url}\n"
                f"Then add to .env: {key_name}=your_key_here"
            )
            ok = False
    return ok


def _provider_summary() -> str:
    """Return a human-readable summary of the active per-agent provider config."""
    default = os.getenv("AI_PROVIDER", "groq")
    agents = {
        "Manager":    os.getenv("MANAGER_PROVIDER",    default),
        "Planner":    os.getenv("PLANNER_PROVIDER",    default),
        "Researcher": os.getenv("RESEARCHER_PROVIDER", default),
        "Coder":      os.getenv("CODER_PROVIDER",      default),
        "Reviewer":   os.getenv("REVIEWER_PROVIDER",   default),
    }
    return "  " + "\n  ".join(f"{agent:<12} → {prov}" for agent, prov in agents.items())


def run_query(query: str, provider_override: str = None, verbose: bool = True) -> str:
    from providers import get_provider
    from agents import ManagerAgent

    if provider_override:
        # Explicit --provider flag: every agent uses the same provider
        prov = get_provider(provider_override)
        manager = ManagerAgent(provider=prov, agent_provider=prov)
    else:
        # Per-agent mode: ManagerAgent reads MANAGER_PROVIDER / *_PROVIDER env vars
        manager = ManagerAgent()

    return manager.orchestrate(query, verbose=verbose)


def interactive_mode(provider_override: str, verbose: bool) -> None:
    print("=" * 60)
    print("  Multi-Agent AI Collaboration System")
    print("=" * 60)
    if provider_override:
        print(f"  Provider: {provider_override.upper()} (all agents)")
    else:
        print("  Per-agent providers:")
        print(_provider_summary())
    print()
    print("Type your query and press Enter. Type 'quit' to exit.")
    print("Type 'examples' to see sample queries.\n")

    while True:
        try:
            query = input("You: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nExiting.")
            break

        if not query:
            continue

        if query.lower() in ("quit", "exit", "q"):
            print("Goodbye!")
            break

        if query.lower() == "examples":
            print("\nExample queries:")
            for i, q in enumerate(EXAMPLE_QUERIES, 1):
                print(f"  {i}. {q}")
            print()
            continue

        print()
        result = run_query(query, provider_override=provider_override, verbose=verbose)
        print("\n" + "=" * 60)
        print("FINAL RESULT:")
        print("=" * 60)
        print(result)
        print("=" * 60 + "\n")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Multi-Agent AI Collaboration System (multi-provider)"
    )
    parser.add_argument(
        "--query", "-q",
        type=str,
        help="Run a single query and exit",
    )
    parser.add_argument(
        "--provider", "-p",
        type=str,
        default=None,
        choices=list(SUPPORTED_PROVIDERS) + ["claude", "gemini"],
        help=(
            "Force all agents to use one provider. "
            "Omit to use per-agent MANAGER_PROVIDER / *_PROVIDER env vars."
        ),
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="Suppress verbose agent activity logs",
    )
    args = parser.parse_args()

    if not check_env(args.provider):
        sys.exit(1)

    verbose = not args.quiet

    if args.query:
        result = run_query(args.query, provider_override=args.provider, verbose=verbose)
        print("\n" + "=" * 60)
        print("RESULT:")
        print("=" * 60)
        print(result)
    else:
        interactive_mode(provider_override=args.provider, verbose=verbose)


if __name__ == "__main__":
    main()
