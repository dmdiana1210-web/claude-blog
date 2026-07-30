import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
	// Загружает Markdown и MDX файлы из каталога `src/content/blog/`.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Проверка frontmatter по схеме
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		// Путь к обложке (строка), по умолчанию запасная картинка-заглушка.
		cover: z.string().default('/covers/placeholder-cover.jpg'),
		category: z.string().default('Без категории'),
		source: z.string().url().optional(),
		tags: z.array(z.string()).default([]),
	}),
});

export const collections = { blog };
