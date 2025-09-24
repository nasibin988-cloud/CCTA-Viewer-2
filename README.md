This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/pages/api-reference/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/pages/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## CCTA Viewer Logic Explanation

### Fractional Flow Reserve (FFRct) Simulation and Visualization

This application employs a sophisticated simulation of FFRct to provide a more granular and clinically intuitive visualization of coronary artery disease.

1.  **Pullback Data Simulation**:
    * Instead of a single FFRct value per coronary segment, the source JSON data (`sample-serial.json`) contains a `ffrct_pullback` field for each segment.
    * This field is an array of 10 numbers, simulating FFR measurements taken at equidistant points from the proximal (start) to the distal (end) end of the segment.
    * The data is generated to be physiologically consistent: FFR values either remain stable or decrease as you move distally down a vessel, reflecting the pressure drop caused by stenoses. An FFR value can never increase in the direction of blood flow.

2.  **Segment FFR Value**:
    * For reporting and visualization purposes, a single representative FFR value is needed for each segment.
    * Based on clinical conventions, the **most distal value** (the last element in the `ffrct_pullback` array) is assigned as the segment's primary `ffrct` value. This value captures the cumulative hemodynamic impact of all disease within and before that segment.
    * It is crucial to understand that *all* FFR values, whether proximal or distal within a segment, are a ratio of the pressure at that point (`Pd`) to the pressure at the aorta (`Pa`). They are not relative to each other.

3.  **Continuous Color Spectrum**:
    * To visually represent FFRct, the application avoids simple categorical legends (e.g., "Normal," "Borderline"). Instead, it uses a continuous color spectrum ranging from deep red (FFR 0.50, highly significant disease) to yellow (around 0.75-0.80, gray zone) to green and finally to blue (FFR 1.00, perfectly normal).
    * This approach provides a more nuanced and immediate visual assessment of hemodynamic significance, mirroring the continuous nature of FFR itself.
    * The color for each segment on the anatomical map and bar charts corresponds directly to its distal FFR value mapped onto this spectrum.

    Physiological FFRct Hierarchy:

The FFRct data must adhere to the physical principle that blood pressure can only decrease or stay the same as it flows through a vessel. An FFRct value in a downstream (distal) segment can never be higher than in an upstream (proximal) segment.

The following inequalities must hold true for the distal FFRct value of each segment:

RCA Chain:

Seg 1 >= Seg 2

Seg 2 >= Seg 3

Seg 3 >= Seg 4 (R-PDA)

Seg 3 >= Seg 16 (R-PLB)

Left Main & LAD Chain:

Seg 5 >= Seg 6 (Prox LAD)

Seg 6 >= Seg 7 (Mid LAD)

Seg 7 >= Seg 8 (Distal LAD)

Seg 7 >= Seg 9 (D1)

Seg 7 >= Seg 10 (D2)

Left Main & LCx Chain:

Seg 5 >= Seg 11 (Prox LCx)

Seg 5 >= Seg 17 (Ramus)

Seg 11 >= Seg 12 (OM1)

Seg 11 >= Seg 13 (Dist LCx)

Seg 13 >= Seg 14 (OM2)

Seg 13 >= Seg 15 (L-PDA)

Seg 13 >= Seg 18 (L-PLB)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn-pages-router) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/pages/building-your-application/deploying) for more details.