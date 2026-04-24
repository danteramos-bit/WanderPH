import type { Metadata } from 'next';
import './globals.css';
import Navbar from '../components/Navbar';
import { AuthProvider } from './providers';

export const metadata: Metadata = {
  title: 'WanderPH - Philippine Travel Stories',
  description: 'Share and discover real travel experiences across the Philippines',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white antialiased">

        <AuthProvider>

          {/* NAVBAR (fixed support) */}
          <div className="sticky top-0 z-50">
            <Navbar />
          </div>

          {/* MAIN CONTENT */}
          <main className="pt-20 px-3 sm:px-6 max-w-7xl mx-auto">
            {children}
          </main>

        </AuthProvider>

      </body>
    </html>
  );
}