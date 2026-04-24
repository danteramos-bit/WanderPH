'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPostIndex, setSelectedPostIndex] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');

  const router = useRouter();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.push('/auth/login');
      return;
    }

    setUser(session.user);

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    setProfile(profileData);

    const { data: posts } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    setMyPosts(posts || []);
    setLoading(false);
  };

  // 🔥 Hide / Unhide
  const toggleHidePost = async (postId: string, current: boolean) => {
    setActionLoading(true);

    await supabase
      .from('posts')
      .update({ is_hidden: !current })
      .eq('id', postId);

    setMyPosts(prev =>
      prev.map(p =>
        p.id === postId ? { ...p, is_hidden: !current } : p
      )
    );

    setMessage(!current ? 'Post hidden' : 'Post visible again');
    setActionLoading(false);
  };

  // 🔥 Delete
  const deletePost = async (postId: string) => {
    if (!confirm('Delete permanently?')) return;

    setActionLoading(true);

    await supabase.from('posts').delete().eq('id', postId);

    setMyPosts(prev => prev.filter(p => p.id !== postId));
    setSelectedPostIndex(null);

    setMessage('Post deleted');
    setActionLoading(false);
  };

  const shareProfile = async () => {
    try {
      await navigator.share({
        title: profile?.full_name,
        url: window.location.href
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      setMessage('Link copied!');
    }
  };

  const openPost = (i: number) => setSelectedPostIndex(i);
  const closeModal = () => setSelectedPostIndex(null);

  const currentPost = selectedPostIndex !== null ? myPosts[selectedPostIndex] : null;

  const getImageUrl = (img: any) => {
    if (!img) return null;
    if (Array.isArray(img)) return img[0];
    try {
      const parsed = JSON.parse(img);
      return Array.isArray(parsed) ? parsed[0] : parsed;
    } catch {
      return img;
    }
  };

  if (loading) return <div className="text-center py-20">Loading profile...</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white pt-8 pb-20">
      <div className="max-w-4xl mx-auto px-6">

        {/* MESSAGE */}
        {message && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-emerald-600 px-6 py-3 rounded-2xl z-50">
            {message}
          </div>
        )}

        {/* 🔥 PROFILE HEADER RESTORED */}
        <div className="bg-zinc-900 rounded-3xl p-10 mb-10">
          <div className="flex flex-col md:flex-row gap-8 items-center">

            <img
              src={profile?.avatar_url || 'https://via.placeholder.com/150'}
              className="w-36 h-36 rounded-full object-cover border-4 border-emerald-500"
            />

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold">
                {profile?.full_name || user?.email}
              </h1>

              <p className="text-white/60 mt-2">{profile?.bio}</p>
              <p className="text-white/40 text-sm mt-1">
                {profile?.nationality} • {profile?.date_of_birth}
              </p>

              {/* 🔥 BUTTONS BACK */}
              <div className="flex gap-4 mt-6 justify-center md:justify-start">
                <button className="bg-emerald-600 px-6 py-2 rounded-xl">Follow</button>
                <button onClick={shareProfile} className="bg-white/10 px-6 py-2 rounded-xl">Share</button>
                <button className="bg-white/10 px-6 py-2 rounded-xl">Message</button>
              </div>
            </div>
          </div>
        </div>

        {/* POSTS */}
        <h2 className="text-3xl font-bold mb-6">My Adventures</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {myPosts.map((post, i) => (
            <div
              key={post.id}
              onClick={() => openPost(i)}
              className={`rounded-3xl overflow-hidden cursor-pointer ${
                post.is_hidden ? 'opacity-40' : ''
              }`}
            >
              <img src={getImageUrl(post.image_urls)} className="w-full aspect-square object-cover" />
            </div>
          ))}
        </div>
      </div>

      {/* MODAL */}
      {/* MODAL */}
{selectedPostIndex !== null && currentPost && (
  <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center overflow-y-auto">

    <div className="bg-zinc-900 rounded-3xl max-w-3xl w-full my-10">

      {/* HEADER */}
      <div className="flex justify-between items-center p-6 border-b border-white/10 sticky top-0 bg-zinc-900 z-10">
        <button onClick={closeModal} className="text-xl">
          ← Back
        </button>

        <div className="flex gap-4">
          <button
            disabled={actionLoading}
            onClick={() =>
              toggleHidePost(currentPost.id, currentPost.is_hidden)
            }
            className="text-yellow-400"
          >
            {currentPost.is_hidden ? 'Unhide' : 'Hide'}
          </button>

          <button
            disabled={actionLoading}
            onClick={() => deletePost(currentPost.id)}
            className="text-red-500"
          >
            Delete
          </button>
        </div>
      </div>

      {/* IMAGE */}
      <img
        src={getImageUrl(currentPost.image_urls)}
        className="w-full max-h-[70vh] object-contain bg-black"
      />

      {/* CONTENT */}
      <div className="p-6">
        <p className="text-xl">{currentPost.caption}</p>
        <p className="text-emerald-400 mt-2">
          {currentPost.location} • ⭐ {currentPost.rating}/5
        </p>
      </div>

      {/* NAVIGATION */}
      <div className="flex justify-between p-6 border-t border-white/10">
        <button
          onClick={() =>
            setSelectedPostIndex(
              (selectedPostIndex - 1 + myPosts.length) % myPosts.length
            )
          }
          className="bg-white/10 px-6 py-2 rounded-xl hover:bg-white/20"
        >
          ← Previous
        </button>

        <button
          onClick={() =>
            setSelectedPostIndex(
              (selectedPostIndex + 1) % myPosts.length
            )
          }
          className="bg-white/10 px-6 py-2 rounded-xl hover:bg-white/20"
        >
          Next →
        </button>
      </div>

    </div>
  </div>
)}
    </div>
  );
}