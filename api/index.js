// ==================== CONFIG =====================
const YOUR_API_KEYS = ["SPLEXXO"];
const TARGET_API = "http://hackingsocietyai.great-site.net/osint.php";
const TARGET_API_KEY = "test";
// =================================================

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Sirf GET allow
  if (req.method !== 'GET') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { phone, mobile, key } = req.query;
  const phoneNumber = phone || mobile;

  // Param check
  if (!phoneNumber || !key) {
    return res.status(400).json({ 
      error: "Missing parameters", 
      details: "Provide 'phone' or 'mobile' and 'key' parameters" 
    });
  }

  // Clean inputs
  const cleanPhone = String(phoneNumber).replace(/\D/g, "");
  const cleanKey = String(key).trim();

  // API key check
  if (!YOUR_API_KEYS.includes(cleanKey)) {
    return res.status(403).json({ error: "Invalid API key" });
  }

  // OSINT API call
  const url = `${TARGET_API}?key=${TARGET_API_KEY}&phone=${cleanPhone}`;

  try {
    console.log('Calling OSINT API:', url);
    const response = await fetch(url);
    
    if (!response.ok) {
      return res.status(502).json({ 
        error: "OSINT API failed", 
        status: response.status,
        message: "Upstream service unavailable"
      });
    }

    const textData = await response.text();
    console.log('Raw response:', textData);

    let jsonData;
    try {
      jsonData = JSON.parse(textData);
    } catch (parseError) {
      // If not JSON, create structured response
      jsonData = {
        raw_response: textData,
        phone: cleanPhone,
        note: "Response from OSINT API"
      };
    }

    // Add branding
    const finalData = {
      ...jsonData,
      developer: "splexxo",
      powered_by: "splexxo OSINT API",
      timestamp: new Date().toISOString()
    };

    return res.status(200).json(finalData);

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message
    });
  }
}
