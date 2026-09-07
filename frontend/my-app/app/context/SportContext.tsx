"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type SportType = "football" | "basketball";

interface SportContextType {
  sport: SportType;
  setSport: (sport: SportType) => void;
  isFootball: boolean;
  isBasketball: boolean;
}

const SportContext = createContext<SportContextType | undefined>(undefined);

export function SportProvider({ children }: { children: React.ReactNode }) {
  const [sport, setSportState] = useState<SportType>("football");

  // Đọc từ localStorage nếu có
  useEffect(() => {
    try {
      const savedSport = localStorage.getItem("iknowball_sport") as SportType;
      if (savedSport === "football" || savedSport === "basketball") {
        setSportState(savedSport);
      }
    } catch {
      // bỏ qua lỗi đọc localStorage
    }
  }, []);

  const setSport = (newSport: SportType) => {
    setSportState(newSport);
    try {
      localStorage.setItem("iknowball_sport", newSport);
    } catch {
      // bỏ qua lỗi lưu
    }
  };

  return (
    <SportContext.Provider
      value={{
        sport,
        setSport,
        isFootball: sport === "football",
        isBasketball: sport === "basketball",
      }}
    >
      {children}
    </SportContext.Provider>
  );
}

export function useSport() {
  const context = useContext(SportContext);
  if (!context) {
    // Giá trị fallback an toàn nếu dùng ngoài Provider
    return {
      sport: "football" as SportType,
      setSport: () => {},
      isFootball: true,
      isBasketball: false,
    };
  }
  return context;
}
