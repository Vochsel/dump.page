"use client";

import { useRouter } from "next/navigation";

export function StartDumpingButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/new")}
      className="mt-4 px-8 py-3 text-white text-lg font-semibold rounded-full font-[family-name:var(--font-poppins)] transition-all hover:scale-105 shadow-md"
      style={{
        backgroundColor: "#7bd096",
        outline: "3px solid white",
        outlineOffset: "-1px",
        boxShadow: "0 2px 8px rgba(123, 208, 150, 0.4)",
      }}
    >
      Start dumping — it&apos;s free
    </button>
  );
}
