# RunTime Arena — Product Requirements Document

**Event:** KICKR CodeMania 2026 — 24-Hour AI × Gaming Hackathon, Sharda University
**Theme:** "Turn the Real World into a Game"
**Team:** Daksh Chaudhary & Harry
**Repo:** github.com/DakshChaudhary2668/runtime-arena

---

## 1. Product Vision

Placement prep today is treated like studying — repetitive, disconnected from stakes, easy to drop. **RunTime Arena** turns DSA and SQL practice into a story-driven survival game: every problem is wrapped in a real-world emergency, and an AI Game Director reacts to how the player actually codes — not a scripted path.

**Tagline:** *"Code with purpose. Learn with adventure."*

**One-line pitch:** RunTime Arena is a solo, AI-narrated coding-adventure game where real coding behavior — attempts, speed, struggle — drives a live emergency story, and the AI decides how the story (and the difficulty) responds.

---

## 2. Problem Statement Alignment

| PS Requirement | How RunTime Arena Meets It |
|---|---|
| Playable game | Full mission-based game loop: briefing → code → resolve → next mission |
| Meaningful AI | AI Game Director generates hints, adjusts EXP/difficulty, and drives narrative escalation based on live player telemetry |
| Real-world connection | Real human coding skill/behavior (keystrokes, attempts, execution results) is the input that changes the game |
| Mobile or PC | Web-based, PC-first for the hackathon build |
| Clear game loop | Enter → Mission Briefing → Code → Execute → AI Reacts → Win/Lose → Progress |

**"What happens if you remove the AI?"** — Without the AI Game Director, RunTime Arena becomes a static set of themed coding problems. With it, the story escalates, hints personalize, and EXP/difficulty adapt to the individual player's real struggle — the AI is a gameplay mechanic, not a chatbot bolted on.

---

## 3. Target User

Students preparing for placements/technical interviews who find traditional DSA/SQL practice (LeetCode-style) repetitive and low-retention. Positioning is explicitly **habit-formation first** — the goal is a practice experience students want to return to, not just complete once.

---

## 4. Core Game Loop

```
Login
  → Choose Mission (module + difficulty)
  → Mission Briefing (story scene)
  → Access Terminal (Monaco overlay opens)
  → Write & Run Code (multiple submissions allowed, LeetCode-style)
  → AI Game Director evaluates:
      - Success → Resolution scene → EXP awarded → Next mission
      - Failure → Try Again / AI hint triggered → EXP deduction scales with attempts
  → Mission Complete → Score/Debrief screen
```

---

## 5. Modules & Difficulty Structure

Each themed module contains **exactly 3 missions**: 1 Easy, 1 Medium, 1 Hard.

### DSA Track

**🛫 Flight 101** (Beginner-friendly theme, live for hackathon MVP)
| Difficulty | Narrative | Topic |
|---|---|---|
| Easy | Reroute the fuel line | Linked List fundamentals |
| Medium | Navigate the storm | Graphs (BFS / shortest path) |
| Hard | Emergency descent | Dynamic Programming |

**🔓 Data Heist** (Intermediate theme — MVP: locked/"Coming Soon" card, content optional if time allows)
| Difficulty | Narrative | Topic |
|---|---|---|
| Easy | Bypass the firewall | Arrays/Strings |
| Medium | Crack the vault | Hashing/Two-Pointer |
| Hard | Erase your tracks | Backtracking/Greedy |

**🚀 Space Rescue** (Advanced theme — MVP: locked/"Coming Soon" card)
| Difficulty | Narrative | Topic |
|---|---|---|
| Easy | Oxygen systems check | Stack/Queue |
| Medium | Chart course home | Graphs (BFS) |
| Hard | Save the crew | MST / Union-Find |

### SQL Track

**🗃️ Vault Breach** (in MVP scope alongside DSA)
| Difficulty | Narrative | Topic |
|---|---|---|
| Easy | Access the mainframe | SELECT, WHERE, ORDER BY |
| Medium | Trace the money trail | JOIN, GROUP BY, aggregates |
| Hard | Cover your tracks | Subqueries, window functions |

---

## 6. AI Game Director — Behavior Spec

**Model:** Gemma4 (`gemma4:e4b`), self-hosted locally via Ollama on the demo machine (MacBook Air M5, 16GB RAM). Gemini API (cloud) held as fallback if local inference is too slow or fails during judging.

**Trigger paths:**
1. **User-requested** — player taps "Ask AI" for approach guidance or problem simplification. Hint level matches current attempt count; small flat EXP deduction (proactive ask).
2. **Automatic on repeated failure** — the more failed attempts/try-agains, the deeper the hint context revealed, and the larger the EXP deduction.

**Illustrative curve (to be finalized in implementation):**
```
Attempt 1 fail → no hint, no deduction
Attempt 2 fail → Hint Level 1 (nudge), small EXP deduction
Attempt 3 fail → Hint Level 2 (approach reveal), moderate deduction
Attempt 4+ fail → Hint Level 3 (near-solution guidance), larger deduction
```

**Narrative integration:** AI-generated hints are delivered in-character (e.g. "We're losing altitude...") and tie into visible game-state changes (oxygen %, alarm level) rather than appearing as a plain chatbot response.

**Voice layer (stretch goal, P1):** Agora Conversational AI SDK (ASR → LLM → TTS) as an optional voice interaction layer on top of the same AI Game Director. Text-mode remains the core and automatic fallback if voice has issues during judging.

---

## 7. Gamification & Profile System

- **EXP & Level** — core progress metric (P0)
- **Attempts tracking** — total attempts per problem and per run, shown on debrief/profile screens
- **Badges/Achievements** — e.g. "Complete an entire module" → 1 achievement (P1, simple set only)
- **Rank tiers** (Bronze/Silver/Gold/Diamond) — explicitly deprioritized for the hackathon MVP; add only if time remains
- Multiple submissions per problem are allowed (LeetCode-style) — final EXP treatment (cumulative deduction vs. success-only) is an open decision, see Section 11.

---

## 8. Technical Architecture

```
Player
  ↓
Frontend (React + Vite)
  — Story scene UI, HUD, Monaco overlay
  ↓
Backend (Flask)
  — Auth, mission/session logic, execution routing
  ↓            ↓
Database      AI Game Director
(Postgres/     (Gemma4 local via Ollama,
SQLite)        Groq/Gemini fallback)
```

- **Frontend:** React + Vite, deployed via Vercel (for the production/reference build); local `npm run dev` for the demo
- **Backend:** Flask, deployed via Render (for the production/reference build); local `python3 app.py` for the demo — required because the local Ollama model is only reachable from the same machine
- **Database:** PostgreSQL in production, SQLite fallback locally (existing dual-engine logic reused)
- **Execution:** Python only for the hackathon demo (see Section 10 — C/C++/Java execution in the inherited codebase is non-functional and out of scope); new SQL execution path required (in-memory SQLite seeded per scenario)
- **AI:** Gemma4 (`gemma4:e4b`) via Ollama REST API (`localhost:11434`), Gemini API as cloud fallback
- **Voice (stretch):** Agora Conversational AI SDK, wired as an optional layer above the existing text-based AI Director

---

## 9. What's Reused vs. Rebuilt vs. Discarded

(From the pre-pivot codebase audit of the original TeamFit AI project)

**✅ Reused as-is:**
- JWT auth flow, `AuthContext.jsx`
- Dual-engine database setup (`database.py`)
- Monaco Editor mounting logic
- `api.js` HTTP client wrapper

**🔧 Rebuilt on existing structure:**
- Code execution (`judge0.py` / `execute.py`) — needs sandboxing, timeouts, and proper exception handling; existing structure kept, safety logic replaced
- `keystroke_log` — needs a `session_id` column and a new `failed_execution_log` table

**❌ Discarded (multiplayer/analytics features not used in solo story-mode):**
- `session.py`, `SessionLobby.jsx`, professor `Dashboard.jsx`, `ai_insights.py`, `ai_engine.py`, `ai_summary.py`

**🆕 Built fresh (did not exist before):**
- AI Game Director (struggle detection → hint/EXP/narrative logic)
- Test-case/verification engine for DSA problems
- SQL execution engine
- Story-mode UI (scene view, narrative rendering, terminal-overlay pattern)

---

## 10. Known Risks & Must-Fix Issues (from codebase audit)

| Risk | Severity | Fix Required |
|---|---|---|
| C/C++/Java "execution" is a regex-matched fake, not real compilation | High | Restrict demo to Python only |
| No DSA test-case/verification engine exists — code runs standalone with no input/output assertions | Critical | Build a real verification harness before AI/game logic can rely on "solved" status |
| `sys.exit()` in submitted code kills the entire Flask server; infinite loops freeze it; zero sandboxing | Critical | Add subprocess isolation, timeouts, and catch `BaseException` |
| Port mismatch — Flask defaults to 5000, Vite proxy expects 5001 | Blocks local boot | Align via env var before any other work |
| AI currently never mutates game state (passive dashboard display only) | High (core to "AI must matter") | Build the AI Game Director from scratch |
| `keystroke_log` has no session scoping, no failed-execution logging | High (blocks struggle detection) | Add `session_id` column and a failed-execution table |
| Active Groq API key was present in local `.env` | Security | Excluded from new repo; `.env.example` used instead, `.gitignore` in place |
| Plaintext passwords, no JWT expiration, mock Google-login backdoor | Medium | Accepted as out-of-scope risk for a 24h demo; not to be used with real user data |

---

## 11. Open Decisions

- **EXP deduction model:** cumulative/permanent deduction per failed attempt, vs. EXP based only on the final successful attempt (with attempts tracked separately as a stat).
- **Final project name confirmation:** RunTime Arena is locked; module names (Flight 101, Data Heist, Space Rescue, Vault Breach) are set.
- **Voice layer inclusion:** confirmed as P1/stretch — to be attempted only after the text-based core loop is fully stable.
- **Scope of Data Heist / Space Rescue / Vault Breach content:** whether these ship as fully playable missions or as "Coming Soon" locked cards in the demo, depending on remaining time.

---

## 12. Scope Priority (Hackathon Build Order)

| Priority | Item |
|---|---|
| P0 | Fix port mismatch |
| P0 | Sandbox Python execution (timeout, safe exception handling) |
| P0 | Build DSA test-case/verification engine |
| P0 | Build SQL execution engine (in-memory seeded DB) |
| P0 | Add session-scoped telemetry (failed attempts, keystroke deltas) |
| P0 | Build the AI Game Director (hint generation, EXP/difficulty logic, narrative text) |
| P0 | Flight 101 module fully playable end-to-end (3 missions) |
| P1 | Vault Breach (SQL) module fully playable |
| P1 | Story-mode UI polish (scene transitions, HUD, tension effects) |
| P1 | Badges/achievements (simple set) |
| P1 | Voice interaction layer via Agora |
| P2 | Data Heist / Space Rescue full content (otherwise: locked cards only) |
| P2 | Rank tiers, leaderboard, XP streaks |

---

## 13. Demo & Submission Plan

- Full app (frontend + backend) run locally on the demo laptop so the local Ollama model is reachable
- 30–60 second demo video covering all modules (Easy/Medium/Hard) and their success-completion scenes
- Submission per hackathon requirements: playable prototype, source code (GitHub repo), demo video, short presentation covering idea/gameplay/AI/real-world integration, tech stack, and future potential

---

## 14. Future Scope (Post-Hackathon)

- 1v1 competitive match mode (previously explored, deprioritized in favor of solo story-mode)
- LLD, HLD, and OOP problem modules
- Full Data Heist and Space Rescue content
- Leaderboards, XP streaks, rank tiers
- Institutional adoption (colleges/bootcamps) as a potential distribution and data moat
- Behavioral/engagement data as a long-term differentiation layer (which hints/difficulty curves drive retention)
