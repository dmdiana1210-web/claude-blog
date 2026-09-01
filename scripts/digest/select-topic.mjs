// Заглушка: выбор темы для дайджеста.
// Возвращает тестовую тему из topics.json. Реальная логика ротации
// (по датам публикаций и приоритетам) появится в следующем PR.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const topicsPath = join(__dirname, 'topics.json');
const outputPath = join(__dirname, '.selected-topic.json');

// Тестовая тема: первую неиспользованную из topics.json.
// Заглушка не учитывает ротацию по датам — берёт первую подходящую.
function selectTestTopic() {
  const topics = JSON.parse(readFileSync(topicsPath, 'utf8'));
  const candidate = topics.find((t) => !t.used);

  if (!candidate) {
    throw new Error('Нет неиспользованных тем в topics.json. Добавьте темы вручную.');
  }

  return candidate;
}

const topic = selectTestTopic();

// Записываем временный файл для следующего шага (generate-article).
// Файл в .gitignore — не попадает в коммит.
import { writeFileSync } from 'node:fs';
writeFileSync(outputPath, JSON.stringify(topic, null, 2), 'utf8');

console.log('Тема выбрана (тестовая):');
console.log(`  Категория: ${topic.category}`);
console.log(`  Тема: ${topic.topic}`);
console.log(`  Угол: ${topic.angle}`);
console.log(`  Приоритет: ${topic.priority}`);
console.log(`  Записано: ${outputPath}`);
