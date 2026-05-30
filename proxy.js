const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const CODEX_API_URL = 'https://codex.sale/v1/chat/completions';

app.post('/api/codex/chat', async (req, res) => {
  try {
    const { apiKey, model, messages, temperature, response_format } = req.body;
    console.log('Received request:', { model, messagesCount: messages?.length, temperature, response_format });

    if (!apiKey) {
      return res.status(400).json({ error: 'apiKey is required' });
    }

    console.log('Sending request to Codex API...');
    const response = await fetch(CODEX_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || 'gpt-5.4-mini',
        temperature: temperature || 0.35,
        response_format,
        messages
      })
    });

    console.log('Codex API response status:', response.status);
    const payload = await response.json();
    console.log('Codex API response:', JSON.stringify(payload, null, 2));

    if (!response.ok) {
      return res.status(response.status).json(payload);
    }
    res.json(payload);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Codex Sale proxy running on http://localhost:${PORT}`);
});
