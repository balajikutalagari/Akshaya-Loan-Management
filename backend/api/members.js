// Simple serverless API for members
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'GET') {
    // Return mock members data
    const members = [
      {
        id: "MEM-00001",
        name: "John Doe",
        phone: "9876543210",
        email: "john@example.com",
        address: "123 Main St, City",
        joinDate: "2024-01-15",
        status: "active",
        totalSavings: 12000,
        activeLoans: 1
      },
      {
        id: "MEM-00002", 
        name: "Jane Smith",
        phone: "9876543211",
        email: "jane@example.com",
        address: "456 Oak Ave, City",
        joinDate: "2024-02-01",
        status: "active",
        totalSavings: 8500,
        activeLoans: 0
      }
    ]

    // Handle search query
    const { q } = req.query
    if (q) {
      const filtered = members.filter(member => 
        member.name.toLowerCase().includes(q.toLowerCase()) ||
        member.phone.includes(q) ||
        member.id.toLowerCase().includes(q.toLowerCase())
      )
      return res.status(200).json(filtered)
    }

    return res.status(200).json(members)
  }

  if (req.method === 'POST') {
    // Mock member creation
    const newMember = {
      id: `MEM-${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`,
      ...req.body,
      joinDate: new Date().toISOString().split('T')[0],
      status: "active",
      totalSavings: 0,
      activeLoans: 0
    }
    
    return res.status(201).json(newMember)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}