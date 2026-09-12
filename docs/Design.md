# RunTime Arena — Style Reference

> A cinematic coding emergency simulator where the interface behaves like cockpit instrumentation and the player's code changes the world.

**Theme:** dark, monochrome, cinematic, technical

RunTime Arena uses quiet, gallery-like visual discipline to create a playable mission-control system. The screen is not a marketing canvas and the terminal is not a generic IDE. Every surface belongs to the fiction: the scene is the world, the HUD reports its condition, the terminal is the player's control surface, and the AI Director reacts to how the player works.

The base interface is a strict monochrome shell—Void canvas, Bone type, Frost hairlines, Charcoal controls, and Ash secondary information. Typography carries hierarchy. Scene art carries atmosphere. Chromatic color is never decorative; it may appear only on small, gameplay-critical telemetry values and diagnostic labels.

## Design North Star

> The interface is the cockpit.  
> The story is the world.  
> The code is the player's action.  
> The AI is the Game Director.

For every screen, ask:

> Does this feel like the player is inside an emergency, or are we showing them a website?

If it feels like a website, remove chrome. If it feels like a coding platform, restore mission context. If the player can understand the stakes, act through code, and see the world respond, it belongs in RunTime Arena.

## Brand Personality

RunTime Arena should feel:

**cinematic · intelligent · tense · technical · premium · mysterious · responsive · game-native**

It must not feel like:

- a generic coding-practice site;
- a learning-management dashboard;
- a neon cyberpunk template;
- a SaaS analytics product;
- a chatbot wrapped around an editor.

The intended emotional promise is:

> **I am inside a system that needs me to act.**

## Visual Hierarchy

Always preserve this order:

```text
WORLD / INCIDENT
        ↓
STORY / STAKES
        ↓
SYSTEM TELEMETRY
        ↓
PLAYER ACTION / CODE
        ↓
SECONDARY CONTROLS
```

The terminal is important, but it must not visually erase the reason the code matters.

## Color System

### Base palette

The product chrome has exactly five colors.

| Name | Value | Token | Runtime Arena role |
|---|---:|---|---|
| Void | `#000000` | `--rt-void` | Page canvas, scene overlays, terminal shell, HUD background |
| Bone | `#FFFFFF` | `--rt-white` | Primary type, icons, active controls, high-contrast labels |
| Charcoal | `#444345` | `--rt-charcoal` | Filled controls and the single raised surface above Void |
| Frost | `#E2E2E2` | `--rt-frost` | Hairline borders, dividers, focus rings, underline marks |
| Ash | `#B8BAB9` | `--rt-ash` | Secondary copy, inactive telemetry, disabled and supporting states |

These five colors are used for all branding, navigation, cards, controls, overlays, login UI, module selection, and non-critical mission chrome.

### Gameplay telemetry exceptions

Chromatic color is allowed only when it communicates an immediate, functional game state.

| State | Value | Allowed use |
|---|---:|---|
| Critical | `#FF453A` | `CRITICAL`, `EXECUTION INTERRUPTED`, and text-only locked state |
| Warning | `#FFD60A` | `WARNING`, `SYSTEM REJECTED`, AI intervention label |
| Success | `#30D158` | Hull/system-restoration percentage value when operationally meaningful |
| System | `#64D2FF` | Oxygen/system percentage value when operationally meaningful |

Telemetry colors are component-local exceptions, not brand colors and not general-purpose global tokens.

Rules:

- Apply an accent to the status word, diagnostic label, icon, or numeric value only.
- Never tint a full panel, card, navigation element, scene, background, or button.
- Never use accents for links, branding, track labels, decorative dots, or hover states.
- Pair color with a label or symbol so state is never communicated by color alone.
- When in doubt, use Bone or Frost.

## Typography

### Display — Inter

RunTime Arena uses Inter as its production display face.

- **Weight:** `400` only for display and hero type
- **Hero size:** `80px` desktop
- **Hero line height:** `0.78`
- **Letter spacing:** normal
- **Role:** entry title, campaign module display heading, major mission title

The authority comes from scale and tight stacking, not bold weight. Do not use `600`, `700`, `800`, or `900` for display titles.

### Instrumentation — JetBrains Mono

JetBrains Mono is the production substitute for GT America Mono.

- **Weight:** `400` by default; `500` only for small emphasis
- **Sizes:** `10px` and `12px`
- **Line height:** `1.0` for labels, `1.3` for microcopy
- **Letter spacing:** `-0.02em` for quiet instrumentation
- **Role:** HUD, navigation, keybindings, telemetry, terminal labels, diagnostics

### Type scale

| Role | Size | Line height | Typeface |
|---|---:|---:|---|
| Hero display | `80px` | `0.78` | Inter 400 |
| Mission display | `48–64px` | `0.90` | Inter 400 |
| Heading | `30px` | `1.00` | Inter 400 |
| Small heading | `26px` | `1.15` | Inter 400 |
| Body | `16px` | `1.45` | Inter 400 |
| HUD / UI | `12px` | `1.00–1.30` | JetBrains Mono 400 |
| Caption | `10px` | `1.00` | JetBrains Mono 400 |

## Signature Underline Mark

Every display title uses the Runtime Arena underline mark.

- `1px` Frost line;
- positioned `0–4px` below the text line;
- begins at the left edge of the first glyph;
- extends `30–50%` of that individual line's width;
- never exceeds `60%`;
- never uses `text-decoration`;
- never appears under subtitles, body copy, or UI labels.

The title remains left-aligned. Each line owns its underline so the mark scales with the word, not the page container.

## Spacing and Shape

**Base unit:** `4px`  
**Density:** comfortable, technical, restrained

### Spacing scale

| Token | Value | Typical use |
|---|---:|---|
| `--space-1` | `4px` | micro gaps |
| `--space-2` | `8px` | icon/label gaps |
| `--space-3` | `12px` | compact controls |
| `--space-4` | `16px` | standard inset |
| `--space-5` | `20px` | card padding and component gaps |
| `--space-6` | `24px` | section grouping |
| `--space-8` | `32px` | panel padding |
| `--space-10` | `40px` | desktop viewport inset |
| `--space-16` | `64px` | large display separation |

### Radius system

The `2px / 10px / 20px` triad is the entire radius language.

| Element | Radius |
|---|---:|
| Buttons, nav controls, badges, inputs | `2px` |
| Cards and compact HUD blocks | `10px` |
| Large panels, overlays, terminal shell | `20px` maximum |

`border-radius: 9999px` is reserved for true circles such as status dots and loading spinners. Do not use oversized pills for ordinary controls.

## Surfaces and Elevation

| Level | Surface | Purpose |
|---|---|---|
| 0 | Void | Universal canvas and deepest terminal layer |
| 1 | Charcoal | Pressed-in interactive control or selected state |
| 2 | Ash | Rare disabled or muted material state |

Use surface contrast and 1px Frost hairlines before adding elevation effects. Scene lighting should create depth; UI chrome should feel printed onto black glass.

- Avoid decorative gradients.
- A mission scene may use a very subtle Void-to-Charcoal atmospheric gradient at low opacity.
- Never use a chromatic background wash.
- Avoid conventional drop shadows; if an overlay needs separation, prefer a border and backdrop contrast.

## Core Screen Architecture

### 1. Entry screen

The entry screen feels like a system booting into a dangerous world.

```text
SYSTEM BOOT // ARENA KERNEL

RUN
TIME
ARENA

CODE WITH PURPOSE. LEARN WITH ADVENTURE.

[ ENTER THE ARENA ]
```

- Use the stacked 80px display title with one underline per line.
- Keep the hero left-aligned.
- Render `ARENA`, login, badges, and dots in Bone/Frost only.
- Use one Charcoal primary action with a Frost border.
- Keep footer instrumentation quiet and subordinate.

### 2. Module selection

This is a campaign deck, not a course catalog.

```text
SELECT CAMPAIGN MODULE
────────────────

FLIGHT 101
// DSA TRACK              ACTIVE EMERGENCY
BEGINNER                  03 MISSIONS

CAPTAIN DOWN. SYSTEMS FAILING. YOU HAVE CONTROL.

[ ENTER MODULE ]
```

- The display heading uses Inter 400 and the signature underline.
- Track labels and active badges are Bone with Frost borders.
- Module cards use a 10px radius and thin neutral border.
- Locked cards remain monochrome and visually quieter.
- `CLASSIFIED` may use Critical red as restrained text only—never as a fill.

### 3. Mission scene

Every mission is a full-viewport incident.

```text
┌──────────────────────────────────────────────────────────┐
│ RUN TIME ARENA       MISSION 01       AI ◆ OBSERVING     │
│                                                          │
│                 CINEMATIC INCIDENT WORLD                 │
│                                                          │
│ FLIGHT 101                                               │
│ THE CAPTAIN IS UNRESPONSIVE.                             │
│                                                          │
│ [ ACCESS TERMINAL ]                                      │
│                                      O2 72%  HULL 91%    │
└──────────────────────────────────────────────────────────┘
```

- Artwork or environmental rendering reaches the viewport edge.
- The base scene remains Void with restrained Charcoal atmosphere.
- Story content sits lower-left; telemetry sits in corners.
- Show one primary action.
- Do not wrap the world itself in a card.

### 4. Terminal overlay

The terminal is the player's in-world control surface.

```text
SCENE
  ↓
ATMOSPHERE DARKENS
  ↓
TERMINAL SHELL OPENS
  ↓
EDITOR BECOMES ACTIVE
```

```text
┌──────────────────────────────────────────────────────────┐
│ SYSTEM TERMINAL                         MISSION 01        │
├───────────────────────────────────────┬──────────────────┤
│ CODE EDITOR                           │ DIRECTIVE        │
│                                       │                  │
│                                       │ AI DIRECTOR      │
├───────────────────────────────────────┴──────────────────┤
│ DIAGNOSTIC CONSOLE                                       │
│ > Terminal idle.                                         │
│                                                          │
│ [ EXECUTE VERIFICATION ]       [ ASK AI DIRECTOR ]       │
└──────────────────────────────────────────────────────────┘
```

- Use a 20px terminal shell and 2px internal controls.
- Keep the objective visible while coding.
- Keep panel backgrounds Void; separate areas with Frost hairlines.
- Diagnostics remain textual and in-world.
- A failure never becomes a browser/server error page.

### 5. AI Game Director

The AI Director is system instrumentation, not chat.

```text
AI GAME DIRECTOR        ▲ ATTENTION

Struggle detected. Starboard manifold pressure dropping.

ATTEMPTS: 02            HINT LEVEL: 01

[ REQUEST SYSTEM HINT ]
```

State sequence:

```text
OBSERVING
    ↓
ATTENTION
    ↓
INTERVENTION
    ↓
RECOVERY
    ↓
RESOLVED
```

- Observing, Recovery, and Resolved are monochrome.
- Attention may use Warning yellow on its label/icon only.
- Intervention may use Critical red on its label/icon only.
- AI copy should be concise, contextual, and tied to the mission state.
- Never use speech bubbles, avatars, chat history, or a message composer.

### 6. Mission debrief

The debrief is a system restoration report, not an analytics dashboard.

```text
MISSION COMPLETE

FLIGHT 101 / 01
FUEL ROUTING RESTORED

TIME              02:41
ATTEMPTS          02
EFFICIENCY        87%
AI INTERVENTIONS  01

AI DIRECTOR
“You stabilized the fuel system before the storm layer.”

[ CONTINUE ]
```

- Keep the panel monochrome.
- Use typography and spacing to create reward.
- Do not add confetti, neon glows, or colorful charts.
- Present progress as system telemetry.

### 7. Pilot login

Authentication is a clearance checkpoint inside the fiction.

- Use a 20px container, 2px inputs, and Charcoal actions.
- Keep validation errors Frost/Bone; login errors are not gameplay telemetry.
- Avoid social-product branding, provider-logo color, or decorative gradients.
- Preserve standard form accessibility and autocomplete behavior.

## Component Rules

### Top HUD

- Transparent or Void at restrained opacity.
- 1px bottom border in Frost at low opacity.
- Left: brand and mission identifier.
- Center: mission progression on wide screens.
- Right: AI Director state.
- JetBrains Mono, 10–12px, Bone/Ash.

### Buttons

- Charcoal fill, Bone label, 1px Frost border.
- 2px radius.
- Uppercase JetBrains Mono at 10–12px.
- Hover changes surface or text only; no glow and no chromatic color.
- Keyboard shortcut may appear as a small bordered suffix.

### Module cards

- Void surface.
- 10px radius.
- Frost border at low opacity; stronger on hover.
- 20px internal padding.
- One action aligned consistently across the grid.
- Locked state uses opacity and copy, not a colored fill.

### Narrative panels

- Use only when text needs reliable contrast over a scene.
- 20px maximum radius.
- Void surface with restrained transparency.
- Frost hairline border.
- Never make the panel larger than the story requires.

### Status indicators

- Always combine `symbol + explicit label`.
- Use a 2px control radius.
- Keep the surface and border monochrome.
- Apply an accent only to the symbol and label when the state is gameplay-critical.

## Voice and Copy

Copy is operational, immediate, and specific.

Prefer:

```text
EXECUTION INTERRUPTED
Runtime exception isolated in the flight computer.
Correct the fault and retry.
```

Avoid:

```text
Oops! Something went wrong.
Please try again later.
```

Rules:

- Use short system labels in uppercase.
- Use sentence case for explanatory narrative and AI guidance.
- State the consequence of failure without blaming the player.
- Translate technical errors into the mission fiction without hiding actionable details.
- Use `//`, brackets, mission numbers, and telemetry notation consistently.

## Motion

Motion communicates state; it is never ambient decoration.

| Interaction | Duration |
|---|---:|
| Button hover | `120–180ms` |
| Opacity change | `150–250ms` |
| Terminal open | `300–450ms` |
| Panel transition | `300–500ms` |
| Scene transition | `500–900ms` |
| Emergency shake | `250–450ms` |

- Use subtle narrative reveal/typewriter motion.
- Use screen shake only for meaningful execution failure or critical impact.
- Do not continuously flash, pulse, or animate every HUD element.
- Respect `prefers-reduced-motion`.

## Imagery

The world supplies cinematic depth; the interface supplies restraint.

- Use full-bleed mission environments: cockpit, vault, data center, orbital station.
- Favor high-detail, atmospheric, story-specific scenes.
- Let environmental light and weather establish urgency.
- UI overlays remain monochrome even when scene artwork contains color.
- Do not frame the world as a thumbnail, card, or dashboard widget.
- Avoid generic stock photography and decorative coding illustrations.

## Responsive Behavior

### Desktop

- Primary targets: `1280×800`, `1440×900`, `1920×1080`.
- Preserve full HUD, narrative panel, mission progression, and corner telemetry.
- Terminal uses a centered 20px shell with persistent objective context.

### Tablet

- Reduce display scale while retaining Inter 400 and tight leading.
- Collapse secondary telemetry before story or objective content.
- Allow the terminal context rail to stack when necessary.

### Mobile

- Keep the story scene primary.
- Make the terminal full-screen.
- Convert keyboard-only shortcuts into visible touch actions.
- Collapse HUD detail into essential status rows.
- Keep the primary action reachable without covering narrative text.

## Accessibility

Required:

- semantic headings, buttons, labels, and form controls;
- complete keyboard navigation;
- visible Frost focus states;
- WCAG-compliant contrast;
- `prefers-reduced-motion` support;
- no color-only communication;
- accessible labels for icon-only HUD controls;
- persistent mission objective while editing;
- readable error output that is not hidden by animation.

Critical states use:

```text
SYMBOL + LABEL + OPTIONAL COLOR
```

Never color alone.

## Implementation Tokens

```css
:root {
  /* Base chrome: the complete global color system */
  --rt-void: #000000;
  --rt-white: #FFFFFF;
  --rt-charcoal: #444345;
  --rt-frost: #E2E2E2;
  --rt-ash: #B8BAB9;

  /* Typography */
  --font-display: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --font-weight-display: 400;

  --text-display: 80px;
  --leading-display: 0.78;
  --text-mission: 56px;
  --leading-mission: 0.90;
  --text-heading: 30px;
  --text-body: 16px;
  --text-ui: 12px;
  --text-caption: 10px;

  /* Shape */
  --radius-control: 2px;
  --radius-card: 10px;
  --radius-panel: 20px;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-16: 64px;
}
```

Gameplay accent values remain local to `GameHUD`, `TerminalConsole`, `AIDirector`, and the text-only `CLASSIFIED` state. Do not add them to the global theme.

## Runtime Arena Component Map

```text
pages/
├── EntryPage.jsx
├── LoginPage.jsx
├── ModuleSelectPage.jsx
└── MissionPage.jsx

components/
├── common/
│   ├── Button.jsx
│   ├── StatusIndicator.jsx
│   └── TypewriterText.jsx
├── game/
│   ├── SceneView.jsx
│   ├── SceneNarrative.jsx
│   └── GameHUD.jsx
├── terminal/
│   ├── TerminalOverlay.jsx
│   ├── TerminalHeader.jsx
│   └── TerminalConsole.jsx
├── ai/
│   └── AIDirector.jsx
└── progression/
    ├── ModuleCard.jsx
    └── MissionDebrief.jsx
```

## Do / Don't

### Do

- Let the incident world occupy the viewport.
- Use monochrome UI for all product chrome.
- Set display titles in Inter 400 with tight leading.
- Apply the Frost underline mark to every display title.
- Use JetBrains Mono for instrumentation and terminal labels.
- Keep one clear primary action visible.
- Make AI responses feel like direction from the game system.
- Keep the mission objective visible while the player codes.
- Use semantic accents only for immediate gameplay telemetry.
- Show keybindings contextually and provide touch equivalents.

### Don't

- Do not use chromatic color for branding, navigation, buttons, cards, or backgrounds.
- Do not tint mission scenes red, blue, green, or purple.
- Do not use bold display type.
- Do not use radii outside the `2px / 10px / 20px` system.
- Do not turn the AI Director into a chat widget.
- Do not make a dashboard the primary experience.
- Do not let Monaco erase the story and objective.
- Do not use oversized pills, neon glows, or decorative gradients.
- Do not expose raw platform failures as the game experience.
- Do not require players to discover hidden keyboard shortcuts.

## Acceptance Checklist

Before shipping a screen, verify:

- [ ] The world or mission context has the highest visual priority.
- [ ] All non-telemetry UI uses only the five base colors.
- [ ] Any accent is attached to a functional label/value, never a surface.
- [ ] Display type is Inter 400 and no heavier.
- [ ] Every display title has a 1px, text-relative Frost underline.
- [ ] Controls/cards/panels use only 2px/10px/20px radii.
- [ ] The screen has one obvious primary action.
- [ ] Mission objectives remain available during code entry.
- [ ] Status remains understandable without color.
- [ ] Keyboard, touch, reduced-motion, and focus behavior are covered.

## Final Visual Formula

```text
CINEMATIC INCIDENT WORLD
          +
MINIMAL MONOCHROME CHROME
          +
SYSTEM INSTRUMENTATION
          +
REAL CODE AS PLAYER ACTION
          +
AI-DIRECTED REACTION
          =
RUN TIME ARENA
```
