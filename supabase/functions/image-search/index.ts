import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

interface CardLite {
  id: string;
  title: string;
  description: string;
  category: string;
  cover_image?: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { imageBase64, mimeType, cards } = await req.json() as {
      imageBase64: string;
      mimeType: string;
      cards: CardLite[];
    };

    if (!imageBase64 || !Array.isArray(cards)) {
      return new Response(JSON.stringify({ error: "Parâmetros inválidos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY ausente" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build prompt content: query image + each candidate cover image with id
    const content: any[] = [
      {
        type: "text",
        text:
          "Você é um buscador visual. Veja a IMAGEM DO USUÁRIO (primeiro anexo: um print de erro/tela). " +
          "Em seguida temos N cards da base de conhecimento, cada um identificado por um ID e com sua imagem de capa e texto. " +
          "Compare visualmente e por contexto. Retorne APENAS um JSON: " +
          '{"matches":[{"id":"<uuid>","score":0-1,"reason":"curto"}]} ordenado por score desc. ' +
          "Inclua só cards com score >= 0.45. Se nenhum, retorne matches vazio.",
      },
      { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
    ];

    for (const c of cards) {
      content.push({
        type: "text",
        text: `Card id=${c.id} | Categoria=${c.category} | Título=${c.title} | Descrição=${(c.description || "").slice(0, 400)}`,
      });
      if (c.cover_image) {
        content.push({ type: "image_url", image_url: { url: c.cover_image } });
      }
    }

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content }],
        response_format: { type: "json_object" },
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      return new Response(JSON.stringify({ error: "AI Gateway error", detail: t }), {
        status: resp.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const raw = data.choices?.[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try {
      parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      parsed = { matches: [] };
    }

    return new Response(JSON.stringify({ matches: parsed.matches ?? [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
