import React from "react";
import { Send } from "lucide-react";

const TelegramSupportButton = () => {
    return (
        <div className="fixed bottom-6 right-6 z-50 group flex items-center">
            {/* Tooltip text */}
            <span className="absolute right-16 bg-gray-800 text-white text-sm px-3 py-1 rounded-lg shadow-md opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2 transition-all duration-300">
                Telegram Support
            </span>

            {/* Floating button */}
            <a
                href="https://t.me/Louis_botcrypto"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#0088cc] text-white p-4 rounded-full shadow-lg hover:bg-[#0077b5] transition-colors duration-300"
            >
                <Send size={24} />
            </a>
        </div>
    );
};

export default TelegramSupportButton;
