// Заглушка: линтер стиля для статей дайджеста.
// Возвращает тестовый результат проверки 8 правил из CLAUDE.md.
// Реальные проверки (подсчёт слов, регулярки, эмодзи) — в следующем PR.

// Тестовый отчёт: воспроизводит структуру, которую будет возвращать реальный линтер.
// Поле passed = true означает, что все 8 проверок прошли.
function buildTestReport() {
  return {
    file: 'src/content/blog/2026-08-21-feedback-retention.md (тестовый пример)',
    passed: true,
    checks: [
      { rule: 1, name: 'Объём 300–500 слов', passed: true, detail: '412 слов' },
      { rule: 2, name: 'Абзац ≤ 4 строк', passed: true, detail: 'макс. 3 строки' },
      { rule: 3, name: 'Обращение на «вы», не «ты»', passed: true, detail: 'обращение на «вы»' },
      { rule: 4, name: 'Есть первое лицо', passed: true, detail: '«я часто слышу»' },
      { rule: 5, name: 'Не начинается вопросом', passed: true, detail: 'первое предложение — утверждение' },
      { rule: 6, name: '≤ 2 эмодзи', passed: true, detail: '2 эмодзи' },
      { rule: 7, name: 'Нет канцелярита', passed: true, detail: 'канцелярских оборотов нет' },
      { rule: 8, name: 'Формулировки проверяемы', passed: true, detail: 'все правила дают да/нет' },
    ],
  };
}

const report = buildTestReport();

console.log('Линтер стиля (тестовый режим):');
console.log(`  Файл:   ${report.file}`);
console.log(`  Итог:   ${report.passed ? 'ПРОШЁЛ' : 'НЕ ПРОШЁЛ'}`);
console.log('  Правила:');
for (const check of report.checks) {
  const mark = check.passed ? '✓' : '✗';
  console.log(`    ${mark} #${check.rule} ${check.name} — ${check.detail}`);
}

// В реальном пайплайне exit 1 = нарушение. Заглушка всегда выходит 0.
process.exit(report.passed ? 0 : 1);
