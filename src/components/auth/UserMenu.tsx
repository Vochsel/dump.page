"use client";

import { useAuth } from "@/context/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function UserMenu() {
  const { user, signOut } = useAuth();

  if (!user) return null;

  const initials = (user.displayName ?? user.email ?? "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md p-0 overflow-hidden">
          <Avatar className="h-6 w-6 rounded-md">
            <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? ""} className="rounded-md" />
            <AvatarFallback className="text-[10px] rounded-md">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem className="text-muted-foreground text-xs" disabled>
          {user.email}
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="gap-2">
          <Link href="/profile">
            <User className="h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={signOut} className="gap-2">
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
