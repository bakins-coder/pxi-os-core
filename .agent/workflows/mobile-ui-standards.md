---
description: Mobile UI and UX standards for PXI OS Core
---

# Mobile UI & UX Standards

These standards were established during the banquet creation module refinement to ensure a premium, consistent mobile experience. Refer to these guidelines when building or updating mobile views.

## 1. Layout & Sizing
- **Card Uniformity**: Always use a fixed width for horizontally scrollable cards (e.g., `w-[82vw]`) to prevent layout shifting when content (like descriptions) varies in length.
- **Image Aspect Ratios**: Use a minimum height of `h-48` for food/product images on mobile with `object-cover` to ensure subject visibility without awkward cropping.
- **Scroll Buffer**: Implement significant bottom padding (e.g., `pb-64`) on main scrollable areas to ensure content can be scrolled fully above sticky footers/action bars.

## 2. Typography & Content
- **Descriptions**: Avoid `line-clamp` on mobile for critical information. Allow descriptions to wrap fully using `whitespace-pre-wrap` and `break-words`.
- **Micro-Labels**: Use `text-[10px]` or `text-[8px]` font sizes for auxiliary labels (like category titles or metadata) to maximize screen real estate.
- **Uppercase Styling**: Use `font-black uppercase tracking-widest` for secondary labels to maintain a premium "dashboard" aesthetic.

## 3. Navigation & Hierarchy
- **Sticky Headers**: Use compact sticky headers (`py-1` to `py-2`) with high transparency/blur (`bg-white/95 backdrop-blur`) for context preservation while scrolling.
- **Header Density**: Reduce vertical gaps in headers on mobile (e.g., `gap-2` instead of `gap-4`).
- **Dividers**: Prefer whitespace or extremely subtle borders (e.g., `border-slate-50`) over dark or heavy lines to reduce visual noise.

## 4. Interaction Design
- **Action Footers**: Keep mobile action bars compact but high-contrast. Buttons should be large enough for touch but minimal in padding to save space.
- **Input Controls**: Compact numeric inputs (`w-12`) and sleek range sliders are preferred for quick quantity adjustments.
- **Loading States**: Always use micro-animations (e.g., `animate-spin` on RefreshCw) during submissions.
