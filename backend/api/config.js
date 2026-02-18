// Simple serverless API that returns mock configuration
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'GET') {
    // Return mock configuration data
    const config = {
      society: {
        id: "sai-akshaya",
        name: "Sri Sai Akshaya Mutually Aided Cooperative Thrift & Credit Society Ltd.",
        shortName: "Sai Akshaya",
        registrationNumber: "REG/2020/SAI001",
        contact: {
          phone: "+91 9876543210",
          email: "info@saiakshaya.coop",
          website: "https://saiakshaya.coop"
        },
        address: {
          line1: "123, Main Road",
          line2: "Near SBI Bank", 
          city: "Hyderabad",
          state: "Telangana",
          pincode: "500001",
          country: "India"
        },
        logo: "/assets/logo.png",
        favicon: "/assets/favicon.ico",
        locale: "en-IN",
        currency: "INR",
        currencySymbol: "₹",
        dateFormat: "DD-MM-YYYY",
        financialYearStart: 4
      },
      ui: {
        theme: {
          primaryColor: "#16a34a",
          secondaryColor: "#ca8a04",
          accentColor: "#2563eb",
          dangerColor: "#dc2626"
        }
      }
    }

    return res.status(200).json(config)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}