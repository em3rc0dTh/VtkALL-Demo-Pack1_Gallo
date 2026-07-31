import { Providers } from './providers';
import './globals.css';

export const metadata = {
  title: 'Demo Test Laboratory',
  description: 'Experiencia publica neutral conectada al backend operativo y al runtime conversacional.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
