"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Play, Pause, ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/layouts/Navbar"
import Footer from "../components/layouts/Footer"

interface Testimonial {
    id: string
    name: string
    videoUrl: string
    thumbnailUrl: string
    quote: string
}

const testimonials: Testimonial[] = [
    { id: "1", name: "Marie Dubois", videoUrl: "/videos/IMG_001.MP4", thumbnailUrl: "/videos/thumbnails/IMG_001.png", quote: "Cette plateforme a complètement transformé ma stratégie d'investissement." },
    { id: "2", name: "Pierre Martin", videoUrl: "/videos/IMG_002.MP4", thumbnailUrl: "/videos/thumbnails/IMG_002.png", quote: "Le ROI que j'ai obtenu a dépassé toutes mes attentes." },
    { id: "3", name: "Sophie Leroy", videoUrl: "/videos/IMG_003.MP4", thumbnailUrl: "/videos/thumbnails/IMG_003.png", quote: "Des résultats exceptionnels et un service client remarquable." },
    { id: "4", name: "Antoine Bernard", videoUrl: "/videos/IMG_004.MP4", thumbnailUrl: "/videos/thumbnails/IMG_004.png", quote: "Les fonctionnalités de trading automatisé sont révolutionnaires." },
    { id: "5", name: "Camille Rousseau", videoUrl: "/videos/IMG_005.MP4", thumbnailUrl: "/videos/thumbnails/IMG_005.png", quote: "Des profits constants mois après mois. Je recommande vivement." },
    { id: "6", name: "Lucas Moreau", videoUrl: "/videos/IMG_006.MP4", thumbnailUrl: "/videos/thumbnails/IMG_006.png", quote: "La meilleure plateforme d'investissement crypto que j'aie jamais utilisée." },
]

interface VideoPlayerProps {
    testimonial: Testimonial
    isVisible: boolean
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ testimonial, isVisible }) => {
    const [isPlaying, setIsPlaying] = useState(false)
    const videoRef = React.useRef<HTMLVideoElement>(null)

    useEffect(() => {
        if (!isVisible && videoRef.current) {
            videoRef.current.pause()
            setIsPlaying(false)
        }
    }, [isVisible])

    const handlePlay = () => {
        if (!videoRef.current) return
        if (isPlaying) {
            videoRef.current.pause()
            setIsPlaying(false)
        } else {
            videoRef.current.play()
            setIsPlaying(true)
        }
    }

    if (!isVisible) {
        return (
            <div className="aspect-[688/1258] bg-slate-800 rounded-lg flex items-center justify-center">
                <div className="text-slate-400">Vidéo non chargée</div>
            </div>
        )
    }

    return (
        <div className="relative aspect-[688/1258] bg-slate-800 rounded-lg overflow-hidden group max-w-sm mx-auto">
            <video
                ref={videoRef}
                className="w-full h-full object-cover"
                poster={testimonial.thumbnailUrl}
                preload="metadata"
                controls={false}
            >
                <source src={testimonial.videoUrl} type="video/mp4" />
                <source src={testimonial.videoUrl.replace(".MP4", ".webm")} type="video/webm" />
                Votre navigateur ne supporte pas la balise vidéo.
            </video>

            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                    onClick={handlePlay}
                    className="bg-white/90 hover:bg-white text-slate-900 rounded-full p-4 transition-all duration-200 hover:scale-110"
                >
                    {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                </button>
            </div>
        </div>
    )
}

function TestimonialsContent() {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [visibleVideos, setVisibleVideos] = useState<Set<number>>(new Set([0, 1]))
    const navigate = useNavigate()

    useEffect(() => {
        const newVisibleVideos = new Set<number>()
        newVisibleVideos.add(currentIndex)
        if (window.innerWidth >= 768) {
            newVisibleVideos.add((currentIndex + 1) % testimonials.length)
        }
        setVisibleVideos(newVisibleVideos)
    }, [currentIndex])

    const nextTestimonial = () => setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    const prevTestimonial = () => setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
    const goToSlide = (index: number) => setCurrentIndex(index)

    return (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900/20">
            <Navbar />
            <section className="py-8 px-4  min-h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <button
                            onClick={() => navigate("/")}
                            className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors duration-200"
                        >
                            <ArrowLeft size={20} />
                            <span>Retour à l'accueil</span>
                        </button>
                    </div>

                    <div className="text-center mb-12">
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Ce que disent nos clients</h2>
                            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                                Découvrez comment notre plateforme a transformé les stratégies d'investissement de professionnels du monde entier
                            </p>
                        </motion.div>
                    </div>

                    <div className="relative">
                        <div className="overflow-hidden">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentIndex}
                                    initial={{ opacity: 0, x: 100 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -100 }}
                                    transition={{ duration: 0.5, ease: "easeInOut" }}
                                    className="grid grid-cols-1 md:grid-cols-2 gap-8"
                                >
                                    <div className="space-y-6">
                                        <VideoPlayer testimonial={testimonials[currentIndex]} isVisible={visibleVideos.has(currentIndex)} />
                                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
                                            <blockquote className="text-lg text-slate-200 mb-4 italic">"{testimonials[currentIndex].quote}"</blockquote>
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold">
                                                    {testimonials[currentIndex].name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-white">{testimonials[currentIndex].name}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="hidden md:block space-y-6">
                                        <VideoPlayer
                                            testimonial={testimonials[(currentIndex + 1) % testimonials.length]}
                                            isVisible={visibleVideos.has((currentIndex + 1) % testimonials.length)}
                                        />
                                        <div className="bg-slate-800/30 backdrop-blur-sm rounded-lg p-6 border border-slate-700/50">
                                            <blockquote className="text-slate-300 mb-4 italic">"{testimonials[(currentIndex + 1) % testimonials.length].quote}"</blockquote>
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-slate-500 to-slate-600 rounded-full flex items-center justify-center text-white font-semibold">
                                                    {testimonials[(currentIndex + 1) % testimonials.length].name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-200">{testimonials[(currentIndex + 1) % testimonials.length].name}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        <button onClick={prevTestimonial} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-slate-800/80 hover:bg-slate-700 text-white p-3 rounded-full transition-all duration-200 hover:scale-110 backdrop-blur-sm border border-slate-600">
                            <ChevronLeft size={24} />
                        </button>
                        <button onClick={nextTestimonial} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-slate-800/80 hover:bg-slate-700 text-white p-3 rounded-full transition-all duration-200 hover:scale-110 backdrop-blur-sm border border-slate-600">
                            <ChevronRight size={24} />
                        </button>
                    </div>

                    <div className="flex justify-center space-x-2 mt-8">
                        {testimonials.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                className={`w-3 h-3 rounded-full transition-all duration-200 ${index === currentIndex ? "bg-emerald-400 scale-125" : "bg-slate-600 hover:bg-slate-500"}`}
                            />
                        ))}
                    </div>
                </div>
            </section>
            <Footer />
        </div>
    )
}

export default function TestimonialsPage() {
    return <TestimonialsContent />
}
