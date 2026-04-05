import { CodeBlock } from "@/components/ui/code-block";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ui/tool";
import { deleteFile } from "@/api/client";
import { useFrontendTool } from "@copilotkit/react-core";

export default function useDeleteFileTool(dir: string) {
  useFrontendTool({
    name: "delete_file_tool",
    description:
      "Delete a file from the project directory. Does not delete directories.",
    parameters: [
      {
        name: "file_path",
        type: "string",
        description:
          "Relative path to the file from the project root (e.g., 'sections/old.tex')",
      },
    ],
    handler: async ({ file_path }) => {
      try {
        const res = await deleteFile(dir, file_path);
        return res.data?.message ?? `Successfully deleted '${file_path}'.`;
      } catch (e) {
        return `Error deleting file '${file_path}': ${e instanceof Error ? e.message : String(e)}`;
      }
    },
    render: ({ args: { file_path }, status, result }) => {
      if (status === "executing") {
        return (
          <Tool>
            <ToolHeader
              state="input-available"
              title={`Deleting ${file_path}...`}
              type="tool-delete_file_tool"
            />
            <ToolContent>
              <ToolInput input={{ file_path }} />
            </ToolContent>
          </Tool>
        );
      }
      if (status === "complete") {
        return (
          <Tool>
            <ToolHeader
              state="output-available"
              title={`Deleted ${file_path}`}
              type="tool-delete_file_tool"
            />
            <ToolContent>
              <ToolInput input={{ file_path }} />
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
