"use client";

import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { StickToBottom } from "use-stick-to-bottom";
import { ChatMessage } from "~/components/chat-message";
import { SignInModal } from "~/components/sign-in-modal";
import { isNewChatCreated } from "~/lib/utils";

interface ChatProps {
  userName: string;
  isAuthenticated: boolean;
  initialRequestsToday: number;
  chatId: string;
  isNewChat: boolean;
  initialMessages?: UIMessage[];
}

export const ChatPage = ({
  userName,
  isAuthenticated,
  initialRequestsToday,
  chatId,
  isNewChat,
  initialMessages,
}: ChatProps) => {
  const router = useRouter();
  const [requestsToday, setRequestsToday] = useState(initialRequestsToday);

  const refreshRequestsToday = useCallback(async () => {
    try {
      const res = await fetch("/api/requests/today");
      if (!res.ok) return;
      const data = (await res.json()) as { count: number };
      setRequestsToday(data.count);
    } catch {
      // ignore refresh failures
    }
  }, []);

  const transport = useMemo(
    () => new DefaultChatTransport({ body: { chatId, isNewChat } }),
    [chatId, isNewChat],
  );

  const { messages, sendMessage, status } = useChat({
    transport,
    messages: initialMessages,
    onData: (dataPart) => {
      if (isNewChatCreated(dataPart)) {
        router.push(`?id=${dataPart.data.chatId}`);
      }
    },
    onFinish: () => {
      void refreshRequestsToday();
    },
    onError: () => {
      void refreshRequestsToday();
    },
  });
  const [input, setInput] = useState("");
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);

  const isLoading = status === "submitted" || status === "streaming";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (text.length === 0 || isLoading) return;
    if (!isAuthenticated) {
      setIsSignInModalOpen(true);
      return;
    }
    setInput("");
    void sendMessage({ text });
  };

  return (
    <>
      <div className="flex flex-1 flex-col">
        <StickToBottom
          className="mx-auto min-h-0 w-full max-w-[65ch] flex-1 [&>div]:scrollbar-thin [&>div]:scrollbar-track-gray-800 [&>div]:scrollbar-thumb-gray-600 [&>div]:hover:scrollbar-thumb-gray-500"
          resize="smooth"
          initial="smooth"
        >
          <StickToBottom.Content
            role="log"
            aria-label="Chat messages"
            className="p-4"
          >
            {messages.map((message, index) => {
              return (
                <ChatMessage
                  key={message.id ?? index}
                  parts={message.parts}
                  role={message.role}
                  userName={userName}
                />
              );
            })}
          </StickToBottom.Content>
        </StickToBottom>

        <div className="border-t border-gray-700">
          {isAuthenticated && (
            <div className="mx-auto max-w-[65ch] px-4 pt-3 text-center text-xs text-gray-500">
              Requests today: {requestsToday}
            </div>
          )}
          <form
            onSubmit={handleSubmit}
            className="mx-auto max-w-[65ch] p-4 pt-2"
          >
            <div className="flex gap-2">
              <input
                value={input}
                onChange={handleInputChange}
                disabled={isLoading}
                placeholder="Say something..."
                autoFocus
                aria-label="Chat input"
                className="flex-1 rounded border border-gray-700 bg-gray-800 p-2 text-gray-200 placeholder-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="rounded bg-gray-700 px-4 py-2 text-white hover:bg-gray-600 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:hover:bg-gray-700"
              >
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Send"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
      />
    </>
  );
};
