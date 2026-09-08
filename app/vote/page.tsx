import type { Metadata } from "next";

import { ComingSoon } from "@/app/components/ComingSoon";
import { destinationFor } from "@/lib/festival";
import { destinationMetadata } from "@/lib/site";

const DESTINATION = destinationFor("/vote");

export const metadata: Metadata = destinationMetadata(DESTINATION);

export default function VotePage() {
  return <ComingSoon destination={DESTINATION} />;
}
