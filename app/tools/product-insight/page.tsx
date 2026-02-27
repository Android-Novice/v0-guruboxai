import { HeroSection } from "@/components/tool/hero-section"
import { InputSection } from "@/components/tool/input-section"

export default function ProductInsightPage() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-10 px-4 py-16">
      <HeroSection />
      <InputSection />
    </div>
  )
}
