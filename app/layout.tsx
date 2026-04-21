import type { Metadata } from 'next';
import './globals.css';
import Navbar from '../components/Navbar';
import { AuthProvider } from './providers';

export const metadata: Metadata = {
  title: 'WanderPH - Philippine Travel Stories',
  description: 'Share and discover real travel experiences across the Philippines',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}