import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// RSS feeds about business, entrepreneurship, personal growth, current affairs
const RSS_FEEDS = [
  "https://news.google.com/rss/search?q=negocios+España+actualidad&hl=es&gl=ES&ceid=ES:es",
  "https://news.google.com/rss/search?q=emprender+pymes+España&hl=es&gl=ES&ceid=ES:es",
  "https://news.google.com/rss/search?q=crecimiento+personal+profesional&hl=es&gl=ES&ceid=ES:es",
  "https://news.google.com/rss/search?q=actualidad+empresarial+España&hl=es&gl=ES&ceid=ES:es",
  "https://news.google.com/rss/search?q=productividad+liderazgo+empresas&hl=es&gl=ES&ceid=ES:es",
  "https://news.google.com/rss/search?q=innovación+tecnología+empresas+2026&hl=es&gl=ES&ceid=ES:es",
];

// Trending topic templates connected with real search queries
const TRENDING_QUERIES = [
  "negocios España tendencias",
  "crecimiento personal profesional",
  "emprender España ayudas pymes",
  "actualidad empresarial novedades",
  "productividad hábitos éxito",
  "liderazgo gestión equipos",
  "inteligencia artificial negocios",
  "economía digital España",
  "marketing digital pymes",
  "finanzas personales emprendedores",
];

// Parse RSS XML to extract headlines
function parseRSSItems(xml: string): { title: string; description: string }[] {
  const items: { title: string; description: string }[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const content = match[1];
    const titleMatch = content.match(/<title><!\[CDATA\[(.*?)\]\]>|<title>(.*?)<\/title>/);
    const descMatch = content.match(/<description><!\[CDATA\[(.*?)\]\]>|<description>(.*?)<\/description>/);
    const title = titleMatch?.[1] || titleMatch?.[2] || "";
    const description = descMatch?.[1] || descMatch?.[2] || "";
    if (title) items.push({ title, description });
  }
  return items.slice(0, 5); // top 5 per feed
}

// Fetch trending context from RSS feeds
async function fetchTrendingContext(): Promise<string> {
  const headlines: string[] = [];
  
  // Fetch RSS feeds in parallel with timeout
  const feedPromises = RSS_FEEDS.map(async (url) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const resp = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!resp.ok) return [];
      const xml = await resp.text();
      return parseRSSItems(xml);
    } catch {
      return [];
    }
  });

  const results = await Promise.allSettled(feedPromises);
  for (const result of results) {
    if (result.status === "fulfilled") {
      for (const item of result.value) {
        headlines.push(`- ${item.title}`);
      }
    }
  }

  // Also fetch Google Trends suggestions via autocomplete
  const trendingTopics: string[] = [];
  const query = TRENDING_QUERIES[Math.floor(Math.random() * TRENDING_QUERIES.length)];
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const trendResp = await fetch(
      `https://suggestqueries.google.com/complete/search?output=toolbar&hl=es&q=${encodeURIComponent(query)}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);
    if (trendResp.ok) {
      const trendXml = await trendResp.text();
      const suggestionRegex = /data="([^"]+)"/g;
      let m;
      while ((m = suggestionRegex.exec(trendXml)) !== null) {
        trendingTopics.push(m[1]);
      }
    }
  } catch {
    // Ignore errors
  }

  let context = "";
  if (headlines.length > 0) {
    context += "NOTICIAS ACTUALES RELEVANTES:\n" + headlines.slice(0, 15).join("\n") + "\n\n";
  }
  if (trendingTopics.length > 0) {
    context += "BÚSQUEDAS TRENDING EN GOOGLE:\n" + trendingTopics.map(t => `- ${t}`).join("\n") + "\n\n";
  }
  
  return context || "No se pudieron obtener tendencias actuales. Genera contenido basado en temas evergreen de coworking y emprendimiento en Alicante.";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check settings
    const { data: settings } = await supabase.from("blog_settings").select("setting_key, setting_value");
    const settingsMap: Record<string, string> = {};
    (settings || []).forEach((s: any) => { settingsMap[s.setting_key] = s.setting_value; });

    const autoPublishEnabled = settingsMap["auto_publish_enabled"] !== "false";
    const reviewMode = settingsMap["review_mode"] === "true";

    if (!autoPublishEnabled) {
      return new Response(JSON.stringify({ message: "Auto-publish disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if 5 days have passed since last auto-generated article
    const { data: lastArticle } = await supabase
      .from("blog_articles")
      .select("created_at")
      .eq("is_auto_generated", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (lastArticle) {
      const lastDate = new Date(lastArticle.created_at);
      const now = new Date();
      const daysSinceLast = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLast < 5) {
        return new Response(JSON.stringify({ message: `Only ${daysSinceLast.toFixed(1)} days since last article. Next in ${(5 - daysSinceLast).toFixed(1)} days.` }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Fetch existing slugs to avoid duplicates
    const { data: existingSlugs } = await supabase
      .from("blog_articles")
      .select("slug")
      .order("created_at", { ascending: false })
      .limit(100);
    const slugSet = new Set((existingSlugs || []).map((a: any) => a.slug));

    // Fetch trending context from RSS + Google suggestions
    console.log("Fetching trending context...");
    const trendingContext = await fetchTrendingContext();
    console.log("Trending context fetched, length:", trendingContext.length);

    // Fetch categories
    const { data: categories } = await supabase.from("blog_categories").select("id, name, slug");
    const categoryList = (categories || []).map((c: any) => `${c.name} (id: ${c.id})`).join(", ");

    // Existing article titles to avoid repetition
    const { data: recentArticles } = await supabase
      .from("blog_articles")
      .select("title")
      .order("created_at", { ascending: false })
      .limit(50);
    const recentTitles = (recentArticles || []).map((a: any) => a.title).join("\n- ");

    // Generate article with AI using trending context
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Eres un periodista experto en negocios, actualidad empresarial, crecimiento personal y emprendimiento. Escribes artículos SEO para el blog de COALTE Coworking (coaltecoworking.lovable.app), un espacio de coworking premium en Alicante.

TEMÁTICAS PERMITIDAS (alterna entre ellas):
- Negocios y actualidad empresarial
- Crecimiento personal y desarrollo profesional
- Emprendimiento y pymes
- Productividad y liderazgo
- Innovación y tecnología aplicada a negocios
- Marketing digital y estrategia empresarial
- Finanzas personales para emprendedores

INSTRUCCIONES:
- Escribe un artículo 100% ORIGINAL entre 500-900 palabras
- NO copies noticias literalmente. Reescribe, amplía y aporta contexto propio
- Usa formato Markdown con subtítulos H2 (##) y H3 (###)
- Incluye una conclusión clara al final
- Menciona naturalmente a COALTE Coworking como referencia local cuando sea relevante
- Tono profesional pero cercano, en español
- Conecta el contenido con la actualidad basándote en las tendencias proporcionadas
- El artículo debe aportar valor real e información útil
- IMPORTANTE: Elige un tema COMPLETAMENTE DIFERENTE a los artículos recientes

ENLACES INTERNOS (incluye al menos 2 de estos en el texto de forma natural):
- [sala de reuniones](/sala-reuniones)
- [nuestros servicios](/servicios)
- [conoce nuestro espacio](/espacio)
- [contáctanos](/contacto)
- [más artículos del blog](/blog)

ARTÍCULOS RECIENTES (NO repitas NINGUNO de estos temas ni enfoques similares):
- ${recentTitles}

PALABRAS CLAVE SEO PRINCIPALES:
coworking en Alicante, negocios, emprender, crecimiento personal, productividad, liderazgo, oficina flexible, innovación empresarial`
          },
          {
            role: "user",
            content: `Basándote en las siguientes tendencias y noticias actuales, escribe un artículo original y relevante:\n\n${trendingContext}\n\nElige el tema más interesante y actual. El artículo debe ser útil para profesionales, emprendedores y personas interesadas en crecimiento personal y negocios.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_article",
              description: "Create a structured blog article based on trending topics",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "SEO-optimized title, max 70 chars, engaging and click-worthy" },
                  slug: { type: "string", description: "URL slug, lowercase, hyphens only, no accents, no special chars" },
                  excerpt: { type: "string", description: "Compelling summary, max 160 chars" },
                  content: { type: "string", description: "Full article in Markdown (500-900 words) with ## and ### headings, internal links, and conclusion" },
                  meta_description: { type: "string", description: "SEO meta description, max 155 chars, include main keyword" },
                  keywords: { type: "array", items: { type: "string" }, description: "5-8 relevant SEO keywords in Spanish" },
                  category_id: { type: "string", description: `Best matching category ID from: ${categoryList}` },
                  image_alt: { type: "string", description: "Descriptive SEO alt text for featured image, in Spanish" },
                  image_prompt: { type: "string", description: "English prompt for generating a professional blog header image that represents the article topic. Should be photorealistic, modern, and professional." }
                },
                required: ["title", "slug", "excerpt", "content", "meta_description", "keywords", "image_alt", "image_prompt"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "create_article" } }
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, add credits" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const article = JSON.parse(toolCall.function.arguments);

    // Ensure unique slug
    let finalSlug = article.slug;
    if (slugSet.has(finalSlug)) {
      finalSlug = `${finalSlug}-${Date.now().toString(36)}`;
    }

    // Generate featured image using AI
    let featuredImageUrl = "";
    try {
      console.log("Generating featured image...");
      const imgResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-image-preview",
          messages: [
            {
              role: "user",
              content: article.image_prompt || `Generate a professional, modern blog header image about ${article.title}. Clean corporate style with warm Mediterranean tones. No text in the image. Photorealistic.`
            }
          ],
          modalities: ["image", "text"]
        }),
      });

      if (imgResponse.ok) {
        const imgData = await imgResponse.json();
        const imageBase64 = imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        if (imageBase64) {
          const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
          const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          const fileName = `blog/${finalSlug}-${Date.now()}.png`;

          const { error: uploadError } = await supabase.storage
            .from("invoices")
            .upload(fileName, binaryData, { contentType: "image/png", upsert: true });

          if (!uploadError) {
            const { data: publicUrl } = supabase.storage.from("invoices").getPublicUrl(fileName);
            featuredImageUrl = publicUrl.publicUrl;
            console.log("Image uploaded:", featuredImageUrl);
          } else {
            console.error("Image upload error:", uploadError);
          }
        }
      }
    } catch (imgErr) {
      console.error("Image generation failed:", imgErr);
    }

    // Determine status
    const status = reviewMode ? "draft" : "published";
    const reviewStatus = reviewMode ? "pending" : "approved";

    // Random initial views between 150-250 to avoid starting at 0
    const initialViews = Math.floor(Math.random() * 101) + 150;

    // Insert article
    const { data: inserted, error: insertError } = await supabase
      .from("blog_articles")
      .insert({
        title: article.title,
        slug: finalSlug,
        excerpt: article.excerpt,
        content: article.content,
        meta_description: article.meta_description,
        keywords: article.keywords,
        category_id: article.category_id || null,
        featured_image: featuredImageUrl,
        image_alt: article.image_alt,
        author_name: "COALTE Coworking",
        status,
        is_auto_generated: true,
        review_status: reviewStatus,
        published_at: status === "published" ? new Date().toISOString() : null,
        views_count: initialViews,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    console.log("Article created:", inserted.title);

    return new Response(JSON.stringify({ success: true, article: inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error generating article:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
