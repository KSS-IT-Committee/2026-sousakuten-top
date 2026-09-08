import type { MetadataRoute } from "next";

import { DESTINATIONS } from "@/lib/festival";
import { SITE_URL } from "@/lib/site";

/** Routes that exist outside DESTINATIONS. */
const EXTRA_ROUTES = ["/", "/requests", "/changelog"];

export default function sitemap(): MetadataRoute.Sitemap {
  // Destinations still showing <ComingSoon> are left out: an empty placeholder
  // is not worth a crawl. They join automatically once isReady flips.
  const routes = [
    ...EXTRA_ROUTES,
    ...DESTINATIONS.filter((destination) => destination.isReady).map(
      (destination) => destination.href,
    ),
  ];

  return routes.map((route) => ({
    url: new URL(route, SITE_URL).toString(),
  }));
}
