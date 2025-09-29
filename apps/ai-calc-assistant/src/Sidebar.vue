<template>
  <div class="sidebar-root">
    <header class="sidebar-header">AI Calc Assistant</header>
    <section class="messages" ref="messagesRef">
      <div v-for="m in messages" :key="m.id" class="msg" :class="m.type">
        <span class="role">{{ m.type }}</span>
        <span class="content">{{ m.content }}</span>
      </div>
    </section>
    <footer class="composer">
      <input
        id="ai-input"
        v-model="input"
        type="text"
        :placeholder="placeholder"
        @keydown.enter.prevent="onSend"
      />
      <button id="ai-send" :disabled="isProcessing || !input.trim()" @click="onSend">Send</button>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, inject } from 'vue';
import { OrchestratorClient, type PlanRequest } from './client/orchestrator';

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

onMounted(async () => {
  if (appConfig?.orchestratorUrl) {
    client.value = new OrchestratorClient(appConfig.orchestratorUrl);
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

  // Send to orchestrator and stream plan events
  try {
    if (!client.value) throw new Error('NO_CLIENT');
    const req: PlanRequest = { userPrompt: content };
    const planId = await client.value.plan(req);

    messages.value.push({ id: uid(), type: 'assistant', content: 'Planning…' });
    await nextTick();
    messagesRef.value?.scrollTo({ top: messagesRef.value!.scrollHeight });

    const bufferId = uid();
    let buffer = '';
    messages.value.push({ id: bufferId, type: 'assistant', content: '' });

    const sub = client.value.stream(planId, {
      onEvent: (name, payload) => {
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
        messages.value.push({ id: uid(), type: 'system', content: 'Stream error.' });
      },
      onDone: () => {
        isProcessing.value = false;
      },
    });

    // Safety timeout for done
    setTimeout(() => { try { sub.close(); } catch {} }, 180000);
  } catch (e: any) {
    messages.value.push({ id: uid(), type: 'system', content: `Failed: ${e?.message || e}` });
    isProcessing.value = false;
  }
}

</script>

<style scoped>
.sidebar-root { display: flex; flex-direction: column; height: 100%; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
.sidebar-header { padding: 12px; border-bottom: 1px solid #eee; font-weight: 600; }
.messages { flex: 1; overflow: auto; padding: 12px; background: #fafafa; }
.msg { margin-bottom: 8px; display: flex; gap: 8px; }
.msg .role { text-transform: capitalize; font-weight: 600; width: 80px; color: #666; }
.msg.user .role { color: #0073e6; }
.msg.assistant .role { color: #2c7; }
.composer { display: flex; gap: 8px; padding: 12px; border-top: 1px solid #eee; }
.composer input { flex: 1; padding: 8px 10px; border: 1px solid #ddd; border-radius: 6px; }
.composer button { padding: 8px 12px; border-radius: 6px; border: 1px solid #ddd; background: #fff; cursor: pointer; }
.composer button:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
