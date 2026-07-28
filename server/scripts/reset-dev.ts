import { spawnSync } from 'node:child_process';

if (process.env.NODE_ENV === 'production') {
  process.stderr.write('Refusing to reset a database while NODE_ENV=production.\n');
  process.exit(1);
}
const result = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['prisma', 'migrate', 'reset', '--force'], {
  cwd: process.cwd(),
  stdio: 'inherit',
  env: process.env,
});
process.exit(result.status ?? 1);
