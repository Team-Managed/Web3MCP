import type { MetadataRoute } from "next";
import { SITE_URL } from "./site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/docs/latest", "/quickstart"].map((path) => ({
    url: `${SITE_URL}${path}`,
  }));
}
