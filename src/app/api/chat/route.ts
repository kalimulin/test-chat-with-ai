import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  type UIMessage,
} from "ai";
import { model } from "~/lib/ai";

export const maxDuration = 60;

export async function POST(request: Request) {
  const body = (await request.json()) as {
    messages: Array<UIMessage>;
  };

  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      execute: async ({ writer }) => {
        const { messages } = body;

        const result = streamText({
          model,
          messages: await convertToModelMessages(messages),
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
