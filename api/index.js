// ==================== CONFIG =====================
const YOUR_API_KEYS = ["SPLEXXO"];
const TARGET_API = "http://hackingsocietyai.great-site.net/osint.php";
const TARGET_API_KEY = "test";
// =================================================

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: "Method not allowed" });

  const { phone, mobile, key } = req.query;
  const phoneNumber = phone || mobile;

  if (!phoneNumber || !key) {
    return res.status(400).json({ 
      error: "Missing parameters", 
      details: "Use: ?mobile=Number&key=SPLEXXO" 
    });
  }

  const cleanPhone = String(phoneNumber).replace(/\D/g, "");
  const cleanKey = String(key).trim();

  if (!YOUR_API_KEYS.includes(cleanKey)) {
    return res.status(403).json({ error: "Invalid API key" });
  }

  // OSINT API call
  const url = `${TARGET_API}?key=${TARGET_API_KEY}&phone=${cleanPhone}`;

  try {
    const response = await fetch(url);
    const textData = await response.text();

    let jsonData;
    try {
      jsonData = JSON.parse(textData);
    } catch {
      jsonData = { raw_data: textData };
    }

    // Final response
    const finalData = {
      ...jsonData,
      phone: cleanPhone,
      developer: "splexxo",
      powered_by: "splexxo OSINT API",
      timestamp: new Date().toISOString()
    };

    return res.status(200).json(finalData);

  } catch (error) {
    return res.status(500).json({
      error: "API error",
      details: error.message,
      developer: "splexxo"
    });
  }
}
