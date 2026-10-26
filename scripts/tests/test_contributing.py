"""website has no contributing guide of its own, so GitHub shows the org's (spec: contributing; design D4).

Standard library only, like check.py. check.py runs it with the rest of scripts/tests as its first gate.
"""

import re
import subprocess
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

GUIDE_PLACES = ["", ".github", "docs"]
"""Where GitHub looks for a repository's contributing guide: the root, .github/ and docs/."""

HISTORY = ("docs/superpowers/", "openspec/changes/")
"""Records of what was true when written. The change in flight quotes the old file too."""

SELF = Path(__file__).resolve().relative_to(ROOT).as_posix()
"""This file: its fixtures are the links it looks for."""

LINK = re.compile(r"""(?:\]\(|href\s*=\s*["']?)([^)"'\s>]*CONTRIBUTING\.md)(?:#[^)"'\s>]*)?""", re.IGNORECASE)
"""A Markdown link target or an href whose path ends in CONTRIBUTING.md, anchor aside."""


def own_guides(root: Path) -> list[str]:
    """Each contributing guide in a place GitHub looks, any case."""
    return [
        (Path(place) / entry.name).as_posix()
        for place in GUIDE_PLACES
        if (root / place).is_dir()
        for entry in sorted((root / place).iterdir())
        if entry.is_file() and entry.name.lower() == "contributing.md"
    ]


def committed_files(root: Path) -> list[str]:
    """The files git would commit: tracked, or new and not ignored."""
    listed = subprocess.run(
        ["git", "-C", str(root), "ls-files", "-z", "--cached", "--others", "--exclude-standard"],
        capture_output=True,
        text=True,
        check=False,
    )
    if listed.returncode != 0:
        raise RuntimeError(f"git couldn't list the files in {root}: {listed.stderr.strip()}")
    return sorted({path for path in listed.stdout.split("\0") if path})


def guide_links(root: Path) -> list[str]:
    """Each link to a CONTRIBUTING.md that isn't a URL, outside the historical records and this file."""
    return [
        f"{path} links {target}"
        for path in committed_files(root)
        if not path.startswith(HISTORY) and path != SELF and (root / path).is_file()
        for target in LINK.findall((root / path).read_text(errors="ignore"))
        if not re.match(r"https?://", target)
    ]


class ThisRepository(unittest.TestCase):
    def test_there_is_no_contributing_guide_at_the_root_in_github_or_in_docs(self) -> None:
        self.assertEqual(own_guides(ROOT), [])

    def test_no_committed_file_outside_the_records_links_to_a_contributing_guide_but_the_org_s(self) -> None:
        self.assertEqual(guide_links(ROOT), [])


class Rules(unittest.TestCase):
    """What counts as a guide of its own and as a link to one, in a throwaway repository."""

    def setUp(self) -> None:
        self.root = Path(self.enterContext(tempfile.TemporaryDirectory()))
        subprocess.run(["git", "init", "-q", str(self.root)], check=True)

    def write(self, path: str, text: str = "") -> None:
        (self.root / path).parent.mkdir(parents=True, exist_ok=True)
        (self.root / path).write_text(text)

    def test_a_guide_in_any_place_github_looks_and_in_any_case_is_reported(self) -> None:
        self.write("CONTRIBUTING.md")
        self.write(".github/contributing.md")
        self.write("docs/Contributing.md")
        self.write("src/CONTRIBUTING.md")
        self.assertEqual(
            own_guides(self.root), ["CONTRIBUTING.md", ".github/contributing.md", "docs/Contributing.md"]
        )

    def test_a_relative_markdown_link_or_href_is_reported_with_its_file(self) -> None:
        self.write("README.md", "See [the guide](CONTRIBUTING.md#setting-up).\n")
        self.write("src/footer.astro", '<a href="../CONTRIBUTING.md">Contributing</a>\n')
        self.assertEqual(
            guide_links(self.root),
            ["README.md links CONTRIBUTING.md", "src/footer.astro links ../CONTRIBUTING.md"],
        )

    def test_the_org_guide_s_url_isn_t_reported(self) -> None:
        url = "https://github.com/troupe-run/.github/blob/main/CONTRIBUTING.md"
        self.write("README.md", f"See [the org's guide]({url}#a-fix-from-outside).\n")
        self.write("src/lib/docs-nav.ts", f"export const CONTRIBUTING = '{url}';\n")
        self.write("tests/e2e/docs.spec.ts", f"toHaveAttribute('href', '{url}');\n")
        self.assertEqual(guide_links(self.root), [])

    def test_the_historical_records_and_ignored_files_aren_t_read(self) -> None:
        self.write(".gitignore", ".cache/\n")
        for path in ["docs/superpowers/plans/plan.md", "openspec/changes/x/proposal.md", ".cache/page.md"]:
            self.write(path, "See [CONTRIBUTING.md](CONTRIBUTING.md).\n")
        self.assertEqual(guide_links(self.root), [])


if __name__ == "__main__":
    unittest.main()
