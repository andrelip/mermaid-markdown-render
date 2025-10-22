import { describe, it, expect } from "vitest";
import { marked } from "marked";
import hljs from "highlight.js";

describe("Markdown Rendering", () => {
  describe("Basic Markdown Syntax", () => {
    it("should render headings correctly", () => {
      const markdown = "# Heading 1\n## Heading 2";
      const html = marked.parse(markdown) as string;

      expect(html).toContain("<h1>Heading 1</h1>");
      expect(html).toContain("<h2>Heading 2</h2>");
    });

    it("should render paragraphs correctly", () => {
      const markdown = "This is a paragraph.";
      const html = marked.parse(markdown) as string;

      expect(html).toContain("<p>This is a paragraph.</p>");
    });

    it("should render lists correctly", () => {
      const markdown = "- Item 1\n- Item 2\n- Item 3";
      const html = marked.parse(markdown) as string;

      expect(html).toContain("<ul>");
      expect(html).toContain("<li>Item 1</li>");
      expect(html).toContain("<li>Item 2</li>");
    });

    it("should render inline code with backticks", () => {
      const markdown = "Use `const` instead of `var`";
      const html = marked.parse(markdown) as string;

      expect(html).toContain("<code>const</code>");
      expect(html).toContain("<code>var</code>");
    });

    it("should render links correctly", () => {
      const markdown = "[Google](https://google.com)";
      const html = marked.parse(markdown) as string;

      expect(html).toContain('<a href="https://google.com">Google</a>');
    });

    it("should render code blocks with triple backticks", () => {
      const markdown = "```\nconst x = 1;\n```";
      const html = marked.parse(markdown) as string;

      expect(html).toContain("<pre>");
      expect(html).toContain("<code>");
      expect(html).toContain("const x = 1;");
    });
  });

  describe("GitHub-Flavored Markdown", () => {
    it("should render tables correctly", () => {
      const markdown =
        "| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |";
      const html = marked.parse(markdown, { gfm: true }) as string;

      expect(html).toContain("<table>");
      expect(html).toContain("<thead>");
      expect(html).toContain("<tbody>");
      expect(html).toContain("Header 1");
      expect(html).toContain("Cell 1");
    });

    it("should render strikethrough correctly", () => {
      const markdown = "~~strikethrough~~";
      const html = marked.parse(markdown, {
        gfm: true,
        breaks: true,
      }) as string;

      expect(html).toContain("strikethrough");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty markdown", () => {
      const markdown = "";
      const html = marked.parse(markdown) as string;

      expect(html).toBe("");
    });

    it("should handle markdown with only whitespace", () => {
      const markdown = "   \n  \n   ";
      const html = marked.parse(markdown) as string;

      expect(html.trim()).toBe("");
    });

    it("should handle special characters", () => {
      const markdown = "Test & test < test > test \" test ' test";
      const html = marked.parse(markdown) as string;

      expect(html).toContain("&amp;");
      expect(html).toContain("&lt;");
      expect(html).toContain("&gt;");
      expect(html).toContain("&quot;");
    });
  });
});

describe("Syntax Highlighting", () => {
  it("should highlight JavaScript code", () => {
    const code = "const x = 42;\nconsole.log(x);";
    const highlighted = hljs.highlight(code, { language: "javascript" });

    expect(highlighted.value).toBeTruthy();
    expect(highlighted.language).toBe("javascript");
  });

  it("should highlight TypeScript code", () => {
    const code = "interface User { name: string; }";
    const highlighted = hljs.highlight(code, { language: "typescript" });

    expect(highlighted.value).toBeTruthy();
    expect(highlighted.language).toBe("typescript");
  });

  it("should highlight Python code", () => {
    const code = 'def hello():\n    print("Hello")';
    const highlighted = hljs.highlight(code, { language: "python" });

    expect(highlighted.value).toBeTruthy();
    expect(highlighted.language).toBe("python");
  });

  it("should handle unknown language gracefully", () => {
    const hasLanguage = hljs.getLanguage("unknownlang123");
    expect(hasLanguage).toBeUndefined();
  });

  it("should handle empty code blocks", () => {
    const code = "";
    const highlighted = hljs.highlight(code, { language: "javascript" });

    expect(highlighted.value).toBe("");
  });
});

describe("Mermaid Diagram Handling", () => {
  it("should detect mermaid code blocks", () => {
    const renderer = new marked.Renderer();

    renderer.code = function (code: string, language: string | undefined) {
      if (language === "mermaid") {
        return `<div class="mermaid">${code}</div>`;
      }
      return `<pre><code>${code}</code></pre>`;
    };

    marked.setOptions({ renderer });

    const markdown = "```mermaid\ngraph TD\n    A-->B\n```";
    const html = marked.parse(markdown) as string;

    expect(html).toContain('<div class="mermaid">');
    expect(html).toContain("graph TD");
    expect(html).toContain("A-->B");
  });

  it("should handle multiple mermaid diagrams", () => {
    const renderer = new marked.Renderer();

    renderer.code = function (code: string, language: string | undefined) {
      if (language === "mermaid") {
        return `<div class="mermaid">${code}</div>`;
      }
      return `<pre><code>${code}</code></pre>`;
    };

    marked.setOptions({ renderer });

    const markdown =
      "```mermaid\ngraph TD\n    A-->B\n```\n\n```mermaid\ngraph LR\n    C-->D\n```";
    const html = marked.parse(markdown) as string;

    const mermaidCount = (html.match(/<div class="mermaid">/g) || []).length;
    expect(mermaidCount).toBe(2);
  });
});
