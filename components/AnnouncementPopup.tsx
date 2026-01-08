"use client";

import { useEffect, useState, useCallback } from "react";

interface Announcement {
  id: number;
  title: string;
  message: string;
  type: string;
  icon?: string;
  bg_color?: string;
  text_color?: string;
  has_action_button?: boolean;
  action_button_text?: string;
  action_button_url?: string;
}

export default function AnnouncementPopup() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/announcements/active?platform=web`
      );
      const data = await response.json();

      if (data.success && data.data.length > 0) {
        // Filter announcements that haven't been dismissed
        const dismissedIds = JSON.parse(
          localStorage.getItem("dismissedAnnouncements") || "[]"
        );
        const filtered = data.data.filter(
          (a: Announcement) => !dismissedIds.includes(a.id)
        );

        if (filtered.length > 0) {
          setAnnouncements(filtered);
          setIsVisible(true);

          // Track view
          trackAnnouncement(filtered[0].id, "VIEWED");
        }
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const trackAnnouncement = async (id: number, action: string) => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/announcements/track`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            announcement_id: id,
            user_id:
              localStorage.getItem("userPhone") ||
              localStorage.getItem("userEmail") ||
              "anonymous",
            action,
          }),
        }
      );
    } catch (error) {
      console.error("Error tracking announcement:", error);
    }
  };

  const handleDismiss = () => {
    const currentAnn = announcements[currentIndex];

    // Track dismiss
    trackAnnouncement(currentAnn.id, "DISMISSED");

    // Save to localStorage
    const dismissed = JSON.parse(
      localStorage.getItem("dismissedAnnouncements") || "[]"
    );
    dismissed.push(currentAnn.id);
    localStorage.setItem("dismissedAnnouncements", JSON.stringify(dismissed));

    // Show next or hide
    if (currentIndex < announcements.length - 1) {
      setCurrentIndex(currentIndex + 1);
      trackAnnouncement(announcements[currentIndex + 1].id, "VIEWED");
    } else {
      setIsVisible(false);
    }
  };

  const handleAction = () => {
    const currentAnn = announcements[currentIndex];
    trackAnnouncement(currentAnn.id, "CLICKED");

    if (currentAnn.action_button_url) {
      window.open(currentAnn.action_button_url, "_blank");
    }

    handleDismiss();
  };

  // Get accent color based on announcement type
  const getAccentColor = (type: string) => {
    switch (type) {
      case 'ERROR':
        return '#EF4444'; // red-500
      case 'WARNING':
        return '#F59E0B'; // amber-500
      case 'MAINTENANCE':
        return '#F59E0B'; // amber-500
      case 'PROMOTION':
        return '#A855F7'; // purple-500
      case 'INFO':
      default:
        return '#13DAEC'; // cyan
    }
  };

  // Get icon background color based on type
  const getIconBgColor = (type: string) => {
    switch (type) {
      case 'ERROR':
        return '#FEE2E2'; // red-100
      case 'WARNING':
        return '#FEF3C7'; // amber-100
      case 'MAINTENANCE':
        return '#FEF3C7'; // amber-100
      case 'PROMOTION':
        return '#F3E8FF'; // purple-100
      case 'INFO':
      default:
        return '#CFF9FE'; // cyan-100
    }
  };

  if (!isVisible || announcements.length === 0) return null;

  const currentAnn = announcements[currentIndex];
  const accentColor = getAccentColor(currentAnn.type);
  const iconBgColor = getIconBgColor(currentAnn.type);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl transform transition-all animate-fade-in"
      >
        {/* Icon with colored background */}
        {currentAnn.icon && (
          <div className="text-center mb-4">
            <div 
              className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-2"
              style={{ backgroundColor: iconBgColor }}
            >
              <span
                className="material-symbols-outlined text-5xl"
                style={{ color: accentColor }}
              >
                {currentAnn.icon}
              </span>
            </div>
          </div>
        )}

        {/* Title - always dark on white */}
        <h2
          className="text-2xl font-bold text-center mb-4"
          style={{ color: '#0D1C1C' }}
        >
          {currentAnn.title}
        </h2>

        {/* Message - gray text */}
        <p
          className="text-center mb-6 whitespace-pre-line leading-relaxed"
          style={{ color: '#64748B' }}
        >
          {currentAnn.message}
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          {currentAnn.has_action_button && (
            <button
              onClick={handleAction}
              className="flex-1 text-white font-bold py-3 rounded-xl transition-colors shadow-lg"
              style={{ 
                backgroundColor: accentColor,
                boxShadow: `0 10px 25px ${accentColor}30`
              }}
            >
              {currentAnn.action_button_text || "Learn More"}
            </button>
          )}

          <button
            onClick={handleDismiss}
            className="flex-1 text-white font-bold py-3 rounded-xl transition-colors shadow-lg"
            style={{ 
              backgroundColor: accentColor,
              boxShadow: `0 10px 25px ${accentColor}30`
            }}
          >
            {currentIndex < announcements.length - 1 ? "Next" : "Dismiss"}
          </button>
        </div>

        {/* Counter */}
        {announcements.length > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: announcements.length }).map((_, idx) => (
              <div
                key={idx}
                className="w-2 h-2 rounded-full transition-colors"
                style={{
                  backgroundColor: idx === currentIndex ? accentColor : '#CBD5E1'
                }}
              />
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
