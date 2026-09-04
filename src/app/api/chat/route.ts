import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  type UIMessage,
} from "ai";
import { model } from "~/lib/ai";
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
