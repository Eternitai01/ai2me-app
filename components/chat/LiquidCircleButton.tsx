"use client";

import { LiquidMetal } from "@paper-design/shaders-react";
import { ReactNode, forwardRef } from "react";
import { useTheme } from "@/context/ThemeContext";

interface LiquidCircleButtonProps {
    onClick?: () => void;
    disabled?: boolean;
    isLoading?: boolean;
    children?: ReactNode;
    className?: string;
    ariaLabel?: string;
    variant?: "circle" | "rect";
    offsetX?: number;
    offsetY?: number;
    liquidColor?: string;
    colorTint?: string;
}

function ArrowUpIcon() {
    return (
        <svg
            className="arrow-ic"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <path
                d="M12 19V6"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
            />
            <path
                d="M6 10l6-6 6 6"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

const LiquidCircleButton = forwardRef<HTMLButtonElement, LiquidCircleButtonProps>(
    function LiquidCircleButton({
        onClick,
        disabled = false,
        isLoading = false,
        children,
        className = "",
        ariaLabel = "Button",
        variant = "circle",
        offsetX = -0.1,
        offsetY = -0.1,
        liquidColor,
        colorTint = "#ffffff",
    }, ref) {
        const { theme } = useTheme();
        const isCircle = variant === "circle";
        const baseClasses = isCircle ? "circle-btn" : "liquid-btn";
        const ringClasses = isCircle ? "circle-ring" : "liquid-btn-ring";
        const glassClasses = isCircle ? "circle-glass" : "liquid-btn-glass";

        const defaultLiquidColor = theme === "light" ? "#4a4a4a" : "#9da0a8";
        const finalLiquidColor = liquidColor || defaultLiquidColor;

        return (
            <button
                ref={ref}
                type="button"
                onClick={onClick}
                disabled={disabled || isLoading}
                className={`${baseClasses} ${className}`}
                aria-label={ariaLabel}
            >
                <div className={ringClasses}>
                    <LiquidMetal
                        width={260}
                        height={260}
                        colorBack={finalLiquidColor}
                        colorTint={colorTint}
                        repetition={2.6}
                        softness={0.35}
                        shiftRed={0.55}
                        shiftBlue={1}
                        distortion={0.26}
                        contour={0.5}
                        angle={70}
                        speed={1}
                        scale={1}
                        offsetX={offsetX}
                        offsetY={offsetY}
                        fit="cover"
                    />
                </div>
                <div className={glassClasses}>
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                        children || <ArrowUpIcon />
                    )}
                </div>
            </button>
        );
    }
);


export default LiquidCircleButton;
