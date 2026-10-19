"""Tests for scripts/check.py (spec: quality-check; design D10).

Standard library only, like check.py itself. check.py runs them as its first gate:
uv run --no-project python -m unittest discover -s scripts/tests
"""

import contextlib
import io
import os
import re
import stat
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))
import check  # noqa: E402

LABELS = [
    "check.py tests",
    "npm ci",
    "playwright chromium",
    "astro check",
    "unit tests",
    "build",
    "fixture build",
    "assets verify",
    "link check",
    "fixture link check",
    "e2e tests",
]


def fake_tools(directory: Path, names: tuple[str, ...] = ("npm", "npx")) -> str:
    """Executables named like Node's tools, so gates() can resolve them without running them."""
    for name in names:
        tool = directory / name
        tool.write_text("#!/bin/sh\nexit 0\n")
        tool.chmod(tool.stat().st_mode | stat.S_IXUSR)
    return str(directory)


def python(code: str) -> list[str]:
    return [sys.executable, "-c", code]


class Gates(unittest.TestCase):
    def setUp(self) -> None:
        self.bin = Path(self.enterContext(tempfile.TemporaryDirectory()))

    def gates(self, env: dict[str, str]) -> list[tuple[str, list[str]]]:
        return check.gates(env={"PATH": fake_tools(self.bin), **env})

    def test_the_gates_are_ci_s_steps_in_ci_s_order_after_the_check_s_own_tests(self) -> None:
        steps = self.gates({})
        self.assertEqual([label for label, _ in steps], LABELS)
        npm, npx = str(self.bin / "npm"), str(self.bin / "npx")
        commands = dict(steps)
        self.assertEqual(
            commands["check.py tests"],
            [sys.executable, "-m", "unittest", "discover", "-s", "scripts/tests"],
        )
        self.assertEqual(commands["npm ci"], [npm, "ci"])
        self.assertEqual(commands["playwright chromium"], [npx, "playwright", "install", "chromium"])
        self.assertEqual(commands["astro check"], [npm, "run", "check"])
        self.assertEqual(commands["unit tests"], [npm, "run", "test:unit"])
        self.assertEqual(commands["build"], [npm, "run", "build"])
        self.assertEqual(commands["assets verify"], [npm, "run", "assets:verify"])
        self.assertEqual(commands["fixture build"], [npm, "run", "build:fixture"])
        self.assertEqual(commands["link check"], [npm, "run", "linkcheck"])
        self.assertEqual(commands["fixture link check"], [npm, "run", "linkcheck", "--", "dist-fixture"])
        self.assertEqual(commands["e2e tests"], [npm, "run", "test:e2e"])

    def test_chromium_s_os_packages_are_installed_only_when_ci_is_set(self) -> None:
        self.assertNotIn("--with-deps", dict(self.gates({}))["playwright chromium"])
        self.assertNotIn("--with-deps", dict(self.gates({"CI": ""}))["playwright chromium"])
        self.assertIn("--with-deps", dict(self.gates({"CI": "true"}))["playwright chromium"])

    def test_a_missing_tool_exits_naming_it_and_how_to_install_node(self) -> None:
        for missing in ("npm", "npx"):
            present = tuple(name for name in ("npm", "npx") if name != missing)
            with self.subTest(missing=missing), tempfile.TemporaryDirectory() as empty:
                with self.assertRaises(SystemExit) as raised:
                    check.gates(env={"PATH": fake_tools(Path(empty), present)})
                message = str(raised.exception.code)
                self.assertTrue(message.startswith(f"check: {missing} isn't on the PATH."), message)
                self.assertIn((ROOT / ".nvmrc").read_text().strip(), message)
                self.assertIn("https://nodejs.org", message)


class RunGates(unittest.TestCase):
    def run_gates(self, steps: list[tuple[str, list[str]]]) -> tuple[int, list[str]]:
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            code = check.run_gates(steps, ROOT)
        return code, out.getvalue().splitlines()

    def test_every_gate_runs_in_order_and_is_reported_passed_with_its_time(self) -> None:
        code, lines = self.run_gates([("first", python("pass")), ("second", python("pass"))])
        self.assertEqual(code, 0)
        self.assertEqual(lines[0], "==> first")
        self.assertRegex(lines[1], r"^    first passed in \d+\.\ds$")
        self.assertEqual(lines[2], "==> second")
        self.assertRegex(lines[3], r"^    second passed in \d+\.\ds$")
        self.assertEqual(lines[-1], "check: all gates passed")

    def test_a_failing_gate_stops_the_run_and_its_exit_code_is_the_check_s(self) -> None:
        with tempfile.TemporaryDirectory() as scratch:
            marker = Path(scratch) / "later-ran"
            code, lines = self.run_gates(
                [
                    ("first", python("pass")),
                    ("unit tests", python("raise SystemExit(3)")),
                    ("later", python(f"open({str(marker)!r}, 'w').close()")),
                ]
            )
            self.assertFalse(marker.exists(), "a gate after the failure ran")
        self.assertEqual(code, 3)
        self.assertRegex(lines[-1], r"^check: unit tests failed \(exit 3\) after \d+\.\ds$")


class Arguments(unittest.TestCase):
    def test_any_argument_is_a_usage_error_before_any_gate_runs(self) -> None:
        for argv in (["--scope", "docs"], ["docs"]):
            with (
                self.subTest(argv=argv),
                mock.patch.object(check, "run_gates") as run_gates,
                mock.patch.object(check, "gates") as gates,
                contextlib.redirect_stderr(io.StringIO()) as err,
                self.assertRaises(SystemExit) as raised,
            ):
                check.main(argv)
            self.assertEqual(raised.exception.code, 2)
            self.assertIn("usage:", err.getvalue())
            run_gates.assert_not_called()
            gates.assert_not_called()


# The real guard defines dataclasses at import, which needs the module in sys.modules while it
# loads; the stand-in does too, so a loader that skips that fails here and not on delivery day.
STAND_IN_GUARD = """\
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

@dataclass(frozen=True)
class Decision:
    rule: str

def activate_hooks(root):
    (Path(root) / "activated").write_text(str(root))
    return "Activated the repository's git hooks (stand-in)."
"""


class Hooks(unittest.TestCase):
    def setUp(self) -> None:
        self.root = Path(self.enterContext(tempfile.TemporaryDirectory()))
        (self.root / "scripts").mkdir()

    def with_guard(self) -> None:
        (self.root / "scripts" / "guard.py").write_text(STAND_IN_GUARD)

    def test_a_git_checkout_with_the_guard_has_its_hooks_turned_on_through_the_guard(self) -> None:
        self.with_guard()
        subprocess.run(["git", "init", "-q", str(self.root)], check=True)
        notice = check.activate_git_hooks(self.root)
        self.assertEqual(notice, "Activated the repository's git hooks (stand-in).")
        self.assertEqual((self.root / "activated").read_text(), str(self.root))

    def test_a_worktree_s_git_file_counts_as_a_git_checkout(self) -> None:
        self.with_guard()
        (self.root / ".git").write_text("gitdir: /somewhere/else\n")
        self.assertIsNotNone(check.activate_git_hooks(self.root))
        self.assertTrue((self.root / "activated").exists())

    def test_a_tree_that_isn_t_a_git_checkout_is_left_alone(self) -> None:
        self.with_guard()
        self.assertIsNone(check.activate_git_hooks(self.root))
        self.assertFalse((self.root / "activated").exists())

    def test_without_the_guard_nothing_is_attempted_and_git_config_is_unchanged(self) -> None:
        subprocess.run(["git", "init", "-q", str(self.root)], check=True)
        self.assertIsNone(check.activate_git_hooks(self.root))
        hooks_path = subprocess.run(
            ["git", "-C", str(self.root), "config", "--get", "core.hooksPath"],
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(hooks_path.stdout, "")

    def test_the_guard_s_notice_is_printed_with_a_check_prefix_and_the_gates_still_run(self) -> None:
        self.with_guard()
        (self.root / ".git").mkdir()
        out = io.StringIO()
        with (
            mock.patch.object(check, "gates", return_value=[]) as gates,
            mock.patch.object(check, "run_gates", return_value=0) as run_gates,
            contextlib.redirect_stdout(out),
        ):
            self.assertEqual(check.main([], root=self.root), 0)
        self.assertIn("check: Activated the repository's git hooks (stand-in).", out.getvalue())
        gates.assert_called_once()
        run_gates.assert_called_once_with([], self.root)


CHECK_PATHS = ROOT / "scripts" / "check-paths.toml"

GATE_SOURCES = [
    *sorted((ROOT / "src").rglob("*")),
    *sorted((ROOT / "tests").rglob("*")),
    *sorted((ROOT / "scripts").glob("*.mjs")),
    ROOT / "astro.config.mjs",
    ROOT / "playwright.config.ts",
    ROOT / "vitest.config.ts",
    ROOT / "package.json",
]
"""What the gates read, besides the packages: the site, its tests, its scripts and its config."""


def declaration() -> dict:
    import tomllib

    return tomllib.loads(CHECK_PATHS.read_text())


def skipped_files(entry: str) -> list[str]:
    """The files a skip entry covers today, as repository-relative paths."""
    if entry.endswith("/**"):
        base = ROOT / entry[:-3]
        return sorted(p.relative_to(ROOT).as_posix() for p in base.rglob("*") if p.is_file())
    return [entry]


class CheckPaths(unittest.TestCase):
    def test_the_declaration_is_version_1_skips_openspec_and_declares_no_scopes(self) -> None:
        data = declaration()
        self.assertEqual(data["version"], 1)
        self.assertIn("openspec/**", data["skip"]["paths"])
        self.assertNotIn("scopes", data)

    def test_no_gate_source_names_a_skipped_file(self) -> None:
        # The guard skips the check for a commit that stages only these, so a gate that read one
        # could break unchecked until CI (design D5). Directory entries are also matched by their
        # prefix (`openspec/`); docs/ only by its files, since the site's routes say /docs/. URLs
        # are left out: a link to another repository's CONTRIBUTING.md isn't this one's file.
        needles = set()
        for entry in declaration()["skip"]["paths"]:
            needles.update(skipped_files(entry))
            if entry.endswith("/**") and entry != "docs/**":
                needles.add(entry[:-2])
        found = [
            f"{source.relative_to(ROOT)} names {needle}"
            for source in GATE_SOURCES
            if source.is_file()
            for text in [re.sub(r"https?://\S+", "", source.read_text(errors="ignore"))]
            for needle in sorted(needles)
            if needle in text
        ]
        self.assertEqual(found, [])

    @unittest.skipUnless(
        (ROOT / "scripts" / "guard.py").exists(), "the guard isn't delivered yet"
    )
    def test_the_guard_skips_an_openspec_only_commit_and_fully_checks_one_touching_src(
        self,
    ) -> None:
        sys.path.insert(0, str(ROOT / "scripts"))
        import guard

        parsed = guard.check_paths(CHECK_PATHS.read_text())
        only_openspec = guard.check_scope(["openspec/changes/x/tasks.md"], parsed)
        self.assertFalse(only_openspec.full)
        self.assertEqual(only_openspec.names, ())
        mixed = guard.check_scope(["openspec/changes/x/tasks.md", "src/pages/index.astro"], parsed)
        self.assertTrue(mixed.full)


if __name__ == "__main__":
    unittest.main()
