"use client";

import { useState, useCallback, useEffect } from "react";
import { NodeProps } from "@xyflow/react";
import { Trash2 } from "lucide-react";
import { TipTapEditor } from "./TipTapEditor";
import { useBoardOps } from "@/context/board-ops-context";

import type { UndoAction } from "@/hooks/useUndoRedo";

type TextNodeData = {
  content: string;
  nodeId: string;
  canEdit: boolean;
  pushAction: (action: UndoAction) => void;
  deleteNodeWithUndo: (nodeId: string) => void;
};

export function TextNode({ data }: NodeProps) {
  const { content, nodeId, canEdit, pushAction, deleteNodeWithUndo } = data as unknown as TextNodeData;
  const [editing, setEditing] = useState(!content && canEdit);
  const { updateNode } = useBoardOps();

  // If content becomes non-empty externally while we were in auto-edit mode, stop editing
  useEffect(() => {
    if (content && editing) {
      // Keep editing - user is actively typing
    }
  }, [content, editing]);

  const handleSave = useCallback(
    async (html: string) => {
      setEditing(false);
      // Normalize empty editor output
      const isEmpty =
        !html || html === "<p></p>" || html.replace(/<[^>]*>/g, "").trim() === "";
      const newContent = isEmpty ? "" : html;
      if (newContent !== content) {
        pushAction({ type: "edit", nodeId, oldContent: content, newContent });
        await updateNode({ nodeId, content: newContent });
      }
    },
    [content, nodeId, updateNode, pushAction]
  );

  const handleCancel = useCallback(() => {
    setEditing(false);
  }, []);

  return (
    <div className="bg-yellow-100 dark:bg-yellow-900/40 rounded-sm shadow-md min-w-[180px] max-w-[360px] group border border-yellow-200/60 dark:border-yellow-700/40">
      <div className="p-3">
        {editing && canEdit ? (
          <TipTapEditor
            content={content}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        ) : (
          <div
            className="tiptap-editor text-sm min-h-[24px] cursor-text text-yellow-900 dark:text-yellow-100"
            onClick={() => canEdit && setEditing(true)}
            dangerouslySetInnerHTML={
              content ? { __html: content } : undefined
            }
          >
            {!content ? (
              <span className="text-yellow-600/50 italic">
                Click to edit...
              </span>
            ) : undefined}
          </div>
        )}
      </div>
      {canEdit && (
        <div className="absolute -top-2.5 -right-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => deleteNodeWithUndo(nodeId)}
            className="bg-destructive rounded-full p-1 shadow-sm hover:bg-destructive/90"
          >
            <Trash2 className="h-3 w-3 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}
