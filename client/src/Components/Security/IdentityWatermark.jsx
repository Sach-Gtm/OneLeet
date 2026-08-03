import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { watermarkText, watermarkImage, openedStamp } from "@/lib/contentProtection";

// A lightweight, non-intrusive identity watermark for general app pages — just
// the tiled overlay, no copy-blocking or blackout (those belong on premium
// content via ProtectedContent). It stamps the signed-in student's name +
// contact faintly across the page so even a casual screenshot of the app is
// traceable to the account. `pointer-events-none` means it never interferes.
//
// Defaults to a `fixed` viewport overlay so it covers the page regardless of
// scroll; it unmounts with the page, so it only appears where it's mounted.
export default function IdentityWatermark({ opacity = 0.06, fixed = true, className = "" }) {
    const { user } = useAuth();
    const img = useMemo(
        () => watermarkImage(watermarkText(user), openedStamp(), opacity),
        [user, opacity]
    );
    if (!user) return null;
    return (
        <div
            aria-hidden="true"
            className={`pointer-events-none ${fixed ? "fixed" : "absolute"} inset-0 z-[5] ${className}`}
            style={{ backgroundImage: img, backgroundRepeat: "repeat" }}
        />
    );
}
