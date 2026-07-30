# AI Digest

Автоматический дайджест новостей AI, машинного обучения и больших языковых моделей.

Проект курса **Claude Code Basics**. На протяжении восьми ступеней этот блог превращается из пустого шаблона в полностью автоматический пайплайн публикации.

## Быстрый старт

```bash
git clone <url-репозитория> ai-digest
cd ai-digest
npm install
npm run dev
```

Сайт откроется на `http://localhost:4321`.

## Команды

| Команда | Что делает |
|---------|------------|
| `npm run dev` | Dev-сервер на :4321. |
| `npm run build` | Сборка для продакшена. |
| `npm run preview` | Предпросмотр сборки. |

## Структура

```
src/
├── content/blog/    — Статьи дайджеста (markdown).
├── components/      — Astro-компоненты.
├── layouts/         — Шаблоны страниц.
├── pages/           — Маршруты: главная, блог, RSS.
├── styles/          — Глобальные стили.
└── assets/          — Изображения и обложки.
```

## Формат статьи

Каждая статья — файл `.md` в `src/content/blog/`:

```markdown
---
title: 'Заголовок статьи'
description: 'Краткое описание в 2–3 предложения.'
pubDate: '2026-03-25'
tags: ['llm', 'anthropic']
source: 'https://example.com/original-article'
---

Текст статьи. 300–500 слов.
```

## Стек

- [Astro](https://astro.build) — статический генератор сайтов.
- [Vercel](https://vercel.com) — деплой.
- TypeScript.
