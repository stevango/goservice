import { useEffect, useRef } from "react";

// Leaflet é carregado do CDN sob demanda: sem dependência npm, sem chave
// de API. OpenStreetMap não exige token. CSP está desligado no helmet.
const LEAFLET_VERSION = "1.9.4";
const CSS_URL = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
const JS_URL = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;

let leafletPromise: Promise<unknown> | null = null;

function loadLeaflet(): Promise<unknown> {
  const w = window as unknown as { L?: unknown };
  if (w.L) return Promise.resolve(w.L);
  if (leafletPromise) return leafletPromise;

  leafletPromise = new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${CSS_URL}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = CSS_URL;
      document.head.appendChild(link);
    }
    const script = document.createElement("script");
    script.src = JS_URL;
    script.async = true;
    script.onload = () => resolve((window as unknown as { L: unknown }).L);
    script.onerror = () => reject(new Error("Falha ao carregar o Leaflet"));
    document.head.appendChild(script);
  });
  return leafletPromise;
}

// Pin SVG com ícone de chave de boca (oficina).
const WORKSHOP_ICON_HTML = `
<div style="transform:translate(-50%,-100%);">
  <svg width="34" height="44" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 0C7.6 0 0 7.6 0 17c0 12 17 27 17 27s17-15 17-27C34 7.6 26.4 0 17 0z" fill="#2563eb"/>
    <circle cx="17" cy="17" r="12" fill="#fff"/>
    <path d="M22.7 12.3a3.7 3.7 0 0 1-4.9 4.6l-5 5 1.9 1.9-1.4 1.4-1.9-1.9-1.4 1.4a1 1 0 0 1-1.4-1.4l1.4-1.4-1.9-1.9 1.4-1.4 1.9 1.9 5-5a3.7 3.7 0 0 1 4.6-4.9l-2.2 2.2 1.2 2.9 2.9 1.2 2.2-2.2z" fill="#2563eb"/>
  </svg>
</div>`;

type Props = {
  lat: number;
  lng: number;
  label?: string;
  className?: string;
  zoom?: number;
};

export function OsmMap({ lat, lng, label, className, zoom = 16 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadLeaflet()
      .then(L => {
        if (cancelled || !containerRef.current) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const LL = L as any;
        const map = LL.map(containerRef.current, {
          scrollWheelZoom: false,
        }).setView([lat, lng], zoom);
        mapRef.current = map;

        LL.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap",
        }).addTo(map);

        const icon = LL.divIcon({
          html: WORKSHOP_ICON_HTML,
          className: "",
          iconSize: [34, 44],
          iconAnchor: [0, 0],
        });
        const marker = LL.marker([lat, lng], { icon }).addTo(map);
        if (label) marker.bindPopup(label);
      })
      .catch(() => {
        if (containerRef.current) {
          containerRef.current.innerHTML =
            '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#6b7280;font-size:13px;">Mapa indisponível</div>';
        }
      });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [lat, lng, label, zoom]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ height: 220, width: "100%", borderRadius: 8, zIndex: 0 }}
    />
  );
}
