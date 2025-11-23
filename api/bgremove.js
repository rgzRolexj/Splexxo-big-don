// ==================== CONFIG =====================
const YOUR_API_KEYS = ["SPLEXXO"]; // tumhara private key
const TARGET_API = "http://hackingsocietyai.great-site.net/osint.php"; // OSINT API
const TARGET_API_KEY = "test"; // upstream API key
const CACHE_TIME = 3600 * 1000; // 1 hour (ms)
// =================================================

const cache = new Map();

// Helper: recursively clean unwanted fields
function cleanResponse(value) {
  if (typeof value === "string") {
    return value.replace(/@oxmzoo/gi, "").trim();
  }
  if (Array.isArray(value)) {
    return value.map(cleanResponse);
  }
  if (value && typeof value === "object") {
    const cleaned = {};
    for (const key of Object.keys(value)) {
      if (key === "@oxmzoo") continue;
      cleaned[key] = cleanResponse(value[key]);
    }
    return cleaned;
  }
  return value;
}

module.exports = async (req, res) => {
  // Sirf GET allow
  if (req.method !== "GET") {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(405).json({ error: "method not allowed" });
  }

  const { phone: rawPhone, key: rawKey, mobile: rawMobile } = req.query || {};

  // Param check - phone ya mobile dono me se koi ek required
  const phoneNumber = rawPhone || rawMobile;
  
  if (!phoneNumber || !rawKey) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(400).json({ 
      error: "missing parameters", 
      details: "Either 'phone' or 'mobile' parameter is required along with 'key'"
    });
  }

  const key = String(rawKey).trim();
  const phone = String(phoneNumber).replace(/\D/g, "");

  // API key check
  if (!YOUR_API_KEYS.includes(key)) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(403).json({ error: "invalid key" });
  }

  // Cache check
  const now = Date.now();
  const cached = cache.get(phone);

  if (cached && now - cached.timestamp < CACHE_TIME) {
    res.setHeader("X-Proxy-Cache", "HIT");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(200).send(cached.response);
  }

  // Upstream URL build - OSINT API
  const url = `${TARGET_API}?key=${TARGET_API_KEY}&phone=${encodeURIComponent(phone)}`;

  try {
    const upstream = await fetch(url);
    const raw = await upstream.text();

    if (!upstream.ok || !raw) {  
      res.setHeader("Content-Type", "application/json; charset=utf-8");  
      return res.status(502).json({  
        error: "upstream API failed",  
        details: `HTTP ${upstream.status}`,  
      });  
    }  

    let responseBody;  

    try {  
      // JSON parse try  
      let data = JSON.parse(raw);  

      // Saare data se unwanted fields clean karo  
      data = cleanResponse(data);  

      // Apni clean branding  
      data.developer = "splexxo";  
      data.powered_by = "splexxo OSINT API";  
      data.note = "Phone number OSINT information";

      responseBody = JSON.stringify(data);  
    } catch {  
      // Agar JSON nahi hai to raw text ko JSON me convert karo
      const formattedResponse = {
        raw_response: raw.trim(),
        developer: "splexxo",
        powered_by: "splexxo OSINT API",
        note: "Phone number OSINT information"
      };
      responseBody = JSON.stringify(formattedResponse);
    }  

    // Cache save  
    cache.set(phone, {  
      timestamp: Date.now(),  
      response: responseBody,  
    });  

    res.setHeader("X-Proxy-Cache", "MISS");  
    res.setHeader("Content-Type", "application/json; charset=utf-8");  
    return res.status(200).send(responseBody);

  } catch (err) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(502).json({
      error: "upstream request error",
      details: err.message || "unknown error",
    });
  }
};
