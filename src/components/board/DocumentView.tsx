"use client";

import { useBoardOps } from "@/context/board-ops-context";
import { ExternalLink } from "lucide-react";

export function DocumentView({ boardName }: { boardName: string }) {
  const { nodes: boardNodes } = useBoardOps();

  const nodes = boardNodes ?? [];
  const textNodes = nodes.filter((n) => n.type === "text");
  const linkNodes = nodes.filter((n) => n.type === "link");
  const checklistNodes = nodes.filter((n) => n.type === "checklist");

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        This board is empty.
      </div>
    );
  }

  return (
    <article className="max-w-2xl mx-auto px-6 py-8 prose prose-sm dark:prose-invert max-w-none">
      <h1>{boardName}</h1>

      {textNodes.map((node) => (
        <section key={node._id}>
          {node.title && <h2>{node.title}</h2>}
          {node.content ? (
            <div dangerouslySetInnerHTML={{ __html: node.content }} />
          ) : (
            <p className="italic text-muted-foreground">Empty note</p>
          )}
        </section>
      ))}

      {checklistNodes.length > 0 && (
        <section>
          <h2>Checklists</h2>
          {checklistNodes.map((node) => {
            let items: Array<{ id: string; text: string; checked: boolean }> = [];
            try { items = JSON.parse(node.content); } catch { /* skip */ }
            return (
              <div key={node._id} className="mb-4">
                {node.title && <h3>{node.title}</h3>}
                <ul className="list-none pl-0 space-y-0.5">
                  {items.map((item) => (
                    <li key={item.id} className={`flex items-start gap-2 ${item.checked ? "line-through opacity-50" : ""}`}>
                      <span>{item.checked ? "☑" : "☐"}</span>
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </section>
      )}

      {linkNodes.length > 0 && (
        <section>
          <h2>Links</h2>
          <ul>
            {linkNodes.map((node) => {
              const title = node.metadata?.title || node.content;
              return (
                <li key={node._id}>
                  <a href={node.content} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1">
                    {title}
                    <ExternalLink className="h-3 w-3 inline" />
                  </a>
                  {node.metadata?.description && (
                    <span className="text-muted-foreground"> — {node.metadata.description}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </article>
  );
}
