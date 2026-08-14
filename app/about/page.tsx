import type { Metadata } from "next";

import { ComingSoon } from "@/app/components/ComingSoon";
import { destinationFor } from "@/lib/festival";

const DESTINATION = destinationFor("/about");

export const metadata: Metadata = {
  title: `${DESTINATION.label} | 創作展2026`,
  description: DESTINATION.blurb,
};

export default function AboutPage() {
  return <ComingSoon destination={DESTINATION} />;
}
