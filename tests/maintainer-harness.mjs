import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
process.env.WRANGLER_WRITE_LOGS = 'false';
process.env.WRANGLER_LOG_PATH = `${projectRoot}/.wrangler/logs`;
const { createTestHarness } = await import('wrangler');

const server = createTestHarness({
  root: projectRoot,
  workers: [
    {
      configPath: 'tests/wrangler.rehearsal.json',
      vars: { ADMIN_EMAIL: 'owner@example.test' },
    },
  ],
});

try {
  const { url } = await server.listen();
  const worker = server.getWorker();
  await worker.applyD1Migrations('DB');
  const exitCode = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['tests/maintainer-rehearsal.mjs'], {
      cwd: projectRoot,
      env: { ...process.env, CFJ_REHEARSAL_URL: url.toString() },
      stdio: 'inherit',
    });
    child.once('error', reject);
    child.once('exit', (code) => resolve(code));
  });
  assert.equal(exitCode, 0, 'maintainer route rehearsal failed');
} catch (error) {
  server.debug();
  throw error;
} finally {
  await server.close();
}
