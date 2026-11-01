#!/usr/bin/env python3
"""Cases for the git push PreToolUse guard. Does not run git."""

from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GUARD = ROOT / "scripts" / "guard-git-push.py"

spec = importlib.util.spec_from_file_location("guard_git_push", GUARD)
guard = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(guard)


ALLOW = [
    "git push -u origin cursor/cashier-missing-spec-9ce8",
    "git push origin cursor/foo",
    "git push --set-upstream origin cursor/bar",
    "git push origin refs/heads/cursor/foo",
    "git push origin HEAD:cursor/foo",
    "git push origin cursor/foo:cursor/foo",
    "git push --force origin cursor/foo",
    "git push --force-with-lease origin cursor/foo",
    "git push origin +cursor/foo",
    "git -C /workspace push -u origin cursor/foo",
    "GIT_TERMINAL_PROMPT=0 git push -u origin cursor/foo",
    "git add -A && git push -u origin cursor/foo",
    "git status",
    "ls",
    "echo git push origin main",
]

BLOCK = [
    "git push",
    "git push origin",
    "git push origin HEAD",
    "git push -u origin HEAD",
    "git push origin main",
    "git push origin master",
    "git push --force origin main",
    "git push --force origin master",
    "git push --force-with-lease origin main",
    "git push --force-with-lease=refs/heads/main origin cursor/foo",
    "git push origin +main",
    "git push origin +refs/heads/master",
    "git push origin cursor/foo main",
    "git push origin cursor/foo:main",
    "git push origin cursor/foo:master",
    "git push origin cursor/foo:refs/heads/main",
    "git push --all",
    "git push --mirror",
    "git push --tags",
    "git push origin --all",
    "git push -u origin cursor/foo && git push origin main",
]


def run_hook(command: str) -> int:
    payload = json.dumps({"tool_input": {"command": command}})
    result = subprocess.run(
        [sys.executable, str(GUARD)],
        input=payload,
        text=True,
        capture_output=True,
        check=False,
    )
    return result.returncode


def check_configured_hook() -> int:
    """Run the command stored in the repo hook files, not only the script."""
    failed = 0
    for path in (ROOT / ".claude" / "settings.json", ROOT / ".codex" / "hooks.json"):
        data = json.loads(path.read_text())
        command = data["hooks"]["PreToolUse"][0]["hooks"][0]["command"]
        samples = [
            ("cursor", ALLOW[0], 0),
            ("main", "git push origin main", 2),
            ("bare", "git push", 2),
            ("force-main", "git push --force origin main", 2),
            ("force-cursor", "git push --force origin cursor/foo", 0),
            ("ls", "ls", 0),
        ]
        for cwd in (ROOT, ROOT / "scripts"):
            for name, sample, expect in samples:
                result = subprocess.run(
                    ["bash", "-lc", command],
                    input=json.dumps({"tool_input": {"command": sample}}),
                    text=True,
                    capture_output=True,
                    check=False,
                    cwd=cwd,
                )
                if result.returncode != expect:
                    failed += 1
                    print(f"hook {path.name} {name} cwd={cwd.name} exit={result.returncode} out={result.stdout.strip()}")
    return failed


def main() -> None:
    failed = check_configured_hook()
    for command in ALLOW:
        code = run_hook(command)
        if code != 0:
            failed += 1
            print(f"ALLOW failed ({code}): {command}")
    for command in BLOCK:
        code = run_hook(command)
        if code != 2 or guard.push_is_allowed(command):
            failed += 1
            print(f"BLOCK failed ({code}, allowed={guard.push_is_allowed(command)}): {command}")
    if failed:
        raise SystemExit(f"{failed} case(s) failed")
    print(f"ok {len(ALLOW) + len(BLOCK)} plus configured hooks")


if __name__ == "__main__":
    main()
