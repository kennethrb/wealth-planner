const FEATURE_GUIDES = {
    projection: {
    title: "Wealth Projection",
    what: "Projects future wealth based on current financial behavior.",
    formula: "Current Assets + (Monthly Surplus × 12)",
    why: "Lets you see where your finances are heading.",
    example: "Current Assets + (Monthly Surplus × 12)",
    interpretation: () => {

    return "Test Interpretation";

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
