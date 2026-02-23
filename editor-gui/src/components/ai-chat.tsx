import { CopilotChat } from "@copilotkit/react-core/v2";
import useRenderReadFileTool from "./tool-calls/read-file-tool";
import useRenderListFilesTool from "./tool-calls/list-files-tool";
import useRenderEditFileTool from "./tool-calls/edit-file-tool";
import useRenderCompileProjectTool from "./tool-calls/compile-project-tool";

interface AIChatProps {
  onComplete: () => void;
}

export default function AIChat({ onComplete }: AIChatProps) {
  useRenderReadFileTool();
  useRenderListFilesTool();
  useRenderEditFileTool();
  useRenderCompileProjectTool();

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex-1 min-h-0 px-2 py-2">
        <CopilotChat
          className="flex h-full flex-col"
          welcomeScreen={false}
          input={{ onStop: onComplete }}
        />
      </div>
    </div>
  );
}

