# Memory System

Claude Code uses a three-tier memory system to maintain context across sessions.

## Memory Files

Stored in `~/.claude/projects/-Users-administrator-Projects-draftr/memory/`:

| File | Purpose | Updated by |
|------|---------|------------|
| `recent-memory.md` | Rolling 48hr window of decisions, context, open questions | `/consolidate-memory` |
| `long-term-memory.md` | Distilled preferences, patterns, architectural decisions | Promoted from recent memory |
| `project-memory.md` | Active work, completions, blockers, next priorities | `/consolidate-memory` |

These sit alongside the existing per-topic memory files (feedback, references, project notes).

## Usage

Run `/consolidate-memory` at the end of your day. It will:

1. Scan conversation logs from the last 24 hours
2. Extract key decisions, preferences, and project state changes
3. Update `recent-memory.md` (purge entries older than 48hrs)
4. Promote durable items to `long-term-memory.md`
5. Update `project-memory.md` with current work status

## Notes

- The skill parses JSONL conversation logs stored by Claude Code
- No automated scheduling — just run it manually when wrapping up
- Recent memory entries expire after 48 hours unless promoted to long-term
