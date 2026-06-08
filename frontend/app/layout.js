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
    title: 'Bate y Late — Pastelería Creativa',
    description: 'Tortas personalizadas y postres deliciosos para cada ocasión. Cotiza y agenda de forma automatizada 24/7.',
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
