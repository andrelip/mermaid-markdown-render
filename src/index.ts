/**
 * Markdown Preview Server
 * Main entry point - orchestrates all modules
 *
 * Refactoring Applied:
 * - Composed Method: High-level orchestration with well-named functions
 * - Separation of Concerns: Each module has a single responsibility
 * - Dependency Injection: Modules are loosely coupled
 */

import express from "express";
import { readFileSync } from "fs";
import { join } from "path";
import type { Request, Response } from "express";
import open from "open";

// Configuration
import {
  SERVER_CONFIG,
  SSE_CONFIG,
  PATHS,
  MESSAGES,
  UI_STRINGS,
} from "./config";

// Modules
import { securityHeadersMiddleware } from "./middleware/security";
import { generateHtmlTemplate } from "./template/html-generator";
import { configureMarked, parseMarkdown } from "./markdown/renderer";
import { ClientManager, FileWatcher } from "./watcher/file-watcher";

/**
 * Application state
 */
let currentHtmlContent: string;
const clientManager = new ClientManager();

/**
 * Validates and retrieves markdown file path from command line arguments
 */
function getMarkdownFilePath(): string {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error(MESSAGES.ERROR_NO_FILE);
    console.log(MESSAGES.USAGE);
    process.exit(1);
  }

  return join(process.cwd(), args[0]);
}

/**
 * Loads and parses markdown file to HTML
 * Refactoring: Separate Query from Modifier
 */
function loadMarkdown(filePath: string): string {
  try {
    const markdownContent = readFileSync(filePath, "utf-8");
    return parseMarkdown(markdownContent);
  } catch (error) {
    console.error(`Error reading file: ${filePath}`);
    console.error(error);
    return MESSAGES.ERROR_LOADING_FILE;
  }
}

/**
 * Configures Express application with middleware and routes
 * Refactoring: Extract Function to clarify setup steps
 */
function configureExpressApp(): express.Application {
  const app = express();

  // Apply security headers
  app.use(securityHeadersMiddleware);

  // Serve static files
  app.use(express.static(join(__dirname, SERVER_CONFIG.STATIC_DIRS.PUBLIC)));
  app.use(
    "/vendor/highlight.js",
    express.static(join(__dirname, SERVER_CONFIG.STATIC_DIRS.HIGHLIGHT_JS)),
  );
  app.use(
    "/vendor/mermaid",
    express.static(join(__dirname, SERVER_CONFIG.STATIC_DIRS.MERMAID)),
  );
  app.use(
    "/vendor/svg-pan-zoom",
    express.static(join(__dirname, SERVER_CONFIG.STATIC_DIRS.SVG_PAN_ZOOM)),
  );

  return app;
}

/**
 * Sets up application routes
 * Refactoring: Extract Function for better readability
 */
function setupRoutes(app: express.Application): void {
  // Main route - serve rendered markdown
  app.get("/", (req, res) => {
    res.send(generateHtmlTemplate(currentHtmlContent));
  });

  // SSE endpoint for live reload
  app.get("/events", (req: Request, res: Response) => {
    res.setHeader("Content-Type", SSE_CONFIG.CONTENT_TYPE);
    res.setHeader("Cache-Control", SSE_CONFIG.CACHE_CONTROL);
    res.setHeader("Connection", SSE_CONFIG.CONNECTION);

    clientManager.addClient(res);

    req.on("close", () => {
      clientManager.removeClient(res);
    });
  });
}

/**
 * Sets up file watchers for markdown and source code
 */
function setupFileWatching(markdownFilePath: string, watchMode: boolean): void {
  const fileWatcher = new FileWatcher(clientManager);

  // Watch markdown file
  fileWatcher.watchMarkdownFile(markdownFilePath, () => {
    currentHtmlContent = loadMarkdown(markdownFilePath);
  });

  // Watch source code if in watch mode
  if (watchMode) {
    const srcPath = join(__dirname, PATHS.SRC);
    const projectRoot = join(__dirname, "..");
    fileWatcher.watchSourceCode(srcPath, projectRoot);
  }
}

/**
 * Prints server startup information to console
 * Refactoring: Extract Function to reduce complexity
 */
function printServerInfo(
  url: string,
  markdownFilePath: string,
  watchMode: boolean,
): void {
  const srcPath = join(__dirname, PATHS.SRC);

  console.log(`\n${UI_STRINGS.SEPARATOR}`);
  console.log(UI_STRINGS.SECTION_TITLES.SERVER);
  console.log(UI_STRINGS.SEPARATOR);
  console.log(`\n${UI_STRINGS.SECTION_TITLES.SERVER_LABEL}${url}`);
  console.log(
    `${UI_STRINGS.SECTION_TITLES.PREVIEWING_LABEL}${markdownFilePath}`,
  );
  console.log(`\n${UI_STRINGS.SECTION_TITLES.WATCHING_LABEL}`);
  console.log(`${UI_STRINGS.SECTION_TITLES.MARKDOWN_LABEL}${markdownFilePath}`);

  if (watchMode) {
    console.log(
      `${UI_STRINGS.SECTION_TITLES.SOURCE_LABEL}${srcPath}${UI_STRINGS.SECTION_TITLES.AUTO_REBUILD_SUFFIX}`,
    );
  }

  console.log(`\n${UI_STRINGS.SECTION_TITLES.TIP}`);
  console.log(`${UI_STRINGS.SEPARATOR}\n`);
}

/**
 * Main application entry point
 * Refactoring: Composed Method - clear sequence of high-level steps
 */
async function main(): Promise<void> {
  // 1. Configure markdown parser
  configureMarked();

  // 2. Get and validate markdown file path
  const markdownFilePath = getMarkdownFilePath();

  // 3. Initial load of markdown content
  try {
    currentHtmlContent = loadMarkdown(markdownFilePath);
  } catch (error) {
    console.error(`Error reading file: ${markdownFilePath}`);
    console.error(error);
    process.exit(1);
  }

  // 4. Configure Express application
  const app = configureExpressApp();
  setupRoutes(app);

  // 5. Setup file watching
  const watchMode = process.env.WATCH_MODE === "true";
  setupFileWatching(markdownFilePath, watchMode);

  // 6. Start server
  const url = `http://localhost:${SERVER_CONFIG.PORT}`;

  app.listen(SERVER_CONFIG.PORT, async () => {
    printServerInfo(url, markdownFilePath, watchMode);

    // 7. Open browser
    console.log(MESSAGES.OPENING_BROWSER + url + "...");
    await open(url);
  });
}

// Start the application
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
