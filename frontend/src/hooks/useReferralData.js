import { useEffect, useState } from "react";

export const useReferralData = () => {
    const [refData, setRefData] = useState({});

    useEffect(() => {
        const STORAGE_KEY = "referralData";

        // If already saved, use that
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            setRefData(JSON.parse(saved));
            return;
        }

        const url = new URL(window.location.href);
        const utm = {};
        ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach((key) => {
            const value = url.searchParams.get(key);
            if (value) utm[key] = value;
        });

        // 👇 also check for custom `source` param (like ?source=telegram)
        const customSource = url.searchParams.get("source");

        const newData = {
            referrer: document.referrer || "direct",
            utm,
            source: customSource || null, // ✅ added this line
            landingPage: window.location.pathname,
            timestamp: new Date().toISOString(),
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
        setRefData(newData);
    }, []);

    return refData;
};
