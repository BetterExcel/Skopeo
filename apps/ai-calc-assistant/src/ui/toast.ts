import { ref } from 'vue';

export type ToastType = 'info' | 'success' | 'error';
export type ToastItem = { id: string; type: ToastType; message: string };

export function createToastStore() {
  const items = ref<ToastItem[]>([]);

  function remove(id: string) {
    const i = items.value.findIndex((t: ToastItem) => t.id === id);
    if (i !== -1) items.value.splice(i, 1);
  }

  function push(type: ToastType, message: string, ttlMs = 4000) {
    const id = Math.random().toString(36).slice(2);
    items.value.push({ id, type, message });
    setTimeout(() => remove(id), ttlMs);
  }

  return {
    state: { get items() { return items.value; } },
    info: (m: string, ttl?: number) => push('info', m, ttl),
    success: (m: string, ttl?: number) => push('success', m, ttl),
    error: (m: string, ttl?: number) => push('error', m, ttl),
    remove,
  };
}
