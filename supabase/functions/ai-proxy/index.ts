import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key, anthropic-version',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { provider, apiKey, prompt, imageBase64 } = await req.json()

    if (provider === 'claude') {
      const messages = []
      if (imageBase64) {
        messages.push({
          role: "user",
          content: [
            { type: "text", text: prompt },
            { 
              type: "image", 
              source: { 
                type: "base64", 
                media_type: "image/jpeg", 
                data: imageBase64
              } 
            }
          ]
        })
      } else {
        messages.push({ role: "user", content: prompt })
      }

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey.trim(),
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5",
          max_tokens: 2048,
          messages: messages,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        return new Response(JSON.stringify(data), { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      return new Response(JSON.stringify(data), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    if (provider === 'openai') {
      const messages = []
      if (imageBase64) {
        messages.push({
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
          ]
        })
      } else {
        messages.push({ role: "user", content: prompt })
      }

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: messages,
          temperature: 0.2,
          max_tokens: 2048,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        return new Response(JSON.stringify(data), { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      return new Response(JSON.stringify(data), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    return new Response(JSON.stringify({ error: 'Provider not supported' }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})
