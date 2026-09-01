const FEATURE_GUIDES = {
  networth: {
    title: "Net Worth",
    what: "The difference between everything you own and everything you owe.",
    formula: "Assets − Liabilities",
    example: "₱789,000 − ₱440,000 = ₱349,000",
    interpretation: () => {
      const netWorthVal = typeof calculateNetWorth === "function" ? calculateNetWorth() : 0;
      const formatted = typeof formatCurrency === "function" ? formatCurrency(netWorthVal) : `₱${netWorthVal}`;
      return `Your current net worth is ${formatted}. A positive net worth means your assets exceed your liabilities.`;
    },
    why: "Net worth is the most important measure of overall financial health."
  }
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
