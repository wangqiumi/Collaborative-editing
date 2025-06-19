import { ref, Ref } from "vue";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

export function useCollabEditor(
  roomName: string,
  user: { id: string; name: string; color: string },
  initialContent = "<p>请编辑知识库文档</p>"
) {
  const editorRef = ref<any>(null);
  const users = ref<Map<number, any>>(new Map());

  let ydoc: Y.Doc;
  let provider: WebsocketProvider;
  let yText: Y.Text;

  const startCollab = () => {
    ydoc = new Y.Doc();
    yText = new Y.Text();
    const yXmlFragment = ydoc.getXmlFragment("content");
    yXmlFragment.insert(0, [yText]);

    // 初始化默认内容
    if (yText.length === 0) {
      yText.insert(0, initialContent);
    }

    provider = new WebsocketProvider("ws://localhost:1234", roomName, ydoc);
    provider.awareness.setLocalState(user);
    provider.awareness.on("change", () => {
      users.value = new Map(provider.awareness.getStates());
    });

    provider.once("synced", () => {
      if (editorRef.value) {
        editorRef.value.dangerouslyInsertHtml(yText.toString());
      }
    });

    yText.observe((event) => {
      if (editorRef.value && event.transaction.origin !== editorRef.value) {
        const html = yText.toString();
        const selection = editorRef.value.selection.save();
        editorRef.value.dangerouslyInsertHtml(html);
        editorRef.value.selection.restore(selection);
      }
    });
  };

  const stopCollab = () => {
    provider?.destroy();
    ydoc?.destroy();
    users.value.clear();
  };

  const handleChange = (editor: any) => {
    if (!editor || !yText || !ydoc) return;
    const html = editor.getHtml();
    const old = yText.toString();
    if (html !== old) {
      ydoc.transact(() => {
        yText.delete(0, yText.length);
        yText.insert(0, html);
      }, editor);
    }
  };

  return {
    editorRef,
    users,
    startCollab,
    stopCollab,
    handleChange,
  };
}
