# Interview preparation

The study app lives in [`../../frontend`](../../frontend) and is served by the
service at **/prep**.

## What is in here

| File | What it is |
|---|---|
| `microsoft-sde-prep-plan.md` | The 15-week campaign in long form: the loop, the operating system, the week-by-week calendar, the tracks, mocks, application timeline, failure modes. |
| `microsoft-prep-log.md` | The paper version of the daily tracker — streak, diagnostic, problem log, review queue, STAR stories. Superseded by the app, kept because the app does not yet hold the STAR inventory. |
| `09-epam-sde3-technical-and-managerial.md` | EPAM SDE3 technical and managerial rounds. §8 is the STAR evidence inventory. |

These are documentation, not application input. The material the app actually
renders is generated from `frontend/source/` by `npm run extract`.

## Source kits

`frontend/source/` holds the original single-file HTML kits:

- `interview-prep.html` — **the source of truth for the question bank.** The
  extractor parses it into `frontend/src/data/generated/`.
- `entain-sde2-prep.html` — an Entain-only cut, generated from part 12 of the above.
- `epamjavaprep.html` — an earlier EPAM-only kit.
- `microsoft-campaign.html` — the standalone campaign page the app's Plan
  section replaced. Useful offline with no build.
