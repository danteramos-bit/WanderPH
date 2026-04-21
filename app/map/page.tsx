'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

// ✅ Dynamic import with loading fallback
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-xl">
      Loading map component...
    </div>
  ),
});

export default function Map() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true; // ✅ prevent state update after unmount

    const fetchPosts = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (full_name, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (!isMounted) return;

      if (error) {
        console.error("MAP FETCH ERROR:", error.message);
        setError("Failed to load map data");
        setPosts([]);
      } else {
        console.log("MAP POSTS:", data); // 🔥 debug
        setPosts(data || []);
      }

      setLoading(false);
    };

    fetchPosts();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
        <p className="text-2xl">Loading interactive map...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-red-400 text-xl">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-6 pt-8">
        <h1 className="text-5xl font-bold mb-4 text-center">
          Explore the Philippines
        </h1>

        <p className="text-center text-white/60 mb-10">
          Discover real travel stories from travelers across the country
        </p>

        {/* ✅ Empty state */}
        {posts.length === 0 && (
          <p className="text-center text-white/50 mb-6">
            No locations available yet.
          </p>
        )}

        {/* ✅ Map container */}
        <div className="h-[82vh] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black">
          <MapComponent posts={posts} />
        </div>
      </div>
    </div>
  );
}