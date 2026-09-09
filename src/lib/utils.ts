export type NewChatCreatedDataPart = {
  type: "data-newChatCreated";
  data: {
    chatId: string;
  };
};

export function isNewChatCreated(
  data: unknown,
): data is NewChatCreatedDataPart {
  return (
    typeof data === "object" &&
    data !== null &&
    "type" in data &&
    data.type === "data-newChatCreated"
  );
}
