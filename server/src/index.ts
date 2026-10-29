import { createApp } from './app.js';
import { config } from './config/env.js';
import { initScheduler } from './services/scheduler.js';

const app = createApp();

app.listen(config.port, () => {
  console.log(`===============================================`);
  console.log(`🚀 Bizpoa POS Backend API Server Running`);
  console.log(`📡 URL: http://localhost:${config.port}`);
  console.log(`🏪 Shop: ${config.shop.name} (Till: ${config.shop.till})`);
  console.log(`📱 USSD Webhook Endpoint: http://localhost:${config.port}/api/ussd`);
  console.log(`💬 Africa's Talking SMS: ${config.africasTalking.isSandbox ? 'Sandbox Mode' : 'Live'}`);
  console.log(`===============================================`);

  // Initialize automated closing report scheduler
  initScheduler();
});
