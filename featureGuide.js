const FEATURE_GUIDES = {
    projection: {
    title: "Wealth Projection",
    what: "Projects future wealth based on current financial behavior.",
    formula: "Current Assets + (Monthly Surplus × 12)",
    why: "Lets you see where your finances are heading.",
    example: "Current Assets + (Monthly Surplus × 12)",
    interpretation: () => {
        const projection = calculateFinancialProjection();
        if (!projection) {
            return "Projection data is not available.";
        }
        const surplus = projection.monthlySurplus || 0;
        const projected = projection.projectedAssets || 0;
        if (surplus > 0) {
            return `
Your current surplus is generating additional wealth each month.

At your current pace, assets could grow to approximately
${formatCurrency(projected)} over the next year.

This suggests a positive wealth trajectory.
`;
        }
        if (surplus < 0) {
            return `
Current spending exceeds available income.

Projected asset growth may slow or decline unless cash flow improves.

Reducing expenses or increasing income could improve future wealth growth.
`;
        }
        return `
Current cash flow is neutral.

Future wealth growth will likely remain flat unless surplus increases.
`;
    }
}
};

function showFeatureGuide(key) {
    const guide = FEATURE_GUIDES[key];
    if (!guide) return;
    document.getElementById("guideTitle").textContent = guide.title || "";
    document.getElementById("guideWhat").textContent = guide.what || "";
    document.getElementById("guideFormula").textContent = guide.formula || "";
    document.getElementById("guideWhy").textContent = guide.why || "";
    document.getElementById("guideExample").textContent = guide.example || "";
    const interpretation = typeof guide.interpretation === "function" ? guide.interpretation() : guide.interpretation || "";
    document.getElementById("guideInterpretation").textContent = interpretation;
    document.getElementById("featureGuideModal").classList.add("show");
}

function closeFeatureGuide() {
    document.getElementById("featureGuideModal").classList.remove("show");
}

document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("featureGuideModal");
    modal.addEventListener("click", function(e) {
        if (e.target === modal) {
            closeFeatureGuide();
        }
    });
});
