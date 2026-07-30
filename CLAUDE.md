<!-- astroblog capstone: используется в фазе 02. Копируется в корень проекта, затем /init дополняет техническими деталями Astro. -->

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Автоматический дайджест на Astro + Vercel. Проект курса Claude Code Basics: блог превращается из шаблона в автоматический пайплайн публикации через субагентов и хуки.

## Тема сайта

HR-дайджест о подборе персонала, адаптации, мотивации и развитии сотрудников.

## Целевая аудитория

HR-специалисты, рекрутеры, руководители, менеджеры и все, кто интересуется управлением персоналом.

## Стиль статей

Понятный, практический, дружелюбный. Короткие информативные материалы в современном деловом стиле.

## Стек

- Astro `^6.1.1` (`src/content/blog/` — markdown-статьи с frontmatter). Node `>=22.12.0`.
- Интеграции: `@astrojs/mdx`, `@astrojs/sitemap` (`sitemap-index.xml` при билде), `@astrojs/rss` (`/rss.xml` из той же коллекции). Оптимизация картинок — `sharp`.
- Чистый статический билд (SSR-адаптера нет). Для серверной логики понадобится `@astrojs/vercel` + `output: 'server'|'hybrid'` в `astro.config.mjs`.
- TypeScript strict (`astro/tsconfigs/strict` + `strictNullChecks`).
- Vercel (автодеплой на push в `main`).
- MCP: Tavily (поиск новостей), Replicate (обложки). Ключи `TAVILY_API_KEY`, `REPLICATE_API_TOKEN` — из `.env` (чтение `.env` запрещено permissions; запуск через `run-claude.sh`, который подгружает `.env`).

## Команды

- `npm run dev` — :4321.
- `npm run build` — production-сборка.
- `npm run preview` — предпросмотр сборки.

Тестов и линтера нет.

## Контент и роутинг

Коллекция `blog` — в `src/content.config.ts` (glob-loader по `src/content/blog/**/*.{md,mdx}`). Schema frontmatter: `title`, `description`, `pubDate` (coerce date), `updatedDate?`, `cover` (default `/covers/placeholder-cover.jpg`), `category` (default «Без категории»), `source?` (url), `tags` (default `[]`).

Роуты:
- `src/pages/index.astro` — главная: карточки статей, отсортированы по `pubDate` убыванию.
- `src/pages/blog/[...slug].astro` — статья. URL = `/blog/{post.id}/`, где `post.id` = имя файла без расширения, с датой (напр. `/blog/2026-07-30-adaptation/`).
- `src/pages/rss.xml.js` — RSS из той же коллекции.

Шаблон статьи — `src/layouts/BlogPost.astro`; стили (Bear Blog) — `src/styles/global.css`. У таблиц ширина 100%, но отдельного стиля ячеек нет — широкие таблицы могут выходить за колонку `.prose` (720px). Обложки — файлы в `public/covers/` (SVG) либо URL от Replicate. Заголовок и описание сайта — в `src/consts.ts` (`SITE_TITLE = 'HR Digest'`).

## Пайплайн публикации

Автоматический выпуск запускается скиллом `/digest` (`.claude/skills/digest.md`) — оркестрация субагентами:

1. `news-scout` — ищет 3 темы через Tavily, фильтрует по редполитике.
2. Для каждой темы (параллельно, 3 потока): `writer` пишет статью и создаёт файл → `cover-artist` генерирует обложку через Replicate и вписывает `cover:` в frontmatter.
3. `page-builder` — проверяет frontmatter, коммитит в `digest/auto`, пушит.

Внутри темы writer→cover-artist последовательно; между темами — параллельно. Оркестратор читает выходные строки агентов (`article_path:`, `cover_url:`). Определения — `.claude/agents/*.md`, скиллы — `.claude/skills/*.md`.

Внимание: агенты `news-scout` и `writer` в текущем виде заточены под AI-новости (запросы вида «new LLM release»). Для автоматического выпуска HR-дайджеста их промпты нужно адаптировать под HR.

## Хуки (`.claude/settings.json`)

- **PreToolUse → `block-main-push.sh`** (matcher `Bash`): блокирует `git push ... main|master` без `CAPSTONE_ALLOW_MAIN_PUSH=1`. Автоматике коммитить в `digest/auto`, merge в `main` — вручную.
- **PostToolUse → `pipeline-log.sh`** (все инструменты): пишет строку в `logs/pipeline.log`.
- **Stop → `validate-article.js`**: валидирует статьи, изменённые за последние 10 мин. Обязательные поля `title`, `description`, `pubDate`, `cover`; `title` ≤ 60 символов, `description` ≤ 160. Код 2 при ошибках.

Ловушка: stop-хук требует `cover` заполненным (хотя в schema у него есть default), но НЕ проверяет `source`. `page-builder` дополнительно требует `source`. Содержимое статей в page-builder переписывать нельзя.

## Редполитика

### Тематика

Подбор персонала, адаптация, мотивация и развитие сотрудников.

### Стиль

- Информационный (Ильяхов). Без маркетинга, оценочных прилагательных, канцелярита.
- Русский язык. Предложения до 25 слов. Точки в конце буллетов.
- Без шаблона «от X до Y» — перечисляем конкретно.
- Без AI-маркеров: «погружаться», «ландшафт», «ключевой момент», «является свидетельством».

### Формат

- Заголовок: ≤ 60 символов, без точки.
- Описание: одно предложение ≤ 160 символов.
- Тело: 300–500 слов, 2–4 абзаца.
- Источник: обязательная ссылка на первоисточник (`source`).
- Обложка: 16:9, путь в `public/covers/` или URL Replicate.

## Git

- Ветка по умолчанию `main`. Автоматика коммитит в `digest/auto`, merge в `main` — вручную.
- Запрещены `git push --force`, `git reset --hard`, `git commit --amend`.
