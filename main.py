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


def check_env(provider: str = "groq") -> bool:
    key_name, key_url = _ENV_KEYS.get(provider.lower(), ("GROQ_API_KEY", "https://console.groq.com/keys"))
    if not os.getenv(key_name):
        print(
            f"Error: {key_name} environment variable is not set.\n"
            f"Get a key at: {key_url}\n"
            f"Then add to .env: {key_name}=your_key_here"
        )
        return False
    return True


def run_query(query: str, provider: str = None, verbose: bool = True) -> str:
    from providers import get_provider
    from agents import ManagerAgent

    prov = get_provider(provider)
    manager = ManagerAgent(provider=prov)
    return manager.orchestrate(query, verbose=verbose)


def interactive_mode(provider: str, verbose: bool) -> None:
    provider_label = provider.upper()
    print("=" * 60)
    print(f"  Multi-Agent AI Collaboration System ({provider_label})")
    print("=" * 60)
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
        result = run_query(query, provider=provider, verbose=verbose)
        print("\n" + "=" * 60)
        print("FINAL RESULT:")
        print("=" * 60)
        print(result)
        print("=" * 60 + "\n")


def main() -> None:
    default_provider = os.getenv("AI_PROVIDER", "groq")

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
        default=default_provider,
        choices=list(SUPPORTED_PROVIDERS) + ["claude", "gemini"],
        help=f"AI provider to use (default: {default_provider})",
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
        result = run_query(args.query, provider=args.provider, verbose=verbose)
        print("\n" + "=" * 60)
        print("RESULT:")
        print("=" * 60)
        print(result)
    else:
        interactive_mode(provider=args.provider, verbose=verbose)


if __name__ == "__main__":
    main()
