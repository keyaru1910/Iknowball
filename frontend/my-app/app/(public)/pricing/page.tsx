"use client";

import React from "react";
import PricingSection from "../../components/PricingSection";

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <PricingSection id="pricing-page" showFaq={true} />
    </div>
  );
}
