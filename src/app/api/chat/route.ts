import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { model } from "~/lib/ai";
import { searchSerper } from "~/serper";
import { auth } from "~/server/auth";

export const maxDuration = 60;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response(null, { status: 401 });
  }

  const body = (await request.json()) as {
    messages: Array<UIMessage>;
  };

  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      execute: async ({ writer }) => {
        const { messages } = body;

        const result = streamText({
          model,
          system: `Вы - полезный научный сотрудник, имеющий доступ к инструменту веб-поиска.
                    Всегда используйте инструмент searchWeb для поиска в Интернете, прежде чем отвечать на любой вопрос, даже если вам кажется, что вы уже знаете ответ. Вы можете выполнить несколько поисковых запросов, чтобы собрать достаточно информации.
                    В своем окончательном ответе всегда приводите ссылки на источники, используя встроенные ссылки markdown, которые указывают на URL источника, например [название источника](https://example.com). Никогда не указывайте факты из результатов поиска без ссылки на источник.`,
          messages: await convertToModelMessages(messages),
          tools: {
            searchWeb: {
              inputSchema: z.object({
                query: z.string().describe("The query to search the web for"),
              }),
              execute: async (
                { query }: { query: string },
                { abortSignal },
              ) => {
                const results = await searchSerper(
                  { q: query, num: 10 },
                  abortSignal,
                );

                return results.organic.map((result) => ({
                  title: result.title,
                  link: result.link,
                  snippet: result.snippet,
                }));
              },
            },
          },
          stopWhen: stepCountIs(10),
          abortSignal: request.signal,
        });

        writer.merge(result.toUIMessageStream());
      },
      onError: (e) => {
        console.error(e);
        return "Oops, an error occured!";
      },
    }),
  });
}
