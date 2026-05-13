const SYSTEM_PROMPT = `Eres un experto en logística de importación desde USA a Bolivia para la empresa "De USA con Andrés".
El usuario te dará un link de Amazon o eBay, o una imagen de un producto.

Tu tarea es analizar el producto y estimar con precisión:
1. El peso NETO del producto en kg
2. El peso de la caja individual del fabricante
3. El peso de la caja de envío de Amazon/eBay
4. Si incluye batería de litio o batería recargable
5. Dimensiones aproximadas con empaque en cm

Reglas logísticas:
- Producto pequeño: producto 0.05-0.15kg, caja fabricante 0.02-0.05kg, caja envío 0.08-0.15kg
- Producto mediano: producto 0.3-1kg, caja fabricante 0.1-0.3kg, caja envío 0.2-0.4kg
- Producto grande: producto 1-3kg, caja fabricante 0.3-0.8kg, caja envío 0.4-0.8kg
- Producto muy grande: producto 3-15kg, caja fabricante 0.8-2kg, caja envío 0.8-1.5kg

Responde SOLO con este JSON exacto, sin texto extra:
{
  "nombre": "nombre del producto en español",
  "descripcion": "descripción breve max 15 palabras",
  "precio_usd": 0.00,
  "peso_producto_kg": 0.000,
  "peso_caja_fabricante_kg": 0.000,
  "peso_caja_envio_kg": 0.000,
  "alto_cm": 0,
  "largo_cm": 0,
  "ancho_cm": 0,
  "incluye_bateria": false,
  "categoria": "Electrónico | Ropa | Calzado | Hogar | Juguete | Belleza | Deporte | Herramienta | Otro",
  "tamaño": "pequeño | mediano | grande | muy grande",
  "confianza": "alta | media | baja",
  "nota": "nota breve si hay incertidumbre, sino string vacío"
}`;

export async function POST(request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json({ error: "Falta configurar ANTHROPIC_API_KEY en variables de entorno." }, { status: 500 });
    }

    const { link, imageBase64, imageType } = await request.json();

    if (!link && !imageBase64) {
      return Response.json({ error: "Envía un link o una imagen del producto." }, { status: 400 });
    }

    let userContent;
    if (imageBase64) {
      userContent = [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: imageType || "image/jpeg",
            data: imageBase64,
          },
        },
        {
          type: "text",
          text: link ? `Link del producto: ${link}. Analiza imagen y link.` : "Analiza esta imagen del producto y cotízalo.",
        },
      ];
    } else {
      userContent = `Link del producto: ${link}`;
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json({ error: data?.error?.message || "Error de Anthropic" }, { status: response.status });
    }

    const fullText = (data.content || [])
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("");

    const jsonMatch = fullText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return Response.json({ error: "La IA no devolvió un JSON válido.", raw: fullText }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return Response.json(parsed);
  } catch (error) {
    return Response.json({ error: error.message || "Error inesperado" }, { status: 500 });
  }
}
