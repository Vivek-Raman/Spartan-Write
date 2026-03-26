import { CopilotChat } from "@copilotkit/react-core/v2";
import MessageViewAdapter from "./ai-component-adapters/message-view";
import InputViewAdapter from "./ai-component-adapters/input-view";
import ScrollViewAdapter from "./ai-component-adapters/scroll-view";
import { useImageForAIChat } from "@/contexts/image-for-ai-chat-context";
import { useEditor } from "@/contexts/editor-context";
import UploadedImageItem from "./uploaded-image-item";
import useReadFileTool from "./tool-calls/read-file-tool";
import useListFilesTool from "./tool-calls/list-files-tool";
import useEditFileTool from "./tool-calls/edit-file-tool";
import useCompileProjectTool from "./tool-calls/compile-project-tool";
import useMoveAttachedImageToProjectTool from "./tool-calls/move-attached-image-to-project-tool";
// import useReadAttachedImageTool from "./tool-calls/read-attached-image-tool";

export default function AIChat() {
  const { dir } = useEditor();
  const { uploadedImageData, handleRemoveImage } = useImageForAIChat();

  useReadFileTool(dir ?? "");
  useListFilesTool(dir ?? "");
  useEditFileTool(dir ?? "");
  useCompileProjectTool(dir ?? "");
  useMoveAttachedImageToProjectTool(dir ?? "", uploadedImageData?.path ?? null);
  // useReadAttachedImageTool(uploadedImageData?.image_bytes ?? null);

  return (
    <div className="ai-chat-panel flex h-full min-h-0 min-w-0 w-full flex-col bg-background">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-2 mb-2">
        <CopilotChat
          className="flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden"
          welcomeScreen={false}
          messageView={MessageViewAdapter}
          input={InputViewAdapter}
          scrollView={ScrollViewAdapter}
        ></CopilotChat>
      </div>
      {uploadedImageData ? (
        <div className="min-w-0 shrink-0">
          <UploadedImageItem
            imageData={uploadedImageData}
            onRemove={handleRemoveImage}
          />
        </div>
      ) : null}
    </div>
  );
}
