let totalPassed = 0;
let totalFailed = 0;

async function runIntelligenceQA() {
    totalPassed = 0;
    totalFailed = 0;
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
        const key = `${tc.year}-${tc.month}`;
        const expected = QA_EXPECTED[key];
        console.group(key);
        assertMetric("Inflation", Number(window.qaInflation.inflationRate.toFixed(2)), expected.inflation, 0.1);
        assertMetric("Monthly Velocity", window.qaVelocity.monthlyVelocity, expected.monthlyVelocity);
        assertMetric("Annual Velocity", window.qaVelocity.annualVelocity, expected.annualVelocity);
        assertMetric("Buffer Target", window.qaBuffer.bufferTarget, expected.bufferTarget);
        assertMetric("Excess Cash", window.qaBuffer.excessCash, expected.excessCash);
        console.groupEnd();
        console.group(`${tc.month} ${tc.year}`);
        console.table(window.qaBuffer);
        console.table(window.qaVelocity);
        console.table(window.qaInflation);
        console.table(window.qaPurchase);
        console.table(window.qaSweep);
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
        
        console.log(
            `✅ PASSED: ${totalPassed}`
        );
        
        console.log(
            `❌ FAILED: ${totalFailed}`
        );
        
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

    const passed =
        Math.abs(actual - expected) <= tolerance;

    if (passed) {

        totalPassed++;

        console.log(
            `✅ ${label}`,
            {
                actual,
                expected
            }
        );

    } else {
    
        totalFailed++;
    
        console.error(
            `❌ ${label}`,
            {
                actual,
                expected,
                difference: actual - expected
            }
        );
    
    }
}
