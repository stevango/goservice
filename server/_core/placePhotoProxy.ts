import type { Express } from "express";
import { ENV } from "./env";

// Serve a foto do Google Places sem expor a chave de API no navegador.
// O endpoint /maps/api/place/photo responde com um 302 para a imagem
// real; seguimos o redirect e repassamos os bytes.
export function registerPlacePhotoProxy(app: Express) {
  app.get("/api/place-photo", async (req, res) => {
    const ref = String(req.query.ref ?? "");
    if (!ref || ref.length > 3000 || !/^[A-Za-z0-9_-]+$/.test(ref)) {
      res.status(400).send("Invalid photo reference");
      return;
    }
    if (!ENV.googleMapsApiKey) {
      res.status(503).send("Maps API key not configured");
      return;
    }

    try {
      const url = new URL("https://maps.googleapis.com/maps/api/place/photo");
      url.searchParams.set("maxwidth", "800");
      url.searchParams.set("photo_reference", ref);
      url.searchParams.set("key", ENV.googleMapsApiKey);

      const upstream = await fetch(url.toString(), { redirect: "follow" });
      if (!upstream.ok || !upstream.body) {
        res.status(502).send("Photo backend error");
        return;
      }

      res.setHeader(
        "Content-Type",
        upstream.headers.get("content-type") ?? "image/jpeg"
      );
      res.setHeader("Cache-Control", "public, max-age=86400");

      const buffer = Buffer.from(await upstream.arrayBuffer());
      res.end(buffer);
    } catch (error) {
      console.error("[PlacePhotoProxy] erro:", error);
      res.status(502).send("Photo backend error");
    }
  });
}
