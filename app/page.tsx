'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-indigo-950 to-purple-950 text-white">
      <nav className="bg-black/40 backdrop-blur-md fixed w-full z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <h1 className="text-4xl font-bold tracking-tighter text-emerald-400">WanderPH</h1>
          
          <div className="flex items-center gap-8 text-lg">
            <Link href="/feed" className="hover:text-emerald-400 transition">Discover</Link>
            <Link href="#" className="hover:text-emerald-400 transition">Map</Link>
            <Link href="#" className="hover:text-emerald-400 transition">For Businesses</Link>
            
            <Link 
              href="/auth/login" 
              className="bg-white text-black px-8 py-3 rounded-full font-semibold hover:bg-white/90 transition"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      <div className="pt-32 pb-24 px-6 text-center max-w-5xl mx-auto">
        <h2 className="text-6xl md:text-7xl font-bold leading-tight mb-6">
          Share your Philippine<br />adventure stories
        </h2>
        <p className="text-2xl text-white/70 mb-10 max-w-2xl mx-auto">
          Real reviews, real photos, real experiences from tourists across Dinagat Islands and the entire Philippines.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/auth/register" 
            className="bg-emerald-500 hover:bg-emerald-600 text-white text-xl px-10 py-5 rounded-2xl font-semibold transition"
          >
            Join as a Tourist
          </Link>
          
          <Link 
            href="/auth/register?type=business" 
            className="border-2 border-white/60 hover:bg-white/10 text-xl px-10 py-5 rounded-2xl font-semibold transition"
          >
            List My Business
          </Link>
        </div>
      </div>
    </div>
  );
}