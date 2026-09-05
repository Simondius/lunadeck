import { bad } from "@/lib/api-errors";

// Files a tester's bug report as two files committed straight to the
// `bug-reports` branch of this repo (not `main` - that branch requires PRs,
// this one is a plain unprotected data store nobody reviews or merges). A
// report is a folder: reports/<id>/report.md (reporter, timestamp, where they
// were, what they typed/dictated) and, when a screenshot came with it,
// reports/<id>/screenshot.png alongside it.
//
// Why files-in-a-branch and not GitHub Issues: Claude's own cloud sandbox can
// `git fetch`/`pull` this repo freely, but its outbound GitHub *REST API*
// calls are blocked by an allowlist that doesn't cover this repo - so it can
// read committed files here without needing anyone's laptop connected, but it
// could not list Issues the same way. Reports as files means "summarise new
// bugs" works from a plain `git pull`, no device link required. See
// claude/bug-report-pipeline.md for the read side of this.
//
// GITHUB_FEEDBACK_TOKEN is deliberately the same classic PAT already used for
// this repo's git management (see claude/github-management-setup.md) rather
// than a freshly-scoped one - it already has repo write access and creating a
// second one buys no real isolation since this route is unauthenticated
// either way (dev console has no login gate; see "Deferred: access control"
// in claude/tester-feedback-architecture-spec.md). Revisit if that ever
// stops being true.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REPO = "LousyBones/lunadeck";
const BRANCH = "bug-reports";
const MAX_TEXT = 4000;
const REPORTERS = new Set(["Tia", "Simon", "Other"]);

function missingTokenResponse() {
  return bad(
    "No GITHUB_FEEDBACK_TOKEN set. Add it in Vercel's Environment Variables and redeploy.",
    503
  );
}

async function putFile({ token, path, contentBase64, message }) {
  const url = `https://api.github.com/repos/${REPO}/contents/${path}`;
  const body = JSON.stringify({
    message,
    content: contentBase64,
    branch: BRANCH,
  });

  // One retry: a report filed the same instant as another can race GitHub's
  // view of the branch head (409). Reports are rare enough that this is the
  // whole retry policy - a second 409 just fails the request.
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body,
    });
    if (res.ok) return { ok: true };
    if (res.status === 409 && attempt === 0) continue;
    const detail = await res.text().catch(() => "");
    return { ok: false, status: res.status, detail };
  }
  return { ok: false, status: 500, detail: "unreachable" };
}

export async function POST(request) {
  const token = process.env.GITHUB_FEEDBACK_TOKEN;
  if (!token) return missingTokenResponse();

  let body;
  try {
    body = await request.json();
  } catch {
    return bad("Could not read that request.");
  }

  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text) return bad("Describe the bug first - the text field is empty.");
  if (text.length > MAX_TEXT) return bad(`Keep it under ${MAX_TEXT} characters.`);

  const reporter = REPORTERS.has(body?.reporter) ? body.reporter : "Other";
  const pathname = typeof body?.pathname === "string" ? body.pathname.slice(0, 200) : "";
  const label = typeof body?.label === "string" ? body.label.slice(0, 200) : "";
  const now = new Date();
  const id = `${now.toISOString().replace(/[:.]/g, "-")}-${Math.random().toString(36).slice(2, 8)}`;

  const lines = [
    `# Bug report — ${reporter}`,
    "",
    `- **When:** ${now.toISOString()}`,
    `- **Reporter:** ${reporter}`,
    label ? `- **Where:** ${label}` : null,
    pathname ? `- **Path:** \`${pathname}\`` : null,
    "",
    "## What they said",
    "",
    text,
  ].filter((line) => line !== null);
  const reportMarkdown = lines.join("\n") + "\n";

  const reportResult = await putFile({
    token,
    path: `reports/${id}/report.md`,
    contentBase64: Buffer.from(reportMarkdown, "utf8").toString("base64"),
    message: `Bug report from ${reporter}: ${text.slice(0, 60)}`,
  });
  if (!reportResult.ok) {
    console.error("[feedback] failed to commit report.md", reportResult.status, reportResult.detail);
    return bad(`Could not file the report (GitHub said ${reportResult.status}). Try again.`, 502);
  }

  // Screenshot is optional and best-effort: a tester's description landing
  // safely matters more than the picture, so a failed screenshot upload is
  // logged and swallowed rather than failing the whole report.
  const screenshotDataUrl =
    typeof body?.screenshotDataUrl === "string" ? body.screenshotDataUrl : "";
  const match = screenshotDataUrl.match(/^data:image\/png;base64,(.+)$/);
  if (match) {
    const shotResult = await putFile({
      token,
      path: `reports/${id}/screenshot.png`,
      contentBase64: match[1],
      message: `Screenshot for bug report ${id}`,
    });
    if (!shotResult.ok) {
      console.error(
        "[feedback] failed to commit screenshot.png",
        shotResult.status,
        shotResult.detail
      );
    }
  }

  return Response.json({ ok: true, id });
}
