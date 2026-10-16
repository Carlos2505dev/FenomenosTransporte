import katex from "katex";
import "katex/dist/katex.min.css";

export function Formula({ tex, block = false, className = "" }: { tex: string; block?: boolean; className?: string }) {
  const html = katex.renderToString(tex, { displayMode: block, throwOnError: false });
  return <span className={`text-accent ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
