/**
 * File Watching Module
 * Manages file watching for markdown files and TypeScript source code
 * Refactoring: Extract Class + Observer Pattern
 */

import chokidar, { type FSWatcher } from "chokidar";
import { spawn } from "child_process";
import type { Response } from "express";
import { FILE_WATCHER_OPTIONS, MESSAGES } from "../config";

/**
 * Callback type for markdown file changes
 */
export type MarkdownChangeCallback = () => void;

/**
 * Manages SSE (Server-Sent Events) clients for live reload functionality
 */
export class ClientManager {
  private clients: Response[] = [];

  /**
   * Adds a new SSE client
   */
  addClient(client: Response): void {
    this.clients.push(client);
  }

  /**
   * Removes a client (typically when connection closes)
   */
  removeClient(client: Response): void {
    const index = this.clients.indexOf(client);
    if (index !== -1) {
      this.clients.splice(index, 1);
    }
  }

  /**
   * Notifies all connected clients to reload
   */
  notifyReload(): void {
    console.log(
      `Notifying ${this.clients.length} connected client(s) to reload...`,
    );
    this.clients.forEach((client) => {
      client.write("data: reload\n\n");
    });
  }

  /**
   * Returns the number of connected clients
   */
  getClientCount(): number {
    return this.clients.length;
  }
}

/**
 * Manages TypeScript rebuild process
 * Refactoring: Extract Class to encapsulate rebuild state and logic
 */
class TypeScriptRebuilder {
  private isRebuilding = false;

  /**
   * Rebuilds TypeScript and notifies clients on success
   */
  rebuild(projectRoot: string, onSuccess: () => void): void {
    if (this.isRebuilding) {
      console.log(MESSAGES.REBUILD_IN_PROGRESS);
      return;
    }

    this.isRebuilding = true;
    console.log(MESSAGES.REBUILDING);

    const tsc = spawn("npx", ["tsc"], {
      cwd: projectRoot,
      shell: true,
    });

    tsc.stdout.on("data", (data) => {
      process.stdout.write(data);
    });

    tsc.stderr.on("data", (data) => {
      process.stderr.write(data);
    });

    tsc.on("close", (code) => {
      this.isRebuilding = false;
      if (code === 0) {
        console.log(MESSAGES.REBUILD_COMPLETE);
        onSuccess();
      } else {
        console.log(MESSAGES.REBUILD_FAILED_PREFIX + code);
      }
    });
  }
}

/**
 * File Watcher that manages both markdown and source code watching
 * Refactoring: Facade Pattern to simplify file watching setup
 */
export class FileWatcher {
  private clientManager: ClientManager;
  private rebuilder: TypeScriptRebuilder;
  private markdownWatcher?: FSWatcher;
  private sourceWatcher?: FSWatcher;

  constructor(clientManager: ClientManager) {
    this.clientManager = clientManager;
    this.rebuilder = new TypeScriptRebuilder();
  }

  /**
   * Starts watching a markdown file for changes
   */
  watchMarkdownFile(filePath: string, onChange: MarkdownChangeCallback): void {
    this.markdownWatcher = chokidar.watch(filePath, {
      persistent: FILE_WATCHER_OPTIONS.persistent,
      ignoreInitial: FILE_WATCHER_OPTIONS.ignoreInitial,
    });

    this.markdownWatcher.on("change", (path: string) => {
      console.log(MESSAGES.FILE_CHANGED_PREFIX + path);
      onChange();
      this.clientManager.notifyReload();
    });
  }

  /**
   * Starts watching source code for changes (enables auto-rebuild)
   */
  watchSourceCode(srcPath: string, projectRoot: string): void {
    this.sourceWatcher = chokidar.watch(srcPath, {
      persistent: FILE_WATCHER_OPTIONS.persistent,
      ignoreInitial: FILE_WATCHER_OPTIONS.ignoreInitial,
      ignored: FILE_WATCHER_OPTIONS.ignored,
    });

    this.sourceWatcher.on("change", (path: string) => {
      if (path.endsWith(".ts") || path.endsWith(".js")) {
        console.log(MESSAGES.SOURCE_CHANGED_PREFIX + path);
        this.rebuilder.rebuild(projectRoot, () => {
          this.clientManager.notifyReload();
        });
      }
    });

    console.log(MESSAGES.WATCH_MODE_ENABLED);
  }

  /**
   * Stops all watchers
   */
  async stopWatching(): Promise<void> {
    if (this.markdownWatcher) {
      await this.markdownWatcher.close();
    }
    if (this.sourceWatcher) {
      await this.sourceWatcher.close();
    }
  }
}
