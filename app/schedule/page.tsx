import type { Metadata } from "next";

import { ComingSoon } from "@/app/components/ComingSoon";
import { destinationFor } from "@/lib/festival";
import { destinationMetadata } from "@/lib/site";

const DESTINATION = destinationFor("/schedule");

export const metadata: Metadata = destinationMetadata(DESTINATION);

export default function SchedulePage() {
  return <ComingSoon destination={DESTINATION} />;
}
