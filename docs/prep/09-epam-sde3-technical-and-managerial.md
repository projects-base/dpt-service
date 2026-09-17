# Part 9 — EPAM SDE3: The Technical Round &amp; The Managerial Round

> Two rounds, two different bars. The **TR** checks whether you're technically a Senior/Lead — fundamentals answered at depth, plus evidence you've driven engineering decisions. The **MR** checks **how you tackle projects and teams**: your delivery method, how you handle requirements and risk, and how you work with the people around you.
> At SDE3 the questions barely change from a mid-level interview. What changes is the **expected shape of the answer**: scope, trade-offs, ownership, and outcome. That's what this part drills.

---

## 1. What each round is actually scoring

| | Technical Round (TR) | Managerial Round (MR) |
|---|---|---|
| Who runs it | Senior/Lead engineer or architect | Delivery manager, resource manager, or account lead |
| Core question | "Can you own a system and raise the team's ceiling?" | "How do you run a project, and how do you work with people?" |
| Content | Fundamentals at depth, design, code quality, technical leadership | Delivery method, requirements, estimation, risk, team dynamics, conflict, communication, English |
| Typical length | 60–90 min | 45–60 min |
| Fails on | Shallow answers, no trade-offs, no production scars | Vague projects, no repeatable method, blaming others, poor English, no questions asked |
| Your lever | Depth + "here's what I'd do and what it costs" | A **named process** for every situation, plus stories with numbers |

EPAM is a **consultancy**. Every answer is being scored twice: is it true, and would it sound good to a client. That's why the MR exists as a separate round and why it is not a formality — people clear the TR and fail the MR.

**The MR's real test:** for any situation they describe, do you have a *method*, or do you improvise? "It depends on the situation" is the weakest possible answer. Name your steps. Sections 6 and 7 are the two halves they told you about — projects and teams — and they're the ones to rehearse hardest.

---

## 2. The project narrative — the spine of both rounds

Both interviewers will open with some form of "tell me about your current project". Build **one** narrative and reuse it. Everything else hangs off it.

**Q1. Tell me about your current project.**
Structure it in four moves, about two minutes total. Do not start with the tech stack — start with the business.

1. **Business context (20s)** — what the product does, who uses it, why it matters commercially.
2. **Your scope (20s)** — team size, your role, what you own end to end, who depends on you.
3. **Architecture (40s)** — the shape of the system with real numbers: services, datastores, throughput, latency, scale.
4. **Your signature contribution (40s)** — one hard problem, the decision you drove, and the measured outcome.

```
"We build [product] for [users], and it matters because [commercial reason].
 I'm one of [N] engineers on a team of [N], and I own [service/domain] end to end —
 design, implementation, tests, deploys and on-call.

 Architecturally it's [N] Spring Boot services, Postgres per service, Kafka for
 async, Redis for caching, on Kubernetes. My service handles [X] and does about
 [N] requests/sec at peak with a p99 of [N]ms.

 The piece I'm proudest of is [problem]. We were seeing [symptom]. I proposed
 [approach], we [did the thing], and it took [metric] from [before] to [after]."
```

**Q2. What numbers should I have memorised?**
RPS at peak, p99 latency, data volume, number of services, team size, release frequency, uptime/SLO, and one cost figure if you have it. At SDE3, an answer with no numbers reads as "I was told what to build". Numbers signal ownership.

**Q3. What if my project isn't impressive?**
Scope isn't the score — **judgement** is. A well-reasoned answer about a 200 RPS internal service beats a hand-wavy one about a "massive platform". Talk about the constraint you were under and how you decided. Never inflate; consultancies check references and a client-facing bluff is expensive for them.

**Q4. What would you do differently if you rebuilt it?**
Always have an answer. Saying "nothing" reads as no reflection. Good shapes: "we split services too early before the domain was stable", "we should have put the outbox pattern in from day one instead of retrofitting it", "we over-invested in E2E tests and under-invested in contract tests". Then say what you learned.

---

## 3. "How did you drive the team" — the leadership bank

This is the specific thing EPAM told you they're probing, so prepare these properly. Use **STAR** (Situation, Task, Action, Result), 60–90 seconds each, and say "I" for your contribution while crediting the team for delivery.

**Q5. Tell me about a time you led a technical initiative end to end.**
What they're testing: can you originate work, not just complete it.
Shape: I noticed [problem with evidence] → I quantified the cost → I wrote a proposal/ADR and socialised it → I got buy-in from [stakeholders] → I broke it into workstreams and delegated → I unblocked and reviewed → outcome with a number.
The tell of a real answer is the **socialising** step. Junior answers jump from "I noticed" to "I built it".

**Q6. How do you make a technical decision when the team disagrees?**
Strong answer: I separate reversible from irreversible decisions. For reversible ones we pick quickly and move — arguing costs more than being wrong. For irreversible ones (data model, public API, service boundary) I write the options down with trade-offs, timebox a spike if the disagreement is empirical, and bring data. If we still disagree, I escalate to a decision-maker rather than letting it drift, and once decided I commit publicly even if it wasn't my option.
Name **ADRs** (Architecture Decision Records) — a short doc per decision with context, options, decision, consequences. It's a concrete artefact that proves process.

**Q7. How do you mentor or grow other engineers?**
Concrete beats warm. Good material: pairing on their first hard ticket; reviewing for design not syntax; giving them the design and letting them own the implementation; setting up a rotation so on-call knowledge spreads; writing the runbook so nobody depends on you personally. Have one named story: someone who was stuck, what you changed, what they can now do alone.

**Q8. How do you run code review?**
What I look for, in order: correctness and edge cases, then tests, then design/SOLID, then error handling and logging, then performance traps (N+1, transaction scope, thread safety), then backwards compatibility of APIs and migrations, then naming.
How I review: I distinguish **blocking** from **suggestion** explicitly, I ask questions instead of issuing verdicts, I approve with nits rather than blocking on style, and I take repeated debates offline into a team standard. Style should be automated (Spotless/Checkstyle) so review is about substance.

**Q9. How do you handle a team member who is underperforming or blocking the team?**
Never a character judgement. Shape: I check whether it's clarity, capability, or capacity first — most "performance problems" are unclear requirements. I give specific, timely, private feedback using **SBI** (Situation, Behaviour, Impact). I agree on something concrete and observable, and a check-in date. If it doesn't move, I escalate to the lead/manager with facts rather than complaints — and I do it early, because silently absorbing someone's work hurts them and the delivery.

**Q10. How do you estimate, and what do you do when you're going to miss?**
Break down until the pieces are a day or two, estimate ranges not points, add explicit risk buffer for unknowns, and re-forecast as you learn. When a slip becomes likely: raise it **as early as you know**, not at the deadline; bring options (cut scope, add people with a caveat about ramp-up, move the date, ship behind a feature flag), not just a problem; and state what you recommend. Escalating early is the single behaviour that separates senior from mid here.

**Q11. How do you deal with technical debt when the business only wants features?**
I make it visible and priced. I don't ask for a "refactoring sprint" — I attach the cost to business language: "this module causes ~30% of our incidents and adds two days to every change in this area". Then I take three routes: fix opportunistically inside feature work (boy-scout rule), reserve a standing slice of capacity (10–20%) agreed with the PO, and raise the genuinely large items as their own initiative with a business case. Track it in the backlog, not in people's heads.

**Q12. How do you onboard onto an unfamiliar codebase — or bring someone else onto yours?**
Read the tests and the deployment pipeline first, they tell the truth. Trace one request end to end. Fix something small and ship it in week one to validate the whole loop. Then write down what confused you — that becomes the onboarding doc, and it's the highest-leverage thing a new senior can produce.

**Q13. Tell me about a production incident you led.**
Shape it as **mitigate → diagnose → prevent**. Detection (alert or customer?), immediate mitigation (rollback, feature flag, scale, circuit break) *before* root-causing, comms to stakeholders during, then the root cause, then the blameless postmortem and the specific prevention item that shipped. Interviewers listen for whether you stabilised first or went hunting for the cause while users were down.

**Q14. How do you improve quality across a team, not just your own code?**
Automate the floor: CI gates, coverage and Sonar thresholds, Spotless, dependency scanning, PR templates. Then raise the ceiling: design reviews for anything touching a boundary, a definition of done that includes tests and observability, runbooks and dashboards per service, and a blameless postmortem culture. Standards that live in a document nobody enforces don't exist.

**Q15. Have you influenced anything outside your immediate team?**
Strong at SDE3: a shared library or starter other teams adopted, a company-wide standard (logging format, error contract, API guidelines), running a guild or brown-bag, contributing to hiring/interviewing, or driving a cross-team migration. If you have none, say what you'd start and why — but find one; this question separates SDE2 from SDE3 more than any other.

---

## 4. Technical leadership inside the TR

These are technical questions asked in a leadership register. Fundamentals still apply — see Parts 1–8 — but the answers need a decision attached.

**Q16. Walk me through a significant design decision you made and its trade-offs.**
Pick something with a genuine cost, not a no-brainer. State: the constraint, at least two options you actually considered, why you chose one, **what you gave up**, and how it turned out. An answer with no downside named is not a trade-off, it's a sales pitch.

**Q17. When would you NOT use microservices?**
Small team, unstable domain boundaries, no DevOps maturity, low scale. Start as a modular monolith and extract when there's a forcing reason: independent scaling, independent deploy cadence, team autonomy, or differing technology needs. Naming the case *against* the fashionable answer is a senior signal.

**Q18. How do you decide between fixing forward and rolling back?**
Roll back by default if the previous version is known-good and the change is reversible. Fix forward when a rollback is unsafe — usually because a DB migration isn't backwards compatible, which is itself the bug. This is why migrations follow expand-contract: add nullable column → write both → backfill → read new → drop old in a later release.

**Q19. How do you keep a system observable?**
RED metrics per endpoint (Rate, Errors, Duration), structured JSON logs with a correlation ID in MDC, distributed traces via OpenTelemetry, dashboards per service, and alerts on **SLO burn** rather than raw CPU. The test: can a new on-call engineer diagnose a p99 spike at 3am with only the dashboards? If not, it isn't observable.

**Q20. How do you choose what to test?**
Test behaviour at the boundaries you own. Heavy unit coverage of business logic, integration tests with Testcontainers on the persistence and messaging edges, contract tests between services, and a thin layer of E2E on critical journeys only. Coverage percentage is a smell detector, not a goal — I care more that the tests fail for the right reason. Mutation testing (PIT) is the honest measure if anyone asks.

**Q21. Your service is the bottleneck for three other teams. What do you do?**
Product-manage it: publish a contract and a changelog, version the API, add consumer-driven contract tests so I can change safely, give them a sandbox and good docs, and if the coupling is structural, look at whether the boundary is wrong. Short term, prioritise transparently with the dependent teams rather than silently.

**Q22. How do you introduce a new technology?**
Never by fiat. Problem statement first, then a timeboxed spike with success criteria, then a small non-critical service as the pilot, then an ADR and a team decision, then a migration plan with a rollback. And I name the ongoing cost: who operates it, who knows it, what happens when the champion leaves.

**Q23. What does "done" mean on your team?**
Merged, tested at the right levels, observable (metrics + logs + alerts), documented where it's non-obvious, migration-safe, feature-flagged if risky, and deployed to production. If "done" stops at merged, the team has a delivery problem.

---

## 5. The Managerial Round bank

The MR is largely behavioural, plus fit and logistics. Answers should be structured, positive about past employers, and specific.

**Q24. Why are you leaving your current company?**
Pull, never push. Growth, scale of problems, exposure to different domains, wanting more ownership or client contact. Never money as the headline, never criticism of your manager or team — a consultancy hears that as "will say this about our client next year".

**Q25. Why EPAM?**
Have a real answer: breadth of domains and clients, engineering-led culture, working on large-scale systems for named brands, structured career levels, mentoring and communities of practice, and the chance to be client-facing rather than ticket-facing. Mention that you're comfortable with the consultancy model — it's a genuine differentiator and many candidates aren't.

**Q26. How do you work with a difficult client or stakeholder?**
Assume good intent and a missing shared picture. Clarify the underlying goal rather than arguing about the requested solution. Communicate in their language (cost, risk, timeline) rather than technical detail. Put agreements in writing. Escalate through your own management before it becomes a client escalation. Never surprise a stakeholder — bad news early is a favour.

**Q27. Tell me about a conflict with a colleague and how you resolved it.**
Pick a real, low-stakes-in-hindsight one. Show: I went to them directly and privately first, I asked what I was missing before asserting my view, we found the actual disagreement (often a hidden constraint), we agreed a way to decide, and the working relationship stayed intact. Avoid stories where you were simply right and they eventually saw it.

**Q28. Tell me about a time you failed or made a significant mistake.**
Choose a real one with real consequences — a trivial one reads as evasion. Own it without self-flagellation: what happened, your part in it specifically, what you did immediately, and the **systemic** change you made so it can't recur (a test, a guardrail, a process). Do not blame a teammate.

**Q29. How do you handle competing priorities from two stakeholders?**
Make the trade-off visible rather than absorbing it. "I can do A by Friday or B by Friday, not both — here's the impact of each. Which do you want?" Then get the decision from whoever owns the priority, and confirm in writing. Quietly working weekends to do both is the wrong answer at SDE3.

**Q30. How do you give and receive feedback?**
Give: specific, timely, private for corrective, public for praise, SBI format, focused on behaviour and impact rather than personality. Receive: ask for it explicitly, don't defend in the moment, ask for an example, thank them, and act on something visibly.

**Q31. How do you keep learning?**
Name concrete recent things — a specific book, a talk, a side project, a new JDK feature you've actually used (virtual threads, records, pattern matching). Vague "I read blogs" is a wasted answer.

**Q32. Where do you see yourself in 3–5 years?**
Credible options: tech lead / architect track, or deep specialisation in a domain. Say what you want to be *better at*, not just a title. Show it's compatible with the role you're interviewing for.

**Q33. Are you comfortable being client-facing / working across time zones / with occasional travel?**
Answer honestly and specifically. If yes, give evidence you've done it. If there are constraints, state them plainly with what you can offer instead. Consultancies would much rather know now.

**Q34. What's your English/communication experience?**
The MR *is* partly an English assessment. Don't address it explicitly unless asked — just demonstrate it: complete sentences, structured answers, ask a clarifying question when a question is ambiguous, and don't ramble. If asked, cite daily standups with distributed teams, client demos, documentation you've written.

---

## 6. How you tackle a project — the delivery questions

This is the heart of the MR. They're checking whether you have a **repeatable method**, or whether you just get handed tickets. Every answer should reveal a process, not a personality trait.

**Q35. You're handed a new project or a large feature from scratch. Walk me through your approach.**
Have a named sequence — this is the single most likely MR question given what they've told you.

1. **Understand the why.** Who's the user, what problem, what does success look like as a measurable outcome. If nobody can state the success metric, that's the first thing I surface.
2. **Clarify scope and constraints.** Deadline, budget, compliance, non-functionals (load, latency, availability, data retention), what's explicitly out of scope.
3. **Map the unknowns.** I separate what we know from what we're guessing. The guesses become spikes with a timebox, done first, because they're what blows up estimates.
4. **Design at the right depth.** A one-page design or ADR: the shape of the solution, the interfaces, the data model, the failure modes. Reviewed with the team before anyone writes code.
5. **Slice for delivery.** Vertical slices that each ship something demonstrable, not horizontal layers. First slice goes to production early to prove the whole pipeline works.
6. **Set up the feedback loop.** CI, environments, monitoring and a demo cadence before the bulk of the work, so problems surface in week one rather than week six.
7. **Execute and re-forecast.** Track against the plan, raise deviation early, keep a visible risk list.

The senior signals here are: **success metric**, **spikes before estimates**, **vertical slices**, and **thin end-to-end first**.

**Q36. How do you handle unclear, incomplete, or contradictory requirements?**
I don't start building and hope. I write down my interpretation and send it back for confirmation — an assumptions list is faster than a meeting and it creates a record. For genuine ambiguity I go to the person with the actual problem, not just the ticket author, and ask what they're trying to achieve rather than what they asked for. If two stakeholders contradict each other, I get them in the same conversation rather than shuttling between them. And I distinguish "unclear" from "undecided" — undecided means someone needs to decide, and my job is to force that decision with options and costs, not to wait.

**Q37. How do you break down a large piece of work?**
Vertically, by user-visible outcome, until each piece is one to three days. I look for the thinnest slice that exercises the whole stack end to end and do that first — it de-risks integration, which is where the surprises live. I make dependencies explicit and sequence the risky and blocking items early. Anything I can't break down is a signal I don't understand it yet, and that becomes a spike.

**Q38. Requirements change mid-sprint. What do you do?**
I make the trade visible rather than absorbing it. Something in, something out — I go to the PO with "we can take this in if X moves to next sprint, here's the impact". If it's genuinely urgent and nothing can move, that's a decision the PO makes explicitly, and I record it so the sprint miss isn't a surprise at review. What I don't do is quietly extend hours and let the estimate look fine; that destroys the team's ability to forecast anything.

**Q39. How do you handle a dependency on another team that's blocking you?**
Early and in writing. I identify cross-team dependencies at planning, not when I hit them. I agree an interface contract up front so we can develop in parallel — a stub or mock against the agreed schema means I'm not idle while they build. I keep a named contact rather than a team inbox, escalate through my lead if a date slips, and always have a fallback plan (feature flag it off, ship without it, temporary shim). Being blocked is acceptable; being blocked silently for a week is not.

**Q40. How do you identify and manage risk on a project?**
I keep a visible risk list with likelihood, impact and a mitigation for each — not a document nobody reads, a standing agenda item. Typical ones: an unproven integration, an unfamiliar technology, a single person holding critical knowledge, a hard external deadline, unclear ownership of data. Mitigations are concrete: spike it early, pair to spread knowledge, build the fallback, get the decision in writing. The main discipline is surfacing risks while there's still time to act, which means raising things that might make you look pessimistic.

**Q41. You inherit a legacy codebase with no documentation and no tests. Where do you start?**
Don't rewrite. First, get it building and deployable reliably — if I can't ship it, I can't change it safely. Then add characterisation tests around the areas I need to touch, so I have a safety net that captures current behaviour even if that behaviour is odd. Trace one critical path end to end and document it as I go. Add observability so I can see what it actually does in production, which is usually different from what people believe. Then improve incrementally under the boy-scout rule, and use the Strangler Fig pattern for anything structural. A rewrite proposal without this groundwork is how projects die.

**Q42. What's your role in the agile ceremonies?**
Concretely, not ritually. **Refinement** is where I add the most value — I push for clear acceptance criteria and flag technical unknowns before the work is committed, because a story that isn't understood at refinement becomes a missed sprint. **Planning**: I challenge estimates that ignore testing, migration or review time. **Standup**: blockers and deviations, not a status recital. **Review**: demo working software to real stakeholders. **Retro**: I bring one specific, actionable improvement rather than a general grievance, and I follow up on last retro's action — retros that produce nothing train people to disengage.

**Q43. How do you protect quality when there's delivery pressure?**
By making the trade-off explicit rather than silently dropping tests. Some things are non-negotiable and I say so: tests on new business logic, migrations that are backwards compatible, no secrets in code, observability on anything new in production. Beyond that I'm willing to negotiate — reduce scope, ship behind a feature flag, defer the nice-to-haves — because cutting scope is honest and cutting quality is a loan at a bad interest rate. If we do take a shortcut deliberately, I write it down as debt with an owner, so it's a decision rather than an accident.

**Q44. How do you handle scope creep?**
Notice it early, name it neutrally, and route it to the backlog rather than the sprint. "That's a good idea and it's not in the current scope — let's size it and let the PO prioritise it." The failure mode is the accumulation of small unlogged additions, which is why I insist that anything that takes more than an hour gets a ticket. In a consultancy setting this matters doubly, because unlogged scope is unbilled scope and it distorts the client relationship.

**Q45. How do you know a project actually succeeded?**
Against the success metric agreed at the start — adoption, latency, conversion, cost, error rate, whatever was defined. Delivered on time and on scope is a project-management measure, not an outcome measure. I also look at what it cost the team: if we shipped on time but burned people out and left the codebase worse, that's a partial failure I'd say so about.

**Q46. How do you hand over a project — or take one over?**
This one is worth preparing specifically, because consultancy engagements rotate. Handing over: runbooks, architecture and decision records, a walkthrough of the failure modes and the ugly corners, shadowing on an on-call rotation before I leave, and a named owner for every component. Taking over: I ask for the same, and where it doesn't exist I write it as I learn — the incoming person's confusion is the best documentation prompt there is.

---

## 7. How you tackle a team — the collaboration questions

**Q47. How do you work with QA, BAs, POs and designers?**
Early and together, not sequentially. I bring QA in at refinement so test scenarios shape the acceptance criteria rather than being invented after the fact — most defects I've seen came from a requirement gap, not a coding error. With BAs and POs I translate in both directions: their goal into technical constraints, and my constraints into cost and risk they can decide with. With designers I flag technical limits before the design is signed off rather than after. The general principle is that handing work over a wall in either direction produces rework.

**Q48. How do you work in a distributed team across time zones?**
Default to asynchronous and written. Decisions land in a durable place — an ADR, a ticket comment, a channel — not in a call that half the team missed. I overlap deliberately for the things that genuinely need synchronous discussion (design debate, unblocking, pairing) and protect the rest. I over-communicate status so nobody has to wait a full cycle to find out I'm blocked. And I'm careful to hand off with enough context that the next time zone can act without me, because a question asked at the wrong hour costs a full day.

**Q49. How do you spread knowledge and avoid a bus factor of one?**
Deliberately, because it doesn't happen naturally. Rotate ownership of areas rather than letting people specialise into silos. Pair or mob on the genuinely hard or unfamiliar work. Require that review is done by someone who didn't write it and doesn't already know that area. Write runbooks and ADRs so the reasoning survives the person. And put on-call on a rotation, because nothing surfaces a knowledge gap faster than being paged for a system you've never touched.

**Q50. How do you onboard a new joiner?**
A ship-something-in-week-one goal, with a small, real, low-risk ticket that forces them through the entire loop: environment, build, test, review, deploy. A buddy for questions so they're not blocked on me. A walkthrough of one request end to end, which teaches the architecture faster than any diagram. Then I ask them to write down everything that confused them — that's the onboarding doc updating itself, and it's the one contribution a newcomer is uniquely able to make.

**Q51. You join a team as the most senior engineer. How do you approach the first weeks?**
Listen before changing anything. There's usually a reason for what looks wrong, and being the new senior who immediately proposes a rewrite is how you lose the team. I learn the system and the people, find the pain they already feel, and fix one of those things visibly — that earns the credibility to propose bigger changes. I ask "why is it like this?" rather than "why isn't it like X?". Then I start raising the standard through review and design conversations rather than by decree.

**Q52. Two people on your team disagree and it's stalling the work.**
I get them to state the actual disagreement, which is often narrower than the argument suggests and frequently rests on a hidden constraint one of them knows. If it's empirical, we settle it with a timeboxed spike rather than opinion. If it's a genuine judgement call, I make sure it's clear who decides — usually the person who'll own the consequences — and we go, with the decision written down. The important part is not letting it drift; unresolved technical disagreement leaks into the codebase as inconsistency.

**Q53. Someone won't follow the team's standards.**
First I check whether the standard is actually agreed and documented, or just my preference — often it's the latter, and then it's my problem, not theirs. If it's agreed, I raise it privately and specifically, and I ask why: sometimes there's a real reason the standard doesn't fit and the standard should change. If it's just disagreement, I take it back to the team to re-decide rather than fighting it repeatedly in pull requests. And anything mechanical gets automated, because a linter never has to have this conversation.

**Q54. How do you keep a team motivated during a long grind?**
Make progress visible, because on long projects it stops feeling like anything is moving. Ship something real regularly. Protect people from churn and unnecessary meetings. Give people work they want to grow into, not just what they're already fastest at. Be honest about what's hard rather than performing relentless positivity, which reads as not listening. And say specifically what someone did well — vague praise doesn't land.

**Q55. How do you improve a team's process?**
Change one thing at a time and measure it, otherwise you can't tell what helped. I start from the pain the team names, not from a practice I read about. Retro produces one concrete action with an owner and a date, and we check it next time. Examples that have actually worked: cutting WIP limits when everything was in progress and nothing was done; adding a definition of ready because stories kept bouncing; automating the release because it was manual and therefore rare and therefore risky.

**Q56. What makes a team effective, in your experience?**
Clear ownership so decisions have a home; psychological safety, so people raise problems early rather than hiding them until they're expensive; fast feedback loops in both the build pipeline and the human conversation; and a shared standard of done so quality doesn't depend on who picked up the ticket. The strongest predictor I've seen is how quickly bad news travels upward — teams where that's slow fail late and loudly.

**Q57. How do you communicate progress upward, to a manager or client?**
Predictably and without surprises. Regular, brief, and in their language: what shipped, what's next, what's at risk and what I need. Risks go up while they're still cheap to act on. I don't report percentage-complete, which is meaningless — I report what's demonstrably working. And if something has gone wrong I say it early with options attached, because the reputational damage is from the surprise, not the problem.

**Q58. Tell me about a project that didn't go well. What did you learn?**
Have one prepared. Pick something with real consequences, be specific about your own contribution to it going wrong, and land on a systemic change rather than "we worked harder". Strong shapes: we committed to a date before we understood the integration; we split services before the domain was stable; we skipped the discovery and built the wrong thing well. The learning should be something you demonstrably do differently now — that's what makes it credible.

---

## 8. Your evidence inventory — fill this in before the interviews

You need roughly eight stories. Most questions above are variations on these.

- [ ] A technical initiative I originated and drove end to end
- [ ] A design decision with a real trade-off I can defend
- [ ] A production incident I led through mitigation and prevention
- [ ] A performance problem I diagnosed and fixed, with before/after numbers
- [ ] A disagreement I resolved without damaging the relationship
- [ ] Someone I mentored, and what they can now do without me
- [ ] A deadline I was going to miss, and how I handled it
- [ ] A mistake I made and the systemic fix that followed
- [ ] Something I influenced beyond my own team
- [ ] The thing I'd rebuild differently, and why
- [ ] A project I took from vague ask to shipped, and how I structured it
- [ ] Requirements that were unclear or changed late, and how I handled it
- [ ] A cross-team dependency that blocked us, and what I did
- [ ] A risk I spotted early that would have hurt us later
- [ ] A legacy or inherited system I made safe to change
- [ ] A process change I drove that the team kept

For each, write four lines only: Situation, Task, Action, **Result with a number**. If you can't put a number on the result, the story isn't ready.

The last six are specifically for the MR. They map one-to-one onto the questions in §6 and §7, and each can be reused for three or four different phrasings.

---

## 9. Mid-level vs SDE3: the same question, two answers

This is the single most useful table in this part. The question is identical; the level is in the shape of the reply.

| Question | SDE2 answer | SDE3 answer |
|---|---|---|
| What is `@Transactional`? | Definition and propagation levels | Definition, plus: it's proxy-based so self-invocation silently does nothing, checked exceptions don't roll back by default, and here's the incident where that bit us |
| How do you scale a service? | "Add instances, add a cache" | Where the actual bottleneck is measured, why the DB is usually the limit, what the cache invalidation cost is, and what I'd give up |
| Microservices vs monolith? | Lists the benefits of microservices | Names when *not* to, and the operational cost you take on |
| How do you test? | "Unit tests with JUnit and Mockito" | Test strategy across the pyramid, what belongs at each level, and how the team enforces it |
| Kafka delivery semantics? | "At-least-once, exactly-once" | At-least-once plus idempotent consumers, because end-to-end exactly-once with an external DB doesn't exist |
| Tell me about your project | Describes the tech stack | Describes the business, the scale in numbers, what they own, and the decision they drove |
| How do you fix a slow query? | "Add an index" | EXPLAIN first, why the index may not be used, sargability, keyset pagination, and the write-side cost of the index |

Rule of thumb: **every technical answer at SDE3 ends with a trade-off or a scar.** Definition, then consequence, then experience.

---

## 10. Questions to ask them

Ask 2–3 per round; not asking is read as low interest.

**In the TR:** What does the service landscape look like on the account I'd join? What's the biggest technical challenge right now? How are architecture decisions made — is there an ADR or review forum? What does the testing and deployment pipeline look like? How is on-call structured?

**In the MR:** How does EPAM match engineers to accounts, and how often does that change? What does the first 3–6 months look like for someone at my level? How is progression from SDE3 assessed here? How client-facing is this role day to day? What does the team look like — size, seniority mix, location spread?

---

## 11. What loses points at this level

- Describing what the team did without ever saying what **you** decided.
- No numbers anywhere.
- Every story ends in success. No failure story, no "I'd do it differently".
- Blaming a previous manager, team, or client.
- Technical answers that stop at the definition.
- Claiming ownership of something you can't go one level deeper on — interviewers probe exactly there.
- Rambling. Answer, then stop. Let them ask the follow-up.
- No questions at the end.

---

## 12. Two-day drill before the rounds

**Day 1 — evidence.** Write the sixteen stories in the evidence inventory, four lines each, with numbers. Weight the last six heavily — those are the MR. Rehearse the project narrative from §2 out loud until it's under two minutes without notes. Draw your architecture diagram from memory three times.

**Day 2 — method and depth.** Rehearse §6 Q35 (how you approach a new project) out loud until the seven steps are automatic — it is the most likely MR opener. Then re-read Part 07 (Spring/annotations/security), Part 06 (collections and gotchas), and Part 03 §5 (one full system design out loud). For each, practise answering in the SDE3 shape from §9: definition → consequence → experience.

**Morning of.** Skim §3 (leadership bank), §6–§7 (projects and teams), and §11 (what loses points). Have your numbers on a card next to you.

---
*Fundamentals live in Parts 1–8. This part is about how you frame them.*
