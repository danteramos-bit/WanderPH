import type { Metadata } from 'next';
import '../globals.css';     // ← Correct path (only one dot pair)

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-950">
      {children}
    </div>
  );
}