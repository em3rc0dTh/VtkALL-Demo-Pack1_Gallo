import { AuthProvider } from '../hooks/useAuth.js';
import './globals.css';

export const metadata = {
  title: 'Sistema Inteligente para Talleres Mecánicos',
  description: 'Servicio mecánico integral asistido por inteligencia artificial. Agendá tu turno de forma automatizada las 24/7.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="scroll-smooth" suppressHydrationWarning>
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
