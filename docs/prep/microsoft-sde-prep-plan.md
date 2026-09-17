# Microsoft SDE — 15-Week Preparation Strategy

**Akhil · Thu 17 Sep 2026 → Thu 31 Dec 2026 · Interviewing from Fri 1 Jan 2027**

Working assumption: 5+ yrs Java backend + React/Angular, employed full-time with 15+ hr office days, parallel AI learning commitment, EPAM/Entain loops still in flight.

---

## 0. The constraint this plan is built around

You told me four things, and they are more useful than any syllabus:

1. **15+ hour office days.** Time is the scarcest resource, not material.
2. **AI learning is already committed.** A second competing track will kill both.
3. **"When I take a break it was gone."** Your failure mode is *decay*, not *inability*.
4. **Weak across all four tracks** (DSA, LLD, HLD, behavioural).

So this plan optimises for **retention per hour**, not hours. Three consequences, and they are non-negotiable:

- **Volume target is deliberately small.** ~120–130 problems seen *three times each*, not 400 seen once. A problem you can't re-derive in December was never prep, it was entertainment.
- **There is a daily floor you can hit on your worst day** (25 minutes). The chain matters more than the session. A zero day costs you ~3 days of re-warming; a 25-minute day costs you nothing.
- **AI learning is folded into the plan, not run beside it.** Two of your twelve HLD designs are AI-systems designs, and the Microsoft Learn AI path doubles as HLD material. You get one track, not two.

**Total budget: ~9–13 hrs/week → ~150 hours across 15 weeks.** That is enough for Microsoft. It is not enough for Microsoft *if spent badly*, which is what the rest of this document is about.

---

## 1. What Microsoft actually tests

### The loop

| Stage | Format | What's scored |
|---|---|---|
| Recruiter screen | 30 min | Resume walkthrough, "why Microsoft", level calibration, comp / notice period |
| Phone or online screen | 45–60 min, 1–2 problems | Can you code cleanly and talk while doing it |
| Loop round 1–2 | 60 min each | DSA + problem solving |
| Loop round 3 | 60 min | Design — LLD at SDE II, HLD at Senior |
| **AA round ("As Appropriate")** | 60 min, senior/principal or hiring manager | Judgment, scope, culture, usually *one more* technical question. **This round can override the rest of the loop, in either direction.** |

India loops (IDC Hyderabad / Bangalore / Noida) frequently include a **machine-coding / LLD round** where you write real, compiling, testable OO code for 60–90 minutes. Plan for it.

### The bar, in practice

Microsoft weights **communication and clean code** more than raw algorithmic exotica. Compared to Google, the problems are *easier* and the expectations on how you get there are *stricter*:

- Restate the problem and confirm constraints before writing anything.
- State the brute force, state its complexity, then improve it — out loud.
- Write code that compiles in your head: real names, no pseudo-code hand-waving.
- **Dry-run your own solution on an example before they ask.** This single habit separates hires from no-hires at Microsoft more than any other.
- Volunteer the edge cases: empty, single element, duplicates, overflow, null.

### Culture signals the AA round is listening for

- **Growth mindset — "learn-it-all, not know-it-all."** The most-cited Microsoft value. Every "I didn't know X, here's how I closed the gap" story scores.
- **Customer obsession** — can you name the user of the thing you built and what changed for them?
- **One Microsoft** — collaboration across team boundaries, not heroics.
- **Accountability** — you owned an outcome, including a bad one.

### Level decision (you said "decide later" — here's the deadline)

Decide by **W10, ~28 Nov**, using mock performance as the evidence:

- **Senior SDE (L63)** if by then: HLD mocks land cleanly (you drive the 45 minutes without prompting), and you have ≥2 stories of impact *beyond your own team*.
- **SDE II (L62)** otherwise. With 5 yrs this is a strong, clean fit and a faster loop.

Do **not** self-downgrade in the recruiter screen. State your experience, let the recruiter calibrate, and say you're open to the level that matches the team. Applying at SDE II and getting down-levelled hurts; being calibrated up costs nothing.

---

## 2. The operating system (read this twice — it is the actual plan)

The calendar below is worthless without this section. Everything here exists to solve *"when I take a break it was gone."*

### The gears

| Gear | When | Duration | Content |
|---|---|---|---|
| **FLOOR** | Every single day, no exceptions | **25 min** | 10 min spaced-repetition review (2 old problems) + 15 min on one new problem |
| **STANDARD** | Normal weekday | **60–75 min** | Floor + 1–2 new problems, or 1 problem + 1 concept |
| **ANCHOR** | One weekend day (Sat *or* Sun — pick whichever is freer that week) | **3–4 hrs** | Design: LLD → HLD, later mocks |
| **REVIEW** | Sunday night | **20 min** | Weekly review ritual (§11) + one behavioural story |

Weekday work is **always DSA**. Weekend work is **always design**. You never have to decide what to do — deciding is where tired people lose.

### Rule 1 — Never zero

On a 15-hour office day you do the 25-minute floor. At 11:40 PM if that's what's left. It is not about the 25 minutes; it is about never paying the re-entry cost again.

### Rule 2 — Log every problem the same day

One line, in `microsoft-prep-log.md` (created alongside this file):

```
2026-09-21 | 3. Longest Substring Without Repeating | sliding-window | 22m | SOLVED-hint | shrink left only while the dup is still inside the window
```

The last field — **one sentence of insight** — is the entire point. It is what you re-read in December. "Solved it" is not an insight.

### Rule 3 — Spaced repetition, +3 / +10 / +30

Every solved problem gets re-surfaced at **3 days, 10 days, 30 days**.

A review is **not** a re-solve. It is 4–5 minutes:

1. Read the title only. State the approach out loud in under 2 minutes.
2. Write the *core loop or recurrence* from memory — 5–10 lines, not the whole solution.
3. Check against your logged insight.
4. Only if you fail step 1 do you re-solve it fully, and it re-enters the queue at +3.

**This is the mechanism that fixes your stated problem.** Skipping reviews in order to do new problems is the single most common way people in your situation waste 150 hours.

### Rule 4 — The two-strike rule

Two consecutive missed floors → one mandatory 90-minute weekend catch-up. That's the whole penalty. **You do not restart the plan, you do not "go back to week 1", you do not feel bad about it.** The restart instinct is what has been costing you months.

### Rule 5 — One resource per track

DSA: NeetCode / Blind 75. LLD: Refactoring Guru + one book. HLD: Alex Xu Vol 1. Behavioural: your own Part 09 §8. Opening a second resource for a track is procrastination wearing a productive costume.

### Rule 6 — AI is not allowed to solve first

Use an AI assistant to generate test cases, critique your written solution, rubber-duck a design, and run mock interviews. **Never** to get the approach before you've spent 15 real minutes on it. The 15 minutes of struggle *is* the encoding.

---

## 3. The 15-week calendar

Four phases. Weekdays carry DSA, weekends carry design, all the way through — the phases describe where the *weight* sits.

| Phase | Dates | Weeks | Theme |
|---|---|---|---|
| **0 — Reset & Ignition** | 17 Sep – 4 Oct | W0–W2 | Install the habit, baseline diagnostic, DSA foundations, resume |
| **1 — Core Build** | 5 Oct – 22 Nov | W3–W9 | DSA patterns (weekdays) + LLD (weekends) |
| **2 — Systems** | 23 Nov – 13 Dec | W10–W12 | DSA maintenance + Microsoft-tagged sets + HLD (weekends) |
| **3 — Loop Simulation** | 14 Dec – 27 Dec | W13–W14 | Mocks, AA round, weak-spot repair |
| **4 — Taper** | 28 Dec – 31 Dec | W15 | Light warm-up, logistics, rest |

### Week by week

| Wk | Dates | Weekday DSA | Weekend Anchor | Milestone |
|---|---|---|---|---|
| W0 | Thu 17 – Sun 20 Sep | Entain round Fri 18. Then: set up the log, run the **baseline diagnostic** | Read §2 twice. Set up the LeetCode list and the daily calendar block | Habit system live |
| W1 | 21 – 27 Sep | Arrays & hashing; two pointers | LLD fundamentals: SOLID, composition over inheritance, writing testable OO Java | Resume v1 draft |
| W2 | 28 Sep – 4 Oct | Sliding window; binary search (including on the answer) | Design patterns block 1: Strategy, Factory, Builder, Observer | **Resume v1 done** |
| W3 | 5 – 11 Oct | Strings; stacks, queues, monotonic stack | **LLD 1: Parking Lot** (full code, 90 min, then self-review) | — |
| W4 | 12 – 18 Oct | Linked lists; fast/slow pointers | **LLD 2: LRU + LFU cache** (bridges DSA and LLD) | **LinkedIn + resume final** |
| W5 | 19 – 25 Oct | Trees & BST: traversals, LCA, serialize, path sums | **LLD 3: Rate limiter** (token bucket + sliding window) | — |
| W6 | 26 Oct – 1 Nov | Heaps, top-K, intervals, greedy, custom sort | **LLD 4: Elevator system** + **Mock #1 (DSA)** | Shortlist 5–8 MS teams |
| W7 | 2 – 8 Nov | **LIGHT WEEK — floor only.** Graphs I: BFS/DFS, grids, islands | Diwali falls around 8 Nov. **90 min minimum**: design patterns block 2 — State, Command, Decorator, Adapter | Survive, don't sprint |
| W8 | 9 – 15 Nov | Graphs II: topological sort, union-find, Dijkstra basics; backtracking | **LLD 5: Vending machine / ATM** (state machine) + **Mock #2 (LLD)** | **Referral asks sent** |
| W9 | 16 – 22 Nov | DP: 1D (climb / rob / coin / LIS / word break) + 2D basics (grid paths, edit distance) | **LLD 6: Splitwise** | — |
| W10 | 23 – 29 Nov | Microsoft-tagged mixed set #1, timed 35 min each + review backlog | **HLD 1: URL shortener** (estimation drill) + **HLD 2: Distributed rate limiter** + **Mock #3 (DSA)** | **APPLY. Level decision made.** |
| W11 | 30 Nov – 6 Dec | Mixed set #2 — timed, random order, no topic hints | **HLD 3: Chat system** (WebSockets, presence, fan-out) + **HLD 4: Notification service** | Recruiter-screen window opens |
| W12 | 7 – 13 Dec | Mixed set #3 + targeted repair of your two worst patterns | **HLD 5: OneDrive / file sync** + **HLD 6: Search typeahead** + **Mock #4 (HLD)** | — |
| W13 | 14 – 20 Dec | Review backlog only + 1 new problem/day | **HLD 7: Booking system** + **HLD 8: Metrics pipeline** + **HLD 9: RAG Q&A system** · **2 mocks** | Behavioural bank complete |
| W14 | 21 – 27 Dec | Review backlog + timed warm-ups | **HLD 10: LLM inference platform** · **Sat 26 Dec: FULL LOOP SIMULATION — 4 back-to-back rounds in one day** | The highest-value day in this plan |
| W15 | 28 – 31 Dec | 2 easy problems/day to stay warm. Nothing new. | Re-read every logged insight. Sleep. Logistics check. | **Ready 1 Jan** |

---

## 4. Track A — DSA

### The spine

**Blind 75 is the spine. ~50 Microsoft-frequent problems are the extension.** ~125 problems total, each seen three times. Do not add a third list.

Get **LeetCode Premium for Nov + Dec only** (~2 months). The value is the *Microsoft-tagged, last-6-months, sorted-by-frequency* filter for Phase 2. It is not worth paying for in September.

### Pattern curriculum (weekday track)

| Pattern | Week | Must-own problems |
|---|---|---|
| Arrays & hashing | W1 | Two Sum · Group Anagrams · Product Except Self · Top K Frequent · Valid Anagram |
| Two pointers | W1 | Container With Most Water · 3Sum · Trapping Rain Water · Valid Palindrome |
| Sliding window | W2 | Longest Substring Without Repeating · Minimum Window Substring · Longest Repeating Character Replacement · Sliding Window Maximum |
| Binary search | W2 | Search in Rotated Sorted Array · Find Minimum in Rotated · Koko Eating Bananas · Median of Two Sorted Arrays |
| Strings | W3 | Reverse Words in a String · String Compression · Longest Palindromic Substring · Valid Parentheses · Roman to Integer |
| Stacks / monotonic | W3 | Min Stack · Daily Temperatures · Largest Rectangle in Histogram · Evaluate RPN |
| Linked lists | W4 | Reverse Linked List · Reverse Nodes in k-Group · Merge k Sorted Lists · Linked List Cycle · Copy List with Random Pointer · Add Two Numbers |
| Design-a-data-structure | W4 | LRU Cache · LFU Cache · Implement Trie · Design Twitter · Insert Delete GetRandom O(1) |
| Trees & BST | W5 | Level Order · Right Side View · LCA (binary tree and BST) · Validate BST · Serialize/Deserialize · Diameter · Path Sum III · Kth Smallest in BST |
| Heaps / top-K | W6 | Kth Largest Element · Merge k Sorted Lists · Find Median from Data Stream · Task Scheduler |
| Intervals & greedy | W6 | Merge Intervals · Insert Interval · Non-overlapping Intervals · Meeting Rooms I/II · Jump Game |
| Graphs I | W7 | Number of Islands · Clone Graph · Rotting Oranges · Word Ladder · Pacific Atlantic · Surrounded Regions |
| Graphs II | W8 | Course Schedule I/II · Alien Dictionary · Number of Connected Components · Redundant Connection · Network Delay Time |
| Backtracking | W8 | Subsets · Permutations · Combination Sum · Word Search · N-Queens |
| DP | W9 | Climbing Stairs · House Robber I/II · Coin Change · LIS · Word Break · Unique Paths · Edit Distance · LCS · Maximum Product Subarray |

### Microsoft's own favourites — make sure these are in the set

Reverse Words in a String · Copy List with Random Pointer · LRU Cache · Serialize/Deserialize Binary Tree · Spiral Matrix · Rotate Image · Set Matrix Zeroes · Valid Parentheses · Merge Intervals · Add Two Numbers · Trie + word search · Find Median from Data Stream · Design Tic-Tac-Toe · Populating Next Right Pointers · Excel Sheet Column Number · String Compression.

Microsoft leans on **arrays, strings, linked lists, trees and "design this data structure"** far more than hard DP or exotic graph algorithms. Weight accordingly — do not spend three weeks on DP because it feels impressive.

### How a weekday session runs (the 60-minute version)

```
0:00–0:10  Reviews: 2 problems from the +3/+10/+30 queue
0:10–0:12  Read the new problem. Restate it in your own words, out loud.
0:12–0:27  Solve — no editorial, no AI, no hints. Brute force counts.
0:27–0:35  If stuck: editorial. Read only until the key idea, then CLOSE IT and code.
0:35–0:50  Code it properly. Real names. Then DRY-RUN IT BY HAND.
0:50–0:55  Second problem of the same pattern, or optimise the first.
0:55–1:00  Log it. One line. Including the insight sentence.
```

Two things you are not allowed to skip: the **hand dry-run** and the **log line**.

---

## 5. Track B — LLD / machine coding (weekends, Oct–Nov)

### The six builds

1. **Parking Lot** (W3) — the canonical one. Vehicle types, spot allocation, pricing strategy, ticketing.
2. **LRU + LFU cache** (W4) — doubles as a DSA problem. Write it as production code: generics, a thread-safety discussion, eviction policy as a strategy.
3. **Rate limiter** (W5) — token bucket and sliding-window log. Discuss where it lives (in-process vs. distributed) — this is your bridge into HLD 2.
4. **Elevator system** (W6) — the hardest scheduling one. State machine + request dispatch policy.
5. **Vending machine / ATM** (W8) — pure State pattern. Fast, high return.
6. **Splitwise** (W9) — modelling and settlement. Tests domain modelling more than patterns.

Stretch, only if the calendar allows: text editor with undo/redo (Command), notification service (Observer + Strategy), in-memory KV store with TTL.

### The patterns you must be able to *write*, not just name

Strategy · Factory / Abstract Factory · Builder · Observer · State · Command · Decorator · Adapter · Template Method · Singleton — **and be ready to explain why you'd usually avoid Singleton** (testability and hidden global state).

### The rubric you're being scored against

- **Working code first.** A running, ugly, complete solution beats a beautiful half-finished abstraction. Every time.
- **Clear domain model.** Nouns become classes and the relationships are obvious from the code.
- **Extensibility demonstrated, not claimed.** "If we add EV charging spots, only this enum and this strategy change" — then show it.
- **Testability.** Constructor injection, no `new` buried in business logic, no static state. Write at least one test or a `main` that exercises the happy path plus one edge case.
- **Concurrency addressed.** You don't have to implement it, but you must say where the race is and what you'd use.
- **No over-engineering.** Six interfaces for a parking lot is a red flag, not a green one.

### The 90-minute LLD drill

```
0:00–0:10  Requirements + an explicit out-of-scope list. Write both down.
0:10–0:20  Core entities and relationships. Sketch it.
0:20–0:30  Identify the 1–2 places that will change → put a pattern there. Only there.
0:30–1:10  Code it. Compiling Java. Real.
1:10–1:20  main() or a test exercising the happy path + one edge case.
1:20–1:30  Self-review out loud: extensibility, concurrency, what you'd do with more time.
```

---

## 6. Track C — HLD / system design (weekends, Nov–Dec)

### The ten designs

| # | Design | Core lesson |
|---|---|---|
| 1 | URL shortener | The estimation ritual. Hashing vs. counter. Read-heavy caching. |
| 2 | Distributed rate limiter | Shared state, Redis, cell-based counters, race conditions |
| 3 | Chat system (Teams / WhatsApp) | WebSockets, connection registry, presence, fan-out, ordering, offline delivery |
| 4 | Notification service | Queues, retries, idempotency, dedupe, fan-out to push/email/SMS, dead-letter queues |
| 5 | OneDrive / file sync | Chunking, dedupe, metadata vs. blob split, conflict resolution, delta sync |
| 6 | Search typeahead | Trie at scale, ranking, sharding by prefix, cache warming |
| 7 | Booking system (tickets / seats) | **Strong consistency**: locking, reservations with TTL, idempotency keys, double-booking |
| 8 | Metrics & monitoring pipeline | Time-series storage, pre-aggregation, cardinality, hot path vs. cold path |
| 9 | **RAG document Q&A system** | Chunking, embeddings, vector store, retrieval quality, evaluation, cost per query |
| 10 | **LLM inference serving platform** | Batching, KV cache, GPU autoscaling, queueing, quotas, streaming, guardrails |

**#9 and #10 are where your AI learning lives.** They are not filler — at Microsoft in 2027 an engineer who can reason about retrieval quality, token cost and GPU scheduling is materially more hireable than one who can only shard a database. The Microsoft Learn AI path feeds directly into these two, so studying it counts as prep, not as a distraction.

### The 45-minute framework — run it the same way every time

```
0:00–0:05  Functional requirements (3–5, numbered). Non-functional (latency, availability,
           consistency, scale). Explicitly name what you're NOT building.
0:05–0:10  Capacity estimates. DAU → QPS → storage/year → bandwidth. Say the numbers out loud.
0:10–0:15  API surface (3–4 endpoints) + core data model.
0:15–0:25  High-level architecture. Draw it. Client → LB → service → store, plus queues/cache.
0:25–0:38  DEEP DIVE — pick the interesting component yourself, or ask which one they want.
           This is where the round is won or lost.
0:38–0:43  Scale & failure: sharding key and why, hot keys, replication, cache invalidation,
           what breaks first under 10x, how you'd detect it.
0:43–0:45  Trade-offs you made and what you'd revisit with more time.
```

**The most common failure is drifting.** Announce the phase you're entering — "let me size this before I draw anything" — and the interviewer will follow you instead of interrupting you.

### Capacity math you should never have to derive live

- 1 day ≈ 86,400 s ≈ **10⁵ s**. So 1 M requests/day ≈ **12 rps**; 100 M/day ≈ **1,160 rps**.
- Peak = **3–5×** average. Design for peak, cost for average.
- 1 KB × 1 M = **1 GB**. 1 KB × 1 B = **1 TB**.
- One commodity DB node: ~**1–5 K writes/s**, ~**10–50 K reads/s** with a cache in front. Above that, shard.
- Redis node ≈ **100 K ops/s**. Kafka partition ≈ **10 MB/s**.
- Latency reference: L1 ~1 ns · RAM ~100 ns · SSD ~100 µs · in-datacentre round trip ~500 µs · cross-continent ~150 ms.

### Concepts to be fluent in, not merely aware of

Sharding strategies and the resharding problem · consistent hashing · replication and leader election · CAP in practice (what you actually give up) · quorum reads and writes · caching patterns (cache-aside, write-through, write-behind) and invalidation · idempotency, and why exactly-once is a lie · message queues vs. event logs · CDC and the outbox pattern · backpressure · circuit breakers · rate limiting · bloom filters · CDNs · blue-green vs. canary deploys.

**Reading discipline:** Alex Xu Vol 1 cover to cover — it's short. *Designing Data-Intensive Applications* **only chapters 1–3, 5–7 and 9**; reading it end to end is a classic three-month detour.

---

## 7. Track D — Behavioural / the AA round

This is the round most engineers under-prepare, and it is the round that can reverse the whole loop.

### Your twelve stories

You already have **`09-epam-sde3-technical-and-managerial.md` §8** — an unfilled 16-story STAR evidence inventory. Fill it. Reuse it. Do not start a new document.

The twelve Microsoft needs:

1. Hardest technical problem you've solved
2. A failure you owned, and what changed in how you work
3. Disagreed with your manager or a senior engineer
4. Conflict with a peer, and how it resolved
5. Influenced a decision without authority
6. Led a project end to end
7. Tight deadline — how you cut scope and what you told stakeholders
8. A production incident you owned (detection → mitigation → prevention)
9. Mentored someone
10. **Learned something unfamiliar, fast** ← the growth-mindset story. Microsoft cares about this one most.
11. Pushed back on a requirement because it was wrong for the customer
12. An ambiguous problem with no clear owner that you picked up

### The rule that makes these work

**Every story ends in a number.** "Improved performance" is noise. "p99 went from 1.8 s to 240 ms, and support tickets for timeouts dropped from ~40/week to 3" is a hire signal. If you cannot find a number, find a *scale*: how many users, how many services, how much money, how many people on the team.

Write them at **120–150 words each** (≈90 seconds spoken). Situation one sentence, Task one sentence, **Action four to five sentences — this is where the technical depth goes**, Result with the number, then one line on what you'd do differently.

**Schedule:** one story per Sunday review slot from W1 onwards. Twelve weeks, twelve stories, twenty minutes each. Done by W13 without ever feeling like work.

### Questions to have ready for them

Ask about the team's on-call load, how they decide what to build, the last thing they shipped that didn't work, and how the team uses AI internally. Asking nothing is a scored negative.

---

## 8. Track E — Java / Spring maintenance (30 min × 2 per week)

**Be clear about this: Microsoft's coding rounds are language-agnostic and do not test Spring Boot.** This track exists purely to keep your *other* pipelines warm — EPAM, Entain, and whatever comes next — because those rounds do test it, and you said juggling that has been the hard part.

- Two 30-minute slots a week, using the existing **`interview-prep.html`** kit in this repo. It is already built; do not rebuild it.
- Rotate: concurrency & the memory model → Spring Boot internals → JPA/SQL → Java 8–21 features → microservices patterns.
- If a live interview at another company is inside 7 days, this track temporarily outranks everything except the DSA floor.

---

## 9. Mocks — the part you will be tempted to skip

Interview skill is a *separate* skill from problem-solving skill. Solving 200 problems alone teaches you nothing about thinking out loud while someone watches.

| When | Mock | Focus |
|---|---|---|
| W6, ~31 Oct | DSA #1 | Baseline. Expect it to go badly. That's the point. |
| W8, ~14 Nov | LLD | Machine coding under time pressure |
| W10, ~28 Nov | DSA #2 | Measure the delta from #1 |
| W12, ~12 Dec | HLD | Driving 45 minutes without prompts |
| W13 | DSA #3 + HLD #2 | Two in one weekend |
| **Sat 26 Dec** | **FULL LOOP: 4 rounds, one day** | Stamina. This is what actually breaks people. |

Sources, in order of value: an engineer in your network who has interviewed candidates → interviewing.io / Pramp / Exponent → **me, in this repo** (I'll play interviewer, hold the clock, and mark you against the Microsoft rubric — say the word and we'll run one).

The full-loop simulation on 26 Dec is the highest-leverage four hours in this entire plan. Protect it.

---

## 10. Application & logistics track

To *interview* from 1 Jan, work backwards:

| By | Action |
|---|---|
| **W2 · 4 Oct** | Resume v1. Impact-first bullets, every one with a number. Kill the responsibilities-list format. |
| **W4 · 18 Oct** | Resume final + LinkedIn updated — headline, about, current role. Recruiters search LinkedIn. |
| **W6 · 1 Nov** | Shortlist 5–8 Microsoft roles — IDC Hyderabad / Bangalore / Noida. Map each to your stack. Azure, M365, Experiences+Devices and the AI orgs all hire Java/backend. |
| **W8 · 15 Nov** | Referral asks out. Second-degree LinkedIn, ex-colleagues, alumni. A referral gets your resume *read*; it does not get you hired. Send 5, expect 2. |
| **W10 · 23–29 Nov** | **Apply.** In the first recruiter conversation, state clearly: *"I'm available to interview from the first week of January."* |
| **W11–W13** | Recruiter-screen window. Be ready from 30 Nov — 30 minutes, resume walkthrough, why Microsoft, notice period, comp expectations. |
| **Dec** | Take **1–2 real interviews at other companies** as rehearsal. Live reps beat mocks. |
| **Jan** | Phone screen → loop. |

**Decide this now, not in the moment:** if a recruiter pushes for a December slot, accept a *phone screen* — you'll be DSA-ready from ~1 Dec — but ask to schedule the *loop* for mid-January. Recruiters accommodate this routinely. Improvising that decision while a recruiter waits on the phone is how people end up in a loop three weeks early.

---

## 11. The weekly review ritual (Sunday, 20 min)

Non-optional. Write it in the log file.

1. **Count:** floors hit /7 · new problems · reviews cleared · design sessions
2. **Cold-start rate:** of this week's +30d reviews, what fraction could you state the approach for in under 2 minutes? *This is your real progress metric.*
3. **Worst pattern this week** — one line.
4. **Next week's single focus** — one line.
5. **Write one STAR story** (§7).

### Targets

| Metric | Target |
|---|---|
| Floors hit | ≥ 6 / 7 |
| New problems | 6–7 per week |
| Reviews cleared | ≥ 10 per week |
| Design sessions | 1 per week |
| **Cold-start success rate by 15 Dec** | **> 70%** |

If cold-start rate drops under 50% in any week, **stop adding new problems for a week and clear the review backlog.** Retention is the goal; new problems are just the raw material.

---

## 12. Failure modes — decide now, not when you're tired

| What happens | What you do |
|---|---|
| Brutal office week | Floor only, all seven days. Keep the weekend anchor at **90 min minimum**. Do not reschedule the plan. |
| Missed an entire week | **Do not restart. Do not double up.** Resume the current week as written; add the missed topic to the W12 repair list. |
| Feeling behind in December | Cut in this order: HLD #9–10 → LLD #6 → the Java/Spring track. **Never cut mocks or the review backlog.** |
| Motivation gone | Do the floor anyway, for three days. Here, motivation follows action; it does not precede it. |
| Another company's offer lands in Nov/Dec | Good — negotiate the start date, and use their loop as free Microsoft practice. An offer in hand is leverage, not a reason to stop. |
| Recruiter pushes the loop into December | Phone screen yes, loop no. See §10. |

---

## 13. What "ready" looks like on 31 Dec

- [ ] ~125 problems solved, each reviewed **three** times; cold-start rate above 70%
- [ ] Any Blind-75 problem: approach stated in under 2 min, coded in under 25
- [ ] 6 LLD problems written as compiling, tested Java; 10 design patterns writable from memory
- [ ] 10 HLD designs run end to end in 45 min, including the 2 AI-systems designs
- [ ] 12 STAR stories written, each ending in a number, each under 150 words
- [ ] 7+ mocks done, including one full four-round loop day
- [ ] Applied, referred, recruiter screen done, loop scheduled
- [ ] A streak you did not break

---

## 14. Start here — the next 72 hours

1. **Tomorrow, Fri 18 Sep:** Entain round. Nothing else. Use `entain-sde2-prep.html`.
2. **Sat 19 Sep:** Read §2 of this document twice. Open `microsoft-prep-log.md`. Block 25 minutes in your calendar as a recurring daily event, named something you won't feel able to decline.
3. **Sun 20 Sep:** Baseline diagnostic. Four problems, timed, no help, logged brutally honestly:
   - Two Sum (easy — should be under 10 min)
   - Longest Substring Without Repeating Characters (medium)
   - Binary Tree Level Order Traversal (medium)
   - Number of Islands (medium)

   Whatever the result, log it. That number on 20 Sep is what you compare against on 31 Dec.
4. **Mon 21 Sep:** W1 begins. Arrays & hashing. 25 minutes minimum.

The plan starts at 25 minutes on a Monday. That's the whole trick.
