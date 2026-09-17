# Archived snapshots of the legacy kit

Three point-in-time copies of `../interview-prep.html`, taken by hand while the
original kit was being written. They are **not** inputs to anything: the
extractor reads `../interview-prep.html` and nothing in here.

| File | What it predates |
|---|---|
| `interview-prep.html.bak-parts01-08` | parts 9–12 |
| `interview-prep.html.bak-parts01-11` | part 12 |
| `interview-prep.html.bak-pre-insider` | the company-insider material |

## Why they are in the repo

They used to live only in `Personal/InterviewPrep`, a local folder with no git
remote — so these were the single existing copies of themselves, on one machine,
and losing the disk would have lost them. Everything else in that folder was
already migrated here byte-for-byte. Copying these across is what made the
folder genuinely redundant rather than only mostly redundant.

## When to delete them

Once you are confident nothing was lost between those snapshots and the current
`interview-prep.html`. The extracted bank (158 topics, 606 questions, 110 notes)
now has `npm run test:content` checking its integrity, so a regression would be
caught by that rather than by diffing against these. They are belt-and-braces
for a migration that is finished.
