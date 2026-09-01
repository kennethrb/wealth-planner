const FEATURE_GUIDES = {
    netWorth: {
    title: "Net Worth",
    what: "Net Worth represents your total wealth after subtracting liabilities from assets.",
    formula: "Assets − Liabilities",
    why: "Net Worth is the primary indicator of overall financial progress.",
    example: "₱789,000 Assets − ₱440,000 Liabilities = ₱349,000"
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
    document.getElementById("featureGuideModal").classList.add("show");
}

function closeFeatureGuide() {
    document.getElementById("featureGuideModal").classList.remove("show");
}
