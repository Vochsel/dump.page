"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Link from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";

interface TipTapEditorProps {
  content: string;
  onSave: (html: string) => void;
  onCancel: () => void;
}

export function TipTapEditor({ content, onSave, onCancel }: TipTapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    autofocus: "end",
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "underline text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300",
        },
      }),
      Table.configure({
        resizable: false,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    editorProps: {
      attributes: {
        class:
          "tiptap-editor outline-none text-sm text-yellow-900 dark:text-yellow-100 min-h-[24px]",
        spellcheck: "true",
        autocorrect: "on",
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

  // Show static content while editor initializes to prevent flicker
  if (!editor) {
    return (
      <div className="nodrag nowheel">
        <div
          className="tiptap-editor outline-none text-sm text-yellow-900 dark:text-yellow-100 min-h-[24px]"
          dangerouslySetInnerHTML={content ? { __html: content } : undefined}
        />
      </div>
    );
  }

  return (
    <div
      className="nodrag nowheel overflow-hidden"
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Escape") {
          e.preventDefault();
          onCancel();
        }
        if (e.key === "Tab") {
          e.preventDefault();
          e.stopPropagation();
          if (!editor) return;
          if (e.shiftKey) {
            // Outdent: try list item lift first, then unwrap blockquote
            const lifted =
              editor.chain().focus().liftListItem("listItem").run() ||
              editor.chain().focus().liftListItem("taskItem").run();
            if (!lifted) {
              editor.chain().focus().lift("blockquote").run();
            }
          } else {
            // Indent: try list item sink first, then wrap in blockquote
            const sank =
              editor.chain().focus().sinkListItem("listItem").run() ||
              editor.chain().focus().sinkListItem("taskItem").run();
            if (!sank) {
              editor.chain().focus().setBlockquote().run();
            }
          }
        }
      }}
    >
      <EditorContent editor={editor} />
    </div>
  );
}
