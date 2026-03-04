"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";

interface TipTapEditorProps {
  content: string;
  onSave: (html: string) => void;
  onCancel: () => void;
}

export function TipTapEditor({ content, onSave, onCancel }: TipTapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit, TaskList, TaskItem.configure({ nested: true })],
    content,
    editorProps: {
      attributes: {
        class:
          "tiptap-editor outline-none text-sm text-yellow-900 dark:text-yellow-100 min-h-[24px]",
      },
    },
    onBlur({ editor }) {
      onSave(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && !editor.isFocused) {
      editor.commands.focus("end");
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <div
      className="nodrag nowheel"
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Escape") {
          e.preventDefault();
          onCancel();
        }
      }}
    >
      <EditorContent editor={editor} />
    </div>
  );
}
