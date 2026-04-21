'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  // Modal state
  const [selectedPostIndex, setSelectedPostIndex] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    date_of_birth: '',
    nationality: '',
  });

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
    setFormData({
      full_name: profileData?.full_name || '',
      bio: profileData?.bio || '',
      date_of_birth: profileData?.date_of_birth || '',
      nationality: profileData?.nationality || '',
    });

    const { data: posts } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    setMyPosts(posts || []);
    setLoading(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploading(true);

    const file = e.target.files[0];
    const fileName = `${user.id}-${Date.now()}`;

    const { error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });

    if (!error) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', user.id);
    }

    setUploading(false);
    loadProfile();
  };

  const handleProfileUpdate = async () => {
    await supabase
      .from('profiles')
      .update({
        full_name: formData.full_name,
        bio: formData.bio,
        date_of_birth: formData.date_of_birth || null,
        nationality: formData.nationality,
      })
      .eq('id', user.id);

    setIsEditing(false);
    setMessage('Profile updated successfully!');
    loadProfile();
  };

  const shareProfile = async () => {
    try {
      await navigator.share({
        title: `${profile?.full_name || 'User'} on WanderPH`,
        text: 'Check out my travel adventures!',
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      setMessage('Profile link copied!');
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm('Delete this post?')) return;

    await supabase.from('posts').delete().eq('id', postId);
    setMyPosts(myPosts.filter(p => p.id !== postId));
    setSelectedPostIndex(null);
    setMessage('Post deleted');
  };

  const openPost = (index: number) => {
    setSelectedPostIndex(index);
  };

  const closeModal = () => {
    setSelectedPostIndex(null);
  };

  const nextPost = () => {
    if (selectedPostIndex === null) return;
    setSelectedPostIndex((selectedPostIndex + 1) % myPosts.length);
  };

  const prevPost = () => {
    if (selectedPostIndex === null) return;
    setSelectedPostIndex((selectedPostIndex - 1 + myPosts.length) % myPosts.length);
  };

  if (loading) return <div className="text-center py-20">Loading profile...</div>;

  const currentPost = selectedPostIndex !== null ? myPosts[selectedPostIndex] : null;
  const currentImageUrl = currentPost && (typeof currentPost.image_urls === 'string' 
    ? JSON.parse(currentPost.image_urls)[0] 
    : currentPost.image_urls?.[0]);

  return (
    <div className="min-h-screen bg-gray-950 text-white pt-8 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        {message && <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-emerald-600 px-6 py-3 rounded-2xl z-50">{message}</div>}

        {/* Profile Header */}
        <div className="bg-zinc-900 rounded-3xl p-10 mb-10">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="relative">
              <img src={profile?.avatar_url || 'https://via.placeholder.com/150'} alt="Profile" className="w-36 h-36 rounded-full object-cover border-4 border-emerald-500" />
              <label className="absolute bottom-2 right-2 bg-black/70 p-3 rounded-full cursor-pointer hover:bg-black">
                📷
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>

            <div className="flex-1 text-center md:text-left">
              {isEditing ? (
                <input type="text" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} className="text-4xl font-bold bg-transparent border-b border-white/30 w-full focus:outline-none" />
              ) : (
                <h1 className="text-4xl font-bold">{profile?.full_name || user?.email}</h1>
              )}

              <p className="text-white/60 mt-1">{user?.email}</p>

              <div className="flex justify-center md:justify-start gap-8 mt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold">{myPosts.length}</p>
                  <p className="text-sm text-white/60">Posts</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">{followersCount}</p>
                  <p className="text-sm text-white/60">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">{followingCount}</p>
                  <p className="text-sm text-white/60">Following</p>
                </div>
              </div>

              <div className="flex gap-4 mt-8 justify-center md:justify-start">
                <button onClick={isEditing ? handleProfileUpdate : () => setIsEditing(true)} className="bg-emerald-600 hover:bg-emerald-700 px-8 py-3 rounded-2xl font-medium">
                  {isEditing ? 'Save Changes' : 'Edit Profile'}
                </button>
                {isEditing && <button onClick={() => setIsEditing(false)} className="px-8 py-3 rounded-2xl border border-white/30">Cancel</button>}
                <button onClick={shareProfile} className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-2xl text-sm flex items-center gap-2">🔗 Share Profile</button>
              </div>
            </div>
          </div>
        </div>

        {/* My Posts Grid - Clickable */}
        <h2 className="text-3xl font-bold mb-6">My Adventures ({myPosts.length})</h2>

        {myPosts.length === 0 ? (
          <p className="text-white/60 text-center py-10">You haven't shared any adventures yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {myPosts.map((post, index) => {
              const imageUrl = post.image_urls && (typeof post.image_urls === 'string' 
                ? JSON.parse(post.image_urls)[0] 
                : post.image_urls[0]);

              return (
                <div 
                  key={post.id} 
                  onClick={() => openPost(index)}
                  className="bg-zinc-900 rounded-3xl overflow-hidden group relative cursor-pointer hover:scale-105 transition-transform"
                >
                  {imageUrl && (
                    <img src={imageUrl} alt={post.caption} className="w-full aspect-square object-cover" />
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 p-4">
                    <p className="text-sm line-clamp-2">{post.caption}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Full Screen Post Modal */}
      {selectedPostIndex !== null && currentPost && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <div className="max-w-3xl w-full bg-zinc-900 rounded-3xl overflow-hidden relative">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <button onClick={closeModal} className="text-2xl">← Back</button>
              <button onClick={() => deletePost(currentPost.id)} className="text-red-500 hover:text-red-400">Delete</button>
            </div>

            {/* Image */}
            {currentImageUrl && (
              <img src={currentImageUrl} alt={currentPost.caption} className="w-full max-h-[70vh] object-contain bg-black" />
            )}

            {/* Content */}
            <div className="p-8">
              <p className="text-2xl font-medium">{currentPost.caption}</p>
              <p className="text-emerald-400 mt-2">{currentPost.location} • ⭐ {currentPost.rating}/5</p>
            </div>

            {/* Navigation */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-6">
              <button onClick={prevPost} className="bg-black/70 hover:bg-black px-6 py-3 rounded-full text-xl">← Previous</button>
              <button onClick={nextPost} className="bg-black/70 hover:bg-black px-6 py-3 rounded-full text-xl">Next →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}