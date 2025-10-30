import { useEffect, useState } from "react";

export const useReferralData = () => {
    const [refData, setRefData] = useState(null);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const STORAGE_KEY = "referralData";

        // ✅ Check if localStorage is safe
        let canUseStorage = true;
        try {
            localStorage.setItem("__test", "1");
            localStorage.removeItem("__test");
        } catch {
            canUseStorage = false;
        }

        // ✅ Load saved data if exists
        let saved = null;
        if (canUseStorage) {
            try {
                const data = localStorage.getItem(STORAGE_KEY);
                if (data) {
                    saved = JSON.parse(data);
                    setRefData(saved);
                }
            } catch {
                localStorage.removeItem(STORAGE_KEY);
            }
        }

        // ✅ Capture new referral only if not already saved
        if (!saved) {
            const url = new URL(window.location.href);
            const utm = {};
            ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach((key) => {
                const value = url.searchParams.get(key);
                if (value) utm[key] = value;
            });

            const newData = {
                referrer: document.referrer || "direct",
                fullUrl: url.href,                     // ✅ full URL including query params
                landingPage: window.location.pathname, // ✅ path only
                utm,
                source: url.searchParams.get("source") || null,
                timestamp: new Date().toISOString(),
            };

            if (canUseStorage) {
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
                } catch { }
            }

            setRefData(newData);
        }
    }, []);

    return refData;
};
