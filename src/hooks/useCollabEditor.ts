// composables/useCollaborativeEditor.ts
import { ref, shallowRef, watch, onBeforeUnmount } from "vue";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { Awareness } from "y-protocols/awareness";
import type { IDomEditor } from "@wangeditor-next/editor";

export function useCollabEditor(roomId: string, serverUrl: string) {
  const editorRef = shallowRef<IDomEditor>();
  const valueHtml = ref("");
  const isEditing = ref(false);

  // Yjs 相关变量
  let ydoc: Y.Doc | null = null;
  let provider: WebsocketProvider | null = null;
  let ytext: Y.Text | null = null;
  let awareness: Awareness | null = null;
  let isRemoteUpdating = false;

  // 用户信息
  const userName = `用户${Math.floor(Math.random() * 1000)}`;
  const getRandomColor = () => {
    const colors = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6"];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleCreated = (editor: IDomEditor) => {
    editorRef.value = editor;
  };

  const handleStartEditing = () => {
    isEditing.value = true;

    ydoc = new Y.Doc();
    provider = new WebsocketProvider(serverUrl, roomId, ydoc);
    ytext = ydoc.getText("wang");
    awareness = provider.awareness;

    awareness.setLocalStateField("user", {
      name: userName,
      color: getRandomColor(),
    });

    const interval = setInterval(() => {
      const editor = editorRef.value;
      if (!editor || !ytext) return;

      clearInterval(interval);

      // Yjs -> Editor
      ytext.observe(() => {
        if (isRemoteUpdating) return;
        isRemoteUpdating = true;
        const newHtml = ytext.toString();
        if (editor && newHtml !== editor.getHtml()) {
          editor.setHtml(newHtml);
        }
        isRemoteUpdating = false;
      });

      // Editor -> Yjs
      watch(valueHtml, (val) => {
        if (isRemoteUpdating) return;
        if (ytext && val !== ytext.toString()) {
          ytext.doc?.transact(() => {
            ytext?.delete(0, ytext.length);
            ytext?.insert(0, val);
          });
        }
      });

      // 初始化内容
      const initHtml = ytext.toString();
      valueHtml.value = initHtml;
      editor.setHtml(initHtml);
    }, 100);
  };

  const handleStopEditing = () => {
    isEditing.value = false;
    if (provider) {
      provider.destroy();
      provider = null;
    }
    if (ydoc) {
      ydoc.destroy();
      ydoc = null;
    }
    ytext = null;
  };

  // 自动清理
  onBeforeUnmount(() => {
    const editor = editorRef.value;
    if (editor) editor.destroy();
    handleStopEditing();
  });

  return {
    editorRef,
    valueHtml,
    isEditing,
    handleCreated,
    handleStartEditing,
    handleStopEditing,
  };
}
