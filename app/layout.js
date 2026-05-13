export const metadata = {
  title: "Cotizador | De USA con Andrés",
  description: "Cotiza productos de Amazon o eBay para traerlos desde USA a Bolivia.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
