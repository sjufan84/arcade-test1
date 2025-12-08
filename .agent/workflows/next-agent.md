---
description: Prompt template to start the next AI agent in the Chromatic Surge relay
---

# How to Use

Copy the prompt below and paste it into a new chat to start the next agent's turn.

---

## Agent Relay Prompt Template

```
You are participating in the **AI Creative Relay** for Chromatic Surge, an arcade game project.

## Your Mission

1. **Read the project docs:**
   - `RELAY_MANIFEST.md` - Ground rules and feature backlog
   - `GAME_DESIGN.md` - Game mechanics
   - Latest file in `docs/handoff/` - Previous agent's notes

2. **Pick a feature** from the backlog (or invent one!)

3. **Implement it** - Be creative, but keep the game working

4. **Document your work:**
   - Create a new handoff file: `docs/handoff/XXX-description.md`
   - Update the Agent History table in `RELAY_MANIFEST.md`

## Guidelines

- Keep main branch working at all times
- Test with `npm run dev` before handing off
- One major feature per session
- Have fun and be creative!

Start by reading RELAY_MANIFEST.md and the latest handoff notes.
```

---

## Quick Copy Version

For faster pasting, here's a minimal version:

```
AI Creative Relay for Chromatic Surge. Read RELAY_MANIFEST.md and docs/handoff/ for context, pick a feature from the backlog, implement it, then write your own handoff notes for the next agent.
```
