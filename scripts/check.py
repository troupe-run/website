# /// script
# requires-python = ">=3.12"
# dependencies = ["lizard==1.26.1"]
# ///
"""Run every quality gate, in order, stopping at the first failure.

Usage: uv run scripts/check.py [--base REV]

The same script runs locally and in CI's `test` job, so the two can't diverge (spec:
quality-check). The development-workflow guard, delivered from troupe-run/infrastructure, runs it
before every commit and quotes its `check: <gate> failed` line. It's Python whose one dependency,
lizard, uv installs for the script itself, so uv runs it without a project environment; the site's
own tooling is Node.

Every run measures the complexity of the functions, and the size of the files, the work adds or
edits since --base, or since where it left origin/main. The dependency audit runs only in CI's test job, which sets
QUALITY_GATES_LEG=true; never locally. website measures no coverage: only the repositories
troupe-run/infrastructure names do (owner, 2026-11-18, infrastructure#332). The measures are
scripts/quality_gates.py, delivered from troupe-run/infrastructure.
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


LEG = "QUALITY_GATES_LEG"
"""Set to `true` by CI's test job, under GitHub Actions only, to run the dependency audit
(quality-gates design D4)."""

QUALITY_GATES = str(ROOT / "scripts" / "quality_gates.py")


def on_leg(env: Mapping[str, str]) -> bool:
    """Whether this run is CI's audit leg. Set anywhere else, or to anything but `true`, the
    variable stops the check: the audit needs the network and runs in CI only."""
    value = env.get(LEG, "")
    if value == "":
        return False
    if value != "true":
        sys.exit(f"check: {LEG}={value!r} isn't valid. Fix: unset it; CI's test job sets it to true.")
    if env.get("GITHUB_ACTIONS") != "true":
        sys.exit(
            f"check: {LEG} is set, but this isn't GitHub Actions. The dependency audit runs in "
            f"CI's test job only (quality-gates design D4). Fix: unset {LEG}."
        )
    return True


def gates(
    env: Mapping[str, str] = os.environ, base: str | None = None
) -> list[tuple[str, list[str]]]:
    """CI's steps, in CI's order, after the check's own tests (design D2), with the quality gates:
    complexity and size first, and the audit after the unit tests on CI's leg only."""
    npm, npx = tool("npm", env), tool("npx", env)
    on_base = ["--base", base] if base else []
    audit = [("audit", [sys.executable, QUALITY_GATES, "audit", *on_base])] if on_leg(env) else []
    chromium = [npx, "playwright", "install", "chromium"]
    if env.get("CI"):
        # The OS libraries Chromium needs. Installing them needs root on Linux, which a CI runner
        # has and a commit hook shouldn't ask for (design D3). Non-empty CI, as playwright.config.ts.
        chromium.append("--with-deps")
    return [
        ("check.py tests", [sys.executable, "-m", "unittest", "discover", "-s", "scripts/tests"]),
        # Needs only git and lizard, so it runs before anything is installed (spec: quality-check).
        ("complexity", [sys.executable, QUALITY_GATES, "complexity", *on_base]),
        # The size of each file the work adds or changes; like complexity, it needs only git, so it runs before
        # anything is installed (spec: quality-check; troupe-run/website#149).
        ("size", [sys.executable, QUALITY_GATES, "size", *on_base]),
        ("npm ci", [npm, "ci"]),
        # ESLint and Prettier need only what npm ci installed, so they fail fast, before Chromium's
        # download (spec: quality-check; lint-gates design D1).
        ("eslint", [npm, "run", "lint"]),
        ("prettier", [npm, "run", "format:check"]),
        ("playwright chromium", chromium),
        ("astro check", [npm, "run", "check"]),
        # tsc reads the types astro check generates (.astro/), so it runs after it (design D1, D4).
        ("tsc", [npm, "run", "typecheck"]),
        ("unit tests", [npm, "run", "test:unit"]),
        *audit,
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
    # One option, --base, for the quality gates; this repository declares no scopes, so the guard
    # never passes --scope (design D4).
    parser = argparse.ArgumentParser(description=(__doc__ or "").split("\n\n")[0])
    parser.add_argument("--base", help="the commit the complexity and audit gates compare with")
    args = parser.parse_args(argv)
    steps = gates(base=args.base)
    activated = activate_git_hooks(root)
    if activated is not None:
        print(f"check: {activated}", flush=True)
    return run_gates(steps, root)


if __name__ == "__main__":
    sys.exit(main())
