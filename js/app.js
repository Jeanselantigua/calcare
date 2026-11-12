(function () {
  const root = document.documentElement;
  const stored = localStorage.getItem("calcare-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initial = stored || (prefersDark ? "dark" : "light");
  root.setAttribute("data-theme", initial);

  function setTheme(next) {
    root.classList.add("theme-switching");
    root.setAttribute("data-theme", next);
    localStorage.setItem("calcare-theme", next);
    const btn = document.getElementById("theme-toggle");
    if (btn) {
      btn.setAttribute("aria-pressed", String(next === "dark"));
      btn.textContent = next === "dark" ? "Light" : "Dark";
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => root.classList.remove("theme-switching"));
    });
  }

  document.getElementById("theme-toggle")?.addEventListener("click", () => {
    const current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
    setTheme(current === "dark" ? "light" : "dark");
  });

  const themeBtn = document.getElementById("theme-toggle");
  if (themeBtn) {
    themeBtn.setAttribute("aria-pressed", String(initial === "dark"));
    themeBtn.textContent = initial === "dark" ? "Light" : "Dark";
  }

  const navToggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("site-nav");
  navToggle?.addEventListener("click", () => {
    const open = nav?.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(Boolean(open)));
  });

  // Chatbot heuristic replies
  const panel = document.getElementById("chat-panel");
  const toggle = document.getElementById("chat-toggle");
  const closeBtn = document.getElementById("chat-close");
  const form = document.getElementById("chat-form");
  const input = document.getElementById("chat-input");
  const messages = document.getElementById("chat-messages");

  function addMsg(text, who) {
    if (!messages) return;
    const div = document.createElement("div");
    div.className = `chat-msg chat-msg--${who}`;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function reply(q) {
    const t = q.toLowerCase();
    if (/fsa|flexible spending|dependent care/.test(t)) {
      return "A Dependent Care FSA lets you set aside up to $5,000 pre-tax per year ($2,500 if married filing separately) for eligible childcare. Open the Calculator to see an estimate for your household.";
    }
    if (/tax credit|cdctc|dependent care tax/.test(t)) {
      return "The Child & Dependent Care Tax Credit covers a percentage of eligible expenses—up to $3,000 for one child or $6,000 for two or more. The rate depends on income. Our Calculator estimates both FSA and credit savings.";
    }
    if (/afford|7%|hhs/.test(t)) {
      return "HHS uses a 7% of household income benchmark for childcare affordability. CalCare shows your estimate as a share of income against that benchmark.";
    }
    if (/assist|subsidy|help|first 5|choices/.test(t)) {
      return "Try Savings & Assistance for Child Care Aware, ChildCare.gov, FIRST 5 Santa Clara County, and Choices for Children links. Eligibility varies by location and income.";
    }
    if (/nanny|au pair|center|home daycare|babysitter/.test(t)) {
      return "Care type changes cost a lot. Use Compare for a side-by-side estimate across center, home daycare, nanny, au pair, and babysitter/after-school options.";
    }
    if (/zip|local|provider|near/.test(t)) {
      return "Enter a ZIP on the Calculator. We apply a regional cost multiplier and list sample providers labeled as estimates—not a live directory.";
    }
    if (/price|cost|how much|expensive/.test(t)) {
      return "National averages put childcare around $13,184 per child per year (2025). Your ZIP, care type, hours, and ages change that number. Run the free Calculator for a personalized estimate.";
    }
    if (/free|subscription|pay|ad/.test(t)) {
      return "CalCare’s basic calculator is always free—no subscriptions. We plan to sustain the site through provider partnerships, donations, and possibly ads.";
    }
    if (/privacy|data|collect/.test(t)) {
      return "We only collect what’s needed to estimate costs. Calculator inputs stay in your browser unless you choose to send a contact request.";
    }
    return "I can help with FSA, tax credits, affordability, care types, and assistance programs. Try the Calculator for numbers, or ask about tax savings, subsidies, or providers.";
  }

  function openChat(open) {
    panel?.classList.toggle("is-open", open);
    toggle?.setAttribute("aria-expanded", String(open));
    if (open) input?.focus();
    else toggle?.focus();
  }

  toggle?.addEventListener("click", () => openChat(!panel?.classList.contains("is-open")));
  closeBtn?.addEventListener("click", () => openChat(false));

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = (input?.value || "").trim();
    if (!q) return;
    addMsg(q, "user");
    input.value = "";
    setTimeout(() => addMsg(reply(q), "bot"), 220);
  });

  if (messages && messages.childElementCount === 0) {
    addMsg("Hi — ask about childcare costs, tax savings, or assistance. Answers are educational estimates.", "bot");
  }

  // Contact form mock
  document.getElementById("contact-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const status = document.getElementById("contact-status");
    const name = document.getElementById("contact-name");
    if (status) {
      status.textContent = "Thanks — your request was recorded locally for this demo. We’ll follow up when contact delivery is connected.";
      status.setAttribute("role", "status");
    }
    e.target.reset();
    name?.focus();
  });
})();
