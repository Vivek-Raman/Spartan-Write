import { CodeBlock } from "@/components/ui/code-block";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ui/tool";
import { updateFileContent } from "@/api/client";
import { useFrontendTool } from "@copilotkit/react-core";

export default function useEditFileTool(dir: string) {
  useFrontendTool({
    name: "edit_file_tool",
    description: "Edit or create a file in the project directory.",
    parameters: [
      {
        name: "file_path",
        type: "string",
        description:
          "Relative path to the file from the project root (e.g., 'main.tex' or 'refs.bib')",
      },
      {
        name: "content",
        type: "string",
        description: "The complete content to write to the file",
      },
    ],
    handler: async ({ file_path, content }) => {
      if (content.length > 20000) {
        return "Error: Too much content. Split up the content into separate subsection tex files. Remember to update main.tex to input the subsections.";
      }
      try {
        const res = await updateFileContent(dir, file_path, content);
        return res.data?.message ?? `Successfully updated '${file_path}'.`;
      } catch (e) {
        return `Error writing to file '${file_path}': ${e instanceof Error ? e.message : String(e)}`;
      }
    },
    render: ({ args: { file_path, content }, status, result }) => {
      if (status === "executing") {
        return (
          <Tool>
            <ToolHeader
              state="input-available"
              title={`Editing ${file_path}...`}
              type="tool-edit_file_tool"
            />
            <ToolContent>
              <ToolInput input={{ file_path, content }} />
            </ToolContent>
          </Tool>
        );
      }
      if (status === "complete") {
        return (
          <Tool>
            <ToolHeader
              state="output-available"
              title={`Edited ${file_path}`}
              type="tool-edit_file_tool"
            />
            <ToolContent>
              <ToolInput input={{ file_path, content }} />
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
