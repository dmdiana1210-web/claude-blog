// Заглушка: LLM-judge для статьи дайджеста.
// Возвращает тестовый вердикт по 8 правилам стиля.
// НЕ вызывает LLM и НЕ постит комментарий в PR. Реальная логика — в следующем PR.

// Тестовый вердикт. Структура совпадает с тем, что вернёт judge в реальном пайплайне
// (см. prompts/judge-prompt.md — поле verdict + remarks).
function buildTestVerdict() {
  return {
    verdict: 'passed',
    summary:
      'Статья соответствует стилю дайджеста: разговорная, попадает в аудиторию HR, есть практический вывод.',
    remarks: [],
  };
}

const verdict = buildTestVerdict();

console.log('LLM-judge (тестовый режим):');
console.log(`  Вердикт:   ${verdict.verdict}`);
console.log(`  Сводка:    ${verdict.summary}`);
if (verdict.remarks.length > 0) {
  console.log('  Замечания:');
  for (const r of verdict.remarks) {
    console.log(`    • ${r}`);
  }
} else {
  console.log('  Замечания: нет');
}
console.log('  Источник:  stub (без вызова LLM, без комментария в PR)');
