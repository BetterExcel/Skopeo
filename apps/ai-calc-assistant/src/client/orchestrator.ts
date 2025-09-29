export type PlanRequest = {
  userPrompt: string;
  sheetContext?: {
    currentSheet?: string;
    selection?: { range: string; type: 'cell' | 'range' | 'column' | 'row' };
    namedRanges?: string[];
    sheetNames?: string[];
    documentType?: 'calc' | 'writer' | 'impress';
  };
};

export type StreamHandlers = {
  onEvent?: (name: string, payload: any) => void;
  onError?: (err: Error) => void;
  onDone?: () => void;
};

export class OrchestratorClient {
  constructor(private baseUrl: string) {}

  async health(): Promise<'ok' | 'fail'> {
    try {
      const res = await fetch(`${this.baseUrl}/health`);
      if (!res.ok) return 'fail';
      const data = await res.json();
      return data?.status === 'ok' ? 'ok' : 'fail';
    } catch {
      return 'fail';
    }
  }

  async plan(req: PlanRequest): Promise<string> {
    const res = await fetch(`${this.baseUrl}/api/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`PLAN_REQUEST_FAILED: ${res.status} ${text}`);
    }
    const data = await res.json();
    if (!data?.planId) throw new Error('PLAN_REQUEST_MALFORMED');
    return String(data.planId);
  }

  stream(planId: string, handlers: StreamHandlers = {}) {
    const src = new EventSource(`${this.baseUrl}/api/stream/${encodeURIComponent(planId)}`);

    const forward = (name: string, e: MessageEvent) => {
      try {
        const payload = e.data ? JSON.parse(e.data) : undefined;
        handlers.onEvent?.(name, payload);
      } catch {
        handlers.onEvent?.(name, e.data);
      }
    };

    src.onmessage = (e) => forward('message', e);

    // Also listen for common custom event names
    const events = [
      'event',
      'error',
      'response.output_text.delta',
      'response.completed',
      'response.error',
    ];
    for (const ev of events) {
      src.addEventListener(ev, (e) => forward(ev, e as MessageEvent));
    }

    src.onerror = () => {
      handlers.onError?.(new Error('STREAM_ERROR'));
      // Close; this is a one-shot stream
      try { src.close(); } catch {}
      handlers.onDone?.();
    };

    return {
      close: () => {
        try { src.close(); } catch {}
      },
    };
  }
}
