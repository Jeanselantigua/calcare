(function () {
  const form = document.getElementById("compare-form");
  const out = document.getElementById("compare-out");
  if (!form || !window.CalCareModel) return;

  const { compute, CARE_TYPES, money } = window.CalCareModel;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const zip = form.zip.value.trim();
    const age = form.age.value;
    const income = form.income.value;
    const schedule = form.schedule.value;
    const hours = form.hours.value;

    if (!/^\d{5}(-\d{4})?$/.test(zip)) {
      form.zip.focus();
      return;
    }

    const est = compute({
      zip,
      income,
      careType: "center",
      schedule,
      hours,
      children: [{ age }],
    });

    out.innerHTML = `
      <p class="estimate-label">All figures are estimates</p>
      <h2>Side-by-side for one child</h2>
      <p class="empty-state">Same ZIP, age band, and schedule across care types. Fees & food at $150/year included.</p>
      <div class="compare-table-wrap">
        <table class="compare-table">
          <thead>
            <tr>
              <th>Care type</th>
              <th>Monthly</th>
              <th>Annual</th>
              <th>vs. HHS 7%</th>
            </tr>
          </thead>
          <tbody>
            ${est.comparisons
              .map((c) => {
                const share = (c.annual * 0.85) / est.income; // rough OOP share proxy
                const flag = share <= 0.07 ? "Near/under" : "Over";
                return `<tr>
                  <td>${c.label}</td>
                  <td>${money(c.monthly)}</td>
                  <td>${money(c.annual)}</td>
                  <td>${flag} (est. ${ (share * 100).toFixed(1) }%)</td>
                </tr>`;
              })
              .join("")}
          </tbody>
        </table>
      </div>
      <p class="privacy-note">Tax savings vary by filing status and whether you use an FSA. Run the full <a href="calculator.html">Calculator</a> for out-of-pocket detail.</p>
    `;
  });
})();
