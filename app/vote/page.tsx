import type { Metadata } from "next";

import { ComingSoon } from "@/app/components/ComingSoon";
import { destinationFor } from "@/lib/festival";

const DESTINATION = destinationFor("/vote");

export const metadata: Metadata = {
  title: `${DESTINATION.label} | 創作展2026`,
  description: DESTINATION.blurb,
};

export default function VotePage() {
  return <ComingSoon destination={DESTINATION} />;
}
