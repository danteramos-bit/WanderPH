'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-black/95 backdrop-blur-md sticky top-0 z-50 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="text-2xl sm:text-3xl font-bold tracking-tighter text-emerald-400">
          WanderPH
        </Link>

        <div className="flex flex-wrap items-center gap-3 text-base sm:text-lg font-medium justify-end">
          <Link href="/feed" className={`transition ${isActive('/feed') ? 'text-emerald-400 font-semibold' : 'text-white hover:text-emerald-400'}`}>Discover</Link>
          <Link href="/post" className={`transition ${isActive('/post') ? 'text-emerald-400 font-semibold' : 'text-white hover:text-emerald-400'}`}>+ Create Post</Link>
          <Link href="/map" className={`transition ${isActive('/map') ? 'text-emerald-400 font-semibold' : 'text-white hover:text-emerald-400'}`}>Map</Link>
          {user && (
            <Link href="/profile" className={`transition ${isActive('/profile') ? 'text-emerald-400 font-semibold' : 'text-white hover:text-emerald-400'}`}>
              Profile
            </Link>
          )}
          {user ? (
            <button onClick={handleLogout} className="text-white/80 hover:text-red-400 transition py-2 px-3 rounded-lg">Logout</button>
          ) : (
            <Link href="/auth/login" className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-full font-semibold transition">Sign In</Link>
          )}
        </div>
      </div>
    </nav>
  );
}