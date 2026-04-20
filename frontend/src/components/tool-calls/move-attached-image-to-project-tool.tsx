import { useFrontendTool } from "@copilotkit/react-core";
import { CodeBlock } from "@/components/ui/code-block";
import { Tool, ToolContent, ToolHeader, ToolOutput } from "@/components/ui/tool";
import { moveImageToProject } from "@/api/client";

export default function useMoveAttachedImageToProjectTool(dir: string, uploadedImagePath: string | null) {
  useFrontendTool({
    name: "move_attached_image_to_project_tool",
    description: "Copy the currently attached image into the project's figures directory.",
    parameters: [],
    handler: async () => {
      if (!uploadedImagePath) return "Error: No image is currently attached.";
      try {
        const res = await moveImageToProject(uploadedImagePath, dir);
        return `Copied attached image to '${res.data?.moved_path}'.`;
      } catch (e) {
        return `Error copying attached image into project: ${e instanceof Error ? e.message : String(e)}`;
      }
    },
    render: ({ status, result }) => {
      if (status === "executing") {
        return (
          <Tool>
            <ToolHeader
              state="input-available"
              title="Copy attached image to project"
              type="tool-move_attached_image_to_project_tool"
            />
          </Tool>
        );
      }
      if (status === "complete") {
        return (
          <Tool>
            <ToolHeader
              state="output-available"
              title="Copy attached image to project"
              type="tool-move_attached_image_to_project_tool"
            />
            <ToolContent>
              <ToolOutput errorText={undefined} output={
                <CodeBlock code={result} language="markdown" />
              } />
            </ToolContent>
          </Tool>
        );
      }

      return <></>;
    },
  });
}
