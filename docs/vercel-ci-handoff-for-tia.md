# Getting Vercel to deploy `lunadeck` directly — a job for Tia

Written 2026-09-06, by Claude, at Simon's request, after we hit a real
platform limitation (not a config mistake) trying to make Vercel build
directly from `LousyBones/lunadeck`. This file is the handoff: what our
setup is today, exactly why it can't be fixed from Simon's side alone, and
the specific steps for Tia (or her own Claude session, reading this) to
finish it properly.

## For a Claude session helping Tia

If Tia has asked you (her Claude) to sort out "the Vercel thing," here is
the full context so you don't have to reconstruct it from scratch:

**The setup today:** `LousyBones/lunadeck` (this repo) is owned by Tia's
personal GitHub account. Vercel is *not* connected to it directly — instead,
it's connected to a second repo, `Simondius/lunadeck`, a plain mirror under
Simon's own GitHub account. Whenever Simon wants a build to go live, a
Claude session on his side pushes `main` to both `origin` (this repo) and
`mirror` (the Simondius one); Vercel watches the mirror and builds from
that. This has worked, but it's an extra manual step every single time, and
it only happens when Simon remembers to ask for it.

**The blocker we hit, and why it isn't fixable from Simon's side:** Vercel's
own docs are explicit about this — for a repository owned by a *personal*
GitHub account (as opposed to an organization), **only the repository
Owner can connect it to Vercel.** A Collaborator — which is what Simon is
on this repo — cannot create a new Vercel project from it or connect it to
an existing one, no matter what token or permission scope they're given.
Quoting Vercel's own "Missing Git repository" documentation directly:

> To import or connect a GitHub repository owned by a personal account, you
> must be the repository Owner. This allows Vercel to configure a webhook
> and automatically deploy your commits. A Collaborator on a personal
> repository cannot create new Vercel projects from that repository or
> connect it to existing projects.

That's the whole reason the mirror-repo workaround exists at all, and it's
also the reason it can't be retired without Tia doing one specific thing
herself: **only Tia, as the account that owns `LousyBones/lunadeck`, can be
the one who clicks "Import" and authorizes Vercel's GitHub App against this
repo.** There is no PAT, no fine-grained token, no collaborator permission
level that lets Simon (or a Claude session acting on his behalf) do that
part. This isn't a decision either of us made — it's a hard rule in how
Vercel's GitHub integration is built.

**What we concluded:** rather than keep maintaining the manual mirror-sync
forever, Tia should spend the ~10 minutes below to connect Vercel directly,
once. The steps below get the project living inside *Simon's* Vercel Team
(so he keeps full day-to-day control — redeploys, env vars, domains) while
still satisfying Vercel's rule that Tia has to be the one who initiates the
Git connection, because she's the repo owner. Once this is done, every push
to `LousyBones/lunadeck`'s `main` branch deploys automatically and the
mirror repo/manual push step can be retired.

If asked to help Tia through this, walk her through "Recommended path"
below in order. Don't skip straight to the alternative (moving the repo
into a GitHub organization) unless she specifically wants full independence
from her own GitHub account down the line — it's a bigger, more disruptive
change than this needs.

## Recommended path: add Tia to Simon's Vercel Team, then she connects the repo

This gets the project fully inside Simon's Vercel account/Team — the part
that requires Tia is just the one click only she is allowed to make.

**Simon does this part first:**

1. If Simon's Vercel account is still a personal ("Hobby") account rather
   than a Team, he creates a Team: Vercel dashboard → the account-switcher
   in the top left → **Create Team**. (Free to create; some Team features
   are paid, but that doesn't block this.)
2. In that Team → **Settings → Members** → **Invite Member** → enter Tia's
   email (`tia@lunadeck.app`) → send the invite.

**Tia does the rest:**

3. Accept the Team invite email, logging into (or creating) a Vercel
   account using **"Continue with GitHub"** — sign in with her `LousyBones`
   GitHub account specifically, so Vercel's GitHub App ends up authorized
   against the account that actually owns the repo.
4. Once inside Simon's Team, switch the active scope to that Team (top-left
   switcher again) and click **Add New… → Project**.
5. Under "Import Git Repository," find `LousyBones/lunadeck`. If it doesn't
   show up in the list:
   - Click **"Adjust GitHub App Permissions"** (or **"Configure GitHub
     App"** — wording varies slightly by Vercel's current UI).
   - This opens GitHub's own settings for the Vercel App
     (github.com/settings/installations, under **Applications**).
   - Under the Vercel App's configuration, either switch it to **"All
     repositories"** or, under **"Only select repositories,"** add
     `lunadeck` to the list, then **Save**.
   - Go back to the Vercel import screen and search again — it should now
     appear, because Tia is the Owner.
6. Click **Import**. On the configuration screen, before deploying:
   - **Framework Preset must be set to "Next.js"** — not "Other." This bit
     us for real on the very first Vercel setup (mismatched preset meant
     the app didn't actually serve) — check this explicitly rather than
     trusting the auto-detect.
   - Add the environment variables the existing project has. At minimum,
     `GITHUB_FEEDBACK_TOKEN` (needed for the in-app bug-report feature to
     commit reports back to GitHub) — **copy its value from the existing
     Vercel project's Settings → Environment Variables page; don't type or
     commit the raw token anywhere, including in chat or in a file.** If
     either of you isn't sure what the current value should be, ask Simon
     directly rather than guessing or reusing an old one from memory.
   - Match any other environment variables and the Production Branch
     setting (`main`) against the existing project too, side by side, so
     nothing's missed.
7. Deploy. Once it builds successfully and the live site matches the
   current one, this new project is the real one — pushes to
   `LousyBones/lunadeck`'s `main` branch deploy automatically from here on,
   no manual mirror push required.

**Cleanup, once the new project is confirmed working (not before):**

- Stop pushing to the `mirror` remote / `Simondius/lunadeck` — it's no
  longer read by anything. Simon can delete that repo later, or just leave
  it stale; either is fine, it isn't load-bearing anymore.
- Whoever does this should also update `claude/tester-feedback-architecture-spec.md`
  and `claude/github-management-setup.md` (Simon's project docs, not files
  in this repo) to reflect the new setup, so a future session doesn't
  re-describe the mirror workaround as current.

## Alternative path: move the repo into a GitHub organization

Only worth doing if Tia wants Simon to have fully independent, first-class
GitHub access to this repo too (not just Vercel access via a Team) — for
example, if she expects to be less available in the future. It's a bigger
change (the repo's ownership itself moves), so treat it as optional, not
the default:

1. Tia creates a free GitHub organization (github.com → "+" in the top
   right → **New organization**).
2. She transfers `lunadeck` into it: repo → **Settings** → scroll to
   **Danger Zone** → **Transfer ownership** → target the new org → confirm
   by typing the repo name.
3. She adds Simon (`simondius`) to the org as a genuine **Member** (org →
   **People** → **Invite member**) — not just as an outside collaborator on
   the repo, which Vercel's own rules explicitly say does not grant import
   access.
4. She also grants Simon repo-level access specifically (repo → **Settings
   → Collaborators and teams** → add `simondius` with at least **Write**
   access) — being an org Member alone isn't enough; Vercel checks for an
   actual repository access role.
5. With that done, Simon's *own* Vercel account (no Team needed this time)
   can import `lunadeck` directly, because he's now an org Member with
   repo access rather than a personal-repo Collaborator — Vercel's rules
   treat those two cases differently.

## Sources

Verified against Vercel's own documentation on 2026-09-06:
- https://vercel.com/docs/git/vercel-for-github — "Missing Git repository"
  section, personal-account vs. organization-repository rules quoted above.
- https://vercel.com/kb/guide/unable-to-find-github-repository — GitHub App
  permission/configuration screen wording.
