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
import { Editor, Toolbar } from "@wangeditor-next/editor-for-vue";
import { useCollabEditor } from "../hooks/useCollabEditor";

// 配置项
const toolbarConfig = {};
const editorConfig = {};

// 使用 hook
const {
  editorRef,
  valueHtml,
  isEditing,
  handleCreated,
  handleStartEditing,
  handleStopEditing,
} = useCollabEditor("wang-room", "ws://localhost:1234");
</script>
