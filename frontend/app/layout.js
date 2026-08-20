import { Providers } from './providers';
import './globals.css';

export const metadata = {
  title: 'Gallo Autos | Taller Automotriz en La Molina',
  description: 'Gallo Autos Workshop: diagnóstico, mantenimiento, mecánica, frenos, suspensión, pintura y cuidado automotriz en La Molina.',
};

export default function RootLayout({ children }) {
  const buildSha = process.env.NEXT_PUBLIC_APP_BUILD_SHA || 'local';
  return (
    <html lang="es" className="scroll-smooth" data-app-build-sha={buildSha}>
      <body className="antialiased" data-app-build-sha={buildSha}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
