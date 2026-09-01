// Категории HR-дайджеста и маппинг «категория → обложка».
// Названия категорий взяты из существующих статей в src/content/blog/.
// Обложки лежат в public/covers/.

export const CATEGORIES = [
  'Адаптация',
  'Вовлечённость',
  'Найм',
  'Удержание',
  'Технологии',
];

// Категория → путь к обложке (используется в frontmatter статьи).
export const CATEGORY_COVERS = {
  Адаптация: '/covers/1-adaptation.svg',
  Вовлечённость: '/covers/2-engagement.svg',
  Найм: '/covers/3-interview.svg',
  Удержание: '/covers/4-retention.svg',
  Технологии: '/covers/5-ai-hr.svg',
};

// Запасная обложка, если категория неизвестна.
export const DEFAULT_COVER = '/covers/placeholder-cover.jpg';
