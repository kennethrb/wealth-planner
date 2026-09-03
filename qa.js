let totalPassed = 0;
let totalFailed = 0;

async function runIntelligenceQA() {
    totalPassed = 0;
    totalFailed = 0;
    const testCases = [
        { year: 2026, month: "Jan" },
        { year: 2026, month: "Jun" },
        { year: 2026, month: "Dec" }
    ];
    
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
        await loadFinancialHealthAdvisor();
        await loadWealthProjectionAccelerator();
        
        const key = `${tc.year}-${tc.month}`;
        const expected = QA_EXPECTED[key];
        
        console.group(key);
        assertMetric("Inflation", Number(window.qaInflation.inflationRate.toFixed(2)), expected.inflation, 0.1);
        assertMetric("Monthly Velocity", window.qaVelocity.monthlyVelocity, expected.monthlyVelocity);
        assertMetric("Annual Velocity", window.qaVelocity.annualVelocity, expected.annualVelocity);
        assertMetric("Buffer Target", window.qaBuffer.bufferTarget, expected.bufferTarget);
        assertMetric("Excess Cash", window.qaBuffer.excessCash, expected.excessCash);
        
        // Accelerator Assertions
        if (expected.investableAmount !== undefined && window.qaAccelerator) {
            assertMetric("Investable Amount", window.qaAccelerator.investableAmount, expected.investableAmount, 1);
            assertMetric("5-Yr Projection", window.qaAccelerator.fv5, expected.fv5, 1);
            assertMetric("10-Yr Projection", window.qaAccelerator.fv10, expected.fv10, 1);
            assertMetric("20-Yr Projection", window.qaAccelerator.fv20, expected.fv20, 1);
        }
        
        console.groupEnd();
        
        console.group(`${tc.month} ${tc.year}`);
        console.table(window.qaBuffer);
        console.table(window.qaVelocity);
        console.table(window.qaInflation);
        console.table(window.qaPurchase);
        console.table(window.qaSweep);
        if (window.qaAccelerator) console.table(window.qaAccelerator);
        console.groupEnd();
    }
    
    console.log("=================================");
    console.log("QA COMPLETE");
    console.log("=================================");
    console.log(`✅ PASSED: ${totalPassed}`);
    console.log(`❌ FAILED: ${totalFailed}`);
    console.log("=================================");
}

const QA_EXPECTED = {
    "2026-Jan": {
        inflation: 5.0,
        monthlyVelocity: 18000,
        annualVelocity: 216000,
        bufferTarget: 141000,
        excessCash: 359000,
        investableAmount: 12600,
        fv5: 897028.18,
        fv10: 2180921.22,
        fv20: 6563195.95
    },
    "2026-Jun": {
        inflation: 4.44,
        monthlyVelocity: 13000,
        annualVelocity: 156000,
        bufferTarget: 156000,
        excessCash: 344000,
        investableAmount: 9100,
        fv5: 647853.69,
        fv10: 1575109.77,
        fv20: 4739530.41
    },
    "2026-Dec": {
        inflation: 3.92,
        monthlyVelocity: 7000,
        annualVelocity: 84000,
        bufferTarget: 174000,
        excessCash: 326000,
        investableAmount: 4900,
        fv5: 348844.29,
        fv10: 848135.26,
        fv20: 2552054.84
    }
};

function assertMetric(label, actual, expected, tolerance = 1) {
    const passed = Math.abs(actual - expected) <= tolerance;
    if (passed) {
        totalPassed++;
        console.log(`✅ ${label}`, { actual, expected });
    } else {
        totalFailed++;
        console.error(`❌ ${label}`, { actual, expected, difference: actual - expected });
    }
}
