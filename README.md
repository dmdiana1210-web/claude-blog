# HR Digest

Автоматический дайджест материалов для HR: адаптация, вовлечённость, найм, удержание сотрудников и технологии в работе с командой.

Проект курса **Claude Code Basics**: блог на Astro, который развивается в автоматический пайплайн публикации.

## Быстрый старт

```bash
git clone <url-репозитория> hr-digest
cd hr-digest
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
├── content/blog/    — Статьи дайджеста (markdown с frontmatter).
├── components/      — Astro-компоненты.
├── layouts/         — Шаблоны страниц.
├── pages/           — Маршруты: главная, блог, RSS, about.
├── styles/          — Глобальные стили.
└── assets/          — Изображения и обложки.
```

## Формат статьи

Каждая статья — файл `.md` в `src/content/blog/`:

```markdown
---
title: 'Заголовок статьи'
description: 'Одно предложение до 160 символов.'
pubDate: 2026-07-30
cover: '/covers/1-adaptation.svg'
category: 'Адаптация'
tags: ['адаптация', 'онбординг']
source: 'https://example.com/original-article'
---

Текст статьи. 300–500 слов.
```

## Стек

- [Astro](https://astro.build) 6 — статический генератор сайтов (`@astrojs/mdx`, `@astrojs/rss`, `@astrojs/sitemap`, `sharp`).
- [Vercel](https://vercel.com) — деплой.
- TypeScript (strict). Node >= 22.12.0.
