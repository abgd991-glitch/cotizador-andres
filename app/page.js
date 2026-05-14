"use client";

import { useMemo, useState } from "react";
import "./style.css";

const SHIPPING_RATE_PER_KG = 45;
const MASTER_BOX_KG = 0.12;
const BATTERY_FEE = 10;
const WHATSAPP_URL = process.env.NEXT_PUBLIC_WHATSAPP_URL || "https://wa.me/message/MRKPA63RPESTI1";

const categoryEmoji = {
  "Electrónico": "💻",
  "Ropa": "👕",
  "Calzado": "👟",
  "Hogar": "🏠",
  "Juguete": "🧸",
  "Belleza": "💄",
  "Deporte": "⚽",
  "Herramienta": "🔧",
  "Otro": "📦",
};

function StarDivider() {
  return (
    <div className="star-divider">
      <div />
      <span>✦</span>
      <div />
    </div>
  );
}

export default function CotizadorAndres() {
  const [link, setLink] = useState("");
  const [precioManual, setPrecioManual] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const handleImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const cotizar = async () => {
    if (!link.trim() && !imageFile) {
      setError("Por favor pega un link de Amazon/eBay o sube una imagen del producto.");
      return;
    }

    setError("");
    setLoading(true);
    setResult(null);

    try {
     const payload = {
      link: link.trim(),
       precioManual: Number(precioManual || 0),
       };

      if (imageFile && imagePreview) {
        payload.imageBase64 = imagePreview.split(",")[1];
        payload.imageType = imageFile.type;
      }

      const response = await fetch("/api/cotizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo generar la cotización.");
      }

      setResult(data);
    } catch (err) {
      setError("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const quote = useMemo(() => {
    if (!result) return null;

    const pesoProducto = Number(result.peso_producto_kg || 0);
    const pesoCajaFab = Number(result.peso_caja_fabricante_kg || 0);
    const pesoCajaEnvio = Number(result.peso_caja_envio_kg || 0);
    const pesoFisico = +(pesoProducto + pesoCajaFab + pesoCajaEnvio + MASTER_BOX_KG).toFixed(3);

    const alto = Number(result.alto_cm || 0);
    const largo = Number(result.largo_cm || 0);
    const ancho = Number(result.ancho_cm || 0);
    const pesoVolumetrico = alto && largo && ancho ? +((alto * largo * ancho) / 5000).toFixed(3) : 0;
    const pesoFacturable = Math.max(pesoFisico, pesoVolumetrico);

   const precioProducto = Number(precioManual || result.precio_usd || 0);
const comisionCompra = +(precioProducto * 0.07).toFixed(2);

const costoEnvio = +(pesoFacturable * SHIPPING_RATE_PER_KG).toFixed(2);

const feeBateria = result.incluye_bateria ? BATTERY_FEE : 0;

const totalUSD = +(
  precioProducto +
  comisionCompra +
  costoEnvio +
  feeBateria
).toFixed(2);
    return {
      pesoProducto,
      pesoCajaFab,
      pesoCajaEnvio,
      pesoFisico,
      pesoVolumetrico,
      pesoFacturable,
      precioProducto,
      comisionCompra,
      costoEnvio,
      feeBateria,
      totalUSD,
    };
  }, [result]);

  const waHref = useMemo(() => {
    if (!result || !quote) return WHATSAPP_URL;

    const message = encodeURIComponent(
      `Hola Andrés! Quiero importar un producto desde USA a Bolivia:\n\n` +
        `📦 *${result.nombre}*\n` +
        `💵 Precio producto: $${quote.precioProducto.toFixed(2)} USD\n` +
        `⚖️ Peso facturable estimado: ${quote.pesoFacturable} kg\n` +
        `✈️ Flete estimado: $${quote.costoEnvio.toFixed(2)} USD\n` +
        `${quote.feeBateria ? `🔋 Fee batería: $${quote.feeBateria.toFixed(2)} USD\n` : ""}` +
        `💰 *TOTAL estimado: $${quote.totalUSD.toFixed(2)} USD*\n\n` +
        `¿Podemos coordinar mi pedido?`
    );

    return `${WHATSAPP_URL}?text=${message}`;
  }, [result, quote]);

  return (
    <main className="page-shell">
      <header className="hero">
        <div className="brand-row">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="url(#gPlane)" />
            <defs>
              <linearGradient id="gPlane" x1="0" y1="0" x2="24" y2="24">
                <stop offset="0%" stopColor="#f7c948" />
                <stop offset="100%" stopColor="#c9a84c" />
              </linearGradient>
            </defs>
          </svg>
          <div className="brand-text">
            <span className="silver">DE </span>
            <span className="gold-light">USA </span>
            <span className="with">con </span>
            <span className="gold">Andrés</span>
          </div>
        </div>
        <StarDivider />
        <p>Trae lo que quieras desde USA · Rápido · Seguro · Confiable</p>
      </header>

      <section className="card">
        <h1>Cotiza tu producto</h1>

        <label>🔗 Link de Amazon o eBay</label>
        <input
          type="url"
          placeholder="https://www.amazon.com/dp/..."
          value={link}
          onChange={(event) => setLink(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && cotizar()}
        />
          <label>💵 Precio del producto en USD</label>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Ej: 129.99"
            value={precioManual}
            onChange={(event) => setPrecioManual(event.target.value)}
         />

        <div className="or-line"><span />o también<span /></div>

        <label>📷 Sube una foto del producto</label>
        {!imagePreview ? (
          <label className="upload-box">
            <input type="file" accept="image/*" onChange={handleImage} />
            <strong>📸</strong>
            <small>Toca para subir imagen</small>
          </label>
        ) : (
          <div className="preview-box">
            <img src={imagePreview} alt="Producto seleccionado" />
            <button onClick={removeImage}>✕ Quitar</button>
          </div>
        )}

        {error && <p className="error-text">{error}</p>}

        <button className="primary-button" onClick={cotizar} disabled={loading}>
          {loading ? "⏳ Analizando producto..." : "✨ Obtener cotización gratis"}
        </button>
      </section>

      {result && quote && (
        <section className="card result-card">
          <div className="product-header">
            <span>{categoryEmoji[result.categoria] || "📦"}</span>
            <div>
              <h2>{result.nombre}</h2>
              <p>{result.descripcion}</p>
              <small>{result.tamaño} · confianza {result.confianza}</small>
            </div>
          </div>

          <StarDivider />

          <h3>⚖️ Desglose de peso</h3>
          <div className="quote-box">
            <Row label="📦 Producto" value={`${quote.pesoProducto.toFixed(3)} kg`} />
            <Row label="🏷️ Caja fabricante" value={`${quote.pesoCajaFab.toFixed(3)} kg`} />
            <Row label="📫 Caja Amazon/eBay" value={`${quote.pesoCajaEnvio.toFixed(3)} kg`} />
            <Row label="🗃️ Caja maestra" value={`${MASTER_BOX_KG.toFixed(3)} kg`} />
            <Row label="Peso físico" value={`${quote.pesoFisico} kg`} highlight />
            {quote.pesoVolumetrico > 0 && <Row label="Peso volumétrico" value={`${quote.pesoVolumetrico} kg`} />}
            <Row label="Peso facturable" value={`${quote.pesoFacturable} kg`} highlight />
          </div>

          <h3>💵 Desglose de costos</h3>
          <div className="quote-box">
            <Row label="Precio del producto" value={`$${quote.precioProducto.toFixed(2)}`} />
            <Row label="Impuesto 7%" value={`$${quote.comisionCompra.toFixed(2)}`} />
            <Row label={`Flete (${quote.pesoFacturable} kg × $45/kg)`} value={`$${quote.costoEnvio.toFixed(2)}`} />
            {quote.feeBateria > 0 && <Row label="Fee por batería" value={`$${quote.feeBateria.toFixed(2)}`} />}
            <div className="total-row">
              <span>TOTAL ESTIMADO</span>
              <strong>${quote.totalUSD.toFixed(2)} USD</strong>
            </div>
          </div>

          {result.nota && <p className="note">ℹ️ {result.nota}</p>}

          <a className="whatsapp-button" href={waHref} target="_blank" rel="noreferrer">
            Confirmar pedido con Andrés
          </a>

          <p className="legal">* Estimado referencial. El precio final puede variar según disponibilidad, peso real, aduanas y tipo de cambio vigente.</p>
        </section>
      )}

      {!result && !loading && (
        <section className="steps">
          <p>¿Cómo funciona?</p>
          <div>
            <Step number="1" icon="🔗" text="Pega el link de Amazon o eBay" />
            <Step number="2" icon="🤖" text="La IA analiza precio y peso" />
            <Step number="3" icon="💵" text="Ves el costo estimado" />
            <Step number="4" icon="📱" text="Coordinamos por WhatsApp" />
          </div>
        </section>
      )}

      <footer>
        <StarDivider />
        <p>© 2026 De USA con Andrés · Importaciones confiables</p>
      </footer>
    </main>
  );
}

function Row({ label, value, highlight = false }) {
  return (
    <div className={highlight ? "row highlight" : "row"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Step({ number, icon, text }) {
  return (
    <article>
      <b>{number}</b>
      <span>{icon}</span>
      <small>{text}</small>
    </article>
  );
}
