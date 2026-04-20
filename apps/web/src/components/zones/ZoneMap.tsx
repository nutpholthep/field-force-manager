'use client';

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Polygon, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import L from "leaflet";
import "leaflet-draw";
import type { Zone } from "@ffm/shared";

// Fix leaflet default icon
// TODO: tighten type — leaflet type defs don't expose _getIconUrl publicly
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface DrawControlProps {
  editingZone: Zone;
  onPolygonSaved: (latlngs: Array<[number, number]> | null) => void;
  onCancel: () => void;
}

// Component to handle draw controls - mounts inside MapContainer
function DrawControl({ editingZone, onPolygonSaved, onCancel }: DrawControlProps) {
  const map = useMap();
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  // TODO: tighten type — leaflet-draw types aren't consistently declared
  const drawControlRef = useRef<L.Control | null>(null);

  useEffect(() => {
    if (!editingZone) return;

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnItemsRef.current = drawnItems;

    if (editingZone.polygon && editingZone.polygon.length > 0) {
      const latlngs = editingZone.polygon.map(([lat, lng]) => [lat, lng] as [number, number]);
      const poly = new L.Polygon(latlngs, {
        color: editingZone.color || "#3b82f6",
        fillColor: editingZone.color || "#3b82f6",
        fillOpacity: 0.3,
        weight: 2,
      });
      drawnItems.addLayer(poly);
      map.fitBounds(poly.getBounds(), { padding: [40, 40] });
    }

    // TODO: tighten type — L.Control.Draw is provided by leaflet-draw at runtime
    const LDraw = L as unknown as {
      Control: {
        Draw: new (options: unknown) => L.Control;
      };
      Draw: { Event: { CREATED: string } };
    };
    const drawControl = new LDraw.Control.Draw({
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: false,
          shapeOptions: {
            color: editingZone.color || "#3b82f6",
            fillColor: editingZone.color || "#3b82f6",
            fillOpacity: 0.3,
            weight: 2,
          },
        },
        polyline: false,
        rectangle: false,
        circle: false,
        circlemarker: false,
        marker: false,
      },
    });
    map.addControl(drawControl);
    drawControlRef.current = drawControl;

    const onCreated = (e: { layer: L.Layer }) => {
      drawnItems.clearLayers();
      drawnItems.addLayer(e.layer);
    };

    map.on(LDraw.Draw.Event.CREATED, onCreated as L.LeafletEventHandlerFn);

    return () => {
      map.off(LDraw.Draw.Event.CREATED, onCreated as L.LeafletEventHandlerFn);
      map.removeControl(drawControl);
      map.removeLayer(drawnItems);
    };
  }, [editingZone, map]);

  // Expose save/cancel via custom events
  useEffect(() => {
    const handleSave = () => {
      const layers = drawnItemsRef.current?.getLayers() || [];
      if (layers.length === 0) {
        onPolygonSaved(null);
        return;
      }
      const poly = layers[0] as L.Polygon;
      const rings = poly.getLatLngs() as L.LatLng[][];
      const latlngs = rings[0].map((ll) => [ll.lat, ll.lng] as [number, number]);
      onPolygonSaved(latlngs);
    };

    const handleCancel = () => onCancel();

    window.addEventListener("zone-map-save", handleSave);
    window.addEventListener("zone-map-cancel", handleCancel);
    return () => {
      window.removeEventListener("zone-map-save", handleSave);
      window.removeEventListener("zone-map-cancel", handleCancel);
    };
  }, [onPolygonSaved, onCancel]);

  return null;
}

interface Props {
  zones: Zone[];
  editingZone: Zone | null;
  onPolygonSaved: (latlngs: Array<[number, number]> | null) => void;
  onCancel: () => void;
}

export default function ZoneMap({ zones, editingZone, onPolygonSaved, onCancel }: Props) {
  const center: [number, number] = [13.75, 100.5]; // Bangkok

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={center}
        zoom={10}
        className="w-full h-full rounded-lg"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Render all zone polygons */}
        {zones.map(zone => {
          if (!zone.polygon?.length) return null;
          const isEditing = editingZone?.id === zone.id;
          if (isEditing) return null; // handled by DrawControl
          const latlngs = zone.polygon.map(([lat, lng]) => [lat, lng] as [number, number]);
          return (
            <Polygon
              key={zone.id}
              positions={latlngs}
              pathOptions={{
                color: zone.color || "#3b82f6",
                fillColor: zone.color || "#3b82f6",
                fillOpacity: 0.25,
                weight: 2,
              }}
            >
              <Tooltip sticky>
                <div className="text-sm font-semibold">{zone.name}</div>
                <div className="text-xs text-gray-500">{zone.code}</div>
              </Tooltip>
            </Polygon>
          );
        })}

        {/* Draw control when editing */}
        {editingZone && (
          <DrawControl
            editingZone={editingZone}
            onPolygonSaved={onPolygonSaved}
            onCancel={onCancel}
          />
        )}
      </MapContainer>
    </div>
  );
}
