# План: автоматический AI-дайджест HR-блога

## Ограничения, добавленные через Ctrl+G

Эти ограничения действуют на PR-1 и сужают исходный подробный план:

1. **Не подключай Tavily и Replicate сейчас — это Ступень 5.** В PR-1 интеграции с внешними сервисами поиска и генерации изображений не происходит.
2. **Только структура файлов и заглушки, возвращающие тестовые данные.** Реальные вызовы LLM, `gh`, запись в `src/content/blog/` и проверки стиля оставлены на следующий PR.
3. **Не трогай существующие страницы.** Файлы в `src/pages/*` и `src/content/blog/*` остаются без изменений.
4. **В CLAUDE.md добавь критерии отбора новостей и редполитику.** Разделы формулируются как проверяемые правила по «да/нет», в одном стиле с уже существующей секцией Content Style.

## Зафиксированные решения

| Параметр | Значение |
|----------|----------|
| LLM-провайдер | Anthropic Claude API |
| Секрет | `ANTHROPIC_API_KEY` (в GitHub Secrets) |
| Модель для генерации статьи | `claude-sonnet-5` |
| Модель для LLM-judge | `claude-haiku-4-5-20251001` |
| Cron | `0 7 * * 1` (понедельник 07:00 UTC) |
| Бэклог тем | `topics.json`, заполняется вручную |
| Мердж PR | вручную пользователем |
| CODEOWNERS | не нужен |

## Контекст из кодовой базы (зафиксировано по итогам изучения)

- Контент — коллекция `blog` (`src/content.config.ts`), схема Zod:
  `title`, `description`, `pubDate` (обязательные); `cover`, `category`, `tags`, `source`, `updatedDate` (опциональные).
  `cover` по умолчанию `/covers/placeholder-cover.jpg`, `category` — `Без категории`.
- Адрес статьи строится из имени файла: `src/pages/blog/[...slug].astro`.
  Переименование файла меняет URL.
- **Фактические категории в существующих статьях** (5 шт., по обложкам):
  - `Адаптация` → `/covers/1-adaptation.svg`
  - `Вовлечённость` → `/covers/2-engagement.svg`
  - `Найм` → `/covers/3-interview.svg`
  - `Удержание` → `/covers/4-retention.svg`
  - `Технологии` → `/covers/5-ai-hr.svg`
- Готовый промпт `prompts/prompt-1-casual.md` (разговорный стиль) — переиспользуем.
- В `CLAUDE.md` зафиксированы 8 проверяемых правил стиля — основа для линтера и judge.
- `.github/workflows` пока нет — создаём с нуля.
- Node ≥ 22.12, Astro 6, ESM (`"type": "module"`).
- `astro.config.mjs` содержит placeholder `https://example.com` (не трогаем в рамках этой задачи).

## Архитектура

```
[Workflow: generate-digest.yml]              [Workflow: style-check.yml]
  cron ПН 07:00 UTC / вручную                   на PR с изменениями в src/content/blog/**
        │                                              │
        ▼                                              ▼
  select-topic ──► generate-article             lint-style (блокирующая, exit 1)
        │              │                         llm-judge  (неблокирующая, комментарий в PR)
        ▼              ▼
  create-pr ─────► открывается PR ─────────► срабатывает style-check
                          │
                          ▼
              ревью + мердж вручную (пользователь)
```

Автоматика PR не мерджит. Публикация — только после ручного мерджа.

---

## Этап 0. Подготовка инфраструктуры

**Новые файлы:**
- `scripts/digest/lib/config.mjs` — ID моделей:
  ```js
  export const MODEL_GENERATION = 'claude-sonnet-5';
  export const MODEL_JUDGE = 'claude-haiku-4-5-20251001';
  ```
- `scripts/digest/lib/categories.mjs` — список 5 категорий (по фактическим данным) и маппинг «категория → обложка» (см. таблицу выше).
- `scripts/digest/lib/llm-client.mjs` — обёртка над `@anthropic-ai/sdk`; принимает `model` параметром, единый клиент для генерации и judge.

**Изменения:**
- `package.json` — добавить devDependency `@anthropic-ai/sdk` (через `npm install -D`).
- `.gitignore` — добавить `scripts/digest/.selected-topic.json` (временный файл).

**Действие пользователя (не код):** добавить секрет `ANTHROPIC_API_KEY` в GitHub repo → Settings → Secrets and variables → Actions.

---

## Этап 1. Выбор темы (ротация + ранжирование)

**Новый файл:** `scripts/digest/select-topic.mjs`
**Выход:** `scripts/digest/.selected-topic.json` (временный, в `.gitignore`)

**Ротация категорий** (без отдельного файла состояния):
1. Читаем существующие статьи из `src/content/blog/`, парсим frontmatter (lightweight-парсер: вытаскиваем `category` и `pubDate` регуляркой/YAML-примитивно, без новой зависимости).
2. Для каждой из 5 категорий определяем дату последней публикации.
3. Выбираем категорию с самой старой датой последней публикации (или без публикаций вовсе).

**Ранжирование тем:**
1. Читаем `scripts/digest/topics.json`.
2. Из выбранной категории берём записи с `used: false`.
3. Из них — с наибольшим `priority`.
4. Если неиспользованных тем в категории нет — падаем с понятной ошибкой («пополните topics.json для категории X»).

**Формат `topics.json`** (создаём с 2–3 стартовыми темами, пользователь дополняет вручную):
```json
[
  {
    "category": "Удержание",
    "topic": "Как обратная связь удерживает сотрудников",
    "angle": "регулярность важнее разовой похвалы",
    "priority": 5,
    "used": false
  }
]
```

---

## Этап 2. Генерация статьи

**Новый файл:** `scripts/digest/generate-article.mjs`
**Вход:** `.selected-topic.json` (Этап 1)

**Что делаем:**
1. Читаем шаблон `prompts/prompt-1-casual.md`, подставляем тему и угол.
2. Просим LLM (`MODEL_GENERATION`) вернуть строгий JSON: `title`, `description`, `tags` (массив), `slug` (латиница, kebab-case), `body` (Markdown без frontmatter).
3. Собираем frontmatter по схеме коллекции:
   ```yaml
   ---
   title: '...'
   description: '...'
   pubDate: YYYY-MM-DD          # сегодня
   category: 'Удержание'
   tags: ['...']
   cover: '/covers/4-retention.svg'   # из маппинга по категории
   ---
   ```
4. Записываем файл `src/content/blog/YYYY-MM-DD-<slug>.md`.
5. Обновляем `topics.json`: помечаем выбранную тему `used: true` (этот апдейт поедет в PR вместе со статьёй — Этап 5).

**Защита от сбоев:** если LLM вернул невалидный JSON — повторяем запрос (до 2 попыток). При неудаче пайплайн падает с ошибкой, PR не создаётся.

**Согласованность slug и имени файла:** slug из ответа LLM используется как часть имени файла; дублируем ту же строку в URL (через `[...slug].astro`). Если slug занят (файл уже есть) — добавляем суффикс `-2`, `-3`.

---

## Этап 3. Линтер стиля (детерминированный, блокирующий)

**Новый файл:** `scripts/digest/lint-style.mjs`

Проверяет 8 правил из `CLAUDE.md` по «да/нет». Работает с Markdown-телом статьи (без frontmatter).

| # | Правило | Как проверяем |
|---|---------|---------------|
| 1 | Объём 300–500 слов | считаем слова в теле |
| 2 | Абзац ≤ 4 строк | считаем физические строки в каждом абзаце (блок между пустыми строками), после удаления Markdown-разметки заголовков |
| 3 | Обращение на «вы», не «ты» | регулярки `\bты\b`, `тебя`, `тобой`, `твой` |
| 4 | Есть первое лицо | ищем `я`/`мы` + глагол в одном предложении |
| 5 | Не начинается вопросом | первое предложение статьи не содержит `?` |
| 6 | ≤ 2 эмодзи | считаем эмодзи через Unicode-диапазоны |
| 7 | Нет канцелярита | список оборотов из `CLAUDE.md` («в данном материале рассматривается», «следует отметить, что», «необходимо обратить внимание») |
| 8 | Формулировки проверяемы | ensured конструкцией линтера (правила 1–7 дают конкретный «да/нет») |

**Режим работы в `style-check.yml`:** линтер ищет изменённые/новые `.md` в `src/content/blog/` (через `git diff` относительно базы PR) — проверяет только их, а не весь каталог.

**Вывод:** список нарушений с номером правила и цитатой. Exit code 1 при любом нарушении → проверка в Actions красная.

---

## Этап 4. LLM-judge (качественная оценка, неблокирующий)

**Новые файлы:**
- `scripts/digest/llm-judge.mjs`
- `prompts/judge-prompt.md` — промпт judge (получает статью + 8 правил, оценивает живость/читабельность/попадание в аудиторию HR, возвращает вердикт «прошёл/есть замечания» + 2–3 коротких замечания).

Judge использует `MODEL_JUDGE`. Результат постим комментарием в PR через `gh pr comment` (`GH_TOKEN`). Judge **не блокирует** мердж — даёт ревьюеру ориентир. Запускается с `if: always()`, чтобы отработал даже при падении линтера.

---

## Этап 5. Создание PR

**Новый файл:** `scripts/digest/create-pr.mjs`

1. Создаём ветку `digest/<дата>-<slug>` от `main`.
2. Коммитим: новый файл статьи + обновлённый `topics.json`.
3. Открываем PR с таргетом `main`:
   - заголовок: `feat(blog): <title>` (Conventional Commits, ≤72 символа).
   - тело: тема, категория, slug, напоминание проверить стиль и смерджить вручную.

Используем встроенный `GITHUB_TOKEN` с `permissions: contents: write, pull-requests: write`.

---

## Этап 6. Workflow генерации

**Новый файл:** `.github/workflows/generate-digest.yml`

```yaml
name: Generate Digest

on:
  schedule:
    - cron: '0 7 * * 1'      # понедельник 07:00 UTC
  workflow_dispatch:          # ручной запуск

permissions:
  contents: write
  pull-requests: write

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - name: Select topic
        run: node scripts/digest/select-topic.mjs
      - name: Generate article
        run: node scripts/digest/generate-article.mjs
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
      - name: Create PR
        run: node scripts/digest/create-pr.mjs
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## Этап 7. Workflow проверки стиля

**Новый файл:** `.github/workflows/style-check.yml`

```yaml
name: Style Check

on:
  pull_request:
    paths:
      - 'src/content/blog/**'

permissions:
  pull-requests: write       # для комментария judge
  contents: read

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0      # нужен git diff для поиска изменённых статей
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - name: Lint style (blocking)
        run: node scripts/digest/lint-style.mjs
      - name: LLM judge (non-blocking)
        if: always()
        run: node scripts/digest/llm-judge.mjs
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          PR_NUMBER: ${{ github.event.pull_request.number }}
```

Срабатывает на любой PR с изменениями в `src/content/blog/` — и на автогенерированные, и на написанные вручную.

---

## Итоговая структура новых/изменяемых файлов

```
.github/workflows/
  generate-digest.yml          ← Этап 6 (новый)
  style-check.yml              ← Этап 7 (новый)
scripts/digest/
  lib/
    config.mjs                 ← Этап 0 (новый)
    llm-client.mjs             ← Этап 0 (новый)
    categories.mjs             ← Этап 0 (новый)
  select-topic.mjs             ← Этап 1 (новый)
  generate-article.mjs         ← Этап 2 (новый)
  lint-style.mjs               ← Этап 3 (новый)
  llm-judge.mjs                ← Этап 4 (новый)
  create-pr.mjs                ← Этап 5 (новый)
  topics.json                  ← Этап 1 (новый, ручное заполнение)
  .selected-topic.json         ← временный, в .gitignore
prompts/
  judge-prompt.md              ← Этап 4 (новый)
package.json                   ← Этап 0 (добавить @anthropic-ai/sdk)
.gitignore                     ← Этап 0 (добавить .selected-topic.json)
```

Существующие файлы (`prompt-1-casual.md`, коллекция, схема, обложки, astro.config.mjs) не трогаем.

---

## Порядок реализации

Реализую строго по этапам, с подтверждением на каждом шаге (по глобальным правилам пользователя — не изменяю файлы без подтверждения):

1. **Этап 0** — инфраструктура (зависимость, клиенты, конфиг, категории, .gitignore).
2. **Этап 1** — выбор темы + `topics.json` с первыми темами.
3. **Этап 2** — генерация статьи.
4. **Этап 3** — линтер (проверяем вручную на существующей статье).
5. **Этап 4** — judge + промпт.
6. **Этап 5** — создание PR.
7. **Этап 6** — workflow генерации.
8. **Этап 7** — workflow проверки стиля.

После каждого этапа — краткое объяснение изменений и что проверять дальше.

## Что реализовано в PR-1 в рамках ограничений Ctrl+G

Реализация немного отличается от первоначального плана: вместо подключения реальных API Tavily и Replicate были созданы только структура файлов и заглушки с тестовыми данными. Это сделано специально, потому что по ограничениям ПР-1 реальные интеграции относятся к Ступени 5. Существующие страницы проекта при реализации не изменялись.

## Открытые вопросы для пользователя (после одобрения плана)

1. Стартовый набор тем для `topics.json` — предложить 2–3 темы на разные категории или пользователь наполнит сам?
2. Branch protection (требовать зелёный линтер для мерджа) — настраиваем в GitHub пользователем, или пока мерджить на своё усмотрение?
