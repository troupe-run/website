# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Run every quality gate, in order, stopping at the first failure.

Usage: uv run scripts/check.py

The same script runs locally and in CI's `test` job, so the two can't diverge (spec:
quality-check). The development-workflow guard, delivered from troupe-run/infrastructure, runs it
before every commit and quotes its `check: <gate> failed` line. It's Python with no dependencies so
uv can run it without a project environment; the site's own tooling is Node.
"""

import argparse
import importlib.util
import os
import shutil
import subprocess
import sys
import time
from collections.abc import Mapping, Sequence
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def tool(name: str, env: Mapping[str, str]) -> str:
    """Find one of Node's tools on the PATH, or exit saying how to get it."""
    found = shutil.which(name, path=env.get("PATH"))
    if found is None:
        node = (ROOT / ".nvmrc").read_text().strip()
        sys.exit(
            f"check: {name} isn't on the PATH. Fix: install Node {node} or later "
            "(https://nodejs.org), which brings npm and npx."
        )
    return found


def gates(env: Mapping[str, str] = os.environ) -> list[tuple[str, list[str]]]:
    """CI's steps, in CI's order, after the check's own tests (design D2)."""
    npm, npx = tool("npm", env), tool("npx", env)
    chromium = [npx, "playwright", "install", "chromium"]
    if env.get("CI"):
        # The OS libraries Chromium needs. Installing them needs root on Linux, which a CI runner
        # has and a commit hook shouldn't ask for (design D3). Non-empty CI, as playwright.config.ts.
        chromium.append("--with-deps")
    return [
        ("check.py tests", [sys.executable, "-m", "unittest", "discover", "-s", "scripts/tests"]),
        ("npm ci", [npm, "ci"]),
        ("playwright chromium", chromium),
        ("astro check", [npm, "run", "check"]),
        ("unit tests", [npm, "run", "test:unit"]),
        ("build", [npm, "run", "build"]),
        # The site again, against a throwaway troupe with releases, so the versions are tested before troupe has
        # one (spec: quality-check). It's never published.
        ("fixture build", [npm, "run", "build:fixture"]),
        # The fixture site built again on that build's content store, with only the milestones and then only the tags
        # changed, as the deploy builds on a restored cache: /status/ and /protocol/ must follow their sources
        # (spec: quality-check; troupe-run/website#35).
        ("rebuild test", [npm, "run", "test:rebuild"]),
        ("assets verify", [npm, "run", "assets:verify"]),
        ("link check", [npm, "run", "linkcheck"]),
        ("fixture link check", [npm, "run", "linkcheck", "--", "dist-fixture"]),
        ("e2e tests", [npm, "run", "test:e2e"]),
    ]


def activate_git_hooks(root: Path) -> str | None:
    """Turn the repository's git hooks on through the guard, once the guard is here (design D4).

    Git never runs hooks from a fresh clone, so the project's own tooling turns them on. The logic
    lives in scripts/guard.py, which troupe-run/infrastructure delivers; until it arrives, there are
    no hooks to turn on.
    """
    guard_py = root / "scripts" / "guard.py"
    if not guard_py.exists() or not (root / ".git").exists():
        return None  # no guard yet, or not a git checkout (for example, an unpacked archive)
    spec = importlib.util.spec_from_file_location("guard", guard_py)
    assert spec is not None and spec.loader is not None
    guard = importlib.util.module_from_spec(spec)
    # Registered before it runs: the guard's dataclasses look their module up while it loads.
    sys.modules["guard"] = guard
    spec.loader.exec_module(guard)
    notice: str | None = guard.activate_hooks(root)
    return notice


def run_gates(steps: list[tuple[str, list[str]]], cwd: Path) -> int:
    for label, command in steps:
        print(f"==> {label}", flush=True)
        started = time.monotonic()
        result = subprocess.run(command, cwd=cwd, check=False)
        elapsed = time.monotonic() - started
        if result.returncode != 0:
            code = result.returncode
            print(f"check: {label} failed (exit {code}) after {elapsed:.1f}s", flush=True)
            return code
        print(f"    {label} passed in {elapsed:.1f}s", flush=True)
    print("check: all gates passed", flush=True)
    return 0


def main(argv: Sequence[str] | None = None, root: Path = ROOT) -> int:
    # No options: this repository declares no scopes, so the guard never passes --scope (design D4).
    argparse.ArgumentParser(description=(__doc__ or "").split("\n\n")[0]).parse_args(argv)
    steps = gates()
    activated = activate_git_hooks(root)
    if activated is not None:
        print(f"check: {activated}", flush=True)
    return run_gates(steps, root)


if __name__ == "__main__":
    sys.exit(main())
