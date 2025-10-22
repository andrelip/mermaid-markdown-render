/**
 * HTML Template Generator
 * Responsible for generating the complete HTML page with embedded styles
 */

import { UI_STRINGS } from "../config";

/**
 * Generates the page styles as a string
 * Extracted to separate function for better readability
 */
function generateStyles(): string {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      line-height: 1.6;
      color: #24292f;
      background-color: #f6f8fa;
      padding: 2rem;
    }

    .container {
      margin: 0 auto;
      background-color: #ffffff;
      padding: 3rem;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08);
    }

    h1, h2, h3, h4, h5, h6 {
      margin-top: 1.5rem;
      margin-bottom: 1rem;
      font-weight: 600;
      line-height: 1.25;
    }

    h1 {
      font-size: 2rem;
      border-bottom: 1px solid #d0d7de;
      padding-bottom: 0.5rem;
      color: #1a2c42;
    }

    h2 {
      font-size: 1.5rem;
      border-bottom: 1px solid #d0d7de;
      padding-bottom: 0.5rem;
      color: #2d4a6b;
    }

    h3 {
      font-size: 1.25rem;
      color: #3d5a7f;
    }

    h4 {
      font-size: 1rem;
      color: #556b85;
    }

    h5 {
      font-size: 0.875rem;
      color: #6b7b8f;
    }

    h6 {
      font-size: 0.85rem;
      color: #7d8a99;
    }

    p {
      margin-bottom: 1rem;
    }

    code {
      background-color: #f6f8fa;
      padding: 0.2rem 0.4rem;
      border-radius: 3px;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 0.9em;
      color: #24292f;
      border: 1px solid #d0d7de;
    }

    pre {
      background-color: #f6f8fa;
      padding: 1rem;
      border-radius: 6px;
      overflow-x: auto;
      margin-bottom: 1rem;
      border: 1px solid #d0d7de;
    }

    pre code {
      background-color: transparent;
      padding: 0;
      border-radius: 0;
      display: block;
      border: none;
    }

    a {
      color: #0969da;
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    ul, ol {
      margin-bottom: 1rem;
      padding-left: 2rem;
    }

    li {
      margin-bottom: 0.25rem;
    }

    blockquote {
      border-left: 4px solid #d0d7de;
      padding-left: 1rem;
      margin-bottom: 1rem;
      color: #57606a;
      background-color: #f6f8fa;
      padding: 0.5rem 1rem;
      border-radius: 3px;
    }

    table {
      border-collapse: collapse;
      width: 100%;
      margin-bottom: 1rem;
    }

    table th,
    table td {
      border: 1px solid #d0d7de;
      padding: 0.5rem;
      text-align: left;
    }

    table th {
      background-color: #f6f8fa;
      font-weight: 600;
      color: #24292f;
    }

    img {
      max-width: 100%;
      height: auto;
    }

    hr {
      border: none;
      border-top: 1px solid #d0d7de;
      margin: 2rem 0;
    }

    /* Mermaid diagrams */
    .mermaid {
      background-color: #ffffff;
      margin: 1rem 0;
      border: 1px solid #d0d7de;
      border-radius: 6px;
      padding: 1rem;
      min-height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: auto;
    }

    /* Make SVG scale properly within container */
    .mermaid svg {
      max-width: 100%;
      height: auto;
      display: block;
      overflow: visible !important;
      max-height: 90vh;
    }

    /* Pan & zoom cursor styles */
    .svg-pan-zoom_viewport {
      cursor: grab;
    }

    .svg-pan-zoom_viewport:active {
      cursor: grabbing;
    }

    /* Prevent text selection while dragging */
    .mermaid, .mermaid * {
      user-select: none;
      -webkit-user-select: none;
    }
  `;
}

/**
 * Generates the HTML head section with all dependencies
 */
function generateHead(): string {
  return `
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${UI_STRINGS.PAGE_TITLE}</title>
  <link rel="stylesheet" href="/vendor/highlight.js/styles/github.min.css">
  <!-- Load Mermaid (UMD) -->
  <script src="/vendor/mermaid/dist/mermaid.min.js"></script>
  <!-- Load svg-pan-zoom (UMD, exposes window.svgPanZoom) -->
  <script src="/vendor/svg-pan-zoom/dist/svg-pan-zoom.min.js"></script>
  <style>
${generateStyles()}
  </style>
`;
}

/**
 * Generates the HTML body section
 */
function generateBody(content: string): string {
  return `
  <div class="container">
    ${content}
  </div>

  <!-- Mermaid initialization - external file to comply with CSP -->
  <script src="/mermaid-init.js"></script>
`;
}

/**
 * Generates the complete HTML document
 * Composed method pattern - delegates to smaller, focused functions
 */
export function generateHtmlTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
${generateHead()}
</head>
<body>
${generateBody(content)}
</body>
</html>
`;
}
