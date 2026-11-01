#!/usr/bin/env python3
"""PreToolUse guard: only explicit cursor/* branch pushes are allowed.

Reads the hook JSON on stdin ({"tool_input": {"command": "..."}}).
Exits 0 to allow the tool, or 2 with a systemMessage to block it.

Allowed: git push whose every destination ref is a branch under cursor/.
Blocked: main/master, a push with no explicit branch, --all/--mirror/--tags,
and --force / --force-with-lease / '+' refspecs aimed at main or master.
"""

from __future__ import annotations

import json
import shlex
import sys

PROTECTED = {"main", "master"}
BLOCK_MESSAGE = (
    "⚠️ git push已拦截！只允许推送到 cursor/ 开头的功能分支（不会部署生产）。"
    "推送到 main/master、未写明目标分支，或对 main/master 使用 --force，仍会拦截。"
    "请改成 git push -u origin cursor/<branch>，或让用户手动执行。"
)

GIT_GLOBALS_WITH_VALUE = {
    "-C",
    "-c",
    "--git-dir",
    "--work-tree",
    "--namespace",
    "--exec-path",
    "--super-prefix",
    "--list-cmds",
}
PUSH_WITH_VALUE = {
    "-o",
    "--push-option",
    "--receive-pack",
    "--exec",
    "--repo",
    "--recurse-submodules",
}
FORCE_FLAGS = {"--force", "-f", "--force-with-lease", "--force-if-includes"}
BROAD_FLAGS = {"--all", "--mirror", "--tags", "--follow-tags"}


def split_statements(command: str) -> list[str]:
    parts: list[str] = []
    buf: list[str] = []
    i = 0
    in_single = False
    in_double = False
    while i < len(command):
        ch = command[i]
        if ch == "'" and not in_double:
            in_single = not in_single
            buf.append(ch)
            i += 1
            continue
        if ch == '"' and not in_single:
            in_double = not in_double
            buf.append(ch)
            i += 1
            continue
        if not in_single and not in_double:
            if ch == "#":
                while i < len(command) and command[i] != "\n":
                    i += 1
                continue
            if command.startswith("&&", i) or command.startswith("||", i):
                parts.append("".join(buf))
                buf = []
                i += 2
                continue
            if ch in ";&\n":
                parts.append("".join(buf))
                buf = []
                i += 1
                continue
        buf.append(ch)
        i += 1
    parts.append("".join(buf))
    return [part.strip() for part in parts if part.strip()]


def _is_assignment(token: str) -> bool:
    return "=" in token and not token.startswith("-") and not token.startswith("'")


def find_push_args(argv: list[str]) -> list[str] | None:
    """Return args after `git push`, or None when this argv is not a git push."""
    i = 0
    while i < len(argv) and _is_assignment(argv[i]):
        i += 1
    if i < len(argv) and argv[i] in {"command", "sudo", "nice", "nohup", "time"}:
        i += 1
        while i < len(argv) and argv[i].startswith("-"):
            i += 1
    if i >= len(argv):
        return None
    git = argv[i]
    if git != "git" and not git.endswith("/git"):
        return None
    i += 1
    while i < len(argv):
        token = argv[i]
        if token == "push":
            return argv[i + 1 :]
        if token == "--":
            return None
        if token in GIT_GLOBALS_WITH_VALUE or token.startswith("-") and token.split("=", 1)[0] in GIT_GLOBALS_WITH_VALUE:
            if "=" in token or token.startswith("--"):
                if token.startswith("--") and "=" not in token and token in GIT_GLOBALS_WITH_VALUE:
                    i += 2
                    continue
                i += 1
                continue
            i += 2
            continue
        if token.startswith("-"):
            i += 1
            continue
        return None
    return None


def _option_name(token: str) -> str:
    if token.startswith("--"):
        return token.split("=", 1)[0]
    return token


def parse_push(args: list[str]) -> tuple[bool, list[str], list[str]]:
    """Return (global_force, lease_refs, refspecs). Raises ValueError to block."""
    force = False
    lease_refs: list[str] = []
    positionals: list[str] = []
    i = 0
    while i < len(args):
        token = args[i]
        if token == "--":
            positionals.extend(args[i + 1 :])
            break
        if token.startswith("-") and token != "-":
            name = _option_name(token)
            if name in BROAD_FLAGS:
                raise ValueError(name)
            if name in FORCE_FLAGS:
                force = True
                if "=" in token and name == "--force-with-lease":
                    lease_refs.append(token.split("=", 1)[1])
                i += 1
                continue
            if name in PUSH_WITH_VALUE and "=" not in token:
                i += 2
                continue
            if token.startswith("--"):
                i += 1
                continue
            # Clustered short flags, e.g. -uf
            cluster = token[1:]
            j = 0
            while j < len(cluster):
                flag = "-" + cluster[j]
                if flag in BROAD_FLAGS or flag in {"-a", "-m"}:
                    raise ValueError(flag)
                if flag in FORCE_FLAGS:
                    force = True
                if flag in PUSH_WITH_VALUE:
                    if j != len(cluster) - 1:
                        raise ValueError(flag)
                    i += 1  # value is the next argv
                j += 1
            i += 1
            continue
        positionals.append(token)
        i += 1

    refspecs: list[str] = []
    seen_remote = False
    for token in positionals:
        if not seen_remote and _is_remote(token):
            seen_remote = True
            continue
        refspecs.append(token)
    return force, lease_refs, refspecs


def _is_remote(token: str) -> bool:
    if token.startswith(("+", ":", "refs/")) or token in {"HEAD", "@", "main", "master"}:
        return False
    if "://" in token or token.startswith("git@"):
        return True
    if ":" in token:
        return False
    # origin, upstream, and other single-token remotes. Branch names we care
    # about contain a slash (cursor/foo) or are listed above.
    return "/" not in token


def destination_branch(refspec: str) -> tuple[str, bool]:
    force = False
    spec = refspec
    if spec.startswith("+"):
        force = True
        spec = spec[1:]
    dest = spec.split(":", 1)[1] if ":" in spec else spec
    if dest.startswith("refs/heads/"):
        dest = dest[len("refs/heads/") :]
    return dest, force


def normalize_lease(ref: str) -> str:
    ref = ref[1:] if ref.startswith("+") else ref
    if ref.startswith("refs/heads/"):
        ref = ref[len("refs/heads/") :]
    return ref


def push_is_allowed(command: str) -> bool:
    """True when every git push in the command only updates cursor/* branches."""
    saw_push = False
    for statement in split_statements(command):
        try:
            argv = shlex.split(statement, posix=True)
        except ValueError:
            if "git" in statement and "push" in statement:
                return False
            continue
        push_args = find_push_args(argv)
        if push_args is None:
            continue
        saw_push = True
        try:
            force, lease_refs, refspecs = parse_push(push_args)
        except ValueError:
            return False
        if not refspecs:
            return False
        for lease in lease_refs:
            if normalize_lease(lease) in PROTECTED:
                return False
        for refspec in refspecs:
            branch, spec_force = destination_branch(refspec)
            if branch in PROTECTED:
                return False
            if not (branch.startswith("cursor/") and len(branch) > len("cursor/")):
                return False
            if (force or spec_force) and branch in PROTECTED:
                return False
    return saw_push


def main() -> int:
    raw = sys.stdin.read()
    if not raw.strip():
        return 0
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return 0
    tool_input = data.get("tool_input") if isinstance(data, dict) else None
    command = ""
    if isinstance(tool_input, dict):
        command = str(tool_input.get("command") or "")
    if "git" not in command or "push" not in command:
        return 0
    try:
        allowed = push_is_allowed(command)
    except Exception:
        allowed = False
    # Commands that merely mention the words but are not a git push stay allowed.
    if "push" in command and not _mentions_push_invocation(command):
        return 0
    if allowed:
        return 0
    if not _mentions_push_invocation(command):
        return 0
    print(json.dumps({"systemMessage": BLOCK_MESSAGE}, ensure_ascii=False))
    return 2


def _mentions_push_invocation(command: str) -> bool:
    for statement in split_statements(command):
        try:
            argv = shlex.split(statement, posix=True)
        except ValueError:
            if "git" in statement and "push" in statement:
                return True
            continue
        if find_push_args(argv) is not None:
            return True
    return False


if __name__ == "__main__":
    raise SystemExit(main())
