import { BUILD_VERSION } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="py-6 text-center text-xs text-stone-400 dark:text-stone-500 font-[family-name:var(--font-poppins)]">
      made with &lt;3 by{" "}
      <a href="https://www.vochsel.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
        vochsel
      </a>
      , powered by{" "}
      <a href="https://www.magpai.app" target="_blank" rel="noopener noreferrer" className="underline hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
        Magpai
      </a>
      {" "}- v{BUILD_VERSION}
    </footer>
  );
}
