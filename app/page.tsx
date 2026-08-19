import { LandingHeader } from "@/components/landing/LandingHeader";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { FormatShowcase } from "@/components/landing/FormatShowcase";
import { LivePreview } from "@/components/landing/LivePreview";
import { SecuritySpec } from "@/components/landing/SecuritySpec";
import { FinalCta } from "@/components/landing/FinalCta";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <LandingHeader />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <FormatShowcase />
        <LivePreview />
        <SecuritySpec />
        <FinalCta />
      </main>
    </div>
  );
}
