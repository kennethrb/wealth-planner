const FEATURE_GUIDES = {

    netWorth: {
        title: "Net Worth",

        what:
            "Net Worth represents your total wealth after subtracting liabilities from assets.",

        formula:
            "Assets − Liabilities",

        why:
            "Net Worth is the primary indicator of overall financial progress."
    },

    financialHealth: {
        title: "Financial Health",

        what:
            "Measures whether your current cash flow supports long-term wealth growth.",

        formula:
            "Income − Expenses − Savings − Debt",

        why:
            "A healthy surplus creates wealth-building opportunities."
    },

    projection: {
        title: "Wealth Projection",

        what:
            "Projects future wealth based on current financial behavior.",

        formula:
            "Current Assets + (Monthly Surplus × 12)",

        why:
            "Lets you see where your finances are heading."
    }

};

function showFeatureGuide(key) {

    const guide =
        FEATURE_GUIDES[key];

    if (!guide) return;

    document.getElementById(
        "guideTitle"
    ).textContent =
        guide.title;

    document.getElementById(
        "guideWhat"
    ).textContent =
        guide.what;

    document.getElementById(
        "guideFormula"
    ).textContent =
        guide.formula;

    document.getElementById(
        "guideWhy"
    ).textContent =
        guide.why;

    document
        .getElementById(
            "featureGuideModal"
        )
        .classList
        .add(
            "show"
        );
}

function closeFeatureGuide() {

    document
        .getElementById(
            "featureGuideModal"
        )
        .classList
        .remove(
            "show"
        );
}
