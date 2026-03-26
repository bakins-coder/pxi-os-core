# TASK: Invoice Share — Bank Details Not Visible

**Assigned To:** Nova  
**Priority:** High  
**Reported By:** Akin (via Prof)  
**Date:** 2026-03-26

---

## Problem Statement

When an Xquisite invoice is **shared** with a customer (using the Share button/option in the `WaveInvoiceModal`), the **Bank Details / Payment Information section is missing** from the shared version.

The section IS visible when the user takes a **screenshot** of the on-screen invoice, but does NOT appear when the invoice is shared (e.g., shared as an image via the Web Share API or exported).

See the attached screenshot showing the invoice — note the `Bank Details:` section appears truncated/cut off at the bottom.

---

## Root Cause Hypothesis

The invoice likely uses `html2canvas` or `dom-to-image` to capture the invoice DOM before sharing. The bank details section may be:

1. **Cut off** due to scroll/container overflow — `html2canvas` only captures the visible viewport unless configured correctly.
2. **Conditionally rendered** and hidden in the export view (e.g., a CSS `@media print` rule, or a conditional `hidden` class applied during export mode).
3. **Rendered below the fold** and the canvas capture height is not set to the full scroll height.

---

## What To Investigate

1. **Find the Share function** in `src/components/Finance.tsx` or `src/utils/exportUtils.ts` — look for `html2canvas`, `toBlob`, `dom-to-image`, `navigator.share`, or Canvas-based capture.
2. **Check the `WaveInvoiceModal`** — it is the component that renders the invoice. Look at how the bank details section is rendered and whether it has any visibility conditions tied to `isPrinting`, `isExporting`, or similar flags.
3. **Check scroll/overflow** — the invoice modal likely has `overflow-y: auto` or `max-h-[...]`. This clips `html2canvas`. The capture element must have its full height exposed before screenshot.

---

## Expected Fix

The shared invoice image must include the complete bank details section, identical to what is visible on screen.

---

## Files Likely Involved

- `src/components/Finance.tsx` — WaveInvoiceModal
- `src/utils/exportUtils.ts` — generateInvoicePDF or share utilities
- `src/components/Catering.tsx` — may contain share trigger

---

## Deliverable

A fix to `exportUtils.ts` and/or `Finance.tsx` ensuring that:
- The full invoice including bank details is captured before sharing
- The export function scrolls/resizes the container to full height before capture

Deliver fix to **Akin's Inbox** when complete.
