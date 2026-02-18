import { BaseModel } from './base.js'
import { configService } from '../services/configService.js'

class MemberModel extends BaseModel {
  constructor(db) {
    super(db)
    this.collection = 'members'
    this.memberConfig = configService.getMemberConfig()
  }

  async create(data) {
    // Generate member ID based on config
    const memberId = await this.generateMemberId()
    
    const member = await super.create({
      ...data,
      memberId,
      status: 'active',
      joinedDate: new Date().toISOString().split('T')[0],
    })

    return member
  }

  async generateMemberId() {
    const { prefix, format, sequenceLength } = this.memberConfig.idFormat
    
    // Get next sequence number
    const sequence = await this.getNextSequence()
    const paddedSequence = sequence.toString().padStart(sequenceLength, '0')
    
    return format
      .replace('{prefix}', prefix)
      .replace('{sequence}', paddedSequence)
  }

  async getNextSequence() {
    try {
      const data = await this.db.get('sequences:member')
      const value = data?.value || data
      const current = JSON.parse(value).value
      await this.db.put('sequences:member', JSON.stringify({ value: current + 1 }))
      return current + 1
    } catch (error) {
      // First member
      await this.db.put('sequences:member', JSON.stringify({ value: 1 }))
      return 1
    }
  }

  async findByMemberId(memberId) {
    try {
      const stream = this.db.createReadStream()
      for await (const { key, value } of stream) {
        if (key.startsWith(`${this.collection}:`)) {
          const member = JSON.parse(value)
          if (member.memberId === memberId) {
            return member
          }
        }
      }
    } catch (error) {
      console.error('Error searching for member:', error)
    }
    return null
  }

  async search(query) {
    const results = []
    const searchTerm = query.toLowerCase()
    
    try {
      const stream = this.db.createReadStream()
      for await (const { key, value } of stream) {
        if (key.startsWith(`${this.collection}:`)) {
          const member = JSON.parse(value)
          if (
            member.name?.toLowerCase().includes(searchTerm) ||
            member.phone?.includes(searchTerm) ||
            member.memberId?.toLowerCase().includes(searchTerm)
          ) {
            results.push(member)
          }
        }
      }
    } catch (error) {
      console.error('Error searching members:', error)
    }
    
    return results
  }

  async getStats() {
    let totalMembers = 0
    let activeMembers = 0
    let inactiveMembers = 0
    
    try {
      // Check if createReadStream exists and is a function
      if (this.db && typeof this.db.createReadStream === 'function') {
        const stream = this.db.createReadStream()
        for await (const { key, value } of stream) {
          if (key.startsWith(`${this.collection}:`)) {
            const member = JSON.parse(value)
            totalMembers++
            if (member.status === 'active') activeMembers++
            else inactiveMembers++
          }
        }
      } else {
        console.log('Database stream not available yet')
      }
    } catch (error) {
      console.log('Error reading member stats:', error.message)
    }
    
    return {
      totalMembers,
      activeMembers,
      inactiveMembers,
    }
  }
}

export { MemberModel }