const FEATURE_GUIDES = {
    networth: {
        title: "Net Worth",
        what: "The difference between everything you own and everything you owe.",
        formula: "Assets − Liabilities",
        example: "₱789,000 − ₱440,000 = ₱349,000",
        interpretation: () => {
            const amount = document.querySelector("#networth .big-amount")?.textContent || "Unavailable";
            return `
      Your current net worth is ${amount}.
      A positive net worth means your assets exceed your liabilities.
    `;
        },
        why: "Net worth is the most important measure of overall financial health."
    },
    projection: {
        title: "Wealth Projection",
        what: "An estimate of how your current financial plan may affect your future wealth.",
        formula: "Current Assets + Annual Surplus − Liabilities",
        example: "₱789,000 + ₱120,000 − ₱440,000 = ₱469,000",
        interpretation: () => "A higher projected net worth indicates that your income, savings, and debt strategy are helping grow wealth over time.",
        why: "Projection helps you understand where today's financial decisions may lead in the future."
    },
    safeToSpend: {
        title: "Safe To Spend",
        what: "The amount available for discretionary spending after protecting upcoming bills and reserves.",
        formula: "Available Cash − Protected Bills − Protected Buffer",
        example: "₱30,000 − ₱20,000 − ₱5,000 = ₱5,000",
        interpretation: () => "A value of ₱0 means all available money is currently required for bills and reserves.",
        why: "Helps prevent overspending before the next payday."
    },
	cashFlow: {
        title: "Cash Flow Command Center",
        what: "Measures whether current deployable cash can safely cover all obligations due before the next payday.",
        formula: "Available Cash ÷ Upcoming Bills = Coverage Ratio",
        example: "₱25,000 ÷ ₱20,000 = 1.25x Coverage",
        interpretation: () => "Coverage above 1.0x means obligations are funded. Coverage below 1.0x indicates a projected cash shortfall.",
        why: "This helps prevent missed payments and protects liquidity before the next payday."
    },
    wealthAdvisor: {
        title: "Wealth Advisor",
        what: "Aggregates all intelligence engines into a prioritized recommendation.",
        formula: "Cash Flow + Goals + Opportunities + Capital Allocation",
        example: "Protect Liquidity → Fund Goal → Invest Excess Cash",
        interpretation: () => "Displays the highest-priority financial action available right now.",
        why: "Simplifies decision-making and focuses attention on the next best action."
    },
    goalFunding: {
        title: "Goal Funding Optimizer",
        what: "Identifies the goal that would benefit most from available capital.",
        formula: "Goal Ranking Based On Progress + Completion Opportunity",
        example: "Emergency Fund receives ₱10,000 to complete the target immediately.",
        interpretation: () => "A completed goal frees future contribution capacity.",
        why: "Accelerates progress toward meaningful financial milestones."
    },
    fundingOptimization: {
        title: "Funding Optimization Advisor",
        what: "Detects account funding deficits and excess idle cash.",
        formula: "Required Funding − Available Funding",
        example: "Savings Account needs ₱2,000 additional funding.",
        interpretation: () => "Highlights accounts at risk of underfunding and recommends transfers.",
        why: "Improves cash allocation efficiency."
    },
    monthlyActionPlan: {
        title: "Monthly Wealth Action Plan",
        what: "Combines all advisor outputs into a prioritized task list.",
        formula: "Funding + Savings + Cash Flow + Goals",
        example: "Resolve Shortfall → Increase Savings → Fund Goal",
        interpretation: () => "Actions are ordered by expected impact on financial outcomes.",
        why: "Converts analysis into execution."
    },
    wealthSweep: {
        title: "Wealth Sweep",
        what: "Automatically recommends how to deploy excess cash.",
        formula: "Excess Cash × Allocation Rules",
        example: "70% Investments, 20% Debt, 10% Emergency Fund",
        interpretation: () => "Only excess capital above protection thresholds is considered.",
        why: "Prevents idle cash and increases long-term wealth growth."
    },
    payCycle: {
        title: "Pay Cycle",
        what: "Tracks the current pay cycle and the next payday.",
        formula: "Current Date → Next Payday",
        example: "Sep 18 → Oct 15",
        interpretation: () => "Used by Safe-To-Spend, Payday Planning, and Upcoming Bills.",
        why: "Provides operational context for spending decisions."
    },
  
};

function showFeatureGuide(key) {
  const guide = FEATURE_GUIDES[key];
  if (!guide) return;

  // Safe DOM assignments
  document.getElementById("guideTitle").textContent = guide.title || "";
  document.getElementById("guideWhat").textContent = guide.what || "";
  document.getElementById("guideFormula").textContent = guide.formula || "";
  document.getElementById("guideExample").textContent = guide.example || "";
  document.getElementById("guideWhy").textContent = guide.why || "";

  // Dynamic interpretation evaluation
  let interpText = "";
  if (typeof guide.interpretation === "function") {
    try {
      interpText = guide.interpretation();
    } catch (err) {
      console.error("Error evaluating interpretation:", err);
      interpText = "Unable to compute dynamic interpretation.";
    }
  } else {
    interpText = guide.interpretation || "";
  }

  document.getElementById("guideInterpretation").textContent = interpText.trim();

  // Show Modal
  const modal = document.getElementById("featureGuideModal");
  if (modal) {
    modal.classList.add("show");
  }
}

function closeFeatureGuide() {
  const modal = document.getElementById("featureGuideModal");
  if (modal) {
    modal.classList.remove("show");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("featureGuideModal");
  if (modal) {
    modal.addEventListener("click", function (e) {
      if (e.target === modal) {
        closeFeatureGuide();
      }
    });
  }
});
