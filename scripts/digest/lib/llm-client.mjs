// Обёртка над @anthropic-ai/sdk для пайплайна дайджеста.
// Единый клиент для генерации статьи и для LLM-judge: модель передаётся параметром.

import Anthropic from '@anthropic-ai/sdk';
import { MODEL_GENERATION, MODEL_JUDGE } from './config.mjs';

// Клиент читает ключ из ANTHROPIC_API_KEY.
// В GitHub Actions прокидывается через env в шаге генерации/judge.
function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY не задан. Укажите секрет в GitHub Actions или в env.');
  }
  return new Anthropic({ apiKey });
}

// Отправляет промпт в модель и возвращает текст ответа.
// model — MODEL_GENERATION или MODEL_JUDGE.
export async function askLLM({ model, system, prompt, maxTokens = 4096 }) {
  const client = getClient();

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: prompt }],
  });

  // Собираем текстовые блоки ответа.
  const text = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('');

  return text;
}

// Удобные обёртки с фиксированной моделью.
export const askGenerator = (args) => askLLM({ ...args, model: MODEL_GENERATION });
export const askJudge = (args) => askLLM({ ...args, model: MODEL_JUDGE });
