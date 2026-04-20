import React, { useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Polygon, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import L from "leaflet";
import "leaflet-draw";

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Component to handle draw controls - mounts inside MapContainer
function DrawControl({ editingZone, onPolygonSaved, onCancel }) {
  const map = useMap();
  const drawnItemsRef = useRef(null);
  const drawControlRef = useRef(null);

  useEffect(() => {
    if (!editingZone) return;

    // Create feature group for drawn items
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnItemsRef.current = drawnItems;

    // If zone already has a polygon, show it for editing
    if (editingZone.polygon?.length > 0) {
      const latlngs = editingZone.polygon.map(([lat, lng]) => [lat, lng]);
      const poly = new L.Polygon(latlngs, {
        color: editingZone.color || "#3b82f6",
        fillColor: editingZone.color || "#3b82f6",
        fillOpacity: 0.3,
        weight: 2,
      });
      drawnItems.addLayer(poly);
      // Fit map to polygon
      map.fitBounds(poly.getBounds(), { padding: [40, 40] });
    }

    // Draw control
    const drawControl = new L.Control.Draw({
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

    // Event: created
    const onCreated = (e) => {
      // Clear previous
      drawnItems.clearLayers();
      drawnItems.addLayer(e.layer);
    };

    map.on(L.Draw.Event.CREATED, onCreated);

    return () => {
      map.off(L.Draw.Event.CREATED, onCreated);
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
      const latlngs = layers[0].getLatLngs()[0].map(ll => [ll.lat, ll.lng]);
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

export default function ZoneMap({ zones, editingZone, onPolygonSaved, onCancel }) {
  const center = [13.75, 100.5]; // Bangkok

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
          const latlngs = zone.polygon.map(([lat, lng]) => [lat, lng]);
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