// Vercel serverless function — hides the Gemini API key on the server side.
// The browser calls POST /api/translate; the key is read from an environment
// variable (GEMINI_API_KEY) and is never sent to the client.
//
// Env vars (set in Vercel → Project → Settings → Environment Variables):
//   GEMINI_API_KEY  (required) — your Google AI Studio key
//   GEMINI_MODEL    (optional) — defaults to "gemini-flash-latest" (auto-tracks newest Flash)

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res
      .status(500)
      .json({ error: "サーバーにAPIキーが設定されていません（GEMINI_API_KEY）。" });
  }

  // Body may arrive parsed (Vercel) or as a raw string; handle both.
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const { text, from, to, tone } = body || {};

  if (!text || !String(text).trim()) {
    return res.status(400).json({ error: "翻訳するテキストが空です。" });
  }

  const fromLang = from === "English" ? "English" : "Japanese";
  const toLang = to === "Japanese" ? "Japanese" : "English";
  const toneInstruction =
    tone === "casual"
      ? "Use a relaxed, friendly, natural conversational register."
      : "Use a polished, professional, business-appropriate register. For Japanese output, use natural keigo suited to client and vendor correspondence.";

  const prompt = `You are a professional ${fromLang}-to-${toLang} translator for business correspondence.
Translate the text below from ${fromLang} into ${toLang}.
${toneInstruction}
Rules:
- Return ONLY the translated text. No quotes, notes, preamble, or romaji.
- Preserve line breaks. Keep proper nouns, product names, numbers/units unchanged.
- Sound natural to a native speaker, not literal.

Text:
${text}`;

  const model = process.env.GEMINI_MODEL || "gemini-flash-latest";
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    encodeURIComponent(model) +
    ":generateContent?key=" +
    encodeURIComponent(apiKey);

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
      }),
    });

    const data = await r.json();

    if (!r.ok) {
      const msg =
        (data && data.error && data.error.message) ||
        "翻訳APIの呼び出しに失敗しました。";
      return res.status(502).json({ error: msg });
    }

    const out =
      (data.candidates &&
        data.candidates[0] &&
        data.candidates[0].content &&
        data.candidates[0].content.parts &&
        data.candidates[0].content.parts
          .map((p) => p.text || "")
          .join("")
          .trim()) ||
      "";

    if (!out) {
      return res.status(502).json({ error: "翻訳結果が空でした。もう一度お試しください。" });
    }

    return res.status(200).json({ text: out });
  } catch (e) {
    return res.status(500).json({ error: "サーバーエラーが発生しました。" });
  }
}
