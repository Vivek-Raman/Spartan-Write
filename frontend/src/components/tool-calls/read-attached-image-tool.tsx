import { useFrontendTool } from "@copilotkit/react-core";
import { CodeBlock } from "@/components/ui/code-block";
import { Tool, ToolContent, ToolHeader, ToolOutput } from "@/components/ui/tool";

export default function useReadAttachedImageTool(imageBytes: string | null) {
  useFrontendTool({
    name: "read_attached_image_tool",
    description: "Read the currently attached image and return its base64-encoded bytes.",
    parameters: [],
    handler: async () => {
      if (!imageBytes) return "Error: No image is currently attached.";
      return imageBytes;
    },
    render: ({ status, result }) => {
      if (status === "executing") {
        return (
          <Tool>
            <ToolHeader
              state="input-available"
              title="Read attached image"
              type="tool-read_attached_image_tool"
            />
          </Tool>
        );
      }
      if (status === "complete") {
        return (
          <Tool>
            <ToolHeader
              state="output-available"
              title="Read attached image"
              type="tool-read_attached_image_tool"
            />
            <ToolContent>
              <ToolOutput
                errorText={undefined}
                output={
                  <CodeBlock
                    code={typeof result === "string" ? result : JSON.stringify(result, null, 2)}
                    language="json"
                  />
                }
              />
            </ToolContent>
          </Tool>
        );
      }

      return <></>;
    },
  });
}
