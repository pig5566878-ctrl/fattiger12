// api/analyze.js
// Vercel Serverless Function — 使用 Google Gemini API（免費額度）

const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY 未設定，請聯絡管理員' });

  try {
    const { mode, image, mediaType, description, prompt, messages } = req.body;

    let systemInstruction = '';
    let parts = [];

    if (mode === 'analyze') {
      systemInstruction = `你是醫院工務部門的 AI 維修助手。分析圖片中的設備異常，結合工務人員的文字描述，以繁體中文輸出純 JSON，格式嚴格如下，不可有任何前後文字或 markdown：
{"issue":"問題名稱（簡短）","icon":"單一emoji","confidence":85,"solutions":[{"rank":1,"name":"方法名稱","difficulty":"簡易","minutes":20,"steps":["詳細步驟1","詳細步驟2","詳細步驟3","詳細步驟4"],"tools":"十字起子、扳手...","warning":"注意事項或空字串"}]}
solutions 必須提供 2 到 3 個方案，由最簡單排到最複雜。difficulty 只能是「簡易」「中等」「困難」三選一。`;

      const userText = description
        ? `請分析這張圖片中的設備異常狀況，並提供維修建議。\n\n工務人員補充描述：${description}`
        : '請分析這張圖片中的設備異常狀況，並提供維修建議。';

      parts = [
        { inline_data: { mime_type: mediaType || 'image/jpeg', data: image } },
        { text: userText }
      ];

    } else if (mode === 'leak') {
      systemInstruction = `你是醫院工務部門的 AI 漏水診斷師傅。根據工務人員回答的問卷，判斷最可能的漏水來源，以繁體中文輸出純 JSON（不加 markdown）：
{"source":"最可能的漏水來源（15字內）","probability":85,"reason":"判斷依據（2~3句話）","urgency":"緊急|注意|一般","steps":["立即處置步驟1","步驟2","步驟3","步驟4"],"escalate":false,"escalate_reason":"若需聯絡廠商或主管的原因（可空字串）"}`;

      parts = [{ text: prompt }];

    } else if (mode === 'chat') {
      systemInstruction = '你是醫院工務部門的 AI 維修師傅。用繁體中文回答維修問題，回答簡潔實用，適合現場工務同仁快速參考。';

      const contents = (messages || []).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const chatResp = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents,
          generationConfig: { maxOutputTokens: 800, temperature: 0.7 }
        })
      });
      const chatData = await chatResp.json();
      if (chatData.error) return res.status(500).json({ error: chatData.error.message });
      const text = chatData.candidates?.[0]?.content?.parts?.[0]?.text || '抱歉，無法取得回應。';
      return res.status(200).json({ content: [{ text }] });

    } else {
      return res.status(400).json({ error: '未知的 mode' });
    }

    // analyze / leak 模式
    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: 'user', parts }],
        generationConfig: { maxOutputTokens: 1800, temperature: 0.4 }
      })
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.status(200).json({ content: [{ text }] });

  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: '伺服器錯誤：' + err.message });
  }
}
