'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function Feed() {
  const [posts, setPosts] = useState<any[]>([]);
  const [comments, setComments] = useState<{ [key: string]: any[] }>({});
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [postingComment, setPostingComment] = useState<string | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);

    // ✅ Fetch posts with error handling
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select(`
        *,
        profiles (full_name, avatar_url)
      `)
      .order('created_at', { ascending: false });

    if (postsError) {
      console.error("POST FETCH ERROR:", postsError.message);
      setPosts([]);
      setLoading(false);
      return;
    }

    setPosts(postsData || []);

    // ✅ Fetch comments
    if (postsData && postsData.length > 0) {
      const postIds = postsData.map((p: any) => p.id);

      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .in('post_id', postIds)
        .order('created_at', { ascending: true });

      if (commentsError) {
        console.error("COMMENTS ERROR:", commentsError.message);
      }

      const map: { [key: string]: any[] } = {};
      (commentsData || []).forEach((c: any) => {
        if (!map[c.post_id]) map[c.post_id] = [];
        map[c.post_id].push(c);
      });

      setComments(map);
    }

    setLoading(false);
  };

  const addComment = async (postId: string) => {
    const text = commentText[postId]?.trim();
    if (!text) return;

    setPostingComment(postId);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert("Please log in");
      setPostingComment(null);
      return;
    }

    const { error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        text,
        user_id: session.user.id
      });

    if (error) {
      console.error("COMMENT ERROR:", error.message);
      alert("Failed to post comment");
      setPostingComment(null);
      return;
    }

    // ✅ Optimistic UI update (no full refetch needed)
    setComments(prev => ({
      ...prev,
      [postId]: [
        ...(prev[postId] || []),
        { text }
      ]
    }));

    setCommentText(prev => ({ ...prev, [postId]: '' }));
    setPostingComment(null);
  };

  // ✅ Improved image handler
  const getImageUrl = (imageUrls: any): string | null => {
    if (!imageUrls) return null;

    if (Array.isArray(imageUrls)) return imageUrls[0];

    if (typeof imageUrls === 'string') {
      try {
        const parsed = JSON.parse(imageUrls);
        return Array.isArray(parsed) ? parsed[0] : imageUrls;
      } catch {
        return imageUrls;
      }
    }

    return null;
  };

  if (loading) {
    return <div className="text-center py-20 text-2xl">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white pt-8 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        <h2 className="text-5xl font-bold mb-12 text-center">
          Recent Adventures
        </h2>

        {/* ✅ Empty state */}
        {posts.length === 0 && (
          <p className="text-center text-white/50">No posts yet.</p>
        )}

        <div className="space-y-12">
          {posts.map((post: any) => {
            const imageUrl = getImageUrl(post.image_urls);
            const postComments = comments[post.id] || [];

            return (
              <div key={post.id} className="bg-zinc-900 rounded-3xl overflow-hidden">

                {/* HEADER */}
                <div className="p-6 flex items-center justify-between border-b border-white/10">
                  <div className="flex items-center gap-4">
                    <img
                      src={post.profiles?.avatar_url || 'https://via.placeholder.com/150'}
                      alt="User"
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold">
                        {post.profiles?.full_name || 'Unknown User'}
                      </p>
                      <p className="text-sm text-white/60">
                        {post.location}
                      </p>
                    </div>
                  </div>
                </div>

                {/* IMAGE */}
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt="Travel"
                    className="w-full h-96 object-cover"
                    onError={(e) => {
                      console.error("IMAGE FAILED:", imageUrl);
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}

                {/* CONTENT */}
                <div className="p-8">
                  <p className="text-2xl font-medium">{post.caption}</p>
                  <p className="text-yellow-400 text-3xl mt-4">
                    ⭐ {post.rating}/5
                  </p>

                  {/* COMMENTS */}
                  <div className="mt-8">
                    <p className="text-white/70 mb-4">
                      Comments ({postComments.length})
                    </p>

                    <div className="space-y-4 mb-6 max-h-80 overflow-y-auto">
                      {postComments.length === 0 ? (
                        <p className="text-white/50 text-center py-8">
                          No comments yet.
                        </p>
                      ) : (
                        postComments.map((c: any, i: number) => (
                          <div key={i} className="bg-zinc-800 rounded-2xl p-5">
                            <p className="text-white">{c.text}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* INPUT */}
                    <div className="flex gap-3">
                      <input
                        value={commentText[post.id] || ''}
                        onChange={(e) =>
                          setCommentText(prev => ({
                            ...prev,
                            [post.id]: e.target.value
                          }))
                        }
                        placeholder="Write a comment..."
                        className="flex-1 bg-zinc-800 px-5 py-4 rounded-2xl"
                        onKeyDown={(e) =>
                          e.key === 'Enter' && addComment(post.id)
                        }
                      />

                      <button
                        onClick={() => addComment(post.id)}
                        disabled={postingComment === post.id}
                        className="bg-emerald-600 px-10 rounded-2xl disabled:opacity-50"
                      >
                        {postingComment === post.id ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}