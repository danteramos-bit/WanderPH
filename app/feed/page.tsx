'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

interface Profile {
  full_name: string;
  avatar_url: string;
}

interface SessionUser {
  id: string;
}

interface Post {
  id: string;
  caption: string;
  location: string;
  image_urls: string | string[] | null;
  reactions: Record<string, number>;
  shares: number;
  created_at: string;
  profiles: Profile | null;
}

interface Comment {
  id: string;
  post_id: string;
  text: string;
  user_id: string;
  created_at: string;
  profiles: Profile | null;
}

export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<{ [key: string]: Comment[] }>({});
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [tapData, setTapData] = useState<Record<string, number>>({});
  const touchTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.push('/auth/login');
      return;
    }

    setUser(session.user as SessionUser);
    fetchAllData();
  };

  const fetchAllData = async () => {
    const { data: postsData } = await supabase
      .from('posts')
      .select(`*, profiles (full_name, avatar_url)`)
      .order('created_at', { ascending: false });

    setPosts((postsData as Post[]) || []);

    if (postsData?.length) {
      const postIds = postsData.map((p: Post) => p.id);

      const { data: commentsData } = await supabase
        .from('comments')
        .select(`*, profiles (full_name, avatar_url)`)
        .in('post_id', postIds)
        .order('created_at', { ascending: true });

      const map: { [key: string]: Comment[] } = {};
      (commentsData as Comment[] || []).forEach((c) => {
        if (!map[c.post_id]) map[c.post_id] = [];
        map[c.post_id].push(c);
      });

      setComments(map);
    }

    setLoading(false);
  };

  // 👍 REACTION (Optimized)
  const addReaction = async (postId: string, reaction: string) => {
    if (!user) return;

    const post = posts.find((p) => p.id === postId);
    const current = post?.reactions || {};

    const updated = {
      ...current,
      [reaction]: (current[reaction] || 0) + 1,
    };

    await supabase
      .from('posts')
      .update({ reactions: updated })
      .eq('id', postId);

    setPosts(prev =>
      prev.map(p =>
        p.id === postId ? { ...p, reactions: updated } : p
      )
    );

    setShowReactions(null);
  };

  // 💬 COMMENT (Optimized)
  const addComment = async (postId: string) => {
    if (!user) return;

    const text = commentText[postId]?.trim();
    if (!text) return;

    await supabase.from('comments').insert({
      post_id: postId,
      text,
      user_id: user.id,
    });

    setComments(prev => ({
      ...prev,
      [postId]: [
        ...(prev[postId] || []),
        {
          id: Math.random().toString(),
          post_id: postId,
          text,
          user_id: user.id,
          created_at: new Date().toISOString(),
          profiles: { full_name: 'You', avatar_url: '' }
        }
      ]
    }));

    setCommentText(prev => ({ ...prev, [postId]: '' }));
  };

  // 🔗 SHARE
  const sharePost = async (post: Post) => {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: post.caption,
          text: post.location,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        alert('Link copied!');
      }

      await supabase
        .from('posts')
        .update({ shares: (post.shares || 0) + 1 })
        .eq('id', post.id);

      setPosts(prev =>
        prev.map(p =>
          p.id === post.id
            ? { ...p, shares: (p.shares || 0) + 1 }
            : p
        )
      );

    } catch (err) {
      console.error(err);
    }
  };

  const getImageUrl = (imageUrls: string | string[] | null): string | null => {
    if (!imageUrls) return null;
    if (Array.isArray(imageUrls)) return imageUrls[0];

    try {
      const parsed = JSON.parse(imageUrls);
      return Array.isArray(parsed) ? parsed[0] : parsed;
    } catch {
      return imageUrls;
    }
  };

  const getTotalReactions = (reactions?: Record<string, number>) => {
    return Object.values(reactions || {}).reduce((a, b) => a + b, 0);
  };

  if (loading) {
    return <div className="text-center py-20 text-xl">Loading...</div>;
  }

  return (
    <div className="space-y-10 pb-24 max-w-5xl mx-auto px-2 sm:px-4">

      <h2 className="text-3xl sm:text-5xl font-bold text-center">
        Recent Adventures
      </h2>

      {posts.length === 0 && (
        <p className="text-center text-white/60 py-20">
          No adventures yet. Be the first to share!
        </p>
      )}

      {posts.map((post) => {
        const imageUrl = getImageUrl(post.image_urls);
        const reactions = post.reactions || {};
        const postComments = comments[post.id] || [];
        const userProfile = post.profiles;

        return (
          <div
            key={post.id}
            className="bg-zinc-900/95 border border-white/10 rounded-[2rem] shadow-xl overflow-hidden transition hover:-translate-y-1"
          >

            {/* HEADER */}
            <div className="flex items-center gap-3 p-4 border-b border-white/10">
              <img
                src={userProfile?.avatar_url || 'https://via.placeholder.com/150'}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold text-sm text-white/95 tracking-wide">
                  {userProfile?.full_name || 'User'}
                </p>
                <p className="text-xs text-white/60">📍 {post.location}</p>
              </div>
            </div>

            {/* IMAGE */}
            {imageUrl && (
              <img
                src={imageUrl}
                className="w-full h-64 sm:h-96 object-cover cursor-pointer"
                onClick={() =>
                  setShowReactions(showReactions === post.id ? null : post.id)
                }
              />
            )}

            <div className="p-5 sm:p-8">
              <p className="text-lg sm:text-2xl text-white/95 leading-relaxed">
                {post.caption}
              </p>

              {/* REACTIONS */}
              <div className="flex items-center gap-4 mt-4 relative">
                <button
                  onClick={() =>
                    setShowReactions(showReactions === post.id ? null : post.id)
                  }
                  className="text-2xl"
                >
                  👍
                </button>

                <span className="text-sm text-white/70">
                  {getTotalReactions(reactions)} reactions
                </span>

                {showReactions === post.id && (
                  <div className="absolute top-12 left-2 sm:left-0 bg-zinc-800 p-3 rounded-xl flex gap-3">
                    <button onClick={() => addReaction(post.id, '👍')}>👍</button>
                    <button onClick={() => addReaction(post.id, '❤️')}>❤️</button>
                    <button onClick={() => addReaction(post.id, '😲')}>😲</button>
                  </div>
                )}
              </div>

              {/* SHARE */}
              <div className="flex items-center gap-4 mt-4 text-sm">
                <button onClick={() => sharePost(post)}>🔗 Share</button>
                <span>{post.shares || 0} shares</span>
              </div>

              {/* COMMENTS */}
              <div className="mt-6">
                <p className="text-white/70 mb-2">
                  Comments ({postComments.length})
                </p>

                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {postComments.map((c, i) => (
                    <div key={i} className="bg-zinc-800 p-3 rounded-xl text-sm">
                      <p className="font-semibold text-emerald-400">
                        {c.profiles?.full_name || 'User'}
                      </p>
                      <p className="text-white/90 leading-relaxed">
                        {c.text}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 mt-3">
                  <input
                    value={commentText[post.id] || ''}
                    onChange={(e) =>
                      setCommentText(prev => ({
                        ...prev,
                        [post.id]: e.target.value,
                      }))
                    }
                    placeholder="Write a comment..."
                    className="flex-1 bg-zinc-800 px-3 py-2 rounded-xl text-white"
                  />
                  <button
                    onClick={() => addComment(post.id)}
                    className="bg-emerald-600 px-4 rounded-xl"
                  >
                    Send
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })}
    </div>
  );
}