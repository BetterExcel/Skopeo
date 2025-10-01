<template>
  <div id="ai-calc-assistant-root" class="sidebar-root">
    <header class="sidebar-header">AI Calc Assistant</header>
    <div class="toasts">
      <div
        v-for="t in toasts.state.items"
        :key="t.id"
        class="toast"
        :class="t.type"
        :data-test="`toast-${t.type}`"
      >
        {{ t.message }}
      </div>
    </div>
    <div v-if="diagWarnings.length" class="diag" data-test="diagnostics-section">
      <div class="diag-title">Configuration checks</div>
      <ul>
        <li v-for="w in diagWarnings" :key="w">{{ w }}</li>
      </ul>
    </div>
    <div v-if="serverDiag" class="diag" data-test="diagnostics-section">
      <div class="diag-title">Server diagnostics</div>
      <ul>
        <li>Orchestrator URL: {{ appConfig?.orchestratorUrl || 'not set' }}</li>
        <li>Status: {{ serverDiag.status }} (reachable: {{ serverDiag.reachable ? 'yes' : 'no' }})</li>
        <li v-if="serverDiag.message">Message: {{ serverDiag.message }}</li>
      </ul>
    </div>
    <section class="messages" ref="messagesRef" data-test="progress-log">
      <div v-for="m in messages" :key="m.id" class="msg" :class="m.type">
        <span class="role">{{ m.type }}</span>
        <span class="content">{{ m.content }}</span>
      </div>
    </section>
  <footer class="composer">
      <input
        id="ai-input"
        data-test="chat-input"
        v-model="input"
        type="text"
        :placeholder="placeholder"
        @keydown.enter.prevent="onSend"
      />
      <button id="ai-send" data-test="send-btn" :disabled="isProcessing || !input.trim()" @click="onSend">Send</button>
    </footer>
    <ConfirmDialog v-if="confirmOpen" :summary="confirmSummary" @confirm="confirmExecute" @cancel="cancelConfirm" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, inject, computed } from 'vue';
import { OrchestratorClient, type PlanRequest } from './client/orchestrator';
import ConfirmDialog from './components/ConfirmDialog.vue';
import { summarizePreview, type PreviewSummary } from './agent/preview';

type MsgType = 'user' | 'assistant' | 'system';
type ChatMessage = { id: string; type: MsgType; content: string };

const messages = ref<ChatMessage[]>([
  { id: 'sys1', type: 'system', content: 'Connected. Ask me to change your sheet.' },
]);
const isProcessing = ref(false);
const input = ref('');
const messagesRef = ref<HTMLElement | null>(null);
const placeholder = 'Ask: Put "Hello" in A1';

function uid() { return Math.random().toString(36).slice(2); }

const appConfig = inject<any>('appConfig', null);
const client = ref<OrchestratorClient | null>(null);
const debug = !!appConfig?.debug;
const executor = inject<any>('toolExecutor', null);
const tools = inject<any>('tools', null);
const toasts = inject<any>('toasts', null);
const confirmOpen = ref(false);
const confirmSummary = ref<PreviewSummary>({ totalCells: 0, ranges: [], requiresConfirmation: false });
let confirmCalls: any[] = [];

// Basic diagnostics for WOPI/Origin config
const diagWarnings = computed<string[]>(() => {
  const out: string[] = [];
  const expected = window.location.origin;
  const actual = appConfig?.postMessageOrigin;
  if (!actual) {
    out.push('PostMessageOrigin is not configured. Set it to ' + expected + ' in Richdocuments CheckFileInfo.');
  } else if (actual !== expected) {
    out.push(`PostMessageOrigin mismatch. Expected ${expected} but got ${actual}. Cross-frame messaging may fail.`);
  }
  out.push('Ensure WOPI CheckFileInfo includes EnableRemoteAIContent: true for Calc documents.');
  // Orchestrator URL/health checks from server diagnostics
  if (!appConfig?.orchestratorUrl) {
    out.push('Orchestrator URL is not configured on the server. Set ai-calc-assistant:orchestrator_url.');
  } else if (appConfig?.diagnostics?.orchestrator) {
    const d = appConfig.diagnostics.orchestrator;
    if (!d.reachable) {
      out.push(`Orchestrator health check failed (status: ${d.status}${d.message ? ', ' + d.message : ''}).`);
    }
  }
  return out;
});

const serverDiag = computed<any>(() => appConfig?.diagnostics?.orchestrator || null);

onMounted(async () => {
  if (appConfig?.orchestratorUrl) {
    client.value = new OrchestratorClient(appConfig.orchestratorUrl, {
      debug,
      reconnectMs: appConfig?.sse?.reconnectMs,
      maxDurationMs: appConfig?.sse?.maxDurationMs,
    });
    const health = await client.value.health();
    if (health !== 'ok') {
      messages.value.push({ id: uid(), type: 'system', content: 'Orchestrator unavailable.' });
    }
  } else {
    messages.value.push({ id: uid(), type: 'system', content: 'Missing configuration.' });
  }
});

async function onSend() {
  const content = input.value.trim();
  if (!content) return;
  messages.value.push({ id: uid(), type: 'user', content });
  input.value = '';
  isProcessing.value = true;
  await nextTick();
  messagesRef.value?.scrollTo({ top: messagesRef.value.scrollHeight });

  // First, try to parse a direct command for basic operations (fast-path)
  const parsed = parseCommand(content);
  if (parsed && executor) {
    try {
      const summary = summarizePreview([parsed], { maxCellsWithoutConfirmation: appConfig?.maxCellsWithoutConfirmation || 1000 });
      if (summary.requiresConfirmation) {
        confirmSummary.value = summary;
        confirmCalls = [parsed];
        confirmOpen.value = true;
      } else {
        isProcessing.value = true;
        messages.value.push({ id: uid(), type: 'assistant', content: `Executing: ${parsed.name}` });
        await executor.run([parsed], (u: any) => {
          if (!u.success) {
            messages.value.push({ id: uid(), type: 'system', content: `Error: ${u.error}` });
            toasts?.error?.(u.error || 'Operation failed');
          }
        });
        messages.value.push({ id: uid(), type: 'assistant', content: 'Done.' });
        toasts?.success?.('Operation completed');
        isProcessing.value = false;
      }
      return;
    } catch (e: any) {
      const msg = e?.message || String(e);
      messages.value.push({ id: uid(), type: 'system', content: `Failed: ${msg}` });
      toasts?.error?.(msg);
      isProcessing.value = false;
      return;
    }
  }

  // Send to orchestrator and stream plan events
  try {
    if (!client.value) throw new Error('NO_CLIENT');
    const req: PlanRequest = { userPrompt: content };
  if (debug) console.debug('[assistant] plan request', req);
  const planId = await client.value.plan(req);
  if (debug) console.debug('[assistant] plan id', planId);

    messages.value.push({ id: uid(), type: 'assistant', content: 'Planning…' });
    await nextTick();
    messagesRef.value?.scrollTo({ top: messagesRef.value!.scrollHeight });

    const bufferId = uid();
    let buffer = '';
    messages.value.push({ id: bufferId, type: 'assistant', content: '' });

    const sub = client.value.stream(planId, {
      onEvent: (name, payload) => {
        if (debug) console.debug('[assistant] event', name, payload);
        if (name === 'response.output_text.delta' && payload?.delta) {
          buffer += String(payload.delta);
          const idx = messages.value.findIndex((m) => m.id === bufferId);
          if (idx !== -1) messages.value[idx] = { ...messages.value[idx], content: buffer } as any;
        }
        if (name === 'response.error') {
          messages.value.push({ id: uid(), type: 'system', content: `Error: ${payload?.message || 'unknown'}` });
        }
      },
      onError: () => {
        if (debug) console.debug('[assistant] stream error');
        messages.value.push({ id: uid(), type: 'system', content: 'Stream error.' });
        toasts?.error?.('Stream error');
      },
      onDone: () => {
        if (debug) console.debug('[assistant] stream done');
        isProcessing.value = false;
        toasts?.info?.('Plan streaming finished');
      },
    });

    // Safety timeout for done
    setTimeout(() => { try { sub.close(); } catch {} }, 180000);
  } catch (e: any) {
    if (debug) console.debug('[assistant] failed', e);
    const msg = e?.message || String(e);
    messages.value.push({ id: uid(), type: 'system', content: `Failed: ${msg}` });
    toasts?.error?.(msg);
    isProcessing.value = false;
  }
}

function cancelConfirm() { confirmOpen.value = false; }
async function confirmExecute() {
  confirmOpen.value = false;
  isProcessing.value = true;
  try {
    // Optional: preview highlight
    for (const c of confirmCalls) {
      if (c.arguments?.range && tools?.select_range) {
        try { await tools.select_range(c.arguments.range); } catch {}
      }
    }
    await executor.run(confirmCalls, (u: any) => {
      if (!u.success) {
        messages.value.push({ id: uid(), type: 'system', content: `Error: ${u.error}` });
        toasts?.error?.(u.error || 'Operation failed');
      }
    });
    messages.value.push({ id: uid(), type: 'assistant', content: 'Done.' });
    toasts?.success?.('Operation completed');
  } catch (e: any) {
    const msg = e?.message || String(e);
    messages.value.push({ id: uid(), type: 'system', content: `Failed: ${msg}` });
    toasts?.error?.(msg);
  } finally {
    isProcessing.value = false;
  }
}

// Very simple NL parser for common commands (fast-path)
function parseCommand(text: string): { name: string; arguments: Record<string, any> } | null {
  const t = text.trim();
  // Put "X" in A1
  let m = t.match(/^put\s+\"(.+?)\"\s+in\s+([A-Za-z]{1,3}\d{1,7})$/i);
  if (m) return { name: 'set_cell_text', arguments: { address: m[2], text: m[1] } };

  // Apply formula =X to A1
  m = t.match(/^apply\s+formula\s+(=.+)\s+to\s+([A-Za-z]{1,3}\d{1,7})$/i);
  if (m) return { name: 'apply_formula', arguments: { address: m[2], formula: m[1] } };

  // Go to cell A1
  m = t.match(/^go\s+to\s+cell\s+([A-Za-z]{1,3}\d{1,7})$/i);
  if (m) return { name: 'go_to_cell', arguments: { address: m[1] } };

  // Make column B currency format
  m = t.match(/^make\s+column\s+([A-Za-z]{1,3})\s+currency\s+format$/i);
  if (m) return { name: 'format_range_currency', arguments: { range: `${m[1].toUpperCase()}1:${m[1].toUpperCase()}1048576` } };

  // Sort A1:C10 by B ascending|descending
  m = t.match(/^sort\s+([A-Za-z]{1,3}\d{1,7}:[A-Za-z]{1,3}\d{1,7})\s+by\s+([A-Za-z]{1,3})\s+(ascending|descending)$/i);
  if (m) return { name: 'sort_range', arguments: { range: m[1], column: m[2], ascending: m[3].toLowerCase() === 'ascending' } };

  return null;
}

</script>

<style scoped>
.sidebar-root { display: flex; flex-direction: column; height: 100%; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
.sidebar-header { padding: 12px; border-bottom: 1px solid #eee; font-weight: 600; }
.messages { flex: 1; overflow: auto; padding: 12px; background: #fafafa; }
.diag { background: #fff7e6; color: #8a6d3b; border: 1px solid #ffe0a3; padding: 8px 12px; margin: 8px 12px; border-radius: 6px; }
.diag-title { font-weight: 600; margin-bottom: 4px; }
.msg { margin-bottom: 8px; display: flex; gap: 8px; }
.msg .role { text-transform: capitalize; font-weight: 600; width: 80px; color: #666; }
.msg.user .role { color: #0073e6; }
.msg.assistant .role { color: #2c7; }
.composer { display: flex; gap: 8px; padding: 12px; border-top: 1px solid #eee; }
.composer input { flex: 1; padding: 8px 10px; border: 1px solid #ddd; border-radius: 6px; }
.composer button { padding: 8px 12px; border-radius: 6px; border: 1px solid #ddd; background: #fff; cursor: pointer; }
.composer button:disabled { opacity: 0.5; cursor: not-allowed; }
.toasts { position: fixed; top: 72px; right: 372px; display: flex; flex-direction: column; gap: 8px; z-index: 10000; }
.toast { padding: 8px 12px; border-radius: 6px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); background: #fff; border: 1px solid #eee; font-size: 13px; }
.toast.success { border-color: #b7eb8f; background: #f6ffed; color: #135200; }
.toast.error { border-color: #ffa39e; background: #fff1f0; color: #a8071a; }
.toast.info { border-color: #91d5ff; background: #e6f7ff; color: #004a7c; }
</style>
