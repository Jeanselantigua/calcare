(function () {
  const AGE_BANDS = [
    { id: "infant", label: "Infant (0–12 mo)" },
    { id: "toddler", label: "Toddler (1–2)" },
    { id: "preschool", label: "Preschool (3–5)" },
    { id: "school", label: "School age (6–12)" },
  ];

  const CARE_TYPES = [
    { id: "center", label: "Childcare center" },
    { id: "home", label: "Home daycare" },
    { id: "nanny", label: "In-home nanny" },
    { id: "aupair", label: "Au pair" },
    { id: "sitter", label: "Babysitter / after-school" },
  ];

  // Base full-time monthly rates by care type × age (USD, national-ish estimates)
  const BASE_MONTHLY = {
    center: { infant: 1650, toddler: 1450, preschool: 1250, school: 780 },
    home: { infant: 1250, toddler: 1100, preschool: 980, school: 620 },
    nanny: { infant: 3200, toddler: 3100, preschool: 3000, school: 2800 },
    aupair: { infant: 1950, toddler: 1950, preschool: 1900, school: 1850 },
    sitter: { infant: 1400, toddler: 1300, preschool: 1100, school: 900 },
  };

  const INCOME_MIDPOINTS = {
    under40: 30000,
    "40-70": 55000,
    "70-100": 85000,
    "100-150": 125000,
    "150-200": 175000,
    over200: 250000,
  };

  const FEE_PER_CHILD_YEAR = 150;

  function zipMultiplier(zip) {
    const z = String(zip || "").replace(/\D/g, "");
    if (z.length < 3) return 1;
    const prefix = Number(z.slice(0, 3));
    // Rough CA / high-cost coastal uplift for demo
    if (prefix >= 900 && prefix <= 961) return 1.28;
    if (prefix >= 100 && prefix <= 149) return 1.35; // NYC area
    if (prefix >= 980 && prefix <= 994) return 1.22; // Seattle
    if (prefix >= 600 && prefix <= 629) return 1.08; // Chicago
    if (prefix >= 750 && prefix <= 799) return 0.95; // TX
    return 0.92 + (prefix % 20) * 0.01;
  }

  function marginalRate(income) {
    if (income < 40000) return 0.12;
    if (income < 90000) return 0.22;
    if (income < 180000) return 0.24;
    return 0.32;
  }

  function cdctcRate(agi) {
    // Simplified: 35% down to 20%
    if (agi <= 15000) return 0.35;
    if (agi >= 43000) return 0.2;
    return 0.35 - Math.floor((agi - 15000) / 2000) * 0.01;
  }

  function hoursFactor(schedule, hours) {
    if (schedule === "full") return 1;
    const h = Math.max(5, Math.min(40, Number(hours) || 20));
    return h / 40;
  }

  function estimateChildMonthly(careType, age, mult, factor) {
    const base = BASE_MONTHLY[careType]?.[age] ?? 1000;
    return base * mult * factor;
  }

  function money(n) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(Math.round(n));
  }

  function pct(n) {
    return `${(n * 100).toFixed(1)}%`;
  }

  function sampleProviders(zip, careType, monthly) {
    const area = String(zip || "00000").slice(0, 5) || "00000";
    const names = {
      center: ["Sunshine Learning Center", "Little Harbor Academy", "Oak Street Early Care"],
      home: ["Casa Amiga Family Daycare", "Maple Nest Home Care", "Riverbend Family Child Care"],
      nanny: ["Bay Nanny Collective", "Trusted Home Care Pros", "Family First Nanny Network"],
      aupair: ["Pacific Au Pair Match", "Global Care Exchange", "Host Family Bridge"],
      sitter: ["AfterSchool Hub", "Neighborhood Sitters Co-op", "FlexCare Sitters"],
    };
    const list = names[careType] || names.center;
    return list.map((name, i) => ({
      name,
      detail: `Near ${area} · sample listing · estimate ~${money(monthly * (0.9 + i * 0.08))}/mo`,
    }));
  }

  function compute(state) {
    const mult = zipMultiplier(state.zip);
    const factor = hoursFactor(state.schedule, state.hours);
    const income = INCOME_MIDPOINTS[state.income] || 85000;
    const children = state.children.length ? state.children : [{ age: "preschool" }];

    let careMonthly = 0;
    const lines = children.map((c, i) => {
      const m = estimateChildMonthly(state.careType, c.age, mult, factor);
      careMonthly += m;
      return {
        label: `Child ${i + 1} (${AGE_BANDS.find((a) => a.id === c.age)?.label || c.age})`,
        monthly: m,
      };
    });

    const feesAnnual = children.length * FEE_PER_CHILD_YEAR;
    const feesMonthly = feesAnnual / 12;
    const grossMonthly = careMonthly + feesMonthly;
    const grossAnnual = grossMonthly * 12;

    // FSA: up to 5000 of eligible care (exclude fees simplification: use care only)
    const fsaCap = 5000;
    const fsaEligible = Math.min(careMonthly * 12, fsaCap);
    const fsaSavings = fsaEligible * marginalRate(income);

    // CDCTC: simplified — credit on eligible care beyond FSA, capped at $3k/$6k.
    const creditLimit = children.length >= 2 ? 6000 : 3000;
    const creditBase = Math.min(Math.max(0, careMonthly * 12 - fsaEligible), creditLimit);
    const creditSavings = creditBase * cdctcRate(income);

    const taxSavingsAnnual = fsaSavings + creditSavings;
    const oopAnnual = Math.max(0, grossAnnual - taxSavingsAnnual);
    const oopMonthly = oopAnnual / 12;
    const affordShare = oopAnnual / income;

    const years = [];
    let running = grossAnnual;
    for (let y = 1; y <= 5; y++) {
      years.push({ year: y, cost: running });
      running *= 1.04; // 4% annual growth assumption
    }

    const comparisons = CARE_TYPES.map((ct) => {
      let m = 0;
      children.forEach((c) => {
        m += estimateChildMonthly(ct.id, c.age, mult, factor);
      });
      m += feesMonthly;
      return { id: ct.id, label: ct.label, monthly: m, annual: m * 12 };
    });

    return {
      mult,
      income,
      lines,
      careMonthly,
      feesMonthly,
      feesAnnual,
      grossMonthly,
      grossAnnual,
      fsaSavings,
      creditSavings,
      taxSavingsAnnual,
      oopMonthly,
      oopAnnual,
      affordShare,
      years,
      comparisons,
      providers: sampleProviders(state.zip, state.careType, careMonthly / Math.max(1, children.length)),
    };
  }

  // --- UI wiring ---
  const form = document.getElementById("calc-form");
  if (!form) return;

  const childrenEl = document.getElementById("children-rows");
  const resultsEl = document.getElementById("calc-results");
  let period = "monthly";

  function childRow(age = "preschool") {
    const row = document.createElement("div");
    row.className = "child-row";
    row.innerHTML = `
      <div class="field" style="margin:0">
        <label>Age band</label>
        <select name="age">
          ${AGE_BANDS.map((a) => `<option value="${a.id}" ${a.id === age ? "selected" : ""}>${a.label}</option>`).join("")}
        </select>
      </div>
      <p class="hint" style="margin:0;align-self:center;color:var(--text-muted);font-size:var(--text-xs)">Fees & food: $150/child/year (estimate)</p>
      <button type="button" class="btn btn--ghost remove-child">Remove</button>
    `;
    row.querySelector(".remove-child").addEventListener("click", () => {
      if (childrenEl.querySelectorAll(".child-row").length <= 1) return;
      row.remove();
    });
    return row;
  }

  childrenEl.appendChild(childRow("infant"));

  document.getElementById("add-child")?.addEventListener("click", () => {
    childrenEl.appendChild(childRow("toddler"));
  });

  document.querySelectorAll("[data-period]").forEach((btn) => {
    btn.addEventListener("click", () => {
      period = btn.getAttribute("data-period");
      document.querySelectorAll("[data-period]").forEach((b) =>
        b.setAttribute("aria-pressed", String(b === btn))
      );
      if (resultsEl.dataset.ready === "1") render(lastEstimate);
    });
  });

  let lastEstimate = null;

  function readState() {
    const children = [...childrenEl.querySelectorAll(".child-row")].map((row) => ({
      age: row.querySelector('select[name="age"]').value,
    }));
    return {
      zip: form.zip.value.trim(),
      income: form.income.value,
      careType: form.careType.value,
      schedule: form.schedule.value,
      hours: form.hours.value,
      children,
    };
  }

  function render(est) {
    lastEstimate = est;
    const unit = period === "monthly" ? "/mo" : "/yr";
    const amt = (monthly) => money(period === "monthly" ? monthly : monthly * 12);

    const status = est.affordShare <= 0.07 ? "ok" : "high";
    const statusText =
      est.affordShare <= 0.07
        ? "At or under the 7% HHS affordability benchmark (estimate)."
        : "Above the 7% HHS affordability benchmark (estimate).";

    resultsEl.innerHTML = `
      <p class="estimate-label">All figures are estimates</p>
      <h2>Your cost estimate</h2>
      <p class="empty-state">Regional multiplier for ZIP ${form.zip.value || "—"}: ×${est.mult.toFixed(2)}. Part-time scaled by weekly hours.</p>
      <div class="metric-grid">
        <div class="metric"><span class="label">Care + fees ${unit}</span><span class="value">${amt(est.grossMonthly)}</span></div>
        <div class="metric"><span class="label">Est. tax savings ${unit}</span><span class="value">${amt(est.taxSavingsAnnual / 12)}</span></div>
        <div class="metric"><span class="label">Out-of-pocket ${unit}</span><span class="value">${amt(est.oopMonthly)}</span></div>
        <div class="metric"><span class="label">Share of income</span><span class="value">${pct(est.affordShare)}</span></div>
      </div>
      <div class="affordability" data-status="${status}">
        <strong>${pct(est.affordShare)}</strong> of estimated household income goes to childcare after modeled tax savings. ${statusText}
      </div>
      <h3>Breakdown</h3>
      <table class="breakdown">
        <thead><tr><th>Item</th><th>${period === "monthly" ? "Monthly" : "Annual"}</th></tr></thead>
        <tbody>
          ${est.lines.map((l) => `<tr><td>${l.label}</td><td>${amt(l.monthly)}</td></tr>`).join("")}
          <tr><td>Incidental fees & food</td><td>${amt(est.feesMonthly)}</td></tr>
          <tr><td><strong>Subtotal</strong></td><td><strong>${amt(est.grossMonthly)}</strong></td></tr>
          <tr><td>Dependent Care FSA savings (est.)</td><td>−${amt(est.fsaSavings / 12)}</td></tr>
          <tr><td>Child & Dependent Care Tax Credit (est.)</td><td>−${amt(est.creditSavings / 12)}</td></tr>
          <tr><td><strong>Out-of-pocket</strong></td><td><strong>${amt(est.oopMonthly)}</strong></td></tr>
        </tbody>
      </table>
      <h3>Multi-year projection</h3>
      <p class="empty-state">Assumes ~4% annual price growth. Labels are estimates.</p>
      <div class="chart" id="year-chart">
        ${est.years
          .map((y) => {
            const max = est.years[est.years.length - 1].cost;
            const width = Math.round((y.cost / max) * 100);
            return `<div class="chart-bar"><span>Year ${y.year}</span><div class="chart-bar__track"><div class="chart-bar__fill" style="width:${width}%"></div></div><span>${money(y.cost)}</span></div>`;
          })
          .join("")}
      </div>
      <h3>Care-type comparison</h3>
      <div class="compare-table-wrap">
        <table class="compare-table">
          <thead><tr><th>Care type</th><th>Monthly est.</th><th>Annual est.</th></tr></thead>
          <tbody>
            ${est.comparisons
              .map(
                (c) =>
                  `<tr><td>${c.label}${c.id === form.careType.value ? " (selected)" : ""}</td><td>${money(c.monthly)}</td><td>${money(c.annual)}</td></tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>
      <h3>Sample providers near your ZIP</h3>
      <p class="empty-state">Mock listings for illustration — not a live directory. Prices are estimates.</p>
      <ul class="provider-list">
        ${est.providers.map((p) => `<li><h3>${p.name}</h3><p>${p.detail}</p></li>`).join("")}
      </ul>
      <h3>Financial assistance</h3>
      <ul class="assist-links">
        <li><a href="https://www.childcareaware.org/" rel="noopener noreferrer" target="_blank">Child Care Aware of America</a></li>
        <li><a href="https://childcare.gov/" rel="noopener noreferrer" target="_blank">ChildCare.gov</a></li>
        <li><a href="https://www.first5kids.org/" rel="noopener noreferrer" target="_blank">FIRST 5 Santa Clara County</a></li>
        <li><a href="https://www.choicesforchildren.org/" rel="noopener noreferrer" target="_blank">Choices for Children</a></li>
        <li><a href="savings.html">More on Savings &amp; Assistance</a></li>
      </ul>
    `;
    resultsEl.dataset.ready = "1";
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const zipInput = form.elements.namedItem("zip");
    const zip = String(zipInput && "value" in zipInput ? zipInput.value : "").trim();
    if (!/^\d{5}(-\d{4})?$/.test(zip)) {
      if (zipInput && "setAttribute" in zipInput) {
        zipInput.setAttribute("aria-invalid", "true");
        zipInput.focus();
      }
      const err = document.getElementById("zip-error");
      if (err) err.textContent = "Enter a 5-digit ZIP code.";
      return;
    }
    if (zipInput && "removeAttribute" in zipInput) zipInput.removeAttribute("aria-invalid");
    const err = document.getElementById("zip-error");
    if (err) err.textContent = "";
    const est = compute(readState());
    render(est);
    const heading = resultsEl.querySelector("h2");
    if (heading) {
      heading.setAttribute("tabindex", "-1");
      heading.focus();
    }
  });

  // Compare page helper
  window.CalCareModel = { compute, CARE_TYPES, AGE_BANDS, money, zipMultiplier, FEE_PER_CHILD_YEAR, INCOME_MIDPOINTS };
})();
