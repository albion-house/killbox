# Agent Notes

Killbox is a strange, readable, chaotic co-op survival adventure about exploring hostile spaces, protecting a living Rift, and creating memorable player stories. It is published to GitHub Pages.

## Repository Memory and Structure

- Store project-specific AI-agent guidance in this repo so all contributors share the same source of truth. Do not keep repo-specific memory only in global user-directory files.
- Treat repo docs as the shared communication layer between ChatGPT, Codex, and future agents. Do not restate stable repo docs in every prompt.
- Treat `openspec/` as augmented memory for detailed requirements, active changes, designs, and task plans. Check relevant `openspec/specs/` and `openspec/changes/` entries before planning or implementing substantial work.
- Put source code and runtime asset changes under `src/`. Do not create parallel root-level source files or duplicate runtime asset trees.
- Put OpenSpec proposals, specs, designs, and task plans under `openspec/`.

## Agent Roles

- ChatGPT is the planner, design reviewer, documentation editor, and scoped-prompt writer.
- Codex is the repo editor, tester, and committer.
- Long-term design docs such as `docs/north-star.md`, `docs/terminology.md`, and `docs/world-flavor.md` should change only after explicit design agreement.
- Gameplay code changes should normally be implemented by Codex, not by editing docs to imply behavior that does not exist yet.

## Document Loading Guide

Read only the docs relevant to the task. Do not load unrelated long docs just because they exist.

- Default for any task: read this `AGENTS.md` file.
- Substantial gameplay, combat, Rift, Arena, or general design work: read `docs/north-star.md`, `docs/terminology.md`, and `docs/lessons-learned.md`.
- Expedition-specific work: also read `docs/expedition-vision.md`.
- UI, layout, readability, or information hierarchy work: read `docs/north-star.md`, `docs/lessons-learned.md`, and `docs/ui-audit-typography-reset.md`. Add `docs/terminology.md` if labels, item names, mode names, or player-facing copy change.
- Naming, copy, enemies, items, lore, world tone, or content flavor: read `docs/north-star.md`, `docs/terminology.md`, and `docs/world-flavor.md`.
- Multiplayer local/Tailscale setup: read `docs/tailscale-multiplayer.md`.
- Multiplayer validation architecture or multi-agent testing: read `docs/tailscale-multiplayer.md` and `docs/multi-agent-multiplayer-validation.md`.
- GitHub Pages deployment or publishing: read `docs/github-pages.md`.
- OpenSpec tasks: read the relevant `openspec/specs/` and `openspec/changes/` entries for that task.

If the requested work does not touch a document's domain, do not read or rewrite that document.

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
- Prefer the smallest player-facing improvement that can be tested safely.

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
- Protect the distinction between Arena and Expedition. Expedition should not drift into Arena with different maps.
