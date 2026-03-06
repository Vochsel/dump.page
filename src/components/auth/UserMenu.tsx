"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Bot, Check } from "lucide-react";

export function UserMenu() {
  const { user, signOut } = useAuth();
  const [copiedMcp, setCopiedMcp] = useState(false);

  if (!user) return null;

  const initials = (user.displayName ?? user.email ?? "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? ""} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem className="text-muted-foreground text-xs" disabled>
          {user.email}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2"
          onClick={async () => {
            const origin = window.location.origin;
            await navigator.clipboard.writeText(`${origin}/api/mcp/mcp`);
            setCopiedMcp(true);
            setTimeout(() => setCopiedMcp(false), 2000);
          }}
        >
          {copiedMcp ? (
            <Check className="h-4 w-4" />
          ) : (
            <Bot className="h-4 w-4" />
          )}
          {copiedMcp ? "Copied MCP URL!" : "Copy MCP Server URL"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut} className="gap-2">
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
