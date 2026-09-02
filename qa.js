async function runIntelligenceQA() {
    const testCases = [{
        year: 2026,
        month: "Jan"
    }, {
        year: 2026,
        month: "Jun"
    }, {
        year: 2026,
        month: "Dec"
    }];
    console.clear();
    console.log("=================================");
    console.log("INTELLIGENCE QA RUNNER");
    console.log("=================================");
    for (const tc of testCases) {
        viewState.year = tc.year;
        viewState.month = tc.month;
        await loadBufferVsInvest();
        await loadNetWorthVelocity();
        await loadPersonalInflation();
        await loadPurchaseEvaluator();
        await loadWealthSweep();
        console.group(`${tc.month} ${tc.year}`);
        console.log("Inflation", window.qaInflation);
        console.log("Velocity", window.qaVelocity);
        console.log("Buffer", window.qaBuffer);
        console.log("Sweep", window.qaSweep);
        console.log("Purchase", window.qaPurchase);
        console.groupEnd();
    }
    console.log("=================================");
    console.log("QA COMPLETE");
    console.log("=================================");
}
const QA_EXPECTED = {
    "2026-Jan": {
        inflation: 5.0,
        monthlyVelocity: 18000,
        annualVelocity: 216000,
        bufferTarget: 141000,
        excessCash: 359000
    },
    "2026-Jun": {
        inflation: 4.44,
        monthlyVelocity: 13000,
        annualVelocity: 156000,
        bufferTarget: 156000,
        excessCash: 344000
    },
    "2026-Dec": {
        inflation: 3.92,
        monthlyVelocity: 7000,
        annualVelocity: 84000,
        bufferTarget: 174000,
        excessCash: 326000
    }
};

function assertMetric(label, actual, expected, tolerance = 1) {
    const passed = Math.abs(actual - expected) <= tolerance;
    if (passed) {
        console.log(`✅ ${label}`, {
            actual,
            expected
        });
    } else {
        console.error(`❌ ${label}`, {
            actual,
            expected
        });
    }
    return passed;
}
