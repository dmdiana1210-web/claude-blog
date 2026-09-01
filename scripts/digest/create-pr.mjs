// Заглушка: создание PR для статьи дайджеста.
// Печатает детали PR, который был бы создан.
// НЕ вызывает gh и НЕ создаёт ветку/коммит/PR. Реальная логика — в следующем PR.

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const inputPath = join(__dirname, '.selected-topic.json');

if (!existsSync(inputPath)) {
  console.error('Файл .selected-topic.json не найден. Сначала запустите select-topic.mjs');
  process.exit(1);
}

const topic = JSON.parse(readFileSync(inputPath, 'utf8'));

// Тестовые детали PR. В реальном пайплайне ветка создаётся от main,
// коммитит статью + topics.json, открывает PR через gh.
const today = new Date().toISOString().slice(0, 10);
const branch = `digest/${today}-feedback-retention-test`;
const title = `feat(blog): ${topic.topic.toLowerCase()}`;

console.log('Создание PR (тестовый режим — ничего не создаётся):');
console.log(`  Ветка:      ${branch}`);
console.log(`  Base:       main`);
console.log(`  Заголовок:  ${title}`);
console.log('  Файлы в коммите:');
console.log('    - src/content/blog/2026-09-01-feedback-retention-test.md (статья)');
console.log('    - scripts/digest/topics.json (тема помечена used: true)');
console.log('  Источник:   stub (без вызова gh, без создания PR)');
