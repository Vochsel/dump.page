"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { NodeProps } from "@xyflow/react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Trash2 } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";

type TextNodeData = {
  content: string;
  nodeId: Id<"nodes">;
  canEdit: boolean;
};

export function TextNode({ data }: NodeProps) {
  const { content, nodeId, canEdit } = data as unknown as TextNodeData;
  const [editing, setEditing] = useState(!content && canEdit);
  const [value, setValue] = useState(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const updateNode = useMutation(api.nodes.updateNode);
  const deleteNode = useMutation(api.nodes.deleteNode);

  useEffect(() => {
    if (!editing) setValue(content);
  }, [content, editing]);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [editing]);

  const handleBlur = useCallback(async () => {
    setEditing(false);
    if (value !== content) {
      await updateNode({ nodeId, content: value });
    }
  }, [value, content, nodeId, updateNode]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setEditing(false);
        setValue(content);
      }
      e.stopPropagation();
    },
    [content]
  );

  return (
    <div className="bg-yellow-100 dark:bg-yellow-900/40 rounded-sm shadow-md min-w-[180px] max-w-[360px] group border border-yellow-200/60 dark:border-yellow-700/40">
      <div className="p-3">
        {editing && canEdit ? (
          <TextareaAutosize
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            minRows={1}
            className="w-full resize-none bg-transparent border-none p-0 text-sm text-yellow-900 dark:text-yellow-100 placeholder:text-yellow-600/50 focus:outline-none"
            placeholder="Type something..."
          />
        ) : (
          <div
            className="text-sm whitespace-pre-wrap min-h-[24px] cursor-text text-yellow-900 dark:text-yellow-100"
            onClick={() => canEdit && setEditing(true)}
          >
            {content || (
              <span className="text-yellow-600/50 italic">
                Click to edit...
              </span>
            )}
          </div>
        )}
      </div>
      {canEdit && (
        <div className="absolute -top-2.5 -right-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => deleteNode({ nodeId })}
            className="bg-destructive rounded-full p-1 shadow-sm hover:bg-destructive/90"
          >
            <Trash2 className="h-3 w-3 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}
