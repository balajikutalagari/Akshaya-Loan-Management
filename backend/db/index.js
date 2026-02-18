import Hyperbee from 'hyperbee'
import Hypercore from 'hypercore'
import path from 'path'
import { configService } from '../services/configService.js'

let db = null

async function initializeDatabase() {
  try {
    const dbConfig = configService.config.system.database
    const storagePath = path.resolve(dbConfig.storagePath)
    
    console.log(`Initializing database at: ${storagePath}`)
    
    // Create hypercore
    const core = new Hypercore(storagePath)
    
    // Wait for core to be ready
    await core.ready()
    
    // Create hyperbee database
    db = new Hyperbee(core, {
      keyEncoding: 'utf-8',
      valueEncoding: 'utf-8'
    })
    
    console.log('Database ready')
    
    // Run any necessary migrations
    await runMigrations()
    
    return db
  } catch (error) {
    console.error('Database initialization error:', error)
    throw error
  }
}

async function runMigrations() {
  try {
    // Check if this is first run
    const versionData = await db.get('system:version')
    
    if (!versionData) {
      // First run - initialize system data
      await db.put('system:version', '1.0.0')
      await db.put('system:initialized', new Date().toISOString())
      
      // Initialize sequences
      await db.put('sequences:member', JSON.stringify({ value: 0 }))
      await db.put('sequences:loan', JSON.stringify({ value: 0 }))
      await db.put('sequences:payment', JSON.stringify({ value: 0 }))
      
      console.log('Database initialized with default data')
    } else {
      console.log(`Database version: ${versionData}`)
    }
  } catch (error) {
    console.error('Migration error:', error)
    throw error
  }
}

function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.')
  }
  return db
}

export {
  initializeDatabase,
  getDatabase
}