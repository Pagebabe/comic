# Integration Rollback Plan

Status: fail closed. No direct merge to `main` is authorized by this document.

## Operating rule

Every integration attempt happens on a new branch created from an exact verified `main` head. Worker branches remain immutable inputs. A failed integration branch is abandoned, never repaired through force-push or history rewriting.

## Before any integration

Record:

```bash
git status --short
git rev-parse HEAD
git rev-parse origin/main
git branch --show-current
git log -10 --oneline --decorate
```

Required conditions:

- clean working tree;
- exact approved worker heads;
- terminal green required workflows;
- Worker 2 final report present;
- no unresolved review threads;
- backup or remote refs for every input branch;
- no live, OAuth, secret or publishing activation.

## Disposable rehearsal rollback

For an uncommitted merge conflict:

```bash
git diff --name-only --diff-filter=U
git merge --abort
git reset --hard <verified-integration-start>
git clean -fdx
git status --short
```

The Worker-4 automation runs this only inside a temporary detached worktree. It then removes the worktree and executes `git worktree prune`.

## Integration-branch rollback

If a committed rehearsal is wrong:

1. stop all further merges;
2. preserve logs and the exact failing commit;
3. do not force-push;
4. create a replacement integration branch from the same verified `main` head;
5. repeat only the last proven sequence;
6. resolve conflicts by explicit file composition;
7. rerun all gates.

Do not use a blanket `ours` or `theirs` strategy for `package.json`, CI workflows, Canon files or Studio files.

## Main protection

No Worker-4 command pushes or merges into `main`. A future human-approved main integration must use a PR whose head is the exact tested integration commit.

If an unauthorized main merge occurs:

- stop deployment and publishing;
- record the unauthorized merge SHA;
- prefer a normal revert PR over history rewriting;
- run recovery and fresh-install drills on the reverted candidate;
- preserve all evidence for audit.

## Stop conditions

Stop immediately when any of the following occurs:

- Worker 2 lacks a final immutable head;
- a pinned Worker 1, PR #131 or Worker 3 head moves;
- `main` moves after rehearsal evidence was generated;
- merge base cannot be resolved;
- dependency cycle appears;
- conflict resolution would discard current-main behavior;
- package scripts disappear;
- current-main, Growth, fresh-install or recovery regression fails;
- source worktree is dirty after a probe;
- any force-push, branch deletion, OAuth, secret, live publishing or account activation is requested.

## Recovery proof

A sequence is considered rolled back only when:

```text
merge state absent
working tree clean
temporary worktree removed
source branch unchanged
pushes performed = 0
force pushes performed = 0
```

The workflow artifact records these properties for all three rehearsal variants.
