const FEATURE_GUIDES = {

    networth: {
        title: "Net Worth",
        what: "The difference between everything you own and everything you owe.",
        formula: "Assets − Liabilities",
        example: "₱789,000 − ₱440,000 = ₱349,000",
        interpretation: () => {

    const netWorth =
        calculateNetWorth();

    if (netWorth > 0) {
        return `
            Your assets exceed your liabilities.
            This indicates a positive financial position.
        `;
    }

    if (netWorth < 0) {
        return `
            Your liabilities exceed your assets.
            Focus on debt reduction and asset accumulation.
        `;
    }

    return `
        Your assets and liabilities are currently equal.
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
