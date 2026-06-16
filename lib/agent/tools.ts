import { tool } from 'ai';
import { z } from 'zod';
import { hybridSearch } from '../retrieve/search';
import { rerank } from '../retrieve/rerank';
import { hasConfidentMatch } from './gate';

/** Wider candidate pool to rerank down from, and the final count returned. */
const CANDIDATES = 12;
const FINAL = 6;

/**
 * The one tool the agent has: semantic search over the ingested MCP SDK docs.
 *
 * Pipeline: hybrid retrieve (vector + lexical, RRF) → refusal gate → LLM rerank.
 * Refusal is enforced here, not just in the prompt: when nothing clears the
 * confidence bar, we return `relevant: false` and no chunks, so the model has no
 * material to fabricate from and is steered to refuse. The gate runs BEFORE
 * reranking, so a refusal costs no extra model call.
 */
export const searchDocs = tool({
  description:
    'Search the Model Context Protocol TypeScript SDK documentation. Returns relevant doc chunks with citations. Call this before answering any question.',
  inputSchema: z.object({
    query: z.string().describe('The search query, phrased as the concept to look up.'),
    version: z
      .enum(['v1', 'v2'])
      .optional()
      .describe(
        'Restrict to one SDK version: v1 (1.x, server.tool, SSE) or v2 (2.0-alpha, registerTool, Streamable HTTP). Omit to search both.',
      ),
  }),
  execute: async ({ query, version }) => {
    const candidates = await hybridSearch(query, { version, limit: CANDIDATES });
    if (!hasConfidentMatch(candidates)) {
      return {
        relevant: false,
        note: 'No documentation chunks cleared the relevance threshold. The docs likely do not cover this — refuse rather than guess.',
        results: [],
      };
    }
    const results = await rerank(query, candidates, FINAL);
    return {
      relevant: true,
      results: results.map((r) => ({
        citation: r.citation,
        version: r.version,
        similarity: Number(r.similarity.toFixed(3)),
        content: r.content,
      })),
    };
  },
});
