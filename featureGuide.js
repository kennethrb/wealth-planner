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
		interpretation:
		() => `Money available to spend before your next payday.`,
		
		why:
		`Prevents overspending.`
    },
	cashFlow: {
	    title: "Cash Flow Command Center",
	    what: "Measures how safely your available cash can support your recurring financial obligations while identifying deployable capital.",
	    formula: "Available Cash ÷ Monthly Bill Load = Coverage Ratio",
	    example: "₱393,000 ÷ ₱37,000 = 10.6x Coverage",
		interpretation:
		() => `Measures how safely cash covers recurring bills.`,
		
		why:
		`Protects liquidity before recommending actions.`
	},
	wealthAdvisor: {
	    title: "Wealth Advisor",
	    what: "Identifies the highest-impact financial action you should take right now.",
	    formula: "Cash Flow + Goals + Opportunities + Capital Allocation → Recommended Action",
	    example: "Fund House Downpayment with ₱30,000",
		interpretation:
		() => `Determines the best financial action right now.`,
		
		why:
		`Turns information into action.`
	},
	goalFunding: {
	    title: "Goal Funding Optimizer",
	    what: "Identifies which goal creates the highest immediate wealth impact from available capital.",
	    formula: "Goal Progress + Completion Opportunity + Available Capital",
		example:
		"Deployable Capital: ₱271,600 | Goal Gap: ₱30,000",
		interpretation:
		() => `Identifies the goal that creates the fastest progress.`,
		
		why:
		`Accelerates goal completion.`
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
	    what: "Converts recommendations into prioritized actions ranked by wealth impact.",
	    formula: "Advisor Recommendations → Prioritized Actions",
	    example: "Fund House Downpayment → Deploy Excess Cash → Increase Long-Term Wealth",
	    interpretation: () => "Actions are sorted by expected impact on future wealth and financial outcomes.",
	    why: "Turns analysis into execution."
	},
    wealthSweep: {
        title: "Wealth Sweep",
		what:
		"Deploys cash that exceeds your long-term reserve target.",
        formula: "Available Cash − 3-Month Reserve Target = Excess Cash",
		example:
		"₱393,000 Available Cash − ₱195,000 Reserve Target = ₱198,000 Excess Cash",
		interpretation:
		() => `Uses only cash above your 3‑month reserve target.`,
		
		why:
		`Prevents idle cash.`
    },
    payCycle: {
        title: "Pay Cycle",
        what: "Tracks the current pay cycle and the next payday.",
        formula: "Current Date → Next Payday",
        example: "Sep 18 → Oct 15",
        interpretation: () => "Used by Safe-To-Spend, Payday Planning, and Upcoming Bills.",
        why: "Provides operational context for spending decisions."
    },
	deployableCapital: {
	    title: "Deployable Capital",
		what:
		"Money that Wealth Planner believes can be safely allocated toward goals, investments, and wealth growth.",
		formula:
		"(Available Cash − Unpaid Bills) × 70% Strategic Allocation Rule",
		example:
		"₱388,000 × 70% = ₱271,600",
		interpretation:
		`Money available for goals, investing, and debt reduction.`,
		
		why:
		`Powers Wealth Advisor recommendations.`
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
  document.getElementById("guideWhy").innerHTML = (guide.why || "").replace(/\n/g, "<br>");

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

  document.getElementById("guideInterpretation").innerHTML = interpText.trim().replace(/\n/g, "<br>");

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
