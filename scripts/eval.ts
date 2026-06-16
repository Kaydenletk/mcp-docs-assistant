import '../lib/load-env';
import { answer } from '../lib/agent/answer';
import { GOLDEN } from '../eval/dataset';
import { scoreCase, type CaseResult } from '../eval/metrics';

/** Aggregate a metric over the cases it applies to. */
function rate(results: CaseResult[], applies: (r: CaseResult) => boolean): string {
  const subset = results.filter(applies);
  if (subset.length === 0) return 'n/a';
  const passed = subset.filter((r) => r.pass).length;
  return `${passed}/${subset.length} (${Math.round((passed / subset.length) * 100)}%)`;
}

async function main() {
  console.log(`\nRunning eval over ${GOLDEN.length} cases…\n`);
  const results: CaseResult[] = [];

  for (const c of GOLDEN) {
    // Sequential to stay friendly with rate limits.
    const { text } = await answer(c.question);
    const r = scoreCase(c, text);
    results.push(r);
    const mark = r.pass ? '✓' : '✗';
    const detail = r.refused ? 'refused' : `${r.citationCount} cites [${r.citedVersions.join(',') || '—'}]`;
    console.log(`${mark} ${c.id.padEnd(16)} expect:${c.expect.padEnd(7)} ${detail}`);
  }

  const overall = rate(results, () => true);
  const refusal = rate(results, (r) => r.expect === 'refuse');
  const answered = rate(results, (r) => r.expect === 'answer');
  const versioned = rate(
    results,
    (r) => r.expect === 'answer' && GOLDEN.find((c) => c.id === r.id)?.version !== undefined,
  );

  console.log('\n── Scorecard ───────────────────────────────');
  console.log(`Overall pass        ${overall}`);
  console.log(`Refusal accuracy    ${refusal}`);
  console.log(`Answer + citation   ${answered}`);
  console.log(`Version-correctness ${versioned}`);
  console.log('─────────────────────────────────────────────\n');

  const failed = results.filter((r) => !r.pass);
  if (failed.length > 0) {
    console.log(`Failures: ${failed.map((r) => r.id).join(', ')}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
