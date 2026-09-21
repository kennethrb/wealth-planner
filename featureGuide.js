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
		interpretation: () => `
		Safe-To-Spend is your operational spending limit before the next payday.
		
		This amount protects:
		
		• unpaid bills
		• short-term cash reserves
		• pay-cycle buffers
		
		Safe-To-Spend answers:
		"Can I spend it?"
		
		Safe-To-Spend is NOT the same as Deployable Capital.
		`,
		why: `
		Different capital numbers exist because they support different decisions.
		
		Safe-To-Spend:
		Can I spend it?
		
		Deployable Capital:
		Can I strategically allocate it?
		
		Wealth Sweep:
		What exceeds my long-term reserve target?
		`
    },
	cashFlow: {
	    title: "Cash Flow Command Center",
	    what: "Measures how safely your available cash can support your recurring financial obligations while identifying deployable capital.",
	    formula: "Available Cash ÷ Monthly Bill Load = Coverage Ratio",
	    example: "₱393,000 ÷ ₱37,000 = 10.6x Coverage",
		interpretation: () => `
		A coverage ratio above 3x generally indicates healthy liquidity.
		Higher coverage allows Wealth Planner to transition from protection mode into optimization mode.
		`,
	    why: "Before investing, funding goals, or reducing debt, Wealth Planner first verifies that recurring obligations are safely covered."
	},
	wealthAdvisor: {
	    title: "Wealth Advisor",
	    what: "Identifies the highest-impact financial action you should take right now.",
	    formula: "Cash Flow + Goals + Opportunities + Capital Allocation → Recommended Action",
	    example: "Fund House Downpayment with ₱30,000",
		interpretation:
		() => `
		The Wealth Advisor combines:
		
		• Cash Flow Command Center
		• Goal Funding Optimizer
		• Wealth Opportunities
		• Capital Allocation
		
		to identify the single highest-value action available today.
		`,
	    why: "Transforms financial information into actionable wealth decisions."
	},
	goalFunding: {
	    title: "Goal Funding Optimizer",
	    what: "Identifies which goal creates the highest immediate wealth impact from available capital.",
	    formula: "Goal Progress + Completion Opportunity + Available Capital",
		example:
		"Deployable Capital: ₱271,600 | Goal Gap: ₱30,000",
		interpretation: () => `
		Only Deployable Capital is considered for goal acceleration.
		
		Deployable Capital represents money available for strategic wealth decisions such as:
		
		• funding goals
		• reducing debt
		• investing
		
		Unlike Safe-To-Spend, this amount is intended for long-term wealth growth rather than discretionary spending.
		`,
	    why: "Accelerates achievement of important financial goals."
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
		() => `
		Wealth Sweep uses a stricter definition of capital.
		
		Unlike Deployable Capital, Wealth Sweep only considers money above your 3‑month reserve target.
		
		This is why Wealth Sweep Capital is often lower than Deployable Capital.
		`,
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
	deployableCapital: {
	    title: "Deployable Capital",
		what:
		"Money that Wealth Planner believes can be safely allocated toward goals, investments, and wealth growth.",
		formula:
		"(Available Cash − Unpaid Bills) × 70% Strategic Allocation Rule",
		example:
		"₱388,000 × 70% = ₱271,600",
	    interpretation: "Deployable Capital powers Goal Funding, Wealth Advisor, Opportunity Engine, and Payday Planning.",
		why: `
		Different capital numbers exist because they support different decisions.
		
		Safe-To-Spend:
		Can I spend it?
		
		Deployable Capital:
		Can I strategically allocate it?
		
		Wealth Sweep:
		What exceeds my long-term reserve target?
		`
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
