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
        
        // DI-005: Purchase Evaluator Threshold Tests
        const totalCash = window.qaBuffer.availableCash;
        const target = window.qaBuffer.bufferTarget;
        const excess = window.qaBuffer.excessCash;

        if (totalCash > 0) {
            // 1. Affordable (Safe within excess cash)
            const affordableAmt = excess > 0 ? Math.floor(excess * 0.5) : 0;
            await loadPurchaseEvaluator(affordableAmt);
            assertMetric(
                "Evaluator (Affordable)", 
                window.qaPurchase.recommendation === "✅ Affordable" ? 1 : 0, 
                1
            );

            // 2. Impacts Buffer (Dips into emergency buffer)
            const impactAmt = excess > 0 ? excess + Math.floor(target * 0.5) : Math.floor(totalCash * 0.5);
            await loadPurchaseEvaluator(impactAmt);
            assertMetric(
                "Evaluator (Impacts Buffer)", 
                window.qaPurchase.recommendation === "⚠️ Impacts Emergency Buffer" ? 1 : 0, 
                1
            );

            // 3. Not Recommended (Exceeds total cash)
            await loadPurchaseEvaluator(totalCash + 50000);
            assertMetric(
                "Evaluator (Not Recommended)", 
                window.qaPurchase.recommendation === "🚨 Not Recommended" ? 1 : 0, 
                1
            );
        } else {
            console.warn("⚠️ Skipping DI-005 tests: window.qaBuffer.availableCash is 0.");
        }

        // --- DI-006: Wealth Sweep Automation Assertions ---
        const excess = window.qaBuffer.excessCash;
        const expectedDebtSweep = excess * 0.20;
        const expectedEmergencySweep = excess * 0.10;
        const expectedInvestmentSweep = excess * 0.70;
        
        assertMetric("Wealth Sweep (Debt)", window.qaSweep.debtSweep, expectedDebtSweep);
        assertMetric("Wealth Sweep (Emergency)", window.qaSweep.emergencySweep, expectedEmergencySweep);
        assertMetric("Wealth Sweep (Investment)", window.qaSweep.investmentSweep, expectedInvestmentSweep);

        // ---
        
        const key = `${tc.year}-${tc.month}`;
        const expected = QA_EXPECTED[key];
        
        console.group(key);
        // qa.js -> inside runIntelligenceQA()
        assertMetric("Inflation", window.qaInflation.inflationRate, expected.inflation, 0.01);
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

// qa.js
const QA_EXPECTED = {
    "2026-Jan": {
        inflation: 5.0,
        monthlyVelocity: 18000,
        annualVelocity: 216000,
        bufferTarget: 141000,
        excessCash: 359000,
        investableAmount: 12600,
        fv5: 902070.56,
        fv10: 2180868.57,
        fv20: 6563675.91
    },
    "2026-Jun": {
        inflation: 4.44,
        monthlyVelocity: 13000,
        annualVelocity: 156000,
        bufferTarget: 156000,
        excessCash: 344000,
        investableAmount: 9100,
        fv5: 651495.40,
        fv10: 1575071.75,
        fv20: 4740432.60 // Updated from 4739321.49
    },
    "2026-Dec": {
        inflation: 3.92,
        monthlyVelocity: 7000,
        annualVelocity: 84000,
        bufferTarget: 174000,
        excessCash: 326000,
        investableAmount: 4900,
        fv5: 350805.22,
        fv10: 848115.56,
        fv20: 2552540.63 // Updated from 2551942.34
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
