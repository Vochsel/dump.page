import { BUILD_VERSION } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="py-6 text-center text-xs text-stone-400 dark:text-stone-500 font-[family-name:var(--font-poppins)]">
      made with &lt;3 by{" "}
      <a href="https://www.vochsel.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
        vochsel
      </a>
      {" "}&middot;{" "}
      <a href="https://github.com/Vochsel/dump.page" target="_blank" rel="noopener noreferrer" className="underline hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
        GitHub
      </a>
      {" "}&middot;{" "}
      <a href="/changelog" className="underline hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
        v{BUILD_VERSION}
      </a>
    </footer>
  );
}
