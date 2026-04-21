import {
  CopilotChatToolCallsView,
  type CopilotChatAssistantMessageProps,
  type CopilotChatMessageViewProps,
  type CopilotChatUserMessageProps,
} from "@copilotkit/react-core/v2";
import { useState } from "react";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ui/message";

function AdaptedAssistantMessage(props: CopilotChatAssistantMessageProps) {
  const { message } = props;

  return (
    <Message from="assistant">
      <MessageContent>
        <MessageResponse>{message.content}</MessageResponse>
      </MessageContent>
      {message.toolCalls && (
        <CopilotChatToolCallsView message={message} messages={props.messages} />
      )}
    </Message>
  );
}

function AdaptedUserMessage(props: CopilotChatUserMessageProps) {
  const { message } = props;
  const [isExpanded, setIsExpanded] = useState(false);
  const content = typeof message.content === "string" ? message.content : null;
  const shouldCollapse = content !== null && content.split("\n").length > 15;

  return (
    <Message from="user" className="my-4">
      <MessageContent>
        {content !== null && (
          <>
            <div
              style={
                shouldCollapse && !isExpanded
                  ? {
                      display: "-webkit-box",
                      WebkitBoxOrient: "vertical",
                      WebkitLineClamp: 15,
                      overflow: "hidden",
                    }
                  : undefined
              }
            >
              <MessageResponse>{content}</MessageResponse>
            </div>
            {shouldCollapse && !isExpanded && (
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className="mt-2 text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
              >
                more...
              </button>
            )}
          </>
        )}
        {Array.isArray(message.content) && (
          // FIXME: Implement this
          <pre>{JSON.stringify(message.content, null, 2)}</pre>
        )}
      </MessageContent>
    </Message>
  );
}

export default {
  assistantMessage: AdaptedAssistantMessage,
  userMessage: AdaptedUserMessage,
} as CopilotChatMessageViewProps;
