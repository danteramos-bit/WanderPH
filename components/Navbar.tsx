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
      <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
        <Link href="/" className="text-3xl font-bold tracking-tighter text-emerald-400">
          WanderPH
        </Link>

        <div className="flex items-center gap-8 text-lg font-medium">
          <Link href="/feed" className={`transition ${isActive('/feed') ? 'text-emerald-400 font-semibold' : 'text-white hover:text-emerald-400'}`}>Discover</Link>
          <Link href="/post" className={`transition ${isActive('/post') ? 'text-emerald-400 font-semibold' : 'text-white hover:text-emerald-400'}`}>+ Create Post</Link>
          <Link href="/map" className={`transition ${isActive('/map') ? 'text-emerald-400 font-semibold' : 'text-white hover:text-emerald-400'}`}>Map</Link>
          
          {user && (
            <Link href="/profile" className={`transition ${isActive('/profile') ? 'text-emerald-400 font-semibold' : 'text-white hover:text-emerald-400'}`}>
              Profile
            </Link>
          )}

          {user ? (
            <button onClick={handleLogout} className="text-white/80 hover:text-red-400 transition">Logout</button>
          ) : (
            <Link href="/auth/login" className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-full font-semibold transition">Sign In</Link>
          )}
        </div>
      </div>
    </nav>
  );
}