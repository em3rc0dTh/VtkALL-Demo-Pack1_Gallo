import { Providers } from './providers';
import './globals.css';

export const metadata = {
  title: 'Demo Test Laboratory',
  description: 'Experiencia publica neutral conectada al backend operativo y al runtime conversacional.',
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
