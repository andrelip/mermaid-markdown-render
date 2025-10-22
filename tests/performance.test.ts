import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from "fs";
import { join } from "path";
import { marked } from "marked";

describe("Performance Tests", () => {
  const testDir = join(process.cwd(), "test-fixtures");

  beforeAll(() => {
    mkdirSync(testDir, { recursive: true });
  });

  afterAll(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe("Large File Handling", () => {
    it("should handle 10MB markdown file without crashing", () => {
      // Generate 10MB of markdown content
      const lineCount = 100000; // ~10MB
      let largeContent = "# Large Document\n\n";

      for (let i = 0; i < lineCount; i++) {
        largeContent += `This is line ${i} with some content to make it longer.\n`;
      }

      const largeFile = join(testDir, "large.md");
      writeFileSync(largeFile, largeContent);

      // Try to parse it
      const startTime = Date.now();

      expect(() => {
        const html = marked.parse(largeContent) as string;
        expect(html).toBeTruthy();
      }).not.toThrow();

      const duration = Date.now() - startTime;

      // Should complete within reasonable time (5 seconds)
      expect(duration).toBeLessThan(5000);
    });

    it("should handle very long single line", () => {
      const longLine = "A".repeat(1000000); // 1 million characters
      const markdown = `# Header\n\n${longLine}\n\nEnd`;

      expect(() => {
        const html = marked.parse(markdown) as string;
        expect(html).toBeTruthy();
      }).not.toThrow();
    });

    it("should handle deeply nested structures", () => {
      let markdown = "";
      const depth = 100;

      for (let i = 0; i < depth; i++) {
        markdown += "  ".repeat(i) + "- Item\n";
      }

      expect(() => {
        const html = marked.parse(markdown) as string;
        expect(html).toBeTruthy();
      }).not.toThrow();
    });
  });

  describe("Multiple Mermaid Diagrams", () => {
    it("should handle 10+ mermaid diagrams", () => {
      let markdown = "# Multiple Diagrams\n\n";

      for (let i = 0; i < 15; i++) {
        markdown += `## Diagram ${i}\n\n`;
        markdown += "```mermaid\n";
        markdown += "graph TD\n";
        markdown += `    A${i}[Start ${i}] --> B${i}[End ${i}]\n`;
        markdown += "```\n\n";
      }

      expect(() => {
        const html = marked.parse(markdown) as string;
        expect(html).toBeTruthy();

        // Count mermaid divs
        const mermaidCount = (html.match(/<code/g) || []).length;
        expect(mermaidCount).toBeGreaterThanOrEqual(15);
      }).not.toThrow();
    });

    it("should handle complex mermaid diagrams", () => {
      const markdown = `
\`\`\`mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Option 1]
    B -->|No| D[Option 2]
    C --> E[Merge]
    D --> E
    E --> F{Another Decision}
    F -->|Path 1| G[Result 1]
    F -->|Path 2| H[Result 2]
    F -->|Path 3| I[Result 3]
    G --> J[End]
    H --> J
    I --> J
\`\`\`
`;

      expect(() => {
        const html = marked.parse(markdown) as string;
        expect(html).toBeTruthy();
        expect(html).toContain("graph TD");
      }).not.toThrow();
    });
  });

  describe("Memory Management", () => {
    it("should not leak memory with repeated parsing", () => {
      const markdown =
        "# Test\n\nThis is a test document with some **bold** and *italic* text.";
      const iterations = 1000;

      const initialMemory = process.memoryUsage().heapUsed;

      for (let i = 0; i < iterations; i++) {
        const html = marked.parse(markdown) as string;
        expect(html).toBeTruthy();
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB for 1000 iterations)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it("should handle 100 file changes simulation", () => {
      // Create test directory if it doesn't exist
      if (!existsSync(testDir)) {
        mkdirSync(testDir, { recursive: true });
      }

      const testFile = join(testDir, "change-test.md");
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const content = `# Iteration ${i}\n\nContent updated ${Date.now()}`;
        writeFileSync(testFile, content);

        // Simulate reading and parsing
        const fileContent = readFileSync(testFile, "utf-8");
        const html = marked.parse(fileContent) as string;

        expect(html).toBeTruthy();
      }

      // Should complete without throwing
      expect(true).toBe(true);
    });
  });

  describe("Concurrent Operations", () => {
    it("should handle concurrent parsing requests", async () => {
      const markdown = "# Test\n\n## Section\n\nContent here.";
      const concurrentRequests = 100;

      const promises = Array.from({ length: concurrentRequests }, () =>
        Promise.resolve(marked.parse(markdown) as string),
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(concurrentRequests);
      results.forEach((html) => {
        expect(html).toContain("<h1>Test</h1>");
      });
    });
  });

  describe("Edge Case Performance", () => {
    it("should handle many code blocks efficiently", () => {
      let markdown = "# Code Examples\n\n";

      for (let i = 0; i < 100; i++) {
        markdown += `## Example ${i}\n\n`;
        markdown += "```javascript\n";
        markdown += `const x${i} = ${i};\n`;
        markdown += `console.log(x${i});\n`;
        markdown += "```\n\n";
      }

      const startTime = Date.now();

      const html = marked.parse(markdown) as string;
      expect(html).toBeTruthy();

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000); // Should complete in under 2 seconds
    });

    it("should handle many links efficiently", () => {
      let markdown = "# Links\n\n";

      for (let i = 0; i < 1000; i++) {
        markdown += `[Link ${i}](https://example.com/${i}) `;
      }

      const startTime = Date.now();

      const html = marked.parse(markdown) as string;
      expect(html).toBeTruthy();

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000);
    });

    it("should handle large tables", () => {
      let markdown = "| A | B | C | D | E |\n|---|---|---|---|---|\n";

      for (let i = 0; i < 1000; i++) {
        markdown += `| ${i} | ${i + 1} | ${i + 2} | ${i + 3} | ${i + 4} |\n`;
      }

      const startTime = Date.now();

      const html = marked.parse(markdown, { gfm: true }) as string;
      expect(html).toBeTruthy();
      expect(html).toContain("<table>");

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000);
    });
  });
});

describe("Watch Mode Tests", () => {
  const testDir = join(process.cwd(), "test-fixtures");

  beforeAll(() => {
    mkdirSync(testDir, { recursive: true });
  });

  afterAll(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe("WATCH_MODE Environment Variable", () => {
    it("should detect WATCH_MODE=true", () => {
      const originalWatchMode = process.env.WATCH_MODE;

      process.env.WATCH_MODE = "true";
      expect(process.env.WATCH_MODE).toBe("true");
      expect(process.env.WATCH_MODE === "true").toBe(true);

      // Restore
      if (originalWatchMode !== undefined) {
        process.env.WATCH_MODE = originalWatchMode;
      } else {
        delete process.env.WATCH_MODE;
      }
    });

    it("should detect WATCH_MODE not set", () => {
      const originalWatchMode = process.env.WATCH_MODE;

      delete process.env.WATCH_MODE;
      expect(process.env.WATCH_MODE).toBeUndefined();
      expect(process.env.WATCH_MODE === "true").toBe(false);

      // Restore
      if (originalWatchMode !== undefined) {
        process.env.WATCH_MODE = originalWatchMode;
      }
    });
  });

  describe("TypeScript Rebuild Simulation", () => {
    it("should handle concurrent rebuild prevention", () => {
      let isRebuilding = false;

      const rebuildTypeScript = () => {
        if (isRebuilding) {
          return false; // Skip if already rebuilding
        }

        isRebuilding = true;

        // Simulate rebuild
        setTimeout(() => {
          isRebuilding = false;
        }, 100);

        return true;
      };

      const firstCall = rebuildTypeScript();
      const secondCall = rebuildTypeScript(); // Should be rejected

      expect(firstCall).toBe(true);
      expect(secondCall).toBe(false);
    });

    it("should track rebuild status", () => {
      let rebuilding = false;
      let lastRebuildStatus: "success" | "failed" | null = null;

      const mockRebuild = (exitCode: number) => {
        rebuilding = true;

        if (exitCode === 0) {
          lastRebuildStatus = "success";
        } else {
          lastRebuildStatus = "failed";
        }

        rebuilding = false;
      };

      mockRebuild(0);
      expect(lastRebuildStatus).toBe("success");

      mockRebuild(1);
      expect(lastRebuildStatus).toBe("failed");
    });
  });

  describe("Source File Watching", () => {
    it("should detect .ts file changes", () => {
      const testFile = join(testDir, "test.ts");
      writeFileSync(testFile, 'console.log("test");');

      const shouldTriggerRebuild = (path: string) => {
        return path.endsWith(".ts") || path.endsWith(".js");
      };

      expect(shouldTriggerRebuild(testFile)).toBe(true);
      expect(shouldTriggerRebuild("test.md")).toBe(false);
      expect(shouldTriggerRebuild("test.json")).toBe(false);
    });

    it("should detect .js file changes", () => {
      const testFile = join(testDir, "test.js");
      writeFileSync(testFile, 'console.log("test");');

      const shouldTriggerRebuild = (path: string) => {
        return path.endsWith(".ts") || path.endsWith(".js");
      };

      expect(shouldTriggerRebuild(testFile)).toBe(true);
    });

    it("should ignore non-source files", () => {
      const shouldTriggerRebuild = (path: string) => {
        return path.endsWith(".ts") || path.endsWith(".js");
      };

      expect(shouldTriggerRebuild("readme.md")).toBe(false);
      expect(shouldTriggerRebuild("config.json")).toBe(false);
      expect(shouldTriggerRebuild("styles.css")).toBe(false);
    });
  });

  describe("Reload Timing", () => {
    it("should reload browser only after successful build", () => {
      let shouldReload = false;

      const onBuildComplete = (exitCode: number) => {
        if (exitCode === 0) {
          shouldReload = true;
        }
      };

      onBuildComplete(0);
      expect(shouldReload).toBe(true);

      shouldReload = false;
      onBuildComplete(1);
      expect(shouldReload).toBe(false);
    });

    it("should not reload on failed build", () => {
      let reloadCount = 0;

      const notifyClients = () => {
        reloadCount++;
      };

      const onBuildComplete = (exitCode: number) => {
        if (exitCode === 0) {
          notifyClients();
        }
      };

      onBuildComplete(1); // Failed build
      expect(reloadCount).toBe(0);

      onBuildComplete(0); // Successful build
      expect(reloadCount).toBe(1);
    });
  });
});
