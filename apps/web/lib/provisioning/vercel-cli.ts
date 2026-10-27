import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { promisify } from 'node:util';
import path from 'node:path';
import { getEnv } from '../env';

const execFileAsync = promisify(execFile);

/**
 * The `vercel` npm package IS the CLI (bin entry `dist/vc.js`). Located via
 * a plain path join from process.cwd() (the deployed function's own root,
 * where its node_modules lives) rather than any Node module-resolution API
 * (require.resolve/createRequire) - those either fail outright at build time
 * (webpack tries to statically bundle the literal specifier and chokes on
 * `vc.js` being ESM) or return undefined at runtime once that's dodged with
 * a dynamically-built specifier. Confirmed working this way against a real
 * deployed Vercel Function, not just a local build.
 *
 * Also requires next.config.ts's outputFileTracingIncludes entry for the
 * route that calls this - the deploy-time file tracer only includes files it
 * can statically discover, and nothing here is statically discoverable by
 * design (same reason as above), so `vercel`'s files must be force-included.
 */
function resolveCliPath(): string {
  const cliPath = path.join(process.cwd(), 'node_modules', 'vercel', 'dist', 'vc.js');
  if (!existsSync(cliPath)) {
    throw new Error(
      `vercel CLI not found at ${cliPath} - check next.config.ts's outputFileTracingIncludes.`,
    );
  }
  return cliPath;
}

export class VercelCliError extends Error {
  constructor(
    message: string,
    public readonly stdout: string,
    public readonly stderr: string,
  ) {
    super(message);
    this.name = 'VercelCliError';
  }
}

/**
 * Every managed project this codebase ever creates or operates on lives
 * under this one team - hardcoded (matches the slug already hardcoded in
 * app/cp/page.tsx's dashboard links) rather than left to whatever scope the
 * provisioning token defaults to, since a personal-account-scoped token
 * silently resolves commands against the wrong account otherwise (see the
 * error-message fix below - this was the actual root cause of a real
 * "Not authorized" / "Check that the selected team is correct" failure).
 */
const TEAM_SCOPE = 'leo-gallis-projects';

/**
 * Pulls the real failure reason out of a failed vercel CLI invocation. The
 * CLI always writes its own version banner (and any deprecation notices) to
 * stderr - on every invocation, not just failures - while the actual
 * machine-readable error (`{ status: "error", reason, message, hint, ... }`)
 * goes to stdout. A naive `stderr || stdout` pick (what this used to do)
 * means every real failure showed only "Vercel CLI 65.3.1 (Node.js ...)" -
 * confirmed by deliberately forcing a failure (an invalid token) and
 * inspecting both streams directly, not guessed.
 */
function extractErrorMessage(stdout: string, stderr: string): string {
  const trimmedStdout = stdout.trim();
  if (trimmedStdout) {
    try {
      const parsed = JSON.parse(trimmedStdout) as {
        message?: string;
        reason?: string;
        hint?: string;
      };
      if (parsed.message) {
        return [parsed.message, parsed.hint].filter(Boolean).join(' - ');
      }
    } catch {
      return trimmedStdout;
    }
  }
  const trimmedStderr = stderr.trim();
  // Strip the version banner / deprecation notices so a genuine stderr-only
  // failure doesn't get buried under them.
  const meaningfulStderr = trimmedStderr
    .split('\n')
    .filter((line) => !/^Vercel CLI \d|^! `.*` is deprecated/.test(line.trim()))
    .join('\n')
    .trim();
  return meaningfulStderr || trimmedStderr || 'unknown error';
}

/**
 * Shells out to the bundled Vercel CLI, authenticated with this instance's
 * own provisioning token (never the operator's personal login) - every call
 * is non-interactive by construction, since this only ever runs unattended
 * from a server action.
 *
 * The token is passed as a CLI argument, not an env var, to match how every
 * other call site in this codebase already invokes `vercel` (see the /cp
 * runbook and this file's own test coverage) - execFile passes argv directly
 * to the child process, never through a shell, so there is no shell-injection
 * concern from any of these arguments.
 */
export async function runVercelCli(
  args: string[],
  options: { cwd?: string } = {},
): Promise<{ stdout: string; stderr: string }> {
  const { VERCEL_PROVISIONING_TOKEN } = getEnv();
  if (!VERCEL_PROVISIONING_TOKEN) {
    throw new Error('VERCEL_PROVISIONING_TOKEN is not configured on this instance.');
  }

  // This code runs inside a Vercel Function deployed on the *demo* project,
  // which - if "Automatically expose System Environment Variables" is on for
  // that project (it is) - has its OWN VERCEL_PROJECT_ID/VERCEL_ORG_ID set in
  // process.env. execFile inherits the parent's env by default, so every
  // spawned `vercel` subprocess was seeing the demo project's identity leak
  // in instead of resolving the *target* project from the `.vercel/
  // project.json` that `vercel link` deliberately writes to the scratch cwd
  // for exactly this purpose. The CLI apparently only trusts a full env-var
  // pair as an override and errors instead of silently ignoring a partial
  // one ("you specified VERCEL_PROJECT_ID but forgot VERCEL_ORG_ID") - a real
  // production failure confirmed by inspecting this project's own runtime
  // env directly, not guessed. Stripping both here lets the CLI fall back to
  // the file-based link as intended.
  const env = { ...process.env };
  delete env.VERCEL_PROJECT_ID;
  delete env.VERCEL_ORG_ID;

  try {
    const { stdout, stderr } = await execFileAsync(
      process.execPath,
      [
        resolveCliPath(),
        ...args,
        '--token',
        VERCEL_PROVISIONING_TOKEN,
        '--scope',
        TEAM_SCOPE,
        '--non-interactive',
      ],
      { cwd: options.cwd, timeout: 120_000, maxBuffer: 10 * 1024 * 1024, env },
    );
    return { stdout, stderr };
  } catch (error) {
    // Never let the token reach a log or an error surfaced to the /cp UI -
    // Node's execFile error can otherwise include the full argv in `.cmd`.
    const stdout = isExecFileError(error) ? error.stdout : '';
    const stderr = isExecFileError(error) ? error.stderr : '';
    throw new VercelCliError(
      `vercel ${args[0] ?? ''} failed: ${extractErrorMessage(stdout, stderr)}`,
      stdout,
      stderr,
    );
  }
}

function isExecFileError(error: unknown): error is { stdout: string; stderr: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'stdout' in error &&
    'stderr' in error &&
    typeof (error as { stdout: unknown }).stdout === 'string' &&
    typeof (error as { stderr: unknown }).stderr === 'string'
  );
}
