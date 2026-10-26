import { z } from 'zod';

const REPO = 'Leo-Galli/openregistro';
export const REPO_URL = `https://github.com/${REPO}`;

const commitSchema = z.object({
  sha: z.string(),
  html_url: z.string(),
  commit: z.object({
    message: z.string(),
    author: z.object({ date: z.string() }).nullable().optional(),
  }),
});

const compareSchema = z.object({
  ahead_by: z.number(),
});

export interface LatestCommit {
  sha: string;
  shaShort: string;
  message: string;
  url: string;
  authoredAt: string | null;
}

export interface RunningVersion {
  commitSha: string | null;
  commitShaShort: string | null;
}

/**
 * The running deployment's own commit - populated by Vercel automatically
 * (VERCEL_GIT_COMMIT_SHA) on every build. Unset for self-hosted/Docker
 * deployments, since there is no equivalent system-provided value there;
 * callers must treat `null` as "unknown", not "out of date".
 */
export function getRunningVersion(): RunningVersion {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA || null;
  return { commitSha: sha, commitShaShort: sha ? sha.slice(0, 7) : null };
}

async function fetchGitHubJson(url: string): Promise<unknown> {
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/vnd.github+json' },
      // Revalidate every 5 minutes - this is a display-only check, not
      // something that needs to be instant, and avoids hitting GitHub's
      // unauthenticated rate limit on every /cp page load.
      next: { revalidate: 300 },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/** Returns null if GitHub is unreachable or returns an unexpected shape - never throws. */
export async function getLatestMainCommit(): Promise<LatestCommit | null> {
  const data = await fetchGitHubJson(`https://api.github.com/repos/${REPO}/commits/main`);
  const parsed = commitSchema.safeParse(data);
  if (!parsed.success) return null;

  return {
    sha: parsed.data.sha,
    shaShort: parsed.data.sha.slice(0, 7),
    message: parsed.data.commit.message.split('\n')[0] ?? parsed.data.commit.message,
    url: parsed.data.html_url,
    authoredAt: parsed.data.commit.author?.date ?? null,
  };
}

/** How many commits `main` has beyond the given sha - null if it can't be determined. */
export async function getCommitsBehindMain(sha: string): Promise<number | null> {
  const data = await fetchGitHubJson(`https://api.github.com/repos/${REPO}/compare/${sha}...main`);
  const parsed = compareSchema.safeParse(data);
  return parsed.success ? parsed.data.ahead_by : null;
}
