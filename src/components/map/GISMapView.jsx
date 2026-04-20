import React, { useMemo, useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const makeIcon = (color, emoji, size = 32) =>
  L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;background:${color};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:${size * 0.45}px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);cursor:pointer;">${emoji}</div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

const WO_COLORS = {
  created: "#6b7280",
  assigned: "#3b82f6",
  accepted: "#8b5cf6",
  traveling: "#f59e0b",
  on_site: "#10b981",
  working: "#059669",
  completed: "#d1d5db",
  cancelled: "#fca5a5",
};

// Cache route results to avoid redundant API calls
const routeCache = {};

async function fetchOSRMRoute(fromLat, fromLng, toLat, toLng) {
  const key = `${fromLat.toFixed(5)},${fromLng.toFixed(5)}-${toLat.toFixed(5)},${toLng.toFixed(5)}`;
  if (routeCache[key]) return routeCache[key];

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.code === "Ok" && data.routes?.[0]) {
      const route = data.routes[0];
      const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      const distanceKm = route.distance / 1000;
      const durationMin = Math.round(route.duration / 60);
      const result = { coords, distanceKm, durationMin };
      routeCache[key] = result;
      return result;
    }
  } catch {
    // OSRM unavailable — return null
  }
  return null;
}

function AutoBounds({ positions }) {
  const map = useMap();
  React.useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, []);
  return null;
}

function FlyToTarget({ target }) {
  const map = useMap();
  const prevTarget = React.useRef(null);
  React.useEffect(() => {
    if (!target) return;
    if (prevTarget.current === target) return;
    prevTarget.current = target;
    map.flyTo([target.lat, target.lng], target.zoom || 15, { duration: 1.2 });
  }, [target, map]);
  return null;
}

function TechnicianMarker({ tech, assignedWO }) {
  const lat = tech.current_latitude || tech.home_latitude;
  const lng = tech.current_longitude || tech.home_longitude;
  const [route, setRoute] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  const hasDestination = assignedWO?.site_latitude && assignedWO?.site_longitude;

  useEffect(() => {
    if (!lat || !lng || !hasDestination) return;
    let cancelled = false;
    setLoadingRoute(true);
    fetchOSRMRoute(lat, lng, assignedWO.site_latitude, assignedWO.site_longitude).then(r => {
      if (!cancelled) {
        setRoute(r);
        setLoadingRoute(false);
      }
    });
    return () => { cancelled = true; };
  }, [lat, lng, assignedWO?.site_latitude, assignedWO?.site_longitude]);

  if (!lat || !lng) return null;

  const avColor = tech.availability === "available" ? "#10b981"
    : tech.availability === "busy" ? "#f59e0b"
    : "#94a3b8";

  const routeColor = "#3b82f6";

  const formatDuration = (mins) => {
    if (mins < 60) return `${mins} นาที`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h} ชม. ${m} นาที` : `${h} ชม.`;
  };

  const statusLabel = { available: "ว่าง", busy: "มีงาน", offline: "ออฟไลน์", break: "พัก" };

  return (
    <>
      {/* Technician marker */}
      <Marker position={[lat, lng]} icon={makeIcon(avColor, "👨‍🔧", 36)} zIndexOffset={100}>
        <Popup className="text-sm" minWidth={230}>
          <div className="space-y-1.5 py-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-slate-800">{tech.full_name}</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium text-white" style={{ background: avColor }}>
                {statusLabel[tech.availability] || tech.availability}
              </span>
            </div>
            <p className="text-xs text-slate-500">{tech.technician_code} · {tech.zone_name || "ไม่มีโซน"}</p>

            {assignedWO ? (
              <div className="pt-1.5 border-t border-slate-100 space-y-1.5">
                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">งานที่ได้รับมอบหมาย</p>
                <div className="bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-2 space-y-0.5">
                  <p className="text-xs font-semibold text-blue-800">{assignedWO.title}</p>
                  <p className="text-[11px] text-blue-600">📍 {assignedWO.site_name || assignedWO.customer_name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{assignedWO.order_number}</p>
                </div>
                {loadingRoute && <p className="text-xs text-slate-400 animate-pulse">⏳ กำลังคำนวณเส้นทาง...</p>}
                {route && (
                  <div className="flex gap-3 bg-slate-50 border border-slate-200 rounded px-2 py-1.5">
                    <span className="text-xs text-slate-700 font-medium">🛣 {route.distanceKm.toFixed(1)} km</span>
                    <span className="text-xs text-slate-700 font-medium">⏱ {formatDuration(route.durationMin)}</span>
                  </div>
                )}
                {!route && !loadingRoute && hasDestination && (
                  <p className="text-xs text-slate-400">ไม่สามารถโหลดเส้นทางได้</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-emerald-600">✅ ไม่มีงานที่ได้รับมอบหมาย</p>
            )}
          </div>
        </Popup>
      </Marker>

      {/* Destination pin for assigned site */}
      {hasDestination && (
        <Marker
          position={[assignedWO.site_latitude, assignedWO.site_longitude]}
          icon={makeIcon("#ef4444", "📍", 28)}
          zIndexOffset={50}
        >
          <Popup minWidth={200}>
            <div className="space-y-1 py-1">
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">ปลายทางของ {tech.full_name}</p>
              <p className="font-semibold text-slate-800 text-sm">{assignedWO.title}</p>
              <p className="text-xs text-slate-500">📍 {assignedWO.site_name || assignedWO.customer_name}</p>
              <p className="text-[10px] text-slate-400 font-mono">{assignedWO.order_number}</p>
              {route && (
                <div className="flex gap-3 bg-red-50 rounded px-2 py-1.5 mt-1">
                  <span className="text-xs text-red-700">🛣 {route.distanceKm.toFixed(1)} km</span>
                  <span className="text-xs text-red-700">⏱ {formatDuration(route.durationMin)}</span>
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      )}

      {/* Road route (OSRM) */}
      {route?.coords && route.coords.length > 1 && (
        <Polyline
          positions={route.coords}
          pathOptions={{ color: routeColor, weight: 3.5, opacity: 0.85 }}
        />
      )}

      {/* Fallback dashed line if OSRM not loaded yet */}
      {!route && hasDestination && (
        <Polyline
          positions={[[lat, lng], [assignedWO.site_latitude, assignedWO.site_longitude]]}
          pathOptions={{ color: "#94a3b8", weight: 2, dashArray: "6 4", opacity: 0.5 }}
        />
      )}
    </>
  );
}

function WorkOrderMarker({ wo }) {
  if (!wo.site_latitude || !wo.site_longitude) return null;
  const color = WO_COLORS[wo.status] || "#6b7280";
  const emoji = wo.status === "traveling" ? "🚗"
    : wo.status === "working" || wo.status === "on_site" ? "⚙️"
    : wo.status === "completed" ? "✅"
    : "📋";
  return (
    <Marker position={[wo.site_latitude, wo.site_longitude]} icon={makeIcon(color, emoji, 30)}>
      <Popup minWidth={200}>
        <div className="space-y-1 py-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-slate-400">{wo.order_number}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full text-white font-medium" style={{ background: color }}>{wo.status}</span>
          </div>
          <p className="font-semibold text-slate-800 text-sm">{wo.title}</p>
          <p className="text-xs text-slate-500">{wo.customer_name} · {wo.zone_name}</p>
          {wo.assigned_technician_name && (
            <p className="text-xs text-blue-600">👷 {wo.assigned_technician_name}</p>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

export default function GISMapView({ workOrders = [], technicians = [], selectedTechId = null, focusTarget = null }) {
  const techWOMap = useMemo(() => {
    const map = {};
    workOrders.forEach(wo => {
      if (wo.assigned_technician_id && ["traveling", "on_site", "working", "assigned", "accepted"].includes(wo.status)) {
        map[wo.assigned_technician_id] = wo;
      }
    });
    return map;
  }, [workOrders]);

  const allPositions = useMemo(() => {
    const pts = [];
    workOrders.forEach(wo => { if (wo.site_latitude && wo.site_longitude) pts.push([wo.site_latitude, wo.site_longitude]); });
    technicians.forEach(t => {
      const lat = t.current_latitude || t.home_latitude;
      const lng = t.current_longitude || t.home_longitude;
      if (lat && lng) pts.push([lat, lng]);
    });
    return pts;
  }, [workOrders, technicians]);

  const defaultCenter = allPositions[0] || [13.7563, 100.5018];

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm" style={{ height: "100%", minHeight: 480 }}>
      <MapContainer center={defaultCenter} zoom={11} style={{ height: "100%", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
        {allPositions.length > 1 && <AutoBounds positions={allPositions} />}
        <FlyToTarget target={focusTarget} />

        {workOrders.map(wo => <WorkOrderMarker key={wo.id} wo={wo} />)}
        {technicians.map(tech => (
          <TechnicianMarker key={tech.id} tech={tech} assignedWO={techWOMap[tech.id]} />
        ))}
      </MapContainer>
    </div>
  );
}