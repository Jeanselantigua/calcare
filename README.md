# CalCare

Know the true cost of childcare before you choose it.

Static multi-page site (HTML / CSS / JS). No build step.

## Run locally

```bash
npx serve -l 8080 .
```

Open [http://localhost:8080](http://localhost:8080).

Links use clean URLs (`/compare`, not `/compare.html`), so the server must map `/compare` to `compare.html`. `serve`, GitHub Pages, and Netlify do this by default; on Vercel set `"cleanUrls": true` in `vercel.json`. `python -m http.server` does not, so links between pages will 404 there.

## Pages

| Page | URL | File |
|------|-----|------|
| Home | `/` | `index.html` |
| Calculator | `/calculator` | `calculator.html` |
| Compare | `/compare` | `compare.html` |
| Savings & Assistance | `/savings` | `savings.html` |
| Market | `/market` | `market.html` |
| FAQ & Contact | `/faq` | `faq.html` |
| Team | `/team` | `team.html` |

## Cost model (assumptions)

All outputs are **estimates**:

- Base full-time monthly rates by care type × age band (national-ish baselines in `js/calculator.js`).
- ZIP → regional multiplier (higher for CA / NYC / Seattle prefixes; otherwise a mild deterministic factor).
- Part-time = `weeklyHours / 40` × full-time rate.
- Incidental fees & food: **$150 per child per year**.
- Dependent Care FSA: up to $5,000 of care costs × simplified marginal rate from income midpoint.
- Child & Dependent Care Tax Credit: income-based rate (35%→20%) on remaining eligible expenses up to $3,000 / $6,000.
- HHS affordability: out-of-pocket annual ÷ income midpoint vs **7%** benchmark.
- Multi-year projection: 5 years at **~4%** annual growth.
- Provider listings: **mock/sample** near the entered ZIP.

Not tax, legal, or financial advice.

## Business note

Basic calculator always free. No subscriptions. Revenue via partnerships, donations, possibly ads.
