// Premium WhatsApp support — the founder's WhatsApp Business line. Only premium
// (pro) students get to message here, with a within-6-hours response commitment.
// Kept in one place so the pricing pitch, the in-app button and any deep links
// all use the same number and promise.

export const WHATSAPP_NUMBER = "919711688538"; // +91 97116 88538, country code included
export const WHATSAPP_RESPONSE = "within 6 hours";

// wa.me deep link to OUR line, optionally pre-filling a message (premium support).
export const whatsappLink = (message) =>
    `https://wa.me/${WHATSAPP_NUMBER}${message ? `?text=${encodeURIComponent(message)}` : ""}`;

// wa.me share link with NO recipient — opens WhatsApp so the sender picks which
// contact to share the message with. Used for referral sharing (share your code
// with a friend), NOT for contacting us.
export const whatsappShareLink = (message) =>
    `https://wa.me/?text=${encodeURIComponent(message || "")}`;
