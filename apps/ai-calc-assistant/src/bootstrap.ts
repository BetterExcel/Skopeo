// Bootstrap script to mount the AI Calc Assistant sidebar only in Calc context
// This is a minimal guard for 4.1; full Vue UI comes in 4.2

declare const OC: any;

import { createApp } from 'vue';
import AppRoot from './AppRoot';

(function () {
  // Detect Richdocuments Calc by looking for Collabora iframe and MIME context
  // Heuristic: presence of an iframe with class 'richdocuments-iframe' and Calc toolbar elements
  const onReady = () => {
    const collaboraIframe = document.querySelector('iframe');
    if (!collaboraIframe) return;

    // Lightweight context check: look for calc-specific markers in URL or DOM
    const iframeSrc = (collaboraIframe as HTMLIFrameElement).src || '';
    const isCalc = /spreadsheet|calc|application%2Fvnd\.oasis\.opendocument\.spreadsheet/i.test(iframeSrc);

    if (!isCalc) {
      // Not a Calc document, do nothing
      return;
    }

    // Create a container for the sidebar root if not exists
    let sidebar = document.getElementById('ai-calc-assistant-sidebar');
    if (!sidebar) {
      sidebar = document.createElement('div');
      sidebar.id = 'ai-calc-assistant-sidebar';
      sidebar.style.cssText = `position: fixed; top: 64px; right: 0; width: 360px; height: calc(100% - 64px); background: #fff; border-left: 1px solid #e5e5e5; z-index: 9999; display: flex; flex-direction: column; box-shadow: -2px 0 6px rgba(0,0,0,0.05);`;
      document.body.appendChild(sidebar);
    }

    // Fetch config from our Nextcloud app backend
    fetch(OC.linkTo('ai-calc-assistant', 'api/config'), { credentials: 'same-origin' })
      .then((r) => r.json())
      .then(async (cfg) => {
        // Optional: health check for orchestrator; we proceed to mount UI regardless
        try { await fetch(`${cfg.orchestratorUrl}/health`).then((r) => r.json()); } catch {}

        // Mount the Vue Sidebar
  const app = createApp(AppRoot as any);
  // Pass config via global property for simplicity
  app.config = app.config || {};
  (app as any).provide && (app as any).provide('appConfig', cfg);
  (app as any).mount && (app as any).mount('#ai-calc-assistant-sidebar');
      })
      .catch(() => {
        // Fallback: still mount UI; 4.3 will surface config errors in the UI
  const app = createApp(AppRoot as any);
  (app as any).provide && (app as any).provide('appConfig', null);
  (app as any).mount && (app as any).mount('#ai-calc-assistant-sidebar');
      });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();
