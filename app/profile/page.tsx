'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState<any>({});
  const [editingPost, setEditingPost] = useState<any>(null);

  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [isFollowing, setIsFollowing] = useState(false);
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
    setEditProfileData(profileData);

    const { data: posts } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    setMyPosts(posts || []);
    setLoading(false);
  };

  const parseImages = (img: any): string[] => {
    if (!img) return [];
    if (Array.isArray(img)) return img;
    try {
      const parsed = JSON.parse(img);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [img];
    }
  };

  const uploadAvatar = async (file: File) => {
    const fileName = `${Date.now()}-${file.name}`;
    await supabase.storage.from('avatars').upload(fileName, file);
    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);

    await supabase
      .from('profiles')
      .update({ avatar_url: data.publicUrl })
      .eq('id', user.id);

    setProfile((prev: any) => ({ ...prev, avatar_url: data.publicUrl }));
    setMessage('Profile updated!');
  };

  const saveProfile = async () => {
    await supabase
      .from('profiles')
      .update(editProfileData)
      .eq('id', user.id);

    setProfile(editProfileData);
    setIsEditingProfile(false);
    setMessage('Profile saved!');
  };

  const toggleFollow = async () => {
    if (!profile) return;

    if (isFollowing) {
      await supabase
        .from('followers')
        .delete()
        .match({ follower_id: user.id, following_id: profile.id });
      setIsFollowing(false);
    } else {
      await supabase
        .from('followers')
        .insert({ follower_id: user.id, following_id: profile.id });
      setIsFollowing(true);
    }
  };

  const shareProfile = async () => {
    try {
      await navigator.share({
        title: profile?.full_name,
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      setMessage('Link copied!');
    }
  };

  if (loading) return <div className="text-center py-20">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">

      {/* MESSAGE */}
      {message && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-emerald-600 px-6 py-3 rounded-xl z-50">
          {message}
        </div>
      )}

      {/* PROFILE HEADER */}
      <div className="bg-zinc-900 p-8 rounded-3xl mb-10">
        <div className="flex flex-col md:flex-row gap-6 items-center">

          <div>
            <img
              src={profile?.avatar_url || 'https://via.placeholder.com/150'}
              className="w-32 h-32 rounded-full object-cover"
            />
            <input
              type="file"
              onChange={(e) => e.target.files && uploadAvatar(e.target.files[0])}
              className="mt-3 text-sm"
            />
          </div>

          <div className="flex-1 text-center md:text-left">
            {isEditingProfile ? (
              <>
                <input
                  value={editProfileData.full_name}
                  onChange={(e) =>
                    setEditProfileData({ ...editProfileData, full_name: e.target.value })
                  }
                  className="bg-black p-2 rounded w-full"
                />

                <textarea
                  value={editProfileData.bio}
                  onChange={(e) =>
                    setEditProfileData({ ...editProfileData, bio: e.target.value })
                  }
                  className="bg-black p-2 rounded mt-2 w-full"
                />

                <button onClick={saveProfile} className="bg-emerald-600 px-4 py-2 mt-3 rounded">
                  Save
                </button>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold">{profile?.full_name}</h1>
                <p className="text-white/60">{profile?.bio}</p>

                <div className="flex gap-3 mt-4 flex-wrap">
                  <button onClick={() => setIsEditingProfile(true)} className="bg-white/10 px-4 py-2 rounded">
                    Edit Profile
                  </button>

                  <button onClick={toggleFollow} className="bg-emerald-600 px-4 py-2 rounded">
                    {isFollowing ? 'Unfollow' : 'Follow'}
                  </button>

                  <button onClick={shareProfile} className="bg-white/10 px-4 py-2 rounded">
                    Share
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* POSTS */}
      <h2 className="text-2xl mb-6">My Posts</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {myPosts.map(post => {
          const images = parseImages(post.image_urls);

          return (
            <div
              key={post.id}
              onClick={() => {
                setSelectedPost(post);
                setCurrentImageIndex(0);
              }}
              className="cursor-pointer rounded-xl overflow-hidden"
            >
              <img src={images[0]} className="w-full aspect-square object-cover" />
            </div>
          );
        })}
      </div>

      {/* FULLSCREEN POST VIEW */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black z-50">

          {(() => {
            const images = parseImages(selectedPost.image_urls);
            const isEditing = editingPost?.id === selectedPost.id;

            return (
              <div className="relative w-full h-full flex items-center justify-center">

                <img
                  src={images[currentImageIndex]}
                  className="w-full h-full max-h-screen object-contain"
                />

                {/* TOP */}
                <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent">

                  <button
                    onClick={() => {
                      setSelectedPost(null);
                      setEditingPost(null);
                    }}
                  >
                    ← Back
                  </button>

                  {!isEditing ? (
                    <>
                      <p className="text-lg font-semibold">{selectedPost.caption}</p>
                      <p className="text-emerald-400 text-sm">
                        {selectedPost.location} • ⭐ {selectedPost.rating}/5
                      </p>
                    </>
                  ) : (
                    <>
                      <textarea
                        value={editingPost.caption}
                        onChange={(e) =>
                          setEditingPost({ ...editingPost, caption: e.target.value })
                        }
                        className="w-full bg-black/70 p-2 rounded mb-2"
                      />

                      <input
                        value={editingPost.location}
                        onChange={(e) =>
                          setEditingPost({ ...editingPost, location: e.target.value })
                        }
                        className="w-full bg-black/70 p-2 rounded mb-2"
                      />

                      <input
                        type="number"
                        value={editingPost.rating}
                        onChange={(e) =>
                          setEditingPost({ ...editingPost, rating: Number(e.target.value) })
                        }
                        className="w-full bg-black/70 p-2 rounded"
                      />
                    </>
                  )}
                </div>

                {/* BOTTOM */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex gap-2 flex-wrap">

                  {!isEditing ? (
                    <>
                      <button onClick={() => setEditingPost(selectedPost)} className="bg-white/20 px-4 py-2 rounded">
                        Edit
                      </button>

                      <button
                        onClick={async () => {
                          await supabase
                            .from('posts')
                            .update({ is_hidden: !selectedPost.is_hidden })
                            .eq('id', selectedPost.id);

                          setSelectedPost({
                            ...selectedPost,
                            is_hidden: !selectedPost.is_hidden
                          });
                        }}
                        className="bg-yellow-500 px-4 py-2 rounded"
                      >
                        {selectedPost.is_hidden ? 'Unhide' : 'Hide'}
                      </button>

                      <button onClick={shareProfile} className="bg-blue-500 px-4 py-2 rounded">
                        Share
                      </button>

                      <button
                        onClick={async () => {
                          if (!confirm('Delete this post?')) return;

                          await supabase.from('posts').delete().eq('id', selectedPost.id);
                          setMyPosts(prev => prev.filter(p => p.id !== selectedPost.id));
                          setSelectedPost(null);
                        }}
                        className="bg-red-600 px-4 py-2 rounded"
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={async () => {
                          await supabase
                            .from('posts')
                            .update({
                              caption: editingPost.caption,
                              location: editingPost.location,
                              rating: editingPost.rating,
                            })
                            .eq('id', editingPost.id);

                          setMyPosts(prev =>
                            prev.map(p => (p.id === editingPost.id ? editingPost : p))
                          );

                          setSelectedPost(editingPost);
                          setEditingPost(null);
                        }}
                        className="bg-emerald-600 px-4 py-2 rounded"
                      >
                        Save
                      </button>

                      <button
                        onClick={() => setEditingPost(null)}
                        className="bg-white/20 px-4 py-2 rounded"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>

                {/* NAV */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setCurrentImageIndex(
                          (currentImageIndex - 1 + images.length) % images.length
                        )
                      }
                      className="absolute left-3 top-1/2 bg-black/50 px-3 py-1 rounded"
                    >
                      ←
                    </button>

                    <button
                      onClick={() =>
                        setCurrentImageIndex(
                          (currentImageIndex + 1) % images.length
                        )
                      }
                      className="absolute right-3 top-1/2 bg-black/50 px-3 py-1 rounded"
                    >
                      →
                    </button>
                  </>
                )}

              </div>
            );
          })()}
        </div>
      )}

    </div>
  );
}