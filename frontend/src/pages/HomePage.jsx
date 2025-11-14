"use client"

import { useState, useEffect, Suspense, lazy } from "react"
import { X } from "lucide-react"

// Lazy-load heavy sections
const ContactForm = lazy(() => import("../components/sections/HomePage/ContactForm"))
const TradingViewChart = lazy(() => import("../components/sections/HomePage/TradingViewChart"))
const Navbar = lazy(() => import("../components/layouts/Navbar"))
const Hero = lazy(() => import("../components/sections/HomePage/Hero"))
const PackagesSection = lazy(() => import("../components/sections/HomePage/PackagesSection"))
const FeaturesSection = lazy(() => import("../components/sections/HomePage/FeaturesSection"))
const StatsSection = lazy(() => import("../components/sections/HomePage/StatsSection"))
const TestimonialsSection = lazy(() => import("../components/sections/HomePage/TestimonialsSection"))
const Footer = lazy(() => import("../components/layouts/Footer"))

const HomePage = () => {
    const [showVideoModal, setShowVideoModal] = useState(false)
    const [mounted, setMounted] = useState(false)

    // Wait for page to mount, THEN show modal with delay
    useEffect(() => {
        setMounted(true)

        // Give UI 600ms to fully load before showing video modal
        const timer = setTimeout(() => {
            setShowVideoModal(true)
        }, 5000)

        return () => clearTimeout(timer)
    }, [])

    const closeVideoModal = () => setShowVideoModal(false)

    return (
        <div className="min-h-screen">

            {/* Modal - only render after mount for smoother UX */}
            {mounted && showVideoModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-opacity">
                    <div className="relative w-full max-w-4xl bg-black rounded-lg overflow-hidden shadow-2xl animate-scale">

                        {/* Close Button */}
                        <button
                            onClick={closeVideoModal}
                            className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-all duration-200"
                        >
                            <X size={24} />
                        </button>

                        {/* Video */}
                        <div className="relative w-full bg-black">
                            <video
                                className="w-full h-full"
                                controls
                                autoPlay
                                playsInline
                            >
                                <source src="/videos/intro.MP4" type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    </div>
                </div>
            )}

            {/* Page Content */}
            <Suspense fallback={<div className="text-center py-20 text-white">Loading...</div>}>
                <Hero />
                <PackagesSection />
                <FeaturesSection />
                <TradingViewChart />
                <StatsSection />
                <TestimonialsSection />
                <ContactForm />
                <Footer />
            </Suspense>
        </div>
    )
}

export default HomePage
