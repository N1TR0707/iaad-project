const cron = require('node-cron');
const Activation = require('../models/Activation');
const emailService = require('./emailService');

class CronService {
  static startWarrantyReminderJob() {
    // Run every day at 9:00 AM
    cron.schedule('0 9 * * *', async () => {
      console.log('Running warranty reminder job...');
      
      try {
        // Get warranties expiring in 30 days
        const expiring30Days = await Activation.getExpiringWarranties(30);
        console.log(`Found ${expiring30Days.length} warranties expiring in 30 days`);
        
        for (const activation of expiring30Days) {
          await emailService.sendWarrantyReminderEmail(
            activation.email,
            activation.nama,
            activation.product_nama,
            activation.serial_code,
            30
          );
          console.log(`Sent 30-day reminder to ${activation.email}`);
        }

        // Get warranties expiring in 7 days
        const expiring7Days = await Activation.getExpiringWarranties(7);
        console.log(`Found ${expiring7Days.length} warranties expiring in 7 days`);
        
        for (const activation of expiring7Days) {
          await emailService.sendWarrantyReminderEmail(
            activation.email,
            activation.nama,
            activation.product_nama,
            activation.serial_code,
            7
          );
          console.log(`Sent 7-day reminder to ${activation.email}`);
        }

        console.log('Warranty reminder job completed successfully');
      } catch (error) {
        console.error('Error in warranty reminder job:', error);
      }
    });

    console.log('✓ Warranty reminder cron job scheduled (runs daily at 9:00 AM)');
  }

  static startAllJobs() {
    this.startWarrantyReminderJob();
  }
}

module.exports = CronService;
