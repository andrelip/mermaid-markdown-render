/**
 * Markdown Renderer Configuration
 * Configures marked.js with custom rendering for code blocks and Mermaid diagrams
 */

import { marked } from "marked";
import hljs from "highlight.js";
import { MARKED_OPTIONS } from "../config";

/**
 * Creates a custom code renderer that handles:
 * - Mermaid diagram rendering
 * - Syntax highlighting for code blocks
 */
function createCodeRenderer() {
  const renderer = new marked.Renderer();
  const originalCodeRenderer = renderer.code.bind(renderer);

  renderer.code = function (
    code: string,
    language: string | undefined,
    isEscaped: boolean,
  ): string {
    // Handle mermaid diagrams specially
    if (language === "mermaid") {
      return `<div class="mermaid">${code}</div>`;
    }

    // Apply syntax highlighting if language is specified and supported
    if (language && hljs.getLanguage(language)) {
      try {
        const highlighted = hljs.highlight(code, { language }).value;
        return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`;
      } catch (err) {
        console.error("Highlight error:", err);
      }
    }

    // Fallback to default rendering
    return originalCodeRenderer(code, language, isEscaped);
  };

  return renderer;
}

/**
 * Configures marked with custom renderer and options
 * Call this once during application initialization
 */
export function configureMarked(): void {
  const renderer = createCodeRenderer();

  marked.setOptions({
    renderer,
    breaks: MARKED_OPTIONS.breaks,
    gfm: MARKED_OPTIONS.gfm,
  });
}

/**
 * Parses markdown content to HTML using configured marked instance
 */
export function parseMarkdown(content: string): string {
  return marked.parse(content) as string;
}
