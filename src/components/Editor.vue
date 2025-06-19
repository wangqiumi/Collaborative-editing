<template>
  <div>
    <div style="margin-bottom: 10px">
      <button @click="handleStartEditing" :disabled="isEditing">编辑</button>
      <button @click="handleStopEditing" :disabled="!isEditing">退出</button>
    </div>

    <div style="border: 1px solid #ccc">
      <Toolbar
        :editor="editorRef"
        :defaultConfig="toolbarConfig"
        mode="default"
        style="border-bottom: 1px solid #ccc"
      />
      <Editor
        v-model="valueHtml"
        :defaultConfig="editorConfig"
        mode="default"
        style="height: 400px; overflow-y: hidden"
        @onCreated="handleCreated"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import "@wangeditor-next/editor/dist/css/style.css";
import { onBeforeUnmount, ref, shallowRef, watch } from "vue";
import { Editor, Toolbar } from "@wangeditor-next/editor-for-vue";
import type { IDomEditor } from "@wangeditor-next/editor";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { Awareness } from "y-protocols/awareness";

// 状态变量
const editorRef = shallowRef<IDomEditor | undefined>(undefined);
const valueHtml = ref("");
const isEditing = ref(false);

// Yjs 相关变量
let ydoc: Y.Doc | null = null;
let provider: WebsocketProvider | null = null;
let ytext: Y.Text | null = null;
let awareness: Awareness | null = null;
let isRemoteUpdating = false;

// 编辑器配置
const toolbarConfig = {};
const editorConfig = {};

// 用户名和颜色
const userName = `用户${Math.floor(Math.random() * 1000)}`;
const getRandomColor = () => {
  const colors = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6"];
  return colors[Math.floor(Math.random() * colors.length)];
};

// 创建编辑器实例
const handleCreated = (editor: IDomEditor) => {
  editorRef.value = editor;
};

// 启动协同
const handleStartEditing = () => {
  isEditing.value = true;

  ydoc = new Y.Doc();
  provider = new WebsocketProvider("ws://localhost:1234", "wang-room", ydoc);
  ytext = ydoc.getText("wang");
  awareness = provider.awareness;

  awareness.setLocalStateField("user", {
    name: userName,
    color: getRandomColor(),
  });

  // 初始绑定
  const interval = setInterval(() => {
    const editor = editorRef.value;
    if (!editor || !ytext) return;

    clearInterval(interval);

    // Yjs -> 编辑器
    ytext.observe(() => {
      if (isRemoteUpdating) return;
      isRemoteUpdating = true;
      const editor = editorRef.value;
      if (editor && ytext) {
        const newHtml = ytext.toString();
        if (newHtml !== editor.getHtml()) {
          editor.setHtml(newHtml);
        }
      }
      isRemoteUpdating = false;
    });

    // 编辑器 -> Yjs（通过 valueHtml 控制）
    watch(valueHtml, (val) => {
      if (isRemoteUpdating) return;
      if (ytext && val !== ytext.toString()) {
        ytext.doc?.transact(() => {
          ytext?.delete(0, ytext.length);
          ytext?.insert(0, val);
        });
      }
    });

    // 初始化 HTML
    const initHtml = ytext.toString();
    valueHtml.value = initHtml;
    editor.setHtml(initHtml);
  }, 100);
};

// 停止协同
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

// 清理资源
onBeforeUnmount(() => {
  const editor = editorRef.value;
  if (editor) editor.destroy();
  handleStopEditing();
});
</script>
