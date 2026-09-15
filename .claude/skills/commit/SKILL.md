---
name: commit
description: Analyze all changes in the working tree and create one or more well-formed Conventional Commits, grouping the changes by concern. Use when the user asks to commit changes (e.g. "haz commit", "commit this").
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git add:*), Bash(git reset:*), Bash(git commit:*)
---

Analyze all changes in the working tree and create git commits, grouped logically.

1. Review changed files and their diffs to understand what changed (`git status`, `git diff`, `git diff --staged`). Infer the purpose only if clearly supported by the changes.
2. Check recent commit history (`git log --oneline -10`) to match the repository's style.
3. Group the changes into logical commits, one per concern. Typical groups: the feature/fix code together with its translations and tests; the OpenSpec archive plus the synced main spec as its own `docs(openspec):` commit; unrelated changes each in their own commit. Never mix unrelated changes in one commit, and never split one coherent change across several. If everything belongs to a single concern, one commit is correct. Commit the groups in dependency order (code before the docs that describe it).
4. For each group, choose the right conventional commit prefix: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `style:`, `test:`, `perf:`. Optionally add a scope in parentheses naming the affected module/concept (never a filename), e.g. `fix(supabase):`, `feat(billing):`. Use a scope when the change is clearly confined to one module; write each scope name consistently across commits.
5. Write a concise commit message (1-2 sentences) **in English**, matching the repository's history; the conventional prefix and scope are in English too. Describe the impact or purpose if clear; if trivial, just describe the change without inventing motivation.
6. Verify the message accurately reflects the diff of that group — it should be neither vague nor misleading. If it doesn't match the actual changes, rewrite it.
7. For each group in order: stage only that group's files by name and create its commit. Files that belong to no group (e.g. unrelated untracked files) stay out of every commit; mention them in the final summary instead.

Rules:
- Never stage files containing secrets (.env, credentials, API keys) or generated/build output (`prisma/generated/`, `release/`, `dist/`, `*.db`).
- Stage specific files by name, not `git add -A` or `git add .`.
- Do NOT push to remote.
- If there are no changes, say so and stop.
- Do NOT add any co-author trailer or attribution. The commit must look like a normal human commit — no `Co-Authored-By`, no "Generated with Claude", no emoji signature, nothing referencing an AI.
- Use HEREDOC format for the commit message to support multiline.
