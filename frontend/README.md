# InterviewKit

A local-first interview preparation app. Every topic, question, follow-up and
company brief lives here as typed data; the UI is a thin reader over it.

Lives inside the tracker service and is served by it at **/prep**, same origin
as the API it calls — so no CORS, one deployable, one sign-in.

```bash
npm install
npm run extract    # regenerate the bank from source/interview-prep.html
npm run build      # writes into ../src/main/resources/static/prep
npm run dev        # hot reload at http://localhost:3000/prep/, proxying /api to :8080
```

`src/main/resources/static/prep` is committed on purpose. The Dockerfile builds
it in a Node stage, but committing the output means a plain `mvn spring-boot:run`
on a fresh clone still serves the app instead of 404ing — worth the diff noise
for a one-person project. Re-run `npm run build` after changing anything here.

## Why a repo instead of the HTML kits

The old `interview-prep.html` was a 1 MB single file — good for reading, bad for
everything else: no search across parts, no progress, no way to add a question
without splicing markup in five places. Here, adding a question is one object in
a data file.

The HTML kits are still the *source* for the legacy bank. They are not deleted,
and `npm run extract` regenerates from them.

## The interaction model

A **workspace shell** everywhere — icon rail, a list pane, a detail pane, and a
**third column** for drilling in without losing your place: a topic opened from
a company stays inside that company, a question opened from a topic sits beside
its list. Each pane scrolls independently; the page itself never scrolls.

Panes are **draggable and collapsible**. Drag a divider to resize, double-click
it to reset, arrow-key it for fine control; the list pane collapses to a 26px
stub. Widths persist in `localStorage` under `prep-panes-v1`. The detail pane is
never squeezed below 300px, so a drag cannot break the layout.

Below 1180px there is no room for three columns, so the third takes the detail
slot. Below 900px the rail becomes a bottom tab bar and the panes become a
stack — verified at 414px with no horizontal overflow.

A **full-screen drill** on top of it for actual studying: one card, `Space` to
reveal, `1`/`2` to grade and advance, `J`/`K` to move, `S` to star, `Esc` out.
Grading ten cards is three clicks and twenty keypresses instead of sixty clicks.

**There is no category page.** The list pane groups every topic under
collapsible category headers, so any topic is one click from any other.

### Keyboard

| Key | Does |
|---|---|
| `⌘K` / `Ctrl+K` | Command palette — topics, companies, plan weeks, questions, drill actions |
| `1`–`8` | Jump to a section |
| `←` / `→` | Step an animation back / forward |
| `F` | Play the current animation full screen (`Esc` to exit) |
| `Space` | Reveal the answer (in a drill) |
| `1` / `2` | Had it / Gone — grades and advances |
| `J` / `K` | Next / previous card |
| `S` | Star the current card |
| `Esc` | Leave the drill or the palette |

## What's in it

| Section | What it holds |
|---|---|
| **Tonight** | One screen. Tonight's task, a 25-minute timer whose Start button also opens the drill on your due cards, a 30-day chain strip, this week's challenge. Loads without the question bank. |
| **Plan** | The 16-week Microsoft campaign. List of weeks, detail tabbed into *The work* and *Problems* with a solved counter. |
| **Topics** | Every topic grouped by category in the list; detail tabbed into *Questions* and *Reference*, with a Drill button per topic. |
| **Companies** | Per-employer, tabbed into *The loop* (rounds, what they weight, intelligence) and *Material*. Microsoft, Entain, EPAM. |
| **Review** | The +3 / +10 / +30 queue, filtered Due / Missed / Starred / All, with *Drill all*. |
| **Visuals** | Nine steppable animations, opening with **The whole picture** — a map holding every other one in its place, with clickable zones. Then: how Java runs, HashMap and collisions, collections vs concurrent collections, streams/Collectors/parallel, threads/races/locks, the object lifecycle through Eden/survivors/tenured, how the JVM loads and runs a class, and the four collectors drawn as pause shape. Each carries the questions it answers plus video links. |
| **Starred** | Your shortlist — starred questions plus bookmarked topics, weeks and companies. Separate from the ladder on purpose: the ladder decides what is *due*, this decides what *matters*. |
| **Search** | Across all 606 questions, prompts and answers, drillable as a set. |

## Content model

Everything is in `src/types.ts`. The shapes that matter:

```ts
Category   // coarse area — dsa, java, spring, design, web, behavioural, company
Topic      // a section within a category; questions hang off it
Question   // prompt + answerHtml + followUps[] + tags + askedBy[]
Note       // prose reference (the legacy parts 3, 5 and 8 are this)
Company    // rounds, focus areas, intelligence, topics to drill
Plan       // a dated campaign: weeks, challenges, boss fights, rules
```

### Adding a question by hand

`src/data/index.ts` exports `authoredQuestions` — an empty array that merges
with the generated bank. Add to it:

```ts
export const authoredQuestions: Question[] = [
  {
    id: 'ms-lru-1',
    topicId: 'dsa--design-ds',
    categoryId: 'dsa',
    prompt: 'Design an LRU cache with O(1) get and put.',
    answerHtml: '<p>HashMap for lookup, doubly linked list for recency…</p>',
    followUps: [
      { q: 'How would you make it thread-safe?', a: '<p>…</p>' },
      { q: 'What changes for LFU?', a: '<p>…</p>' },
    ],
    tags: ['cache', 'design'],
    askedBy: ['microsoft'],
    difficulty: 'medium',
  },
]
```

### Adding a company

Append to `src/data/companies.ts`. Topics become company-specific by setting
`companyId` on them; they then appear under that company as well as their
category.

### Adding an animation

`src/pages/Visuals.tsx` holds the `VISUALS` array (title, the questions it
answers, video links); the animation itself is a component under
`src/components/visuals/` that builds an array of frames and hands it to
`useFrames` + `Stage`. Frames are precomputed and deterministic — no randomness,
so the narration reads the same every time and stepping backwards works.

`render` receives a navigator, so an animation can link to another one — that is
how the zones in **The whole picture** open the animation that expands them.

### Testing the animations

```bash
npm run test:visuals
```

Mounts each animation under jsdom, drives the controls, and asserts the step
counter advances on step and across successive played frames, then that full
screen toggles on, keeps playing, and toggles back off. Run it after
touching `Stage.tsx` — the player is shared by all six.

### Adding a category or topic

`src/data/categories.ts` and `src/data/dsa.ts`. Generated topics come
from the extractor and should not be hand-edited.

## The extractor

```bash
npm run extract
```

Reads `../interview-prep.html` and writes `src/data/generated/`
(`topics.ts`, `questions.ts`, `notes.ts`). Currently: **158 topics, 606
questions, 110 reference notes**, across 12 legacy parts.

A qa card is closed by its own `</section>` and never nests one, so each card is
sliced at that closer. Slicing to the next heading instead — as the first
version did — swallowed the trailing `</div></section>` into `answerHtml`, and
that unbalanced `</div>` closed the prose container early and broke the layout.
Prose sitting after the last card in a section is captured as a `-tail` note
rather than glued onto the answer above it.

The mapping from legacy part to category is the `PART_CATEGORY` table at the top
of `scripts/extract-legacy.mjs`. Parts 9 and 10 are filed to EPAM, part 12 to
Entain.

Everything under `src/data/generated/` is disposable — never edit it by hand, it
is overwritten on the next run.

## Progress

Stored in `localStorage` under `prep-progress-v1`: daily check-ins, solved
problem slugs, passed challenges, spaced-repetition state per question, starred
questions, and bookmarks. It is per-browser and never leaves the machine.

Bookmarks on non-question things are keyed `topic:<id>`, `week:<n>`,
`company:<id>` in `progress.bookmarks`; starred questions are question ids in
`progress.starred`.

## Stack

Vite 6 · React 19 · TypeScript · Tailwind v4 · React Router 7 (hash routing, so
a production build also works opened straight off disk).

## Still to do

- Follow-up questions are modelled but empty in the generated bank — the legacy
  HTML has no separate markup for them. They need adding by hand where they matter.
- `askedBy` is unset on generated questions, so cross-company tagging is manual
  for now.
- The DSA category has topics but no questions; the problems live on the plan
  weeks and link out to LeetCode.
