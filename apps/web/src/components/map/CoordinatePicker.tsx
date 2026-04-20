'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Navigation, Search } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// TODO: Leaflet default icon hack — Leaflet typings don't expose the private getter.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface ClickHandlerProps {
  onPick: (lat: number, lng: number) => void;
}

function ClickHandler({ onPick }: ClickHandlerProps) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

interface FlyToProps {
  lat: number | null;
  lng: number | null;
}

function FlyTo({ lat, lng }: FlyToProps) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.flyTo([lat, lng], 15, { duration: 1 });
  }, [lat, lng, map]);
  return null;
}

interface PickedCoords {
  lat: number | null;
  lng: number | null;
}

interface Props {
  lat?: number | null;
  lng?: number | null;
  onConfirm: (lat: number | null, lng: number | null) => void;
  onCancel: () => void;
}

export default function CoordinatePicker({ lat, lng, onConfirm, onCancel }: Props) {
  const defaultLat = lat || 13.7563;
  const defaultLng = lng || 100.5018;

  const [picked, setPicked] = useState<PickedCoords>({ lat: lat || null, lng: lng || null });
  const [searchText, setSearchText] = useState('');
  const [searching, setSearching] = useState(false);
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | null>(null);

  const handlePick = (pLat: number, pLng: number) => setPicked({ lat: pLat, lng: pLng });

  const handleSearch = async () => {
    if (!searchText.trim()) return;
    setSearching(true);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchText)}&limit=1`);
    const data = await res.json();
    if (data[0]) {
      const { lat: rLat, lon } = data[0];
      setPicked({ lat: parseFloat(rLat), lng: parseFloat(lon) });
      setFlyTarget({ lat: parseFloat(rLat), lng: parseFloat(lon) });
    }
    setSearching(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search address or place..."
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Button size="sm" variant="outline" onClick={handleSearch} disabled={searching} className="h-8 px-3">
          {searching ? '...' : 'Search'}
        </Button>
      </div>

      <div className="rounded-xl overflow-hidden border border-slate-200" style={{ height: 340 }}>
        <MapContainer center={[defaultLat, defaultLng]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={true}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
          <ClickHandler onPick={handlePick} />
          {flyTarget && <FlyTo lat={flyTarget.lat} lng={flyTarget.lng} />}
          {picked.lat && picked.lng && <Marker position={[picked.lat, picked.lng]} />}
        </MapContainer>
      </div>

      <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
        <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
        {picked.lat ? (
          <span className="text-sm font-mono text-slate-700">
            {picked.lat.toFixed(6)}, {picked.lng!.toFixed(6)}
          </span>
        ) : (
          <span className="text-sm text-slate-400">Click on the map to pick a location</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Latitude</label>
          <Input
            type="number" step="0.000001"
            value={picked.lat ?? ''}
            onChange={e => setPicked(p => ({ ...p, lat: parseFloat(e.target.value) || null }))}
            className="h-8 text-sm font-mono"
            placeholder="e.g. 13.756300"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Longitude</label>
          <Input
            type="number" step="0.000001"
            value={picked.lng ?? ''}
            onChange={e => setPicked(p => ({ ...p, lng: parseFloat(e.target.value) || null }))}
            className="h-8 text-sm font-mono"
            placeholder="e.g. 100.501800"
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-1">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={() => onConfirm(picked.lat, picked.lng)} disabled={!picked.lat || !picked.lng}>
          <Navigation className="w-3.5 h-3.5 mr-1.5" /> Confirm Location
        </Button>
      </div>
    </div>
  );
}
