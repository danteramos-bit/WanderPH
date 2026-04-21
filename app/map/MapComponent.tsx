'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapComponentProps {
  posts: any[];
}

export default function MapComponent({ posts }: MapComponentProps) {
  // Center of the Philippines
  const center: [number, number] = [12.8797, 121.7740];

  return (
    <MapContainer center={center} zoom={6} style={{ height: '100%', width: '100%' }} className="z-0">
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />

      {posts.map((post: any) => {
        // Random location around Philippines for now (later we can use real coordinates)
        const lat = 12.8797 + (Math.random() - 0.5) * 10;
        const lng = 121.7740 + (Math.random() - 0.5) * 12;

        const imageUrl = post.image_urls && (typeof post.image_urls === 'string' 
          ? JSON.parse(post.image_urls)[0] 
          : post.image_urls?.[0]);

        return (
          <Marker key={post.id} position={[lat, lng]}>
            <Popup>
              <div className="min-w-[220px]">
                {imageUrl && (
                  <img 
                    src={imageUrl} 
                    alt="Travel" 
                    className="w-full h-32 object-cover rounded-lg mb-3" 
                  />
                )}
                <p className="font-semibold text-base">{post.caption}</p>
                <p className="text-emerald-400 text-sm mt-1">{post.location}</p>
                <p className="text-xs text-white/60 mt-2">⭐ {post.rating}/5</p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}