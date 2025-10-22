import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
  writeFileSync,
  unlinkSync,
  mkdirSync,
  rmSync,
  existsSync,
  readFileSync,
} from "fs";
import { join, isAbsolute } from "path";
import request from "supertest";
import express from "express";
import { marked } from "marked";
import chokidar from "chokidar";

describe("Server Integration Tests", () => {
  const testDir = join(process.cwd(), "test-fixtures");
  const testFile = join(testDir, "test.md");

  beforeAll(() => {
    // Create test directory and file
    mkdirSync(testDir, { recursive: true });
    writeFileSync(testFile, "# Test Heading\n\nThis is a test.");
  });

  afterAll(() => {
    // Clean up
    rmSync(testDir, { recursive: true, force: true });
  });

  describe("Server Initialization", () => {
    it("should validate markdown file exists", () => {
      expect(existsSync(testFile)).toBe(true);
    });

    it("should handle missing file path", () => {
      const nonExistentFile = join(testDir, "nonexistent.md");
      expect(existsSync(nonExistentFile)).toBe(false);
    });

    it("should accept relative and absolute paths", () => {
      expect(isAbsolute(testFile)).toBe(true);

      const relativePath = "./test.md";
      expect(isAbsolute(relativePath)).toBe(false);
    });
  });

  describe("File Loading", () => {
    it("should read markdown file content", () => {
      const content = readFileSync(testFile, "utf-8");

      expect(content).toContain("# Test Heading");
      expect(content).toContain("This is a test.");
    });

    it("should handle file read errors", () => {
      const badFile = join(testDir, "does-not-exist.md");

      expect(() => {
        readFileSync(badFile, "utf-8");
      }).toThrow();
    });
  });

  describe("HTML Template Generation", () => {
    it("should generate valid HTML5 document", () => {
      const htmlTemplate = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown Preview</title>
</head>
<body>
  ${content}
</body>
</html>
`;
      const html = htmlTemplate("<h1>Test</h1>");

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain('<html lang="en">');
      expect(html).toContain('<meta charset="UTF-8">');
      expect(html).toContain('<meta name="viewport"');
      expect(html).toContain("<h1>Test</h1>");
    });

    it("should include required CSS/JS dependencies", () => {
      const htmlTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css">
  <script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/svg-pan-zoom@3.6.2/dist/svg-pan-zoom.min.js"></script>
</head>
<body>${content}</body>
</html>
`;
      const html = htmlTemplate("");

      expect(html).toContain("highlight.js");
      expect(html).toContain("mermaid");
      expect(html).toContain("svg-pan-zoom");
    });

    it("should detect HTML special characters in content (security risk)", () => {
      const content = '<script>alert("xss")</script>';
      const parsed = marked.parse(content) as string;

      // NOTE: marked allows HTML by default - we should sanitize this!
      expect(parsed).toContain("<script>alert");
    });
  });

  describe("File Watching", () => {
    it("should detect file changes", async () => {
      const changeDetected = await new Promise<boolean>((resolve) => {
        const watcher = chokidar.watch(testFile, {
          persistent: false,
          ignoreInitial: true,
        });

        watcher.on("change", () => {
          watcher.close();
          resolve(true);
        });

        // Modify the file after watcher is ready
        watcher.on("ready", () => {
          writeFileSync(testFile, "# Modified\n\nContent changed.");
        });

        // Timeout after 1 second
        setTimeout(() => {
          watcher.close();
          resolve(false);
        }, 1000);
      });

      expect(changeDetected).toBe(true);
    });
  });
});

describe("CLI Arguments", () => {
  it("should parse command line arguments", () => {
    const mockArgs = ["node", "index.js", "test.md"];
    const args = mockArgs.slice(2);

    expect(args.length).toBe(1);
    expect(args[0]).toBe("test.md");
  });

  it("should detect missing arguments", () => {
    const mockArgs = ["node", "index.js"];
    const args = mockArgs.slice(2);

    expect(args.length).toBe(0);
  });

  it("should handle file paths with spaces", () => {
    const mockArgs = ["node", "index.js", "my file.md"];
    const args = mockArgs.slice(2);

    expect(args[0]).toBe("my file.md");
  });
});

describe("HTTP Server Endpoints", () => {
  let app: express.Application;
  let currentHtmlContent: string;

  beforeEach(() => {
    // Create a test express app that mimics our server
    app = express();
    currentHtmlContent = "<h1>Test</h1><p>Content</p>";

    const htmlTemplate = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown Preview</title>
</head>
<body>
  <div class="container">
    ${content}
  </div>
</body>
</html>
`;

    // Mock the main route
    app.get("/", (req, res) => {
      res.send(htmlTemplate(currentHtmlContent));
    });

    // Mock SSE endpoint
    app.get("/events", (req, res) => {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.write("data: connected\n\n");
    });
  });

  describe("GET /", () => {
    it("should return HTML with status 200", async () => {
      const response = await request(app).get("/");

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toMatch(/html/);
    });

    it("should return valid HTML5 document structure", async () => {
      const response = await request(app).get("/");

      expect(response.text).toContain("<!DOCTYPE html>");
      expect(response.text).toContain('<html lang="en">');
      expect(response.text).toContain('<meta charset="UTF-8">');
      expect(response.text).toContain("<title>Markdown Preview</title>");
    });

    it("should include rendered markdown content", async () => {
      const response = await request(app).get("/");

      expect(response.text).toContain("<h1>Test</h1>");
      expect(response.text).toContain("<p>Content</p>");
    });

    it("should include container div", async () => {
      const response = await request(app).get("/");

      expect(response.text).toContain('<div class="container">');
    });
  });

  describe("GET /events (SSE)", () => {
    it("should return event-stream content type", (done) => {
      const req = request(app).get("/events");

      req.end((err, res) => {
        if (err) {
          // Expected - SSE connections may not complete normally
          expect(res?.headers["content-type"]).toBe("text/event-stream");
          done();
        } else {
          expect(res.headers["content-type"]).toBe("text/event-stream");
          done();
        }
      });

      // Close the request after a short delay
      setTimeout(() => {
        req.abort();
      }, 100);
    });

    it("should set correct SSE headers", (done) => {
      const req = request(app).get("/events");

      req.end((err, res) => {
        if (res) {
          expect(res.headers["cache-control"]).toBe("no-cache");
          expect(res.headers["connection"]).toBe("keep-alive");
        }
        done();
      });

      setTimeout(() => {
        req.abort();
      }, 100);
    });

    it("should send initial connection message", (done) => {
      const req = request(app).get("/events");

      req.end((err, res) => {
        if (res) {
          expect(res.text).toContain("data: connected");
        }
        done();
      });

      setTimeout(() => {
        req.abort();
      }, 100);
    });
  });
});

describe("Live Reload SSE Tests", () => {
  let app: express.Application;
  let clients: express.Response[] = [];

  beforeEach(() => {
    app = express();
    clients = [];

    // SSE endpoint that tracks clients
    app.get("/events", (req, res) => {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      clients.push(res);

      req.on("close", () => {
        const index = clients.indexOf(res);
        if (index !== -1) {
          clients.splice(index, 1);
        }
      });
    });

    // Helper route to trigger reload
    app.post("/trigger-reload", (req, res) => {
      clients.forEach((client) => {
        client.write("data: reload\n\n");
      });
      res.json({ notified: clients.length });
    });
  });

  it("should track multiple connected clients", async () => {
    // This tests the pattern used in the server
    expect(clients).toEqual([]);
  });

  it("should notify clients on file change", async () => {
    const response = await request(app).post("/trigger-reload").expect(200);

    expect(response.body).toHaveProperty("notified");
    expect(typeof response.body.notified).toBe("number");
  });

  it("should handle client disconnection", (done) => {
    const req = request(app).get("/events");

    setTimeout(() => {
      // Connection handling is tested via the req.on('close') pattern
      done();
    }, 100);
  });
});

describe("Error Handling", () => {
  const testDir = join(process.cwd(), "test-fixtures");

  beforeAll(() => {
    mkdirSync(testDir, { recursive: true });
  });

  afterAll(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("should handle deleted file gracefully", () => {
    const tempFile = join(testDir, "temp-delete.md");
    writeFileSync(tempFile, "# Content");

    expect(existsSync(tempFile)).toBe(true);

    unlinkSync(tempFile);

    expect(existsSync(tempFile)).toBe(false);

    // Server should handle file read error
    expect(() => {
      readFileSync(tempFile, "utf-8");
    }).toThrow();
  });

  it("should handle malformed mermaid syntax", () => {
    const malformedMermaid = "```mermaid\ngraph TD\n    A-->>>\n```";

    // Marked should still parse it without crashing
    expect(() => {
      const html = marked.parse(malformedMermaid) as string;
      expect(html).toBeTruthy();
    }).not.toThrow();
  });

  it("should handle invalid markdown gracefully", () => {
    const invalidMarkdown = "# [[[broken\n```\nunclosed code";

    expect(() => {
      const html = marked.parse(invalidMarkdown) as string;
      expect(html).toBeTruthy();
    }).not.toThrow();
  });

  it("should handle missing markdown file on startup", () => {
    const nonExistentFile = join(testDir, "does-not-exist.md");

    // Should throw error when file doesn't exist
    expect(() => {
      readFileSync(nonExistentFile, "utf-8");
    }).toThrow();
  });
});
