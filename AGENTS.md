# Agent Notes

This repo is a tower defense game published to github pages.

## Repository Memory and Structure

- Store project-specific AI-agent guidance in this repo so all contributors share the same source of truth. Do not keep repo-specific memory only in global user-directory files.
- Treat `openspec/` as augmented memory for detailed requirements, active changes, designs, and task plans. Check relevant `openspec/specs/` and `openspec/changes/` entries before planning or implementing substantial work.
- Read `docs/north-star.md` and `docs/terminology.md` before substantial design, gameplay, Expedition, narrative, or naming changes.
- Put source code and runtime asset changes under `src/`. Do not create parallel root-level source files or duplicate runtime asset trees.
- Put OpenSpec proposals, specs, designs, and task plans under `openspec/`.

## Release Versioning

- This repository uses semantic versioning for releases.
- Every release version should be tagged in git.
- Use annotated tags named `vMAJOR.MINOR.PATCH`, for example `v7.6.0`.

## Dependency Tooling

- This project uses mise for tool dependencies.
- Install mise before working with OpenSpec here; `mise.toml` provides the OpenSpec CLI via `npm:@fission-ai/openspec`.
## Token and Scope Control

Keep Codex tasks narrow. One pass should target one system, one visible outcome, and one test path.

Before editing:
- Inspect only the files/functions relevant to the requested task.
- Preserve all existing functionality unless explicitly instructed otherwise.
- Do not rewrite unrelated systems.
- Do not refactor opportunistically.
- Do not expand scope without asking.

Browser and screenshot control:
- Do not use browser/computer-use verification unless the task is visual or explicitly requires it.
- Do not take repeated screenshots.
- If screenshots are needed, take at most one before and one after.
- If manual browser testing is blocked by menus, profile state, loadout state, login state, or missing local setup, stop and report the blocker.
- Do not keep navigating UI to overcome blocked test setup.

Testing:
- Prefer targeted automated tests or smoke tests first.
- If manual testing cannot reach the target state quickly, report that it was not completed and explain why.
- Summarize long logs instead of pasting them unless the exact error is needed.

Implementation style:
- Make the smallest change that solves the stated player-facing problem.
- For games, preserve feel, readability, pacing, humor, and visual style.
- Avoid adding UI clutter when better in-world feedback can solve the problem.