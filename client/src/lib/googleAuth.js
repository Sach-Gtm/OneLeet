// Google sign-in is optional and only works when a client ID is provided at
// build time (VITE_GOOGLE_CLIENT_ID). It must be fully OFF when that's missing:
// Google's GSI library throws the moment its script loads if it was initialized
// with an empty client_id, which crashes the whole login page. So we neither
// mount the provider nor render the button unless a real client ID exists.
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
export const GOOGLE_ENABLED = Boolean(GOOGLE_CLIENT_ID);
