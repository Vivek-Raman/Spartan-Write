import { CopilotChatView } from "@copilotkit/react-core/v2";
import { cn } from "@/lib/utils";
import type { CSSProperties, ReactElement, ReactNode } from "react";
import { cloneElement, isValidElement } from "react";

/** Minimum space under the message list (beyond measured input height). */
const MIN_BOTTOM_PADDING_PX = 24;
/**
 * CopilotKit's default bottom padding is inputHeight + 96 (feather) + 32 (no suggestions),
 * which reads as ~128px before the input is measured. Shave that down while staying above
 * `inputContainerHeight + MIN_BOTTOM_PADDING_PX`.
 */
const REDUCTION_FROM_LIBRARY_PX = 56;

function reduceScrollContentPaddingBottom(
  children: ReactNode,
  inputContainerHeight: number,
): ReactNode {
  if (!isValidElement(children)) return children;

  const props = children.props as { style?: CSSProperties };
  const style = { ...props.style };
  const pb = style.paddingBottom;
  let px = 0;
  if (typeof pb === "string" && pb.endsWith("px")) px = Number.parseFloat(pb);
  else if (typeof pb === "number") px = pb;
  if (!Number.isFinite(px) || px <= 0) return children;

  const reduced = Math.max(
    inputContainerHeight + MIN_BOTTOM_PADDING_PX,
    px - REDUCTION_FROM_LIBRARY_PX,
  );

  return cloneElement(children as ReactElement<{ style?: CSSProperties }>, {
    style: { ...style, paddingBottom: reduced },
  });
}

function AdaptedScrollView(props: React.ComponentProps<typeof CopilotChatView.ScrollView>) {
  const { children, inputContainerHeight = 0, className, ...rest } = props;

  return (
    <CopilotChatView.ScrollView
      {...rest}
      className={cn("min-h-0 flex-1", className)}
      inputContainerHeight={inputContainerHeight}
    >
      {reduceScrollContentPaddingBottom(children, inputContainerHeight)}
    </CopilotChatView.ScrollView>
  );
}

export default AdaptedScrollView as typeof CopilotChatView.ScrollView;
