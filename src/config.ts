/**
 * Application configuration
 * Centralizes all magic numbers and string constants
 * Refactoring: Replace Magic Number with Symbolic Constant
 */

export const SERVER_CONFIG = {
  PORT: 4002,
  STATIC_DIRS: {
    PUBLIC: "../public",
    HIGHLIGHT_JS: "../node_modules/highlight.js",
    MERMAID: "../node_modules/mermaid",
    SVG_PAN_ZOOM: "../node_modules/svg-pan-zoom",
  },
} as const;

export const PATHS = {
  SRC: "../src",
} as const;

export const SECURITY_HEADERS = {
  CONTENT_SECURITY_POLICY: [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src * data:",
    "connect-src 'self'",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; "),
  X_CONTENT_TYPE_OPTIONS: "nosniff",
  X_FRAME_OPTIONS: "DENY",
  X_XSS_PROTECTION: "1; mode=block",
  REFERRER_POLICY: "strict-origin-when-cross-origin",
} as const;

export const SSE_CONFIG = {
  CONTENT_TYPE: "text/event-stream",
  CACHE_CONTROL: "no-cache",
  CONNECTION: "keep-alive",
  RELOAD_MESSAGE: "data: reload\n\n",
} as const;

export const MARKED_OPTIONS = {
  breaks: true,
  gfm: true,
} as const;

export const FILE_WATCHER_OPTIONS = {
  persistent: true,
  ignoreInitial: true,
  ignored: /(^|[/\\])\../, // ignore dotfiles
} as const;

export const MESSAGES = {
  ERROR_NO_FILE: "Error: Please provide a markdown file path as argument",
  USAGE: "Usage: npm start <path-to-markdown-file.md>",
  ERROR_LOADING_FILE: "<p>Error loading markdown file</p>",
  REBUILD_IN_PROGRESS: "Rebuild already in progress, skipping...",
  REBUILDING: "\nRebuilding TypeScript...",
  REBUILD_COMPLETE: "✓ Rebuild complete! Reloading browser...",
  REBUILD_FAILED_PREFIX: "✗ Rebuild failed with code ",
  FILE_CHANGED_PREFIX: "\n📝 Markdown file changed: ",
  SOURCE_CHANGED_PREFIX: "\n🔧 Source file changed: ",
  WATCH_MODE_ENABLED:
    "🔄 Watch mode enabled: TypeScript will auto-rebuild on changes",
  OPENING_BROWSER: "🚀 Opening browser at ",
} as const;

export const UI_STRINGS = {
  PAGE_TITLE: "Markdown Preview",
  SECTION_TITLES: {
    SERVER: "📄 Markdown Preview Server",
    SERVER_LABEL: "🌐 Server: ",
    PREVIEWING_LABEL: "📝 Previewing: ",
    WATCHING_LABEL: "👀 Watching for changes:",
    MARKDOWN_LABEL: "   • Markdown: ",
    SOURCE_LABEL: "   • Source code: ",
    AUTO_REBUILD_SUFFIX: " (auto-rebuild enabled)",
    TIP: "💡 Tip: Edit your markdown file and watch it update automatically!",
  },
  SEPARATOR: "=".repeat(60),
} as const;
