import { Container } from "@/components/ui/Layout";
import { HeroSection } from "@/components/home/HeroSection";
import { UpcomingMatchSection } from "@/components/home/UpcomingMatchSection";
import { PointsTablePreview } from "@/components/home/PointsTablePreview";
import { LatestUpdatesSection } from "@/components/home/LatestUpdatesSection";
import { TeamsPreview } from "@/components/home/TeamsPreview";

export default function HomePage() {
  return (
    <div className="py-6 sm:py-8 lg:py-10">
      <Container className="space-y-12 sm:space-y-16">
        {/* 1. Hero Section with Constellation Background */}
        <HeroSection />

        {/* 2. Featured Upcoming Match */}
        <UpcomingMatchSection />

        {/* 3. Points Table Standings Preview */}
        <PointsTablePreview />

        {/* 4. Latest News & Tournament Updates */}
        <LatestUpdatesSection />

        {/* 5. NPL Franchise Teams */}
        <TeamsPreview />
      </Container>
    </div>
  );
}
