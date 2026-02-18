import HyperBee from 'hyperbee'
import Hypercore from 'hypercore'
import { promises as fs } from 'fs'
import path from 'path'

async function clearDatabase() {
  console.log('🗑️  Starting database cleanup...')
  
  try {
    // Initialize the database
    const core = new Hypercore('./storage', { valueEncoding: 'json' })
    await core.ready()
    const db = new HyperBee(core, { keyEncoding: 'utf-8', valueEncoding: 'json' })
    
    console.log('📊 Reading all keys to delete...')
    
    // Collect all keys
    const keysToDelete = []
    for await (const { key } of db.createReadStream()) {
      keysToDelete.push(key)
    }
    
    console.log(`Found ${keysToDelete.length} records to delete`)
    
    // Delete all keys
    let deletedCount = 0
    for (const key of keysToDelete) {
      try {
        await db.del(key)
        deletedCount++
        if (deletedCount % 10 === 0) {
          console.log(`  Deleted ${deletedCount}/${keysToDelete.length} records...`)
        }
      } catch (err) {
        console.error(`  Failed to delete key ${key}:`, err.message)
      }
    }
    
    console.log(`✅ Successfully deleted ${deletedCount} records`)
    
    // Reset sequences
    const sequences = ['member', 'loan', 'payment', 'receipt', 'saving']
    for (const seq of sequences) {
      try {
        await db.put(`sequences:${seq}`, JSON.stringify({ value: 0 }))
        console.log(`  Reset sequence: ${seq}`)
      } catch (err) {
        console.error(`  Failed to reset sequence ${seq}:`, err.message)
      }
    }
    
    console.log('✅ Database cleared successfully!')
    console.log('📝 Note: Restart the server to ensure clean state')
    
  } catch (error) {
    console.error('❌ Error clearing database:', error.message)
    process.exit(1)
  }
  
  process.exit(0)
}

// Run the cleanup
clearDatabase()