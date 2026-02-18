import cron from 'node-cron'
import { configService } from '../services/configService.js'

function startJobs(db) {
  const jobsConfig = configService.config.system.jobs
  
  if (!jobsConfig) {
    console.log('No jobs configured')
    return
  }
  
  // Overdue checker job
  if (jobsConfig.overdueChecker && jobsConfig.overdueChecker.enabled) {
    const hour = jobsConfig.overdueChecker.runAtHour || 0
    cron.schedule(`0 ${hour} * * *`, () => {
      console.log('Running overdue checker job...')
      // TODO: Implement overdue checking logic
    })
    console.log(`✅ Overdue checker job scheduled for ${hour}:00 daily`)
  }
  
  // Reminder sender job
  if (jobsConfig.reminderSender && jobsConfig.reminderSender.enabled) {
    const hour = jobsConfig.reminderSender.runAtHour || 9
    cron.schedule(`0 ${hour} * * *`, () => {
      console.log('Running reminder sender job...')
      // TODO: Implement reminder sending logic
    })
    console.log(`✅ Reminder sender job scheduled for ${hour}:00 daily`)
  }
  
  // Savings interest job
  if (jobsConfig.savingsInterest && jobsConfig.savingsInterest.enabled) {
    if (jobsConfig.savingsInterest.schedule === 'monthEnd') {
      // Last day of month at midnight
      cron.schedule('0 0 28-31 * *', () => {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        
        // Check if tomorrow is first day of next month
        if (tomorrow.getDate() === 1) {
          console.log('Running monthly savings interest calculation...')
          // TODO: Implement savings interest calculation
        }
      })
      console.log('✅ Savings interest job scheduled for month end')
    }
  }
  
  console.log('Background jobs started')
}

export { startJobs }