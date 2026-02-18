/**
 * Base Model with common operations
 */
class BaseModel {
  constructor(db) {
    this.db = db
  }

  async create(data) {
    const id = this.generateId()
    const record = {
      id,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    await this.db.put(`${this.collection}:${id}`, JSON.stringify(record))
    return record
  }

  async findById(id) {
    try {
      const data = await this.db.get(`${this.collection}:${id}`)
      // Hyperbee returns { seq, key, value } object
      const value = data?.value || data
      return JSON.parse(value)
    } catch (error) {
      if (error.code === 'KEY_NOT_FOUND') return null
      throw error
    }
  }

  async update(id, data) {
    const existing = await this.findById(id)
    if (!existing) throw new Error('Record not found')
    
    const updated = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    }
    
    await this.db.put(`${this.collection}:${id}`, JSON.stringify(updated))
    return updated
  }

  async delete(id) {
    await this.db.del(`${this.collection}:${id}`)
    return true
  }

  async findAll(options = {}) {
    const { limit = 100, offset = 0 } = options
    const results = []
    
    try {
      const stream = this.db.createReadStream()
      for await (const { key, value } of stream) {
        if (key.startsWith(`${this.collection}:`)) {
          results.push(JSON.parse(value))
        }
        if (results.length >= limit + offset) break
      }
    } catch (error) {
      console.error('Error reading from database:', error)
    }
    
    return results.slice(offset, offset + limit)
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
}

export { BaseModel }