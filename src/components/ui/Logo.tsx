import Image from "next/image";
import React from "react";

interface LogoProps {
  iconSize?: number;
  textSize?: string;
  subTextSize?: string;
  hideTextOnMobile?: boolean;
}

export function Logo({ 
  iconSize = 32, 
  textSize = "text-2xl", 
  subTextSize = "text-[9px]",
  hideTextOnMobile = false
}: LogoProps) {
  return (
    <div className="flex items-center gap-2">
      <Image 
        src="/logo.png" 
        alt="FreelancePay Logo" 
        width={iconSize} 
        height={iconSize} 
        className="object-contain shrink-0"
      />
      <div className={`min-w-0 flex flex-col justify-center ${hideTextOnMobile ? 'hidden sm:flex' : 'flex'}`}>
        <span className={`${textSize} font-headline-lg text-primary leading-none truncate block`}>
          FreelancePay
        </span>
        <span className={`text-on-surface-variant font-ui-label ${subTextSize} uppercase tracking-wider truncate block mt-0.5`}>
          Infrastructure
        </span>
      </div>
    </div>
  );
}
