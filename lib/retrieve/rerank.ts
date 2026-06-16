import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import type { RetrievedChunk } from './search';

/**
 * LLM reranker. Hybrid retrieval is fast but approximate; a reranker reads the
 * query and each candidate *together* and re-scores relevance — the standard
 * "fetch many cheaply, rank few accurately" pattern. Here a small, cheap model
 * (flash-lite) acts as the cross-encoder via structured output.
 */

/** Cheap, fast model dedicated to scoring — separate from the answer model. */
const rerankModel = google('gemini-2.5-flash-lite');

const rankingSchema = z.object({
  rankings: z.array(
    z.object({
      index: z.number().describe('the candidate index being scored'),
      score: z.number().describe('relevance to the query, 0 (irrelevant) to 10 (perfect)'),
    }),
  ),
});

/** Pure: reorder items by the model's scores, unscored items last, keep topK. */
export function applyRanking<T>(
  items: readonly T[],
  scores: ReadonlyArray<{ index: number; score: number }>,
  topK: number,
): T[] {
  const byIndex = new Map(scores.map((s) => [s.index, s.score]));
  return items
    .map((item, index) => ({ item, index, score: byIndex.get(index) ?? -1 }))
    .sort((a, b) => b.score - a.score || a.index - b.index) // ties keep original order
    .slice(0, topK)
    .map((x) => x.item);
}

/** Rerank retrieved chunks against the query and return the top K. */
export async function rerank(
  query: string,
  chunks: RetrievedChunk[],
  topK: number,
): Promise<RetrievedChunk[]> {
  if (chunks.length <= 1) return chunks.slice(0, topK);

  const candidates = chunks
    .map((c, i) => `[${i}] (${c.version}) ${c.heading}\n${c.content.slice(0, 500)}`)
    .join('\n\n');

  try {
    const { object } = await generateObject({
      model: rerankModel,
      schema: rankingSchema,
      prompt: `Query: "${query}"\n\nScore how well each documentation candidate answers the query (0-10).\n\n${candidates}`,
    });
    return applyRanking(chunks, object.rankings, topK);
  } catch {
    // Reranking is an enhancement, not a dependency — fall back to retrieval order.
    return chunks.slice(0, topK);
  }
}
