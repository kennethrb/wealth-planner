async function runIntelligenceQA() {

    const testCases = [
        { year: 2026, month: "Jan" },
        { year: 2026, month: "Jun" },
        { year: 2026, month: "Dec" }
    ];

    console.clear();

    console.log(
        "================================="
    );

    console.log(
        "INTELLIGENCE QA RUNNER"
    );

    console.log(
        "================================="
    );

    for (const tc of testCases) {

        viewState.year = tc.year;
        viewState.month = tc.month;

        await loadBufferVsInvest();
        await loadNetWorthVelocity();
        await loadPersonalInflation();
        await loadPurchaseEvaluator();
        await loadWealthSweep();

        console.log(
            `✅ ${tc.month} ${tc.year} completed`
        );
    }

    console.log(
        "================================="
    );

    console.log(
        "QA COMPLETE"
    );

    console.log(
        "================================="
    );
}
