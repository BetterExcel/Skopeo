import { config } from './lib/config.js';
import { app } from './app.js';

const port = config.PORT;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[ai-orchestrator] listening on :${port}`);
});
