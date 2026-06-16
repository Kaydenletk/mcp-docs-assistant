import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  type UIMessage,
} from 'ai';
import { agentConfig } from '@/lib/agent/config';

// Agent does up to 5 steps (retrieval + answer); give it headroom.
export const maxDuration = 60;

type ChatMode = 'agent' | 'graph';

/** Concatenate the text parts of the latest user message. */
function lastUserText(messages: UIMessage[]): string {
  const last = [...messages].reverse().find((m) => m.role === 'user');
  return (last?.parts ?? [])
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('');
}

export async function POST(req: Request) {
  const { messages, mode = 'agent' }: { messages: UIMessage[]; mode?: ChatMode } = await req.json();

  // Corrective-RAG (LangGraph) is non-streaming; emit its final answer as a
  // single text part so the same useChat UI renders it identically. LangChain is
  // dynamically imported so it never bloats the default streaming path.
  if (mode === 'graph') {
    const question = lastUserText(messages);
    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        const { answerWithGraph } = await import('@/lib/agent/graph');
        const { text } = await answerWithGraph(question);
        writer.write({ type: 'text-start', id: '0' });
        writer.write({ type: 'text-delta', id: '0', delta: text });
        writer.write({ type: 'text-end', id: '0' });
      },
    });
    return createUIMessageStreamResponse({ stream });
  }

  const result = streamText({
    ...agentConfig,
    messages: await convertToModelMessages(messages),
  });
  return result.toUIMessageStreamResponse();
}
