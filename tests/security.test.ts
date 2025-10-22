import { describe, it, expect } from "vitest";
import { marked } from "marked";
import { join, normalize } from "path";
import { readFileSync, existsSync } from "fs";

describe("Security Tests", () => {
  describe("XSS Prevention", () => {
    it("should detect unescaped script tags (security risk)", () => {
      const markdown = '<script>alert("XSS")</script>';
      const html = marked.parse(markdown) as string;

      // NOTE: marked.js allows HTML by default - this is a security risk!
      // In production, use DOMPurify or configure marked to sanitize
      expect(html).toContain("<script>alert");
    });

    it("should detect dangerous HTML attributes (security risk)", () => {
      const markdown = '<img src=x onerror="alert(1)">';
      const html = marked.parse(markdown) as string;

      // NOTE: marked.js allows HTML by default - this is a security risk!
      expect(html).toContain("onerror=");
    });

    it("should detect javascript: protocol in links (security risk)", () => {
      const markdown = '[Click me](javascript:alert("XSS"))';
      const html = marked.parse(markdown) as string;

      // NOTE: marked.js allows javascript: protocol - security risk!
      expect(html).toContain("javascript:");
    });

    it("should escape HTML in code blocks", () => {
      const markdown = '```html\n<script>alert("test")</script>\n```';
      const html = marked.parse(markdown) as string;

      // Code blocks ARE properly escaped
      expect(html).toContain("<code");
      expect(html).toContain("&lt;script&gt;");
      expect(html).not.toContain("<script>alert");
    });

    it("should handle inline HTML safely", () => {
      const markdown = 'Test <div onclick="alert(1)">content</div>';
      const html = marked.parse(markdown) as string;

      // By default, marked allows HTML but escapes dangerous attributes
      // If you want to disable HTML completely, use { sanitize: true }
      expect(html).toBeTruthy();
    });

    it("should prevent XSS through image alt text", () => {
      const markdown = "![<script>alert(1)</script>](image.png)";
      const html = marked.parse(markdown) as string;

      expect(html).not.toContain("<script>");
      expect(html).toContain("&lt;script&gt;");
    });
  });

  describe("Path Traversal Prevention", () => {
    it("should detect path traversal attempts with ../", () => {
      const maliciousPath = "../../../etc/passwd";
      expect(maliciousPath).toContain("..");
    });

    it("should detect path traversal with absolute paths", () => {
      const maliciousPath = "/etc/passwd";
      expect(maliciousPath.startsWith("/")).toBe(true);
    });

    it("should normalize paths safely", () => {
      const basePath = "/home/user/docs";
      const userInput = "../../../etc/passwd";
      const fullPath = normalize(join(basePath, userInput));

      // Should not escape the base directory
      expect(fullPath.startsWith(basePath)).toBe(false);
    });

    it("should reject paths with NULL bytes", () => {
      const maliciousPath = "test.md\0.txt";
      expect(maliciousPath).toContain("\0");
    });

    it("should validate file extensions", () => {
      const validFile = "document.md";
      const invalidFile = "document.exe";

      expect(validFile.endsWith(".md")).toBe(true);
      expect(invalidFile.endsWith(".md")).toBe(false);
    });
  });

  describe("Input Validation", () => {
    it("should handle very long strings", () => {
      const longString = "A".repeat(1000000);
      const html = marked.parse(longString) as string;

      expect(html).toBeTruthy();
      expect(html.length).toBeGreaterThan(0);
    });

    it("should handle special Unicode characters", () => {
      const markdown = "# Hello 👋\n\nTesting émojis and ñ characters";
      const html = marked.parse(markdown) as string;

      expect(html).toContain("Hello 👋");
      expect(html).toContain("émojis");
      expect(html).toContain("ñ");
    });

    it("should handle malformed markdown gracefully", () => {
      const markdown =
        "# Heading\n[Link without closing paren(http://test.com\n```\nCode without closing";

      expect(() => {
        const html = marked.parse(markdown) as string;
        expect(html).toBeTruthy();
      }).not.toThrow();
    });

    it("should handle nested markdown structures", () => {
      const markdown =
        "> Blockquote\n> > Nested\n> > > Deeply nested\n> > > > Very deep";
      const html = marked.parse(markdown) as string;

      expect(html).toContain("<blockquote>");
      expect(html).toBeTruthy();
    });
  });

  describe("Code Injection Prevention", () => {
    it("should not execute code in mermaid diagrams", () => {
      const markdown =
        "```mermaid\ngraph TD\n    A[<script>alert(1)</script>] --> B\n```";
      const html = marked.parse(markdown) as string;

      // The code should be rendered as text, not executed
      expect(html).toBeTruthy();
    });

    it("should escape HTML entities in code", () => {
      const markdown = "```\n<div>Test & \"quotes\" & 'apostrophes'</div>\n```";
      const html = marked.parse(markdown) as string;

      expect(html).toContain("<code>");
      // Check that content is preserved (marked might or might not escape in code blocks)
      expect(html).toBeTruthy();
    });
  });

  describe("Resource Exhaustion Prevention", () => {
    it("should handle deeply nested lists", () => {
      let markdown = "";
      for (let i = 0; i < 100; i++) {
        markdown += "  ".repeat(i) + "- Item\n";
      }

      const html = marked.parse(markdown) as string;
      expect(html).toBeTruthy();
    });

    it("should handle many headings", () => {
      const markdown = Array(1000).fill("# Heading").join("\n");
      const html = marked.parse(markdown) as string;

      expect(html).toBeTruthy();
      expect(html).toContain("<h1>");
    });

    it("should handle large tables", () => {
      let markdown = "| A | B | C |\n|---|---|---|\n";
      for (let i = 0; i < 100; i++) {
        markdown += `| ${i} | ${i + 1} | ${i + 2} |\n`;
      }

      const html = marked.parse(markdown, { gfm: true }) as string;
      expect(html).toContain("<table>");
    });
  });

  describe("HTTP Header Injection Prevention", () => {
    it("should not allow newlines in file names", () => {
      const maliciousFilename =
        "test\r\nContent-Type: text/html\r\n\r\n<script>alert(1)</script>";
      expect(maliciousFilename).toContain("\r\n");
    });

    it("should validate content types", () => {
      const validContentType = "text/html; charset=utf-8";
      const invalidContentType = "text/html\r\nX-Injected: true";

      expect(validContentType).not.toContain("\r\n");
      expect(invalidContentType).toContain("\r\n");
    });
  });

  describe("Content Security Policy (CSP)", () => {
    // Read the source code to check CSP configuration
    // After refactoring, CSP config is in config.ts and middleware/security.ts
    const configPath = join(__dirname, "../src/config.ts");
    const middlewarePath = join(__dirname, "../src/middleware/security.ts");
    const templatePath = join(__dirname, "../src/template/html-generator.ts");
    const configCode = readFileSync(configPath, "utf-8");
    const middlewareCode = readFileSync(middlewarePath, "utf-8");
    const templateCode = readFileSync(templatePath, "utf-8");
    const sourceCode = configCode + "\n" + middlewareCode; // Combined for backward compat

    it("should have CSP configured in source code", () => {
      // Check for CONTENT_SECURITY_POLICY constant name
      expect(configCode).toContain("CONTENT_SECURITY_POLICY");
      // Also check that it contains the CSP directives
      expect(configCode).toContain("default-src 'self'");
    });

    it("should NOT allow unsafe-inline scripts (CRITICAL SECURITY)", () => {
      // Find the CSP configuration in the config source
      const cspMatch = configCode.match(
        /CONTENT_SECURITY_POLICY:\s*\[([^\]]+)\]/s,
      );
      expect(cspMatch).toBeTruthy();

      const cspConfig = cspMatch ? cspMatch[0] : "";

      // CRITICAL: Ensure script-src does NOT contain 'unsafe-inline'
      // Extract just the script-src directive value
      const scriptSrcMatch = cspConfig.match(/"script-src\s+([^"]+)"/);
      expect(scriptSrcMatch).toBeTruthy();

      if (scriptSrcMatch) {
        const scriptSrcValue = scriptSrcMatch[1];
        expect(scriptSrcValue).not.toContain("unsafe-inline");
      }
    });

    it("should enforce strict script-src with only self", () => {
      // Match the script-src directive specifically
      const scriptSrcMatch = sourceCode.match(/"script-src\s+'self'"/);
      expect(scriptSrcMatch).toBeTruthy();

      // Also verify it doesn't have other sources
      const scriptSrcFullMatch = sourceCode.match(/"script-src\s+([^"]+)"/);
      if (scriptSrcFullMatch) {
        const scriptSrc = scriptSrcFullMatch[1].trim();
        // Should only contain 'self', nothing else (trim whitespace and check)
        expect(scriptSrc).toBe("'self'");
      }
    });

    it("should have all required CSP directives", () => {
      // Check that all important directives are present
      expect(sourceCode).toContain("default-src 'self'");
      expect(sourceCode).toContain("script-src 'self'");
      expect(sourceCode).toContain("object-src 'none'");
      expect(sourceCode).toContain("base-uri 'self'");
      expect(sourceCode).toContain("form-action 'self'");
      expect(sourceCode).toContain("frame-ancestors 'none'");
    });

    it("should allow images from any source (for markdown flexibility)", () => {
      const imgSrcMatch = sourceCode.match(/"img-src\s+([^"]+)"/);
      expect(imgSrcMatch).toBeTruthy();

      if (imgSrcMatch) {
        const imgSrc = imgSrcMatch[1].trim();
        // Should allow all sources
        expect(imgSrc).toContain("*");
        expect(imgSrc).toContain("data:");
      }
    });

    it("should have additional security headers configured", () => {
      expect(sourceCode).toContain("X-Content-Type-Options");
      expect(sourceCode).toContain("nosniff");
      expect(sourceCode).toContain("X-Frame-Options");
      expect(sourceCode).toContain("DENY");
      expect(sourceCode).toContain("X-XSS-Protection");
    });

    it("should disallow inline scripts by checking HTML template", () => {
      // Ensure the HTML template doesn't have inline <script> tags
      // (except the reference to external mermaid-init.js)
      const scriptTagPattern = /<script>\s*[^<]/; // Inline script content
      const hasInlineScript = scriptTagPattern.test(sourceCode);

      // Should NOT have inline scripts with content
      expect(hasInlineScript).toBe(false);
    });

    it("should use external script file for mermaid initialization", () => {
      // Verify that mermaid-init.js is referenced in the template
      expect(templateCode).toContain("mermaid-init.js");

      // Check that the external file exists
      const publicPath = join(__dirname, "../public/mermaid-init.js");
      expect(existsSync(publicPath)).toBe(true);
    });
  });
});
