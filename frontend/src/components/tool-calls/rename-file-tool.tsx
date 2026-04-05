import { CodeBlock } from "@/components/ui/code-block";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ui/tool";
import { renameFile } from "@/api/client";
import { useFrontendTool } from "@copilotkit/react-core";

export default function useRenameFileTool(dir: string) {
  useFrontendTool({
    name: "rename_file_tool",
    description:
      "Rename or move a file within the project directory (same as moving to a new relative path).",
    parameters: [
      {
        name: "from_path",
        type: "string",
        description: "Current relative path of the file from the project root",
      },
      {
        name: "to_path",
        type: "string",
        description: "New relative path for the file from the project root",
      },
    ],
    handler: async ({ from_path, to_path }) => {
      try {
        const res = await renameFile(dir, from_path, to_path);
        return (
          res.data?.message ??
          `Successfully renamed '${from_path}' to '${to_path}'.`
        );
      } catch (e) {
        return `Error renaming file: ${e instanceof Error ? e.message : String(e)}`;
      }
    },
    render: ({ args: { from_path, to_path }, status, result }) => {
      if (status === "executing") {
        return (
          <Tool>
            <ToolHeader
              state="input-available"
              title={`Renaming ${from_path} → ${to_path}...`}
              type="tool-rename_file_tool"
            />
            <ToolContent>
              <ToolInput input={{ from_path, to_path }} />
            </ToolContent>
          </Tool>
        );
      }
      if (status === "complete") {
        return (
          <Tool>
            <ToolHeader
              state="output-available"
              title={`Renamed ${from_path} → ${to_path}`}
              type="tool-rename_file_tool"
            />
            <ToolContent>
              <ToolInput input={{ from_path, to_path }} />
              <ToolOutput
                errorText={undefined}
                output={<CodeBlock code={result} language="markdown" />}
              />
            </ToolContent>
          </Tool>
        );
      }

      return <></>;
    },
  });
}
