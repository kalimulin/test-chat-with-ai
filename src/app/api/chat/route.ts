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
import { upsertChat } from "~/server/queries";
import { auth } from "~/server/auth";
import { checkAndRecordRequest } from "~/server/rate-limit";

export const maxDuration = 60;

function getChatTitle(messages: UIMessage[]): string {
  const firstUserMessage = messages.find((message) => message.role === "user");
  const text = firstUserMessage?.parts.find(
    (part) => part.type === "text",
  )?.text;

  return text ? text.slice(0, 255) : "Новый чат";
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response(null, { status: 401 });
  }

  const { allowed } = await checkAndRecordRequest(session.user.id);
  if (!allowed) {
    return new Response(null, { status: 429 });
  }

  const { messages, chatId: existingChatId } = (await request.json()) as {
    messages: Array<UIMessage>;
    chatId?: string;
  };

  const userId = session.user.id;
  const title = getChatTitle(messages);

  const chatId = existingChatId ?? crypto.randomUUID();

  if (!existingChatId) {
    await upsertChat({ userId, chatId, title, messages });
  }

  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      originalMessages: messages,
      generateId: () => crypto.randomUUID(),
      execute: async ({ writer }) => {
        if (!existingChatId) {
          writer.write({
            type: "data-newChatCreated",
            data: { chatId },
            transient: true,
          });
        }

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
      onEnd: async ({ messages: updatedMessages }) => {
        await upsertChat({
          userId,
          chatId,
          title,
          messages: updatedMessages,
        });
      },
    }),
  });
}
