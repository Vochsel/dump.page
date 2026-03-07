"use client";

import { use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function ItemPage({
  params,
}: {
  params: Promise<{ boardId: string; itemId: string }>;
}) {
  const { boardId } = use(params);
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  useEffect(() => {
    const url = `/b/${boardId}${token ? `?token=${token}` : ""}`;
    router.replace(url);
  }, [boardId, token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Redirecting to board...</div>
    </div>
  );
}
