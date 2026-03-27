import cron from 'node-cron';
import { runDataPipeline } from './dataService';
import { alertService } from './alertService';

export function startCronJobs() {
  console.log('⏰ Starting cron jobs...');

  // Data pipeline: every 4 hours on weekdays (Mon-Fri, 10-22 Chile time)
  cron.schedule('0 10,14,18,22 * * 1-5', async () => {
    console.log('🔄 Cron: Running data pipeline');
    try {
      await runDataPipeline();
    } catch (e: any) {
      console.error('Cron data pipeline error:', e.message);
    }
  });

  // Daily summary: 18:00 weekdays
  cron.schedule('0 18 * * 1-5', async () => {
    console.log('📋 Cron: Sending daily summary');
    try {
      await alertService.sendDailySummary();
    } catch (e: any) {
      console.error('Cron daily summary error:', e.message);
    }
  });

  // Alert check: every hour during market hours (Mon-Fri, 10-22)
  cron.schedule('0 10-22 * * 1-5', async () => {
    console.log('🔔 Cron: Checking alerts');
    try {
      await alertService.runAllAlerts();
    } catch (e: any) {
      console.error('Cron alerts error:', e.message);
    }
  });

  // Initial data fetch on startup
  setTimeout(async () => {
    console.log('🚀 Running initial data pipeline...');
    try {
      await runDataPipeline();
    } catch (e: any) {
      console.error('Initial pipeline error:', e.message);
    }
  }, 5000);

  console.log('✅ Cron jobs scheduled:');
  console.log('   📊 Data pipeline — every 4h on weekdays');
  console.log('   📋 Daily summary — 18:00 weekdays');
  console.log('   🔔 Alert check  — hourly on weekdays');
}
