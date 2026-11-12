# CalCare

Know the true cost of childcare before you choose it.

Static multi-page site (HTML / CSS / JS). No build step.

## Run locally

```bash
cd /home/ubuntu/calcare
python3 -m http.server 8080 --bind 127.0.0.1
```

Open [http://127.0.0.1:8080](http://127.0.0.1:8080).

Any static file server works. The site is publishable as static hosting.

## Pages

| Page | File |
|------|------|
| Home | `index.html` |
| Calculator | `calculator.html` |
| Compare | `compare.html` |
| Savings & Assistance | `savings.html` |
| Market | `market.html` |
| FAQ & Contact | `faq.html` |
| Team | `team.html` |

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
