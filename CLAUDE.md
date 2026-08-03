# OneLeet — working notes for Claude

OneLeet is an AI-powered **LEET / lateral-entry exam-prep platform** for Indian diploma students.

- **Client**: React 19 + Vite + Tailwind v4 · deploys to Vercel (`www.oneleet.in`)
- **Server**: Express 5 + Mongoose · deploys to Render (`oneleet-api.onrender.com`)
- **DB**: MongoDB Atlas

## Authoring questions / content from external sources

**examveda:** the founder has obtained **permission from examveda** to use their questions, and
these standard exam questions recur across papers. So when the founder shares questions **from
examveda**, reproduce them **faithfully / verbatim** — copy the question and all options exactly
as given (fix only obvious typos, encoding, or formatting). Do **not** paraphrase or reorder.

**Any other source without stated permission:** do not copy verbatim. Rewrite the wording
substantially, reword/reorder the options (vary numbers, names, examples), keep the skill and
difficulty, or author fresh questions. A light "20–30% tweak" is not a reliable copyright shield
on its own (a lightly-paraphrased original is still a derivative), so lean toward substantial
rewrites or originals when permission isn't in place. **PYQs (real past exam papers)** are
high-value and generally safe — lean on them.

## Instructor / author names

**Never add an instructor, teacher, or author _name_** to any content (syllabi, tests, notes,
videos, exam patterns, blurbs, etc.) unless the founder **explicitly gives that name**. When a
source (e.g. a coaching syllabus sheet) lists instructor names, **drop them** — don't transcribe
them into content or even into commit/PR text as attribution. Wherever an instructor/author credit
would appear, write **"OneLeet"** (already the default for the video `author` field). The
**Mentors** feature is the only exception — those are real, named people the founder adds on purpose.

## How content reaches production

There is **no direct write access to Atlas** from a Claude session, so published content (tests,
notes, syllabi, migrations) ships as **idempotent boot seeds** in `Server/server.js`, each guarded
by a `SeedFlag` (`Server/src/models/seedFlagModel.js`) so it runs exactly once and never resurrects
staff-deleted items. Staff can also create/edit live via the in-app **Content Studio** (`/studio`).

## Git workflow

Develop on `claude/oneleet-code-kickoff-ciqm6w`; ship **one squash-merged PR per feature**; reset
the local branch to `origin/main` after each merge. Author/committer email: `noreply@anthropic.com`.
The GitHub squash-merge commit shows as "Unverified" (GitHub's own committer) — that's expected and
must not be amended (it's already-merged `main` history).

## Conventions worth keeping

- **Tests**: `mode` = `test` (graded, single-attempt, ranked) or `practice` (repeatable, answers
  reveal as you go). `format` locks the question count (quick-shot 10 / practice 25 / challenge 40 /
  survivor 50 / real-exam 100). A graded test with no `closeAt` = lifetime access + a **live**
  leaderboard; with a `closeAt` = deadline test, leaderboard frozen until 5 min after close.
- **Premium**: content has a `premium` flag (free by default); only `plan: "pro"` students + staff
  can open it. Gate check lives in `Server/src/config/roles.isPremiumUser`.
- Attempts **snapshot** their questions, so the results review survives later edits/deletes.
