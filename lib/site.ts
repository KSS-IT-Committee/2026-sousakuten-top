import type { Metadata } from "next";

import {
  type Destination,
  FESTIVAL_DATE_LABEL,
  FESTIVAL_NUMBER,
  FESTIVAL_THEME,
  VENUE_NAME,
} from "@/lib/festival";

/**
 * Canonical origin for this app. The site is also served on every PR-preview
 * subdomain, so canonical and Open Graph URLs are pinned to the production host
 * rather than derived from the request — that is what stops the previews from
 * competing with production as duplicate content.
 */
export const SITE_URL = "https://sousakuten-top.2026.kss-it.com";

/** Short site name: the `%s | …` title suffix and og:site_name. */
export const SITE_NAME = "創作展2026";

/** Built from lib/festival.ts so the search snippet cannot drift from the site. */
export const SITE_DESCRIPTION = `${VENUE_NAME} 第${FESTIVAL_NUMBER}回創作展 公式サイト。テーマ「${FESTIVAL_THEME}」。${FESTIVAL_DATE_LABEL}開催。`;

/** Shared Open Graph image — the hero visual, not a purpose-built 1200×630 card. */
const OG_IMAGE = {
  url: "/hero-books.jpg",
  width: 1272,
  height: 720,
  alt: SITE_NAME,
};

type IndexablePage = {
  /** Page title WITHOUT the site suffix — `title.template` appends it. */
  title: string;
  /**
   * Set on the top page only, where the title already carries the site name
   * and `title.template` would otherwise repeat it.
   */
  isTitleAbsolute?: boolean;
  description: string;
  /** Root-relative path; `metadataBase` resolves it against SITE_URL. */
  path: string;
  isIndexable?: true;
};

type NonIndexablePage = {
  title: string;
  description: string;
  isIndexable: false;
};

type PageMetadataOptions = IndexablePage | NonIndexablePage;

/**
 * Title, description, canonical URL and social cards for one page.
 *
 * Every page builds its metadata through this rather than inheriting from the
 * root layout, because Next merges metadata objects only **shallowly**: a page
 * that sets any `openGraph` field replaces the layout's entire `openGraph`
 * object, silently dropping og:site_name, og:locale and the image. The same
 * applies to `twitter` and `alternates`.
 */
export function pageMetadata(options: PageMetadataOptions): Metadata {
  const { title, description } = options;

  if (options.isIndexable === false) {
    return { title, description, robots: { index: false, follow: false } };
  }

  const { path, isTitleAbsolute = false } = options;

  return {
    title: isTitleAbsolute ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "ja_JP",
      url: path,
      title,
      description,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE.url],
    },
  };
}

/**
 * Metadata for one of the DESTINATIONS pages, keyed off the same `isReady`
 * flag the nav uses. A destination that still renders <ComingSoon> is thin
 * content, so it is kept out of the index — and out of app/sitemap.ts, which
 * reads the same flag — until it has something on it. Publishing one is
 * therefore a single `isReady: true` in lib/festival.ts.
 */
export function destinationMetadata(destination: Destination): Metadata {
  if (!destination.isReady) {
    return pageMetadata({
      title: destination.label,
      description: destination.blurb,
      isIndexable: false,
    });
  }

  return pageMetadata({
    title: destination.label,
    description: destination.blurb,
    path: destination.href,
  });
}
