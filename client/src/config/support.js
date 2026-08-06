// Premium WhatsApp support — the founder's WhatsApp Business line. Only premium
// (pro) students get to message here, with a within-6-hours response commitment.
// Kept in one place so the pricing pitch, the in-app button and any deep links
// all use the same number and promise.

export const WHATSAPP_NUMBER = "919355446497"; // +91 93554 46497, country code included
export const WHATSAPP_RESPONSE = "within 6 hours";

// wa.me deep link, optionally pre-filling a message.
export const whatsappLink = (message) =>
    `https://wa.me/${WHATSAPP_NUMBER}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
