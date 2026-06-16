import { google } from '@ai-sdk/google';

/**
 * Output dimensionality of {@link embeddingModel}; must match the DB vector column.
 *
 * `gemini-embedding-001` defaults to 3072-dim, but pgvector's HNSW index caps at
 * 2000-dim, so we truncate via Matryoshka (`outputDimensionality`) to 1536.
 * Cosine similarity is scale-invariant, so truncated vectors rank correctly.
 */
export const EMBED_DIMENSIONS = 1536;

/**
 * Shared embedding model for ingestion and retrieval.
 *
 * Google Gemini `gemini-embedding-001`. Reads the API key from the
 * `GOOGLE_GENERATIVE_AI_API_KEY` env var. Both the ingest writer and the query
 * searcher MUST use the same model + dimensions, so this lives in one place.
 */
export const embeddingModel = google.textEmbeddingModel('gemini-embedding-001');

/**
 * Per-call provider options for {@link embeddingModel}. Pass to `embed`/`embedMany`
 * as `providerOptions`. Truncates the 3072-dim default to {@link EMBED_DIMENSIONS}.
 */
export const embedProviderOptions = {
  google: { outputDimensionality: EMBED_DIMENSIONS },
} as const;
