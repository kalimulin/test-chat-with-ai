import type { UIMessage } from "ai";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "~/server/db";
import { chats, messages } from "~/server/db/schema";

export type ChatWithMessages = typeof chats.$inferSelect & {
  messages: (typeof messages.$inferSelect)[];
};

export async function upsertChat(opts: {
  userId: string;
  chatId: string;
  title: string;
  messages: UIMessage[];
}): Promise<void> {
  const { userId, chatId, title, messages: newMessages } = opts;

  await db.transaction(async (tx) => {
    const [existingChat] = await tx
      .select()
      .from(chats)
      .where(eq(chats.id, chatId));

    if (existingChat) {
      if (existingChat.userId !== userId) {
        throw new Error("Chat does not belong to the user");
      }

      await tx.update(chats).set({ title }).where(eq(chats.id, chatId));
      await tx.delete(messages).where(eq(messages.chatId, chatId));
    } else {
      await tx.insert(chats).values({ id: chatId, title, userId });
    }

    if (newMessages.length > 0) {
      await tx.insert(messages).values(
        newMessages.map((message, index) => ({
          id: message.id,
          chatId,
          role: message.role,
          parts: message.parts,
          order: index,
        })),
      );
    }
  });
}

export async function getChat(id: string): Promise<ChatWithMessages | null> {
  const [chat] = await db.select().from(chats).where(eq(chats.id, id));

  if (!chat) {
    return null;
  }

  const chatMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.chatId, id))
    .orderBy(asc(messages.order));

  return { ...chat, messages: chatMessages };
}

export async function getChats(userId: string) {
  return db
    .select()
    .from(chats)
    .where(eq(chats.userId, userId))
    .orderBy(desc(chats.createdAt));
}
