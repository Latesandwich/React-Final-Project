"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { readCheckoutDraft, type CheckoutData } from "@/lib/booking-validation";

const key = "cinemago_checkout";
const changeEvent = "cinemago-booking-change";
let memoryDraft: string | null = null;

function subscribe(notify: () => void) {
  window.addEventListener(changeEvent, notify);
  window.addEventListener("storage", notify);
  return () => {
    window.removeEventListener(changeEvent, notify);
    window.removeEventListener("storage", notify);
  };
}
function snapshot() {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return memoryDraft;
  }
}
function setCheckout(data: CheckoutData | null) {
  memoryDraft = data ? JSON.stringify(data) : null;
  try {
    if (memoryDraft) sessionStorage.setItem(key, memoryDraft);
    else sessionStorage.removeItem(key);
  } catch {
    /* Booking still works in memory when browser storage is blocked. */
  }
  window.dispatchEvent(new Event(changeEvent));
}

const BookingContext = createContext<{
  data: CheckoutData | null;
  ready: boolean;
  setCheckout: typeof setCheckout;
} | null>(null);

// CHECK 03 — Context shares a booking draft across routes. This is client-only UI state.
// Stable string snapshots avoid effect-based hydration and match SSR's empty draft.
export function BookingProvider({ children }: { children: ReactNode }) {
  const raw = useSyncExternalStore(subscribe, snapshot, () => null);
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const data = useMemo(() => readCheckoutDraft(raw), [raw]);
  return (
    <BookingContext.Provider value={{ data, ready, setCheckout }}>
      {children}
    </BookingContext.Provider>
  );
}
export function useBooking() {
  const value = useContext(BookingContext);
  if (!value) throw new Error("useBooking requires BookingProvider");
  return value;
}
