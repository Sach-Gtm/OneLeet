// A tiny app-wide bus for the "Request a callback" modal, which lives in the
// Footer. Any screen (e.g. the dashboard paper-pattern card) can ask for it to
// open without prop-drilling or a context — it just fires this event and the
// Footer, which is rendered on every page, opens the modal.
export const CALLBACK_EVENT = "oneleet:open-callback";

export const openCallback = () => {
    window.dispatchEvent(new Event(CALLBACK_EVENT));
};
