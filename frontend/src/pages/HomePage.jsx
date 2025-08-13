import Footer from "../components/layouts/Footer";
import FeaturesSection from "../components/sections/HomePage/FeaturesSection";
import Hero from "../components/sections/HomePage/Hero";
import PackagesSection from "../components/sections/HomePage/PackagesSection";
import StatsSection from "../components/sections/HomePage/StatsSection";
import TestimonialsSection from "../components/sections/HomePage/TestimonialsSection";

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">

            <Hero />
            <PackagesSection />
            <FeaturesSection />
            <StatsSection />
            <TestimonialsSection />
            <Footer />
        </div>
    )
}
