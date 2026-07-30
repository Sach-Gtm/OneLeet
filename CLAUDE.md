# OneLeet — working notes for Claude

OneLeet is an AI-powered **LEET / lateral-entry exam-prep platform** for Indian diploma students.

- **Client**: React 19 + Vite + Tailwind v4 · deploys to Vercel (`www.oneleet.in`)
- **Server**: Express 5 + Mongoose · deploys to Render (`oneleet-api.onrender.com`)
- **DB**: MongoDB Atlas

## Authoring questions / content from external sources

When the founder shares questions from **examveda or any other platform**, never reproduce
them verbatim. Make every item OneLeet's own:

- Rewrite the question wording **substantially** (not a token change).
- **Reword and reorder the options**; where possible change the numbers, names, or examples.
- Keep the tested skill and difficulty the same.
- Prefer **authoring fresh questions** on the same topic/skill over copy-then-edit.

> Honest note: a light "20–30% tweak" is **not** a reliable copyright shield on its own — a
> lightly-paraphrased original question is a derivative work and can still infringe, and copying
> a whole curated set can infringe the *compilation* even if each item is edited. **Substantial
> rewriting (as above) is the safe default.** Standard, common reasoning/aptitude items (basic
> analogies, standard math, PYQs) are largely generic and low-risk once reworded. For large-scale
> commercial use, a quick professional IP check is worthwhile. **PYQs (real past exam papers)**
> are both high-value and generally far safer to use than a competitor's practice bank — lean on
> them.

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
