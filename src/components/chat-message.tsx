import {
  getToolName,
  isToolUIPart,
  type DynamicToolUIPart,
  type ToolUIPart,
  type UIMessage,
} from "ai";
import { Loader2 } from "lucide-react";
import ReactMarkdown, { type Components } from "react-markdown";

export type MessagePart = UIMessage["parts"][number];

interface ChatMessageProps {
  parts: MessagePart[];
  role: string;
  userName: string;
}

const components: Components = {
  // Override default elements with custom styling
  p: ({ children }) => <p className="mb-4 first:mt-0 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-4 list-disc pl-4">{children}</ul>,
  ol: ({ children }) => <ol className="mb-4 list-decimal pl-4">{children}</ol>,
  li: ({ children }) => <li className="mb-1">{children}</li>,
  code: ({ className, children, ...props }) => (
    <code className={`${className ?? ""}`} {...props}>
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="mb-4 overflow-x-auto rounded-lg bg-gray-700 p-4">
      {children}
    </pre>
  ),
  a: ({ children, ...props }) => (
    <a
      className="text-blue-400 underline"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),
};

const Markdown = ({ children }: { children: string }) => {
  return <ReactMarkdown components={components}>{children}</ReactMarkdown>;
};

const getQuery = (input: unknown): string | undefined => {
  if (
    typeof input === "object" &&
    input !== null &&
    "query" in input &&
    typeof input.query === "string"
  ) {
    return input.query;
  }
  return undefined;
};

const ToolInvocation = ({
  part,
}: {
  part: ToolUIPart | DynamicToolUIPart;
}) => {
  const toolName = getToolName(part);

  if (part.state === "output-error") {
    return (
      <div className="mb-4 rounded-lg border border-red-800 bg-red-950/50 p-3 text-sm text-red-300">
        <p className="font-semibold">{toolName} failed</p>
        <p>{part.errorText}</p>
      </div>
    );
  }

  const query = getQuery(part.input);

  if (part.state === "output-available") {
    const resultCount = Array.isArray(part.output) ? part.output.length : 0;

    return (
      <div className="mb-4 rounded-lg border border-gray-700 bg-gray-900/60 p-3 text-sm">
        <p className="text-gray-400">
          Searched the web for{" "}
          <span className="font-semibold text-gray-200">
            &ldquo;{query}&rdquo;
          </span>
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Found {resultCount} {resultCount === 1 ? "result" : "results"}
        </p>
      </div>
    );
  }

  return (
    <div className="mb-4 flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-900/60 p-3 text-sm text-gray-400">
      <Loader2 className="size-4 animate-spin" />
      <p>
        Searching the web
        {query ? (
          <>
            {" "}
            for{" "}
            <span className="font-semibold text-gray-200">
              &ldquo;{query}&rdquo;
            </span>
          </>
        ) : null}
        ...
      </p>
    </div>
  );
};

export const ChatMessage = ({ parts, role, userName }: ChatMessageProps) => {
  const isAI = role === "assistant";

  return (
    <div className="mb-6">
      <div
        className={`rounded-lg p-4 ${
          isAI ? "bg-gray-800 text-gray-300" : "bg-gray-900 text-gray-300"
        }`}
      >
        <p className="mb-2 text-sm font-semibold text-gray-400">
          {isAI ? "AI" : userName}
        </p>

        {parts.map((part, index) => {
          if (isToolUIPart(part)) {
            return <ToolInvocation key={index} part={part} />;
          }

          if (part.type === "text") {
            return (
              <div className="prose prose-invert max-w-none" key={index}>
                <Markdown>{part.text}</Markdown>
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
};
