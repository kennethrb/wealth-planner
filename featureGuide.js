const FEATURE_GUIDES = {
    networth: {
        title: "Net Worth",
        what: "The difference between everything you own and everything you owe.",
        formula: "Assets − Liabilities",
        example: "₱789,000 − ₱440,000 = ₱349,000",
        interpretation: "A positive net worth means assets exceed liabilities.",
        why: "Net worth is one of the best indicators of long-term financial health."
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
