import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });
  }

  try {
    const { user_email, user_name, type, message } = await req.json();
    const timestamp = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "SlicerAI <onboarding@resend.dev>",
        to: "lula1973@gmail.com",
        subject: `[SlicerAI] Nova solicitação de acesso — ${user_email}`,
        html: `
          <h2>Solicitação de acesso — SlicerAI</h2>
          <p><strong>Usuário:</strong> ${user_name} (${user_email})</p>
          <p><strong>Tipo:</strong> ${type === 'renewal' ? 'Renovação' : 'Novo acesso'}</p>
          <p><strong>Mensagem:</strong> ${message || 'Sem mensagem'}</p>
          <p><strong>Data:</strong> ${timestamp}</p>
          <hr/>
          <p>Acesse o painel admin do SlicerAI para aprovar ou negar.</p>
        `,
      }),
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      status: res.status,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      status: 500,
    });
  }
});