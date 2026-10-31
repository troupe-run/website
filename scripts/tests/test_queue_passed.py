"""Tests for scripts/queue_passed.py (spec: quality-check, "CI runs the same check";
ci-once-per-commit design D2-D4).

A push to main skips `test` only when the merge queue passed that exact commit, and a read that
fails runs everything without failing the job. GitHub's runs come from a fake `gh`, and time from
a fake clock, so nothing waits for real. Standard library only, like the script.
"""

import contextlib
import io
import subprocess
import sys
import unittest
from pathlib import Path
from typing import Any
from unittest import mock

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))
import queue_passed  # noqa: E402

SHA = "11e0154" + "0" * 33
REPOSITORY = "troupe-run/website"


def run(status: str, conclusion: str = "") -> dict[str, str]:
    return {"status": status, "conclusion": conclusion}


class FakeGh:
    """CI's merge-queue runs on the commit, one answer per poll; the last one stays. An exception
    in the list is what that read raises. Each call's arguments are kept."""

    def __init__(self, *answers: Any) -> None:  # noqa: ANN401 (JSON)
        self.answers = list(answers)
        self.calls: list[list[str]] = []

    def __call__(self, args: list[str]) -> Any:  # noqa: ANN401 (JSON)
        self.calls.append(args)
        answer = self.answers.pop(0) if len(self.answers) > 1 else self.answers[0]
        if isinstance(answer, Exception):
            raise answer
        return answer


class Clock:
    def __init__(self) -> None:
        self.time = 0.0
        self.sleeps = 0

    def now(self) -> float:
        return self.time

    def sleep(self, seconds: float) -> None:
        self.sleeps += 1
        self.time += seconds


def decide(gh: FakeGh, clock: Clock | None = None) -> "queue_passed.Answer":
    clock = clock or Clock()
    return queue_passed.decide(gh, REPOSITORY, SHA, now=clock.now, sleep=clock.sleep)


class DecideTest(unittest.TestCase):
    def test_a_successful_queue_run_skips_test(self) -> None:
        answer = decide(FakeGh([run("completed", "success")]))
        self.assertTrue(answer.passed)
        self.assertFalse(answer.warning)

    def test_one_success_among_failed_runs_is_enough(self) -> None:
        answer = decide(FakeGh([run("completed", "failure"), run("completed", "success")]))
        self.assertTrue(answer.passed)

    def test_no_queue_run_runs_everything_without_a_warning(self) -> None:
        answer = decide(FakeGh([]))
        self.assertFalse(answer.passed)
        self.assertFalse(answer.warning)
        self.assertIn("no merge-queue run", answer.why)

    def test_a_queue_run_that_did_not_succeed_runs_everything_without_a_warning(self) -> None:
        for conclusion in ("failure", "cancelled", "timed_out", ""):
            with self.subTest(conclusion=conclusion):
                answer = decide(FakeGh([run("completed", conclusion)]))
                self.assertFalse(answer.passed)
                self.assertFalse(answer.warning)

    def test_a_run_that_completes_during_the_wait_is_waited_for(self) -> None:
        clock = Clock()
        gh = FakeGh([run("in_progress")], [run("in_progress")], [run("completed", "success")])
        answer = decide(gh, clock)
        self.assertTrue(answer.passed)
        self.assertEqual(clock.sleeps, 2)

    def test_a_run_still_waiting_at_two_minutes_runs_everything_with_a_warning(self) -> None:
        for status in ("queued", "in_progress", "waiting", "requested", "pending"):
            with self.subTest(status=status):
                clock = Clock()
                answer = decide(FakeGh([run(status)]), clock)
                self.assertFalse(answer.passed)
                self.assertTrue(answer.warning)
                self.assertEqual(queue_passed.LIMIT_SECONDS, 120)
                self.assertGreaterEqual(clock.time, 120)
                self.assertLess(clock.time, 120 + queue_passed.POLL_SECONDS + 1)

    def test_an_unknown_status_runs_everything_with_a_warning_naming_it(self) -> None:
        answer = decide(FakeGh([run("exploded")]))
        self.assertFalse(answer.passed)
        self.assertTrue(answer.warning)
        self.assertIn("exploded", answer.why)

    def test_a_failed_read_runs_everything_with_a_warning_naming_why(self) -> None:
        answer = decide(FakeGh(queue_passed.ReadError("HTTP 502")))
        self.assertFalse(answer.passed)
        self.assertTrue(answer.warning)
        self.assertIn("HTTP 502", answer.why)

    def test_an_answer_of_the_wrong_shape_runs_everything_with_a_warning(self) -> None:
        shapes: list[object] = [
            {"runs": []},
            [{"status": "completed"}],
            ["completed"],
            [{"status": 1, "conclusion": ""}],
        ]
        for shape in shapes:
            with self.subTest(shape=shape):
                answer = decide(FakeGh(shape))
                self.assertFalse(answer.passed)
                self.assertTrue(answer.warning)

    def test_only_ci_merge_queue_runs_on_the_commit_are_asked_for(self) -> None:
        gh = FakeGh([])
        decide(gh)
        args = gh.calls[0]
        self.assertEqual(args[:2], ["run", "list"])
        for flag, value in (
            ("--workflow", "ci.yml"),
            ("--event", "merge_group"),
            ("--commit", SHA),
            ("--repo", REPOSITORY),
        ):
            self.assertEqual(args[args.index(flag) + 1], value, flag)


class GhTest(unittest.TestCase):
    def test_gh_output_that_isn_t_json_is_a_read_error(self) -> None:
        done = subprocess.CompletedProcess([], 0, stdout="not json", stderr="")
        with mock.patch.object(subprocess, "run", return_value=done):
            with self.assertRaisesRegex(queue_passed.ReadError, "isn't JSON"):
                queue_passed.gh(["run", "list"])

    def test_gh_exiting_non_zero_is_a_read_error_with_its_message(self) -> None:
        done = subprocess.CompletedProcess([], 1, stdout="", stderr="HTTP 401: Bad credentials")
        with mock.patch.object(subprocess, "run", return_value=done):
            with self.assertRaisesRegex(queue_passed.ReadError, "Bad credentials"):
                queue_passed.gh(["run", "list"])


class MainTest(unittest.TestCase):
    def main(self, answer: "queue_passed.Answer") -> tuple[int, str, str]:
        out, err = io.StringIO(), io.StringIO()
        with (
            mock.patch.object(queue_passed, "decide", return_value=answer),
            contextlib.redirect_stdout(out),
            contextlib.redirect_stderr(err),
        ):
            code = queue_passed.main(["--repository", REPOSITORY, "--sha", SHA])
        return code, out.getvalue(), err.getvalue()

    def test_a_passed_commit_prints_test_false_and_says_why(self) -> None:
        code, out, err = self.main(queue_passed.Answer(True, f"the merge queue passed {SHA}"))
        self.assertEqual(code, 0)
        self.assertEqual(out, "test=false\n")
        self.assertIn(f"the merge queue passed {SHA}", err)
        self.assertNotIn("::warning::", err)

    def test_a_commit_the_queue_didn_t_pass_prints_test_true_without_a_warning(self) -> None:
        code, out, err = self.main(queue_passed.Answer(False, "no merge-queue run"))
        self.assertEqual(code, 0)
        self.assertEqual(out, "test=true\n")
        self.assertNotIn("::warning::", err)

    def test_a_bad_read_prints_test_true_with_a_warning_and_exits_0(self) -> None:
        code, out, err = self.main(queue_passed.Answer(False, "couldn't be read: HTTP 502", True))
        self.assertEqual(code, 0)
        self.assertEqual(out, "test=true\n")
        self.assertIn("::warning::", err)
        self.assertIn("HTTP 502", err)

    def test_the_whole_path_from_a_failed_gh_to_the_output_exits_0(self) -> None:
        out, err = io.StringIO(), io.StringIO()
        with (
            mock.patch.object(queue_passed, "gh", side_effect=queue_passed.ReadError("no gh")),
            contextlib.redirect_stdout(out),
            contextlib.redirect_stderr(err),
        ):
            code = queue_passed.main(["--repository", REPOSITORY, "--sha", SHA])
        self.assertEqual(code, 0)
        self.assertEqual(out.getvalue(), "test=true\n")
        self.assertIn("::warning::", err.getvalue())


if __name__ == "__main__":
    unittest.main()
