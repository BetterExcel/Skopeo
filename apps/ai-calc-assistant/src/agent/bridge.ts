/*
 * UNOBridge implements postMessage-based communication to the Collabora iframe.
 * It correlates requests with responses, validates origin, and handles timeouts.
 */

import type { UNOArgument, UNOResult } from './types';

type Pending = {
  resolve: (res: UNOResult) => void;
  reject: (err: Error) => void;
  timeoutId: number;
};

export class UNOBridge {
  private collaboraFrame: HTMLIFrameElement;
  private allowedOrigin: string;
  private pending = new Map<string, Pending>();

  constructor(opts: { frame: HTMLIFrameElement; allowedOrigin: string }) {
    this.collaboraFrame = opts.frame;
    this.allowedOrigin = opts.allowedOrigin;
    window.addEventListener('message', this.onMessage);
  }

  dispose() {
    window.removeEventListener('message', this.onMessage);
    this.pending.forEach((p) => clearTimeout(p.timeoutId));
    this.pending.clear();
  }

  // Core UNO send method
  uno(command: string, args: UNOArgument[] = [], timeoutMs = 10000): Promise<UNOResult> {
    return new Promise<UNOResult>((resolve, reject) => {
      const id = crypto.randomUUID();

      if (!this.collaboraFrame || !this.collaboraFrame.contentWindow) {
        reject(new Error('COLLABORA_NOT_READY: iframe contentWindow unavailable'));
        return;
      }

      const timeoutId = window.setTimeout(() => {
        this.pending.delete(id);
        reject(new Error('UNO command timeout'));
      }, timeoutMs);

      this.pending.set(id, { resolve, reject, timeoutId });

      this.collaboraFrame.contentWindow.postMessage(
        { MessageId: 'uno', id, args: { command, arguments: args } },
        this.allowedOrigin,
      );
    });
  }

  // Generic request helper for read-only queries (e.g., selection state)
  request(messageType: string, payload: Record<string, unknown>, timeoutMs = 8000): Promise<UNOResult> {
    return new Promise<UNOResult>((resolve, reject) => {
      const id = crypto.randomUUID();

      const timeoutId = window.setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`${messageType} request timeout`));
      }, timeoutMs);

      this.pending.set(id, { resolve, reject, timeoutId });

      this.collaboraFrame.contentWindow?.postMessage(
        { MessageId: messageType, id, ...payload },
        this.allowedOrigin,
      );
    });
  }

  private onMessage = (event: MessageEvent) => {
    // Origin validation
    if (event.origin !== this.allowedOrigin) {
      return; // Ignore silently; sender is not allowed origin
    }
    const data = event.data;
    if (!data || typeof data !== 'object') return;

  // Expecting response with a matching request id regardless of message type
  if (!data.id) return;
  const pending = this.pending.get(String(data.id));
    if (!pending) return;

    clearTimeout(pending.timeoutId);
  this.pending.delete(String(data.id));

    if (data.error) {
      const errStr = String(data.error);
      // Surface origin mismatches if backend signals them
      const message = (event.origin !== this.allowedOrigin)
        ? `ORIGIN_MISMATCH: expected ${this.allowedOrigin}, got ${event.origin}`
        : errStr;
      pending.reject(new Error(message));
    } else {
      const result: UNOResult = { success: true, data: data.result };
      pending.resolve(result);
    }
  };
}
