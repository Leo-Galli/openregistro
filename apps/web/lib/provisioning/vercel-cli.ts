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

  try {
    const { stdout, stderr } = await execFileAsync(
      process.execPath,
      [resolveCliPath(), ...args, '--token', VERCEL_PROVISIONING_TOKEN, '--non-interactive'],
      { cwd: options.cwd, timeout: 120_000, maxBuffer: 10 * 1024 * 1024 },
    );
    return { stdout, stderr };
  } catch (error) {
    // Never let the token reach a log or an error surfaced to the /cp UI -
    // Node's execFile error can otherwise include the full argv in `.cmd`.
    const stdout = isExecFileError(error) ? error.stdout : '';
    const stderr = isExecFileError(error) ? error.stderr : '';
    throw new VercelCliError(
      `vercel ${args[0] ?? ''} failed: ${stderr.trim() || stdout.trim() || 'unknown error'}`,
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
