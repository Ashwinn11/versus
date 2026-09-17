import type { Metadata } from "next";

import { FeedPage } from "@/components/feed/feed-page";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Upcoming",
  description: "Matches that haven't started yet.",
};

export default function UpcomingPage() {
  return (
    <FeedPage
      title="Next up"
      subtitle="Scheduled matches that haven't opened for voting yet."
      icon="clock"
      status="scheduled"
      empty={{
        title: "Nothing scheduled",
        body: "Every match is either running or already settled.",
      }}
    />
  );
}
