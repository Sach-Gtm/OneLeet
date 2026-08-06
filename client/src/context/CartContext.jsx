/* eslint-disable react-refresh/only-export-components -- context module intentionally exports the provider component and the useCart hook together */
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { computeCart } from "@/data/pricing";

// A lightweight shopping cart for course batches, persisted to localStorage so it
// survives a refresh / the login round-trip. Items are minimal snapshots
// ({ slug, name, price, subtitle }); the authoritative price is re-fetched
// server-side at order time, so a stale cart price can never be charged.
const CartContext = createContext(null);
const KEY = "oneleet_cart";

const load = () => {
    try {
        const raw = JSON.parse(localStorage.getItem(KEY));
        return Array.isArray(raw) ? raw : [];
    } catch {
        return [];
    }
};

export function CartProvider({ children }) {
    const [items, setItems] = useState(load);

    useEffect(() => {
        try {
            localStorage.setItem(KEY, JSON.stringify(items));
        } catch {
            /* storage blocked — cart still lives in state for this session */
        }
    }, [items]);

    const add = useCallback((item) => {
        setItems((prev) => (prev.some((i) => i.slug === item.slug) ? prev : [...prev, item]));
    }, []);
    const remove = useCallback((slug) => setItems((prev) => prev.filter((i) => i.slug !== slug)), []);
    const clear = useCallback(() => setItems([]), []);
    const has = useCallback((slug) => items.some((i) => i.slug === slug), [items]);
    const toggle = useCallback(
        (item) => setItems((prev) => (prev.some((i) => i.slug === item.slug) ? prev.filter((i) => i.slug !== item.slug) : [...prev, item])),
        []
    );

    const totals = useMemo(() => computeCart(items), [items]);

    const value = useMemo(
        () => ({ items, add, remove, clear, has, toggle, totals, count: items.length }),
        [items, add, remove, clear, has, toggle, totals]
    );
    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart must be used within a CartProvider");
    return ctx;
}
