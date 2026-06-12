import { AuthProvider } from '../hooks/useAuth.js';
import './globals.css';

export async function generateMetadata() {
  try {
    const res = await fetch('http://localhost:4000/api/configuracion', {
      next: { revalidate: 10 } // Revalidar cada 10 segundos
    });
    if (res.ok) {
      const config = await res.json();
      return {
        title: `${config.nombre_taller || 'Bate y Late'} — Pastelería Creativa`,
        description: `${config.slogan || 'Endulzamos con amor'}. Cotiza y agenda tu pedido 24/7.`,
      };
    }
  } catch (error) {
    // Silently fallback if API is offline
  }

  return {
    title: 'Turagua — Servicio Automotriz',
    description: 'Mantenimiento y reparación garantizada para tu vehículo. Agenda tu cita 24/7.',
  };
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const color = localStorage.getItem('tema-color');
                if (color) {
                  document.documentElement.style.setProperty('--primary', color);
                  const hoverColors = {
                    '#ff8da1': '#ff748e',
                    '#00aeef': '#008fcc',
                    '#ef4444': '#dc2626',
                    '#10b981': '#059669',
                    '#f97316': '#ea580c',
                    '#8b5cf6': '#7c3aed'
                  };
                  const hoverVal = hoverColors[color] || color;
                  document.documentElement.style.setProperty('--primary-hover', hoverVal);
                  document.documentElement.style.setProperty('--color-primary', color);
                }
                const colorSecundario = localStorage.getItem('tema-color-secundario');
                if (colorSecundario) {
                  document.documentElement.style.setProperty('--secondary', colorSecundario);
                  document.documentElement.style.setProperty('--color-secondary', colorSecundario);
                  document.documentElement.style.setProperty('--cyan', colorSecundario);
                  document.documentElement.style.setProperty('--yellow', colorSecundario);
                }
                const colorFondo = localStorage.getItem('tema-color-fondo');
                if (colorFondo) {
                  document.documentElement.style.setProperty('--dark-bg', colorFondo);
                  document.documentElement.style.setProperty('--lavender', colorFondo);
                }
              } catch (e) {}
            `
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
