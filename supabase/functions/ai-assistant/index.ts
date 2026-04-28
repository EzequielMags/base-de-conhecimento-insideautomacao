import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();
    console.log("Mensagem recebida:", message);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: cards, error: cardsError } = await supabase
      .from('cards')
      .select('id, title, category, description, cover_image, images')
      .order('created_at', { ascending: false });

    if (cardsError) throw cardsError;

    const cardsContext = cards?.map((card) =>
      `ID: ${card.id}\nTítulo: ${card.title}\nCategoria: ${card.category}\nSolução: ${card.description}`
    ).join('\n\n') || 'Nenhum card encontrado.';

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Você é um assistente técnico que ajuda funcionários a encontrar soluções na base de conhecimento.

Cards disponíveis:

${cardsContext}

INSTRUÇÕES IMPORTANTES:
1. Entenda o problema do usuário.
2. Identifique até 4 cards mais relevantes (pode ser apenas 1 se for muito específico).
3. Escreva uma resposta curta e útil em texto explicando como esses cards ajudam.
4. NÃO liste os títulos dos cards no texto — eles aparecerão como mini-cards visuais.
5. NO FINAL da resposta, adicione SEMPRE uma linha exata no formato:
SUGGESTED_CARD_IDS: [id1, id2, id3]
(use os IDs exatos dos cards listados acima, separados por vírgula, dentro dos colchetes; se nenhum for relevante, use lista vazia [])

Seja direto, amigável e útil.`
          },
          {
            role: 'user',
            content: message
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro da API:', response.status, errorText);
      throw new Error(`Erro da API: ${response.status}`);
    }

    const data = await response.json();
    const fullText: string = data.choices[0].message.content || "";

    // Extrair IDs sugeridos
    const idsMatch = fullText.match(/SUGGESTED_CARD_IDS:\s*\[([^\]]*)\]/i);
    let suggestedIds: string[] = [];
    if (idsMatch) {
      suggestedIds = idsMatch[1]
        .split(',')
        .map((s) => s.trim().replace(/['"]/g, ''))
        .filter(Boolean);
    }
    const cleanText = fullText.replace(/SUGGESTED_CARD_IDS:\s*\[[^\]]*\]/i, '').trim();

    const suggestedCards = (cards || [])
      .filter((c) => suggestedIds.includes(c.id))
      .slice(0, 4)
      .map((c) => ({
        id: c.id,
        title: c.title,
        category: c.category,
        cover_image: c.cover_image || (Array.isArray(c.images) && c.images.length > 0 ? c.images[0] : null),
      }));

    return new Response(
      JSON.stringify({ response: cleanText, suggestedCards }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
