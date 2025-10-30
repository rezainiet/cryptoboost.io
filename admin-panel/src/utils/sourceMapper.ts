export const getSourceFromReferral = (referral: any): string => {
    if (!referral) return "Direct"

    // Check if utm_source exists and map it
    if (referral.utm?.utm_source) {
        const utmSource = referral.utm.utm_source.toLowerCase()
        const sourceMap: Record<string, string> = {
            ig: "Instagram",
            fb: "Facebook",
            google: "Google",
            tiktok: "TikTok",
            twitter: "Twitter",
            linkedin: "LinkedIn",
            youtube: "YouTube",
        }
        return sourceMap[utmSource] || utmSource.charAt(0).toUpperCase() + utmSource.slice(1)
    }

    // Check referrer for direct or other sources
    if (referral.referrer === "direct") return "Direct"
    if (referral.referrer?.includes("facebook")) return "Facebook"
    if (referral.referrer?.includes("instagram")) return "Instagram"
    if (referral.referrer?.includes("google")) return "Google"
    if (referral.referrer?.includes("fbclid")) return "Facebook"

    return "Organic"
}

// Get source color for UI
export const getSourceColor = (source: string): string => {
    const colorMap: Record<string, string> = {
        Instagram: "bg-pink-100 text-pink-800",
        Facebook: "bg-blue-100 text-blue-800",
        Google: "bg-red-100 text-red-800",
        TikTok: "bg-black text-white",
        Twitter: "bg-sky-100 text-sky-800",
        LinkedIn: "bg-blue-600 text-white",
        YouTube: "bg-red-600 text-white",
        Direct: "bg-gray-100 text-gray-800",
        Organic: "bg-green-100 text-green-800",
    }
    return colorMap[source] || "bg-slate-100 text-slate-800"
}
