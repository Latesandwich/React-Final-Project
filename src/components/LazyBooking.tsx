"use client";

import dynamic from "next/dynamic";

function WidgetLoading({ label }: { label: string }) {
  return (
    <div role="status" aria-busy="true" className="cg-panel min-h-60 p-8">
      <p className="text-sm text-neutral-400">{label}</p>
      <div aria-hidden="true" className="mt-5 h-36 animate-pulse rounded-xl bg-neutral-800 motion-reduce:animate-none" />
    </div>
  );
}

// A client boundary lets Next split these interactive widgets into separate chunks.
// Keep SSR enabled; only load the widget used by the current route.
export const LazySeatSelector = dynamic(() => import("./SeatSelector"), {
  loading: () => <WidgetLoading label="กำลังโหลดผังที่นั่ง…" />,
});

export const LazyCheckoutForm = dynamic(() => import("./CheckoutForm"), {
  loading: () => <WidgetLoading label="กำลังโหลดฟอร์มยืนยันการจอง…" />,
});
