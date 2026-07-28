import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { configureApp } from '../src/main';

async function exportDocument() {
  const { app, document } = await configureApp();
  const outputDirectory = resolve(process.cwd(), 'dist');
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(resolve(outputDirectory, 'openapi.json'), JSON.stringify(document, null, 2), 'utf8');
  await app.close();
}

void exportDocument();
