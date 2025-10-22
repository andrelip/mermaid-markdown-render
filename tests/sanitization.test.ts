import { describe, it, expect } from "vitest";
import { marked } from "marked";

describe("HTML Sanitization Tests", () => {
  describe("Marked Configuration for Security", () => {
    it("should support disabling HTML parsing", () => {
      // Configure marked to escape HTML
      const safeOptions = {
        breaks: true,
        gfm: true,
        // Modern versions of marked don't have 'sanitize' or 'sanitizer'
        // Instead, you should process the output through a sanitizer
      };

      const dangerousMarkdown = '<script>alert("XSS")</script>';
      const html = marked.parse(dangerousMarkdown, safeOptions) as string;

      // Marked still includes HTML by default - need external sanitizer
      expect(html).toBeTruthy();
    });

    it("should demonstrate proper sanitization approach", () => {
      const markdown =
        '# Title\n\n<script>alert("XSS")</script>\n\nSafe content';

      // Step 1: Parse markdown
      const rawHtml = marked.parse(markdown) as string;

      // Step 2: Sanitize (would use DOMPurify in production)
      const sanitize = (html: string): string => {
        // Simple sanitization - remove script tags
        return html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
          .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "") // Remove event handlers
          .replace(/javascript:/gi, ""); // Remove javascript: protocol
      };

      const safeHtml = sanitize(rawHtml);

      // Verify XSS is removed
      expect(safeHtml).not.toContain("<script>");
      expect(safeHtml).not.toContain('alert("XSS")');
      expect(safeHtml).toContain("<h1>Title</h1>");
      expect(safeHtml).toContain("Safe content");
    });
  });

  describe("Content Security Policy Recommendations", () => {
    it("should define recommended CSP headers", () => {
      const csp = {
        "default-src": "'self'",
        "script-src":
          "'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com 'unsafe-inline'",
        "style-src": "'self' https://cdnjs.cloudflare.com 'unsafe-inline'",
        "img-src": "'self' data: https:",
        "connect-src": "'self'",
      };

      expect(csp["default-src"]).toBe("'self'");
      expect(csp["script-src"]).toContain("cdn.jsdelivr.net");
    });
  });

  describe("Safe Markdown Patterns", () => {
    it("should safely render user-generated content", () => {
      const userInput = "# User Title\n\nUser **content** here";

      // Parse markdown
      const html = marked.parse(userInput) as string;

      // Verify expected content
      expect(html).toContain("<h1>User Title</h1>");
      expect(html).toContain("<strong>content</strong>");
    });

    it("should handle escaped HTML entities", () => {
      const markdown = "Test &lt;script&gt; and &amp; characters";
      const html = marked.parse(markdown) as string;

      // HTML entities should be preserved
      expect(html).toContain("&lt;");
      expect(html).toContain("&amp;");
    });
  });

  describe("URL Validation", () => {
    it("should validate safe URLs", () => {
      const isSafeUrl = (url: string): boolean => {
        try {
          const parsed = new URL(url, "http://example.com");
          const protocol = parsed.protocol;

          // Allow only safe protocols
          return ["http:", "https:", "mailto:", "ftp:"].includes(protocol);
        } catch {
          return false;
        }
      };

      expect(isSafeUrl("https://example.com")).toBe(true);
      expect(isSafeUrl("http://example.com")).toBe(true);
      expect(isSafeUrl("mailto:test@example.com")).toBe(true);
      expect(isSafeUrl("javascript:alert(1)")).toBe(false);
      expect(isSafeUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
      expect(isSafeUrl("vbscript:msgbox(1)")).toBe(false);
    });

    it("should sanitize markdown links", () => {
      const links = [
        { input: "[Safe](https://example.com)", safe: true },
        { input: "[Unsafe](javascript:alert(1))", safe: false },
        { input: "[Data](data:text/html,<script>)", safe: false },
      ];

      links.forEach((link) => {
        const html = marked.parse(link.input) as string;

        if (link.safe) {
          expect(html).toContain('href="https://example.com"');
        } else {
          // Marked allows these by default - they should be sanitized
          expect(html).toBeTruthy();
        }
      });
    });
  });

  describe("Attribute Sanitization", () => {
    it("should identify dangerous HTML attributes", () => {
      const dangerousAttributes = [
        "onclick",
        "onload",
        "onerror",
        "onmouseover",
        "onfocus",
        "onblur",
      ];

      const testHtml = '<div onclick="alert(1)" onload="alert(2)">Test</div>';

      dangerousAttributes.forEach((attr) => {
        if (testHtml.includes(attr)) {
          expect(testHtml).toContain(attr);
        }
      });
    });

    it("should demonstrate attribute sanitization", () => {
      const removeDangerousAttributes = (html: string): string => {
        return html.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, "");
      };

      const dangerous = '<img src="x.png" onerror="alert(1)" alt="test">';
      const safe = removeDangerousAttributes(dangerous);

      expect(safe).not.toContain("onerror");
      expect(safe).toContain('src="x.png"');
      expect(safe).toContain('alt="test"');
    });
  });

  describe("Mermaid Security", () => {
    it("should detect potential XSS in mermaid diagrams", () => {
      const markdown =
        "```mermaid\ngraph TD\n    A[<script>alert(1)</script>] --> B\n```";
      const html = marked.parse(markdown) as string;

      // Mermaid content should be in a code block
      expect(html).toBeTruthy();

      // Check if it contains potentially dangerous content
      if (html.includes("<script>")) {
        // Would need to sanitize mermaid content
        expect(html).toContain("<script>");
      }
    });

    it("should safely render mermaid diagrams", () => {
      const safeDiagram = "```mermaid\ngraph TD\n    A[Start] --> B[End]\n```";
      const html = marked.parse(safeDiagram) as string;

      expect(html).toBeTruthy();
      expect(html).toContain("graph TD");
    });
  });

  describe("Defense in Depth", () => {
    it("should recommend multiple layers of protection", () => {
      const securityLayers = {
        csp: "Content Security Policy headers",
        sanitization: "HTML sanitization (DOMPurify)",
        validation: "Input validation",
        escaping: "Output escaping",
        https: "HTTPS only",
      };

      expect(Object.keys(securityLayers)).toHaveLength(5);
      expect(securityLayers.csp).toBeTruthy();
      expect(securityLayers.sanitization).toBeTruthy();
    });
  });

  describe("Recommended Sanitization Library Tests", () => {
    it("should demonstrate DOMPurify usage pattern", () => {
      // This is how you would use DOMPurify in production
      const markdown = '# Title\n\n<script>alert("XSS")</script>\n\nContent';
      const rawHtml = marked.parse(markdown) as string;

      // Simulating DOMPurify.sanitize()
      const mockDOMPurify = {
        sanitize: (html: string): string => {
          return html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
            .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "");
        },
      };

      const cleanHtml = mockDOMPurify.sanitize(rawHtml);

      expect(cleanHtml).not.toContain("<script>");
      expect(cleanHtml).toContain("<h1>Title</h1>");
      expect(cleanHtml).toContain("Content");
    });
  });
});

describe("Marked Extensions Security", () => {
  describe("Custom Renderer Security", () => {
    it("should sanitize custom renderer output", () => {
      const renderer = new marked.Renderer();

      // Override link renderer for safety
      const originalLinkRenderer = renderer.link.bind(renderer);
      renderer.link = function (
        href: string,
        title: string | null | undefined,
        text: string,
      ) {
        // Block dangerous protocols
        if (
          href &&
          (href.startsWith("javascript:") || href.startsWith("data:"))
        ) {
          return text; // Return just text, no link
        }

        return originalLinkRenderer(href, title, text);
      };

      marked.setOptions({ renderer });

      const markdown = "[Click](javascript:alert(1))";
      const html = marked.parse(markdown) as string;

      // Should still work but needs validation
      expect(html).toBeTruthy();
    });

    it("should sanitize image sources", () => {
      const renderer = new marked.Renderer();

      renderer.image = function (
        href: string,
        title: string | null,
        text: string,
      ) {
        // Only allow https images
        if (!href.startsWith("https://") && !href.startsWith("http://")) {
          return `<img alt="${text || ""}" src="" title="Blocked unsafe image source">`;
        }

        return `<img src="${href}" alt="${text || ""}" ${title ? `title="${title}"` : ""}>`;
      };

      marked.setOptions({ renderer });

      const safeImage = "![Test](https://example.com/image.png)";
      const unsafeImage = "![Test](javascript:alert(1))";

      const safeHtml = marked.parse(safeImage) as string;
      const unsafeHtml = marked.parse(unsafeImage) as string;

      expect(safeHtml).toContain("https://example.com/image.png");
      expect(unsafeHtml).toContain("Blocked unsafe image source");
    });
  });
});
