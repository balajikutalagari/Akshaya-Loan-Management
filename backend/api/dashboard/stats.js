// Simple serverless API for dashboard stats
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'GET') {
    // Return mock dashboard stats
    const stats = {
      members: {
        total: 150,
        active: 142,
        new: 8
      },
      loans: {
        total: 85,
        active: 78,
        disbursed: 7850000,
        outstanding: 5240000
      },
      payments: {
        today: 12,
        amount: 185000,
        overdue: 3
      },
      savings: {
        total: 2150000,
        thisMonth: 125000
      }
    }

    return res.status(200).json(stats)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}