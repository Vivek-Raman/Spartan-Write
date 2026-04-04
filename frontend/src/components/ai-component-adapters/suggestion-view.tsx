import {
  CopilotChatSuggestionView,
  type CopilotChatSuggestionViewProps,
} from "@copilotkit/react-core/v2";
import { Suggestion, Suggestions } from "@/components/ui/suggestion";
import { cn } from "@/lib/utils";
import React from "react";

const AdaptedSuggestionView = React.forwardRef<
  HTMLDivElement,
  CopilotChatSuggestionViewProps
>(function AdaptedSuggestionView(
  {
    suggestions,
    onSelectSuggestion,
    loadingIndexes,
    className,
    container: _container,
    suggestion: _suggestionSlot,
    children: _children,
    ...rest
  },
  ref,
) {
  const loadingSet = React.useMemo(() => {
    if (!loadingIndexes?.length) return new Set<number>();
    return new Set(loadingIndexes);
  }, [loadingIndexes]);

  return (
    <div
      ref={ref}
      data-copilotkit
      data-testid="copilot-suggestions"
      className={cn("pointer-events-auto w-full max-w-3xl", className)}
      {...rest}
    >
      <Suggestions className="gap-1.5 sm:gap-2">
        {suggestions.map((suggestion, index) => {
          const isLoading =
            loadingSet.has(index) || suggestion.isLoading === true;
          return (
            <Suggestion
              key={`${suggestion.title}-${index}`}
              suggestion={suggestion.title}
              onClick={() => onSelectSuggestion?.(suggestion, index)}
              disabled={isLoading}
              aria-busy={isLoading}
              className="shrink-0"
            />
          );
        })}
      </Suggestions>
    </div>
  );
});

AdaptedSuggestionView.displayName = "CopilotChatSuggestionView";

export default AdaptedSuggestionView as typeof CopilotChatSuggestionView;
