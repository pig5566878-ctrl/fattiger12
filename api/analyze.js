// api/analyze.js - Vercel Serverless Function (CommonJS)
// 使用 gemini-1.5-flash（免費額度最穩定）

const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY 未設定' });

  try {
    const { mode, image, mediaType, description, prompt, messages } = req.body;

    // ── CHAT ──────────────────────────────────────────
    if (mode === 'chat') {
      const systemText = '你是醫院工務部門的 AI 維修師傅。用繁體中文回答維修問題，回答簡潔實用，適合現場工務同仁快速參考。';
      // gemini-1.5-flash：把 system 放進第一個 user turn
      const contents = [];
      contents.push({ role: 'user', parts: [{ text: systemText + '\n\n請確認你理解角色。' }] });
      contents.push({ role: 'model', parts: [{ text: '我是醫院工務 AI 維修師傅，請問有什麼需要協助的維修問題？' }] });
      (messages || []).forEach(m => {
        contents.push({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        });
      });
      const r = await callGemini(apiKey, { contents, generationConfig: { maxOutputTokens: 800, temperature: 0.7 } });
      if (r.error) return res.status(500).json({ error: r.error.message || JSON.stringify(r.error) });
      const text = r.candidates?.[0]?.content?.parts?.[0]?.text || '抱歉，無法取得回應。';
      return res.status(200).json({ content: [{ text }] });
    }

    // ── ANALYZE ───────────────────────────────────────
    if (mode === 'analyze') {
      const systemText = `你是醫院工務部門的 AI 維修助手。分析圖片中的設備異常，結合工務人員的文字描述，以繁體中文輸出純 JSON，格式嚴格如下，不可有任何前後文字或 markdown 符號：
{"issue":"問題名稱（簡短）","icon":"單一emoji","confidence":85,"solutions":[{"rank":1,"name":"方法名稱","difficulty":"簡易","minutes":20,"steps":["詳細步驟1","詳細步驟2","詳細步驟3","詳細步驟4"],"tools":"工具清單","warning":"注意事項或空字串"}]}
solutions 提供 2~3 個方案，由簡單到複雜。difficulty 只能是「簡易」「中等」「困難」。`;

      const userText = description
        ? `請分析這張圖片中的設備異常狀況，並提供維修建議。\n\n工務人員補充描述：${description}`
        : '請分析這張圖片中的設備異常狀況，並提供維修建議。';

      const contents = [
        { role: 'user', parts: [{ text: systemText }] },
        { role: 'model', parts: [{ text: '我是醫院工務 AI 維修助手，請提供圖片讓我分析。' }] },
        {
          role: 'user', parts: [
            { inline_data: { mime_type: mediaType || 'image/jpeg', data: image } },
            { text: userText }
          ]
        }
      ];

      const r = await callGemini(apiKey, { contents, generationConfig: { maxOutputTokens: 1800, temperature: 0.4 } });
      if (r.error) return res.status(500).json({ error: r.error.message || JSON.stringify(r.error) });
      const text = r.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return res.status(200).json({ content: [{ text }] });
    }

    // ── LEAK ──────────────────────────────────────────
    if (mode === 'leak') {
      const systemText = `你是醫院工務部門的 AI 漏水診斷師傅。根據工務人員回答的問卷，判斷最可能的漏水來源，以繁體中文輸出純 JSON（不加 markdown）：
{"source":"最可能的漏水來源（15字內）","probability":85,"reason":"判斷依據（2~3句話）","urgency":"緊急|注意|一般","steps":["立即處置步驟1","步驟2","步驟3","步驟4"],"escalate":false,"escalate_reason":"需聯絡廠商原因（可空字串）"}`;

      const contents = [
        { role: 'user', parts: [{ text: systemText }] },
        { role: 'model', parts: [{ text: '我是漏水診斷師傅，請提供問卷資料讓我分析。' }] },
        { role: 'user', parts: [{ text: prompt }] }
      ];

      const r = await callGemini(apiKey, { contents, generationConfig: { maxOutputTokens: 1000, temperature: 0.4 } });
      if (r.error) return res.status(500).json({ error: r.error.message || JSON.stringify(r.error) });
      const text = r.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return res.status(200).json({ content: [{ text }] });
    }

    return res.status(400).json({ error: '未知的 mode: ' + mode });

  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: '伺服器錯誤：' + err.message });
  }
};

async function callGemini(apiKey, body) {
  const resp = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return resp.json();
}
