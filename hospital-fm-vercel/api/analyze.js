// api/analyze.js
// Vercel Serverless Function — 代理 Anthropic API，保護 Key 不外露

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API Key 未設定，請聯絡管理員' });
  }

  try {
    const { image, mediaType, description, mode } = req.body;

    // Build messages based on mode
    let messages;
    let systemPrompt;

    if (mode === 'analyze') {
      // Image analysis mode
      systemPrompt = `你是醫院工務部門的 AI 維修助手。分析圖片中的設備異常，結合工務人員的文字描述，以繁體中文輸出純 JSON，格式嚴格如下，不可有任何前後文字：
{"issue":"問題名稱（簡短）","icon":"單一emoji","confidence":85,"solutions":[{"rank":1,"name":"方法名稱","difficulty":"簡易","minutes":20,"steps":["詳細步驟1","詳細步驟2","詳細步驟3","詳細步驟4"],"tools":"十字起子、扳手...","warning":"注意事項或空字串"}]}
solutions 必須提供 2 到 3 個方案，由最簡單排到最複雜。difficulty 只能是「簡易」「中等」「困難」三選一。`;

      const userText = description
        ? `請分析這張圖片中的設備異常狀況，並提供維修建議。\n\n工務人員補充描述：${description}`
        : '請分析這張圖片中的設備異常狀況，並提供維修建議。';

      messages = [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: image } },
          { type: 'text', text: userText }
        ]
      }];

    } else if (mode === 'leak') {
      // Leak diagnosis mode
      systemPrompt = `你是醫院工務部門的 AI 漏水診斷師傅。根據工務人員回答的問卷，判斷最可能的漏水來源，以繁體中文輸出純 JSON 如下（只輸出 JSON）：
{"source":"最可能的漏水來源（15字內）","probability":85,"reason":"判斷依據（2~3句話）","urgency":"緊急|注意|一般","steps":["立即處置步驟1","步驟2","步驟3","步驟4"],"escalate":false,"escalate_reason":"若需聯絡廠商或主管的原因（可空字串）"}`;

      messages = [{
        role: 'user',
        content: req.body.prompt
      }];

    } else if (mode === 'chat') {
      // Chat mode
      systemPrompt = '你是醫院工務部門的 AI 維修師傅。用繁體中文回答維修問題，回答簡潔實用，適合現場工務同仁快速參考。';
      messages = req.body.messages;

    } else {
      return res.status(400).json({ error: '未知的 mode' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: mode === 'chat' ? 800 : 1800,
        system: systemPrompt,
        messages
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error('Anthropic API error:', data.error);
      return res.status(500).json({ error: data.error.message });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ content: data.content });

  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: '伺服器錯誤，請稍後再試' });
  }
}
