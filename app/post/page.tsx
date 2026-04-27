'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

const popularPlaces = [
  "Dinagat Islands", "Siargao", "Boracay", "El Nido", "Coron", "Palawan",
  "Cebu", "Bohol", "Davao", "Manila", "Baguio", "Sagada", "Vigan", "Batanes", "Siquijor"
];

export default function CreatePost() {
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [rating, setRating] = useState(5);
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const repostData = localStorage.getItem('repostData');
    if (repostData) {
      const data = JSON.parse(repostData);
      setCaption(data.original_caption ? `Reposted: ${data.original_caption}` : '');
      setLocation(data.location || '');
      if (data.image_urls) {
        setPreviewUrls(Array.isArray(data.image_urls) ? data.image_urls : [data.image_urls]);
      }
      localStorage.removeItem('repostData');
    }
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setImages(filesArray);
      setPreviewUrls(filesArray.map(file => URL.createObjectURL(file)));
    }
  };

  const getCurrentLocation = () => {
    setGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          setGettingLocation(false);
          alert(`✅ Location captured!\nYou can edit the place name below.`);
        },
        () => {
          alert("Unable to get location. Please type manually.");
          setGettingLocation(false);
        }
      );
    } else {
      alert("Geolocation not supported.");
      setGettingLocation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (images.length === 0 && previewUrls.length === 0) {
      setError("Please upload at least one photo");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const imageUrls: string[] = [];

      for (const image of images) {
        const fileName = `${Date.now()}-${image.name}`;
        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(fileName, image);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('post-images').getPublicUrl(fileName);
        imageUrls.push(data.publicUrl);
      }

      if (imageUrls.length === 0 && previewUrls.length > 0) {
        imageUrls.push(...previewUrls);
      }

      const { error: postError } = await supabase
        .from('posts')
        .insert({
          caption,
          location: location || 'Philippines',
          rating,
          image_urls: imageUrls,
          latitude,
          longitude,
        });

      if (postError) throw postError;

      alert('Adventure shared successfully! 🎉');
      router.push('/feed');

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-20">
      <div className="max-w-2xl mx-auto px-6 pt-8">
        <h1 className="text-4xl font-bold mb-8 text-center">Share Your Adventure</h1>

        {error && <p className="text-red-500 text-center mb-6">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* 1. UPLOAD PHOTOS FIRST */}
          <div>
            <label className="block text-sm mb-3 text-white/70">Upload Photos</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-sm text-white/70 file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-emerald-600 file:text-white"
            />

            {previewUrls.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-6">
                {previewUrls.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt="preview"
                    className="rounded-2xl aspect-square object-cover"
                  />
                ))}
              </div>
            )}
          </div>

          {/* 2. LOCATION */}
          <div>
            <label className="block text-sm mb-2 text-white/70">Where did you visit?</label>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="e.g. Siargao, El Nido..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="flex-1 px-5 py-4 bg-zinc-900 border border-white/10 rounded-2xl"
                list="places"
                required
              />
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={gettingLocation}
                className="px-6 py-4 bg-emerald-600 hover:bg-emerald-700 rounded-2xl whitespace-nowrap disabled:opacity-50"
              >
                {gettingLocation ? 'Getting...' : '📍 My Location'}
              </button>
            </div>

            <datalist id="places">
              {popularPlaces.map(place => (
                <option key={place} value={place} />
              ))}
            </datalist>
          </div>

          {/* 3. RATING */}
          <div>
            <label className="block text-sm mb-3 text-white/70">Rate this place</label>
            <div className="flex gap-3 text-5xl justify-center">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setRating(num)}
                  className={rating >= num ? 'text-yellow-400' : 'text-gray-600'}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* 4. CAPTION LAST */}
          <div>
            <label className="block text-sm mb-2 text-white/70">
              Tell us about your experience
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={6}
              placeholder="What made this place special?"
              className="w-full px-5 py-4 bg-zinc-900 border border-white/10 rounded-3xl"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 py-5 rounded-2xl text-xl font-semibold disabled:opacity-50"
          >
            {loading ? 'Posting...' : 'Share this Adventure'}
          </button>

        </form>
      </div>
    </div>
  );
}