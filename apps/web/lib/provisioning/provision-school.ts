import { randomBytes } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { REPO_URL } from '../deployment-status';
import { runVercelCli } from './vercel-cli';

const ROOT_DIRECTORY = 'apps/web';
const INSTALL_COMMAND = 'cd ../.. && pnpm install --frozen-lockfile';
const BUILD_COMMAND = 'cd ../.. && pnpm --filter @openregistro/web build';

export interface ProvisionResult {
  vercelProjectId: string;
}

/**
 * Deterministic from the subdomain, not a random/generated id - Vercel's own
 * APIs/CLI accept a project name interchangeably with its real project ID
 * everywhere this codebase calls them, so there is no need to look up or
 * persist a separate opaque id.
 */
export function projectNameFor(subdomain: string): string {
  return `openregistro-${subdomain}`;
}

/**
 * Automates the exact steps the /cp "Setup steps" runbook otherwise has the
 * operator run by hand: a new Vercel project (Root Directory = apps/web,
 * same monorepo build commands as every other deployment of this app), a
 * dedicated Neon Postgres database via Vercel's own free marketplace
 * integration (per the operator's explicit instruction: no separate Neon
 * account/API key - Vercel brokers it), the required env vars, the school's
 * assigned subdomain, and an initial deploy from `main`.
 *
 * Deliberately does NOT set PLATFORM_HOSTED or the shared Tophost SMTP
 * credentials on the new project - usePlatformEmail stays inert there (same
 * as any self-hosted install) until a deliberate decision is made to extend
 * platform email to automatically-provisioned schools too, rather than
 * copying the shared mailbox password into every new project by default.
 *
 * Every step is independently idempotent-ish (Vercel rejects a duplicate
 * project name outright, `--force` on env vars tolerates re-runs) but this
 * function does not attempt automatic rollback on a partial failure - it
 * throws with whatever had already succeeded discoverable via the Vercel
 * dashboard, and the caller is expected to persist `provisioningStatus:
 * 'failed'` plus the error so the operator can finish manually or retry.
 */
export async function provisionSchoolInstance(
  schoolName: string,
  subdomain: string,
): Promise<ProvisionResult> {
  const projectName = projectNameFor(subdomain);
  const domain = `${subdomain}.openregistro.another-horizon.eu`;

  await runVercelCli(['project', 'add', projectName]);

  await runVercelCli([
    'project',
    'update',
    projectName,
    '--root-directory',
    ROOT_DIRECTORY,
    '--install-command',
    INSTALL_COMMAND,
    '--build-command',
    BUILD_COMMAND,
    '--framework',
    'nextjs',
  ]);

  // `vercel integration add` and `vercel git connect` resolve "the current
  // project" from a linked working directory rather than a --project flag -
  // this scratch directory exists only to hold that link for this run.
  const scratchDir = await mkdtemp(path.join(tmpdir(), 'openregistro-provision-'));
  try {
    await runVercelCli(['link', '--project', projectName, '--yes'], { cwd: scratchDir });
    await runVercelCli(['git', 'connect', `${REPO_URL}.git`], { cwd: scratchDir });
    await runVercelCli(['integration', 'add', 'neon', '--plan', 'free_v3', '--no-claim'], {
      cwd: scratchDir,
    });
  } finally {
    await rm(scratchDir, { recursive: true, force: true });
  }

  const authSecret = randomBytes(32).toString('base64');
  await setEnvVar(projectName, 'STORAGE_DRIVER', 'postgres');
  await setEnvVar(projectName, 'AUTH_SECRET', authSecret);
  await setEnvVar(projectName, 'AUTH_URL', `https://${domain}`);

  await runVercelCli(['domains', 'add', domain, projectName]);

  // New projects default to Vercel's own SSO wall on every deployment -
  // without disabling it, the school's own staff/students (who have never
  // logged into Vercel) would be locked out of their own instance entirely.
  await runVercelCli(['project', 'protection', 'disable', projectName, '--sso']);

  const hookResult = await runVercelCli([
    'deploy-hooks',
    'create',
    'initial-deploy',
    '--project',
    projectName,
    '--ref',
    'main',
  ]);
  const hook = JSON.parse(hookResult.stdout) as { hook: { url: string } };
  await fetch(hook.hook.url, { method: 'POST' });

  return { vercelProjectId: projectName };
}

async function setEnvVar(projectName: string, key: string, value: string): Promise<void> {
  await runVercelCli([
    'env',
    'add',
    key,
    'production',
    '--value',
    value,
    '--project',
    projectName,
    '--yes',
    '--force',
  ]);
}
