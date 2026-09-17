import type { Metadata } from "next";

import { FeedPage } from "@/components/feed/feed-page";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Hall of Fame",
  description: "Every settled match and the side the crowd chose.",
};

export default function HallOfFamePage() {
  return (
    <FeedPage
      title="Hall of Fame"
      subtitle="Every match the crowd has already settled."
      icon="trophy"
      accent="#e0a33c"
      status="ended"
      variant="result"
      empty={{
        title: "No finals yet",
        body: "Once a match closes it is enshrined here, winner and all.",
      }}
    />
  );
}
