import {
  CopilotChatInput,
  CopilotChatInputProps,
  useAgent,
  UseAgentUpdate,
  useCopilotChatConfiguration,
} from "@copilotkit/react-core/v2";
import {
  PromptInput,
  PromptInputBody,
  PromptInputClearChat,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ui/prompt-input";
import { cn } from "@/lib/utils";
import { useCallback } from "react";

function AdaptedInputView(props: CopilotChatInputProps) {
  const {
    onSubmitMessage,
    onStop,
    containerRef,
    className,
    positioning = "static",
    keyboardHeight = 0,
  } = props;

  const config = useCopilotChatConfiguration();
  const { agent } = useAgent({
    agentId: config?.agentId,
    updates: [UseAgentUpdate.OnRunStatusChanged],
  });

  const status = agent.isRunning ? "streaming" : "ready";

  const handleClearChat = useCallback(() => {
    if (agent.isRunning) {
      onStop?.();
    }
    agent.setMessages([]);
  }, [agent, onStop]);

  const input = (
    <PromptInput
      maxFiles={0}
      onSubmit={(prompt) => onSubmitMessage?.(prompt.text)}
    >
      <PromptInputBody>
        <PromptInputTextarea placeholder="What can I help you with?" />
      </PromptInputBody>
      <PromptInputFooter className="flex justify-between">
        <div />
        <div className="flex items-center gap-1">
          <PromptInputClearChat onClearChat={handleClearChat} status={status} />
          <PromptInputSubmit status={status} onStop={onStop} />
        </div>
      </PromptInputFooter>
    </PromptInput>
  );

  if (positioning !== "absolute") {
    return input;
  }

  // In-flow footer (used with CopilotChat `children` layout in ai-chat.tsx) so the
  // prompt sits directly under the suggestion row instead of overlaying it.
  return (
    <div
      data-copilotkit
      ref={containerRef}
      className={cn(
        "z-20 min-w-0 w-full shrink-0 pointer-events-none",
        className,
      )}
      style={{
        transform: keyboardHeight > 0 ? `translateY(-${keyboardHeight}px)` : undefined,
        transition: "transform 0.2s ease-out",
      }}
    >
      <div className="pointer-events-auto mx-auto max-w-3xl px-4 sm:px-0 pb-2">
        {input}
      </div>
    </div>
  );
}

export default AdaptedInputView as typeof CopilotChatInput;
