/**
 * Wealth Planner Intelligence Engine
 */
const DEBUG_QA = true;

// Example Debug Wrapper for Personal Inflation Index
function calculatePersonalInflation() {
    const currentYearSpend = getCurrentYearSpending(appData.transactions);
    const previousYearSpend = getPreviousYearSpending(appData.transactions);
    
    let rate = 0;
    if (previousYearSpend > 0) {
        rate = (currentYearSpend - previousYearSpend) / previousYearSpend;
    } else {
        rate = null; // Triggers N/A root cause
    }

    if (DEBUG_QA) {
        console.group("WI-005 / DI-005 Personal Inflation Trace");
        console.log("Current Year Spend:", currentYearSpend);
        console.log("Previous Year Spend:", previousYearSpend);
        console.log("Calculated Inflation Rate:", rate);
        console.log("Status:", rate === null ? "FAILED (Insufficient Historical Data)" : "PASS");
        console.groupEnd();
    }

    return rate;
}

async function loadBufferVsInvest() {
    const selectedYear = getViewYear();
    const selectedMonth = getViewMonth();

    const budgetData = (appData.budget || []).filter(
        item => Number(item.year) === selectedYear
    );

    const categoryTypes = {};
    (appData.categories || []).forEach(cat => {
        categoryTypes[cat.categoryName] = cat.budgetType;
    });

    let monthlyExpense = 0;
    let monthlyDebt = 0;

    budgetData.forEach(item => {
        if (item.month !== selectedMonth) return;
        const type = categoryTypes[item.category];
        const amount = Number(item.plannedAmount || item.amount || 0);

        if (type === "Expense") monthlyExpense += amount;
        if (type === "Debt") monthlyDebt += amount;
    });

    const monthlyObligations = monthlyExpense + monthlyDebt;
    const bufferTarget = monthlyObligations * 3;

    let availableCash = 0;
    (appData.accounts || []).forEach(account => {
        const balance = Number(account.currentBalance ?? account.balance ?? account.amount ?? 0);
        const type = String(account.netWorthType || account.type || "").toLowerCase();
        
        // Match Asset, liquid, bank, or cash account types
        if (type === "asset" || type === "liquid" || type === "bank" || type === "cash") {
            availableCash += balance;
        }
    });

    // Fallback if netWorthType isn't explicitly set on accounts
    if (availableCash === 0 && appData.accounts.length > 0) {
        appData.accounts.forEach(account => {
            const balance = Number(account.currentBalance ?? account.balance ?? 0);
            if (balance > 0) availableCash += balance;
        });
    }

    const excessCash = availableCash - bufferTarget;

    // Expose QA Metrics
    window.qaBuffer = {
        availableCash,
        monthlyObligations,
        bufferTarget,
        excessCash
    };

    logQATrace(
    "DI-002",
    "loadBufferVsInvest",
    {
        selectedYear,
        selectedMonth,
        availableCash,
        monthlyObligations
    },
    {
        bufferTarget,
        excessCash
    },
    !isNaN(excessCash)
);


    let recommendationHtml = "";

    if (excessCash <= 0) {
        recommendationHtml = `
            <div class="metric-row">
                <span>Status</span>
                <strong>⚠️ Build Emergency Buffer</strong>
            </div>
            <div class="metric-row">
                <span>Shortfall</span>
                <strong>${formatCurrency(Math.abs(excessCash))}</strong>
            </div>
        `;
    } else {
        const investAmount = excessCash * 0.8;
        const debtAmount = excessCash * 0.2;

        recommendationHtml = `
            <div class="metric-row">
                <span>Status</span>
                <strong>✅ Excess Cash Available</strong>
            </div>
            <div class="metric-row">
                <span>Invest</span>
                <strong>${formatCurrency(investAmount)}</strong>
            </div>
            <div class="metric-row">
                <span>Debt Reduction</span>
                <strong>${formatCurrency(debtAmount)}</strong>
            </div>
        `;
    }

    const container = document.getElementById("bufferVsInvest");
    if (!container) return;

    container.innerHTML = `
        <div class="card">
            <h2>🧠 Buffer vs Invest</h2>
            <div class="metric-row">
                <span>Available Cash</span>
                <strong>${formatCurrency(availableCash)}</strong>
            </div>
            <div class="metric-row">
                <span>Monthly Obligations</span>
                <strong>${formatCurrency(monthlyObligations)}</strong>
            </div>
            <div class="metric-row">
                <span>Buffer Target (3x)</span>
                <strong>${formatCurrency(bufferTarget)}</strong>
            </div>
            <div class="metric-row">
                <span>Excess Cash</span>
                <strong>${formatCurrency(excessCash)}</strong>
            </div>
            <hr>
            ${recommendationHtml}
        </div>
    `;
}

async function loadNetWorthVelocity() {
    const container = document.getElementById("netWorthVelocity");
    if (!container) return;

    let assets = 0;
    let liabilities = 0;

    appData.accounts.forEach(account => {
        const balance = Number(account.currentBalance || account.balance || 0);
        if (account.netWorthType === "Asset") assets += balance;
        if (account.netWorthType === "Liability") liabilities += balance;
    });

    const netWorth = assets - liabilities;
    const selectedYear = getViewYear();
    const selectedMonth = getViewMonth();

    const categoryTypes = {};
    appData.categories.forEach(cat => {
        categoryTypes[cat.categoryName] = cat.budgetType;
    });

    let income = 0;
    let expense = 0;
    let savings = 0;
    let debt = 0;

    appData.budget.forEach(item => {
        if (Number(item.year) !== selectedYear) return;
        if (item.month !== selectedMonth) return;

        const amount = Number(item.plannedAmount || 0);
        const type = categoryTypes[item.category];

        if (type === "Income") income += amount;
        if (type === "Expense") expense += amount;
        if (type === "Savings") savings += amount;
        if (type === "Debt") debt += amount;
    });

    const monthlyVelocity = income - expense - savings - debt;
    const annualVelocity = monthlyVelocity * 12;
    const projectedNetWorth = netWorth + annualVelocity;

    // Expose QA Metrics[cite: 6]
    window.qaVelocity = {
        netWorth,
        monthlyVelocity,
        annualVelocity,
        projectedNetWorth
    };

    logQATrace(
    "DI-004",
    "loadNetWorthVelocity",
    {
        assets,
        liabilities,
        income,
        expense,
        savings,
        debt
    },
    {
        netWorth,
        monthlyVelocity,
        annualVelocity,
        projectedNetWorth
    },
    !isNaN(projectedNetWorth)
);


    container.innerHTML = `
        <div class="card">
            <h2>📈 Net Worth Velocity</h2>
            <div class="metric-row">
                <span>Current Net Worth</span>
                <strong>${formatCurrency(netWorth)}</strong>
            </div>
            <div class="metric-row">
                <span>Monthly Velocity</span>
                <strong>${formatCurrency(monthlyVelocity)}</strong>
            </div>
            <div class="metric-row">
                <span>Annual Velocity</span>
                <strong>${formatCurrency(annualVelocity)}</strong>
            </div>
            <div class="metric-row">
                <span>Projected Next Year</span>
                <strong>${formatCurrency(projectedNetWorth)}</strong>
            </div>
        </div>
    `;
}


/*---ADVISOR---*/
async function loadFinancialHealthAdvisor() {


    const container =
        document.getElementById("financialHealthAdvisor");

    if (!container) return;

    const selectedYear = getViewYear();
    const selectedMonth = getViewMonth();

    const categoryTypes = {};

    appData.categories.forEach(cat => {
        categoryTypes[cat.categoryName] = cat.budgetType;
    });

    let income = 0;
    let expenses = 0;
    let savings = 0;
    let debt = 0;

    appData.budget.forEach(item => {

        if (Number(item.year) !== selectedYear) return;
        if (item.month !== selectedMonth) return;

        const amount =
            Number(item.plannedAmount || 0);

        const type =
            categoryTypes[item.category];

        if (type === "Income") income += amount;
        if (type === "Expense") expenses += amount;
        if (type === "Savings") savings += amount;
        if (type === "Debt") debt += amount;

    });

    const monthlySurplus =
        income - expenses - savings - debt;

    const savingsRate =
        income > 0
            ? (savings / income) * 100
            : 0;

    const debtRate =
        income > 0
            ? (debt / income) * 100
            : 0;
    
    let status = "Healthy";
    
    if (
        savingsRate < 20 ||
        debtRate > 30
    ) {
        status = "Needs Improvement";
    }

    const problems = [];
    const actions = [];

    if (savingsRate < 20) {

        problems.push(
            "Savings rate is below recommended 20%"
        );

    const targetSavingsRate = 20;
    
    const savingsGap =
        income * (targetSavingsRate / 100) - savings;
    
    actions.push({
        priority: 1,
        title: "Increase Savings",
        amount: Math.max(0, savingsGap)
    });
    }

    if (debtRate > 30) {

        problems.push(
            "Debt payments consume too much income"
        );

        actions.push(
            "Prioritize debt reduction"
        );
    }

    if (monthlySurplus > 0) {
    
        actions.push({
            priority: 2,
            title: "Deploy Monthly Surplus",
            invest: monthlySurplus * 0.70,
            debt: monthlySurplus * 0.20,
            emergency: monthlySurplus * 0.10
        });
    
    }


    const wealthImpact =
        monthlySurplus * 12 * 10;

    window.qaFinancialHealthAdvisor = {
        income,
        expenses,
        savings,
        debt,
        savingsRate,
        debtRate,
        monthlySurplus,
        wealthImpact
    };
    logQATrace(
    "DI-001",
    "loadFinancialHealthAdvisor",
    {
        income,
        expenses,
        savings,
        debt
    },
    {
        savingsRate,
        debtRate,
        monthlySurplus,
        wealthImpact,
        status
    },
    !isNaN(savingsRate) &&
    !isNaN(debtRate) &&
    !isNaN(monthlySurplus)
);

    container.innerHTML = `
        <div class="card">

            <h2>🎯 Financial Health Advisor</h2>
            <div class="advisor-status ${status === "Healthy" ? "success" : "warning"}">
            ${status === "Healthy"
            ? "✅ Healthy"
            : "⚠ Needs Improvement"}
            </div>

            <div class="metric-row">
                <span>Savings Rate</span>
                <strong>${savingsRate.toFixed(1)}%</strong>
            </div>

            <div class="metric-row">
                <span>Debt Rate</span>
                <strong>${debtRate.toFixed(1)}%</strong>
            </div>

            <div class="metric-row">
                <span>Monthly Surplus</span>
                <strong>${formatCurrency(monthlySurplus)}</strong>
            </div>

            <hr>

            <div class="metric-row">
                <span>Priority Actions</span>
                <strong>${problems.length}</strong>
            </div>

            ${actions.map(action => {
            
                if (typeof action === "string") {
                    return `
                        <div class="advisor-action">
                            <div class="action-title">✅ ${action}</div>
                        </div>
                    `;
                }
            
                if (action.title === "Increase Savings") {
                    return `
                        <div class="advisor-action priority">
                            <div class="action-title">🎯 ${action.title}</div>
                            <div class="allocation-row">
                                <span>Suggested Increase</span>
                                <strong>${formatCurrency(action.amount)}</strong>
                            </div>
                        </div>
                    `;
                }
            
                if (action.title === "Deploy Monthly Surplus") {
                    return `
                        <div class="advisor-action priority">
                            <div class="action-title">🚀 ${action.title}</div>
            
                            <div class="allocation-row">
                                <span>📈 Investments</span>
                                <strong>${formatCurrency(action.invest)}</strong>
                            </div>
            
                            <div class="allocation-row">
                                <span>💳 Debt Reduction</span>
                                <strong>${formatCurrency(action.debt)}</strong>
                            </div>
            
                            <div class="allocation-row">
                                <span>🛡️ Emergency Fund</span>
                                <strong>${formatCurrency(action.emergency)}</strong>
                            </div>
                        </div>
                    `;
                }
            
                return "";
            
            }).join("")}

            <hr>

            <div class="metric-row">
                <span>10-Year Wealth Impact</span>
                <strong>${formatCurrency(wealthImpact)}</strong>
            </div>

        </div>
    `;
}

async function loadFundingOptimizationAdvisor() {
    const container = document.getElementById("fundingOptimizationAdvisor");
    if (!container) return;

    const selectedYear = getViewYear();
    const selectedMonth = getViewMonth();

    // Map budget categories for reference
    const categoryTypes = {};
    appData.categories.forEach(cat => {
        categoryTypes[cat.categoryName] = cat.budgetType;
    });

    // Calculate total monthly obligations across all accounts
    let totalObligations = 0;
    appData.budget.forEach(item => {
        if (Number(item.year) !== selectedYear) return;
        if (item.month !== selectedMonth) return;

        const amount = Number(item.plannedAmount || 0);
        const type = categoryTypes[item.category];

        if (type === "Expense" || type === "Debt") {
            totalObligations += amount;
        }
    });

    const bufferTarget = totalObligations * 3;
    const insights = [];

    // Rule 1: Detect Individual Account Deficits
    const accounts = appData.accounts || [];
    accounts.forEach(account => {
        const balance = Number(account.currentBalance || account.balance || 0);
        
        // Skip liabilities
        if (account.netWorthType === "Liability") return;

        // Calculate allocated planned budget for this specific account
        const accountAllocated = (appData.fundingAllocations || [])
            .filter(item => item.accountId === account.id || item.accountName === account.name)
            .reduce((sum, item) => sum + Number(item.amount || 0), 0);

        if (accountAllocated > 0 && balance < accountAllocated) {
            const deficit = accountAllocated - balance;

            // Find best source account with excess funds
            const sourceAccount = accounts
                .filter(a => a.netWorthType === "Asset" && a.id !== account.id)
                .sort((a, b) => Number(b.currentBalance || b.balance || 0) - Number(a.currentBalance || a.balance || 0))[0];

            insights.push({
                type: "DEFICIT",
                title: `${account.name} Deficit`,
                required: accountAllocated,
                current: balance,
                shortfall: deficit,
                recommendation: sourceAccount 
                    ? `Transfer ${formatCurrency(deficit)} from ${sourceAccount.name}`
                    : `Deposit ${formatCurrency(deficit)} to cover planned obligations`
            });
        }
    });

    // Rule 2: Detect Global Idle Cash
    let totalAvailableCash = 0;
    accounts.forEach(account => {
        const balance = Number(account.currentBalance || account.balance || 0);
        if (account.netWorthType === "Asset") {
            totalAvailableCash += balance;
        }
    });

    const excessCash = totalAvailableCash - bufferTarget;

    if (excessCash > 0) {
        insights.push({
            type: "IDLE_CASH",
            title: "Idle Cash Detected",
            excessAmount: excessCash,
            goalAllocation: excessCash * 0.50,
            investAllocation: excessCash * 0.50
        });
    }

    // Expose QA Metrics
    window.qaFundingAdvisor = {
        totalObligations,
        bufferTarget,
        totalAvailableCash,
        excessCash,
        insightsCount: insights.length
    };
    logQATrace(
    "DI-002",
    "loadFundingOptimizationAdvisor",
    {
        selectedYear,
        selectedMonth,
        totalObligations,
        totalAvailableCash
    },
    {
        bufferTarget,
        excessCash,
        insightsCount: insights.length
    },
    !isNaN(totalAvailableCash) &&
    !isNaN(bufferTarget) &&
    !isNaN(excessCash)
);

    container.innerHTML = `
        <div class="card">
            <h2>⚡ Funding Optimization Advisor</h2>
            <div class="metric-row">
                <span>Total Cash Available</span>
                <strong>${formatCurrency(totalAvailableCash)}</strong>
            </div>
            <div class="metric-row">
                <span>Optimization Alerts</span>
                <strong>${insights.length}</strong>
            </div>

            <hr>

            ${insights.length === 0 ? `
                <div class="advisor-action">
                    <div class="action-title">✅ Funding Perfectly Optimized</div>
                    <span style="color: var(--text-muted); font-size: 0.85rem;">
                        No cash deficits or unallocated excess detected.
                    </span>
                </div>
            ` : ""}

            ${insights.map(item => {
                if (item.type === "DEFICIT") {
                    return `
                        <div class="advisor-action deficit">
                            <div class="action-title">⚠️ ${item.title}</div>
                            <div class="allocation-row">
                                <span>Required / Current</span>
                                <strong>${formatCurrency(item.required)} / ${formatCurrency(item.current)}</strong>
                            </div>
                            <div class="allocation-row">
                                <span>Shortfall</span>
                                <strong style="color: #ef4444;">${formatCurrency(item.shortfall)}</strong>
                            </div>
                            <div class="recommendation-pill">
                                💡 ${item.recommendation}
                            </div>
                        </div>
                    `;
                }

                if (item.type === "IDLE_CASH") {
                    return `
                        <div class="advisor-action opportunity">
                            <div class="action-title">💤 ${item.title}</div>
                            <div class="allocation-row">
                                <span>Unallocated Excess</span>
                                <strong>${formatCurrency(item.excessAmount)}</strong>
                            </div>
                            <div class="allocation-row">
                                <span>🎯 Goal Reserve (50%)</span>
                                <strong>${formatCurrency(item.goalAllocation)}</strong>
                            </div>
                            <div class="allocation-row">
                                <span>📈 Investment Sweep (50%)</span>
                                <strong>${formatCurrency(item.investAllocation)}</strong>
                            </div>
                        </div>
                    `;
                }

                return "";
            }).join("")}
        </div>
    `;
}

async function loadWealthProjectionAccelerator() {
    const container = document.getElementById("wealthProjectionAccelerator");
    if (!container) return;

    const selectedYear = getViewYear();
    const selectedMonth = getViewMonth();

    const categoryTypes = {};
    (appData.categories || []).forEach(cat => {
        categoryTypes[cat.categoryName] = cat.budgetType;
    });

    let income = 0;
    let expense = 0;
    let savings = 0;
    let debt = 0;

    (appData.budget || []).forEach(item => {
        if (Number(item.year) !== selectedYear) return;
        if (item.month !== selectedMonth) return;

        const amount = Number(item.plannedAmount || 0);
        const type = categoryTypes[item.category];

        if (type === "Income") income += amount;
        if (type === "Expense") expense += amount;
        if (type === "Savings") savings += amount;
        if (type === "Debt") debt += amount;
    });

    const monthlySurplus = income - expense - savings - debt;
    const investableAmount = Math.max(0, monthlySurplus * 0.70); // Assume 70% sweep into investments
    const annualReturnRate = 0.07; // Assumed 7% conservative annual return

    // Future Value Formula: FV = P * (((1 + r/n)^(n*t) - 1) / (r/n))
    const calculateFV = (years) => {
        const r = annualReturnRate / 12; // Monthly rate
        const n = years * 12;            // Total months
        if (r === 0) return investableAmount * n;
        return investableAmount * ((Math.pow(1 + r, n) - 1) / r);
    };

    const fv5 = calculateFV(5);
    const fv10 = calculateFV(10);
    const fv20 = calculateFV(20);

    // Expose QA Metrics for qa.js
    window.qaAccelerator = {
        investableAmount,
        fv5,
        fv10,
        fv20
    };

    logQATrace(
    "DI-003",
    "loadWealthProjectionAccelerator",
    {
        income,
        expense,
        savings,
        debt
    },
    {
        investableAmount,
        fv5,
        fv10,
        fv20
    },
    fv20 >= fv10 && fv10 >= fv5
);

    container.innerHTML = `
        <div class="card">
            <h2>🚀 Wealth Projection Accelerator</h2>
            <div class="metric-row">
                <span>Monthly Investable Surplus</span>
                <strong>${formatCurrency(investableAmount)}</strong>
            </div>
            <div class="metric-row">
                <span>Assumed Return (CAGR)</span>
                <strong>7.0%</strong>
            </div>

            <hr>

            <div class="metric-row">
                <span>5-Year Projection</span>
                <strong style="color: #10b981;">${formatCurrency(fv5)}</strong>
            </div>
            <div class="metric-row">
                <span>10-Year Projection</span>
                <strong style="color: #10b981;">${formatCurrency(fv10)}</strong>
            </div>
            <div class="metric-row">
                <span>20-Year Projection</span>
                <strong style="color: #10b981;">${formatCurrency(fv20)}</strong>
            </div>
        </div>
    `;
}

async function loadPersonalInflation() {
    const container = document.getElementById("personalInflation");
    if (!container) return;

    const currentYear = Number(getViewYear());
    const currentMonth = getViewMonth();
    const previousYear = currentYear - 1;

    const categoryTypes = {};
    appData.categories.forEach(cat => {
        categoryTypes[cat.categoryName] = cat.budgetType;
    });

    let currentExpense = 0;
    let previousExpense = 0;
    let sourceUsed = "Transactions";

    appData.transactions.forEach(tx => {
        const txDate = new Date(tx.Date || tx.date);
        if (isNaN(txDate.getTime())) return;
        const txYear = txDate.getFullYear();
        const txMonth = txDate.toLocaleString("en-US", { month: "short" });
        const txType = tx["Budget Type"] || tx.budgetType;
        if (txType !== "Expense") return;
        const amount = Number(tx.Amount || tx.amount || 0);

        if (txYear === currentYear && txMonth === currentMonth) {
            currentExpense += amount;
        }
        if (txYear === previousYear && txMonth === currentMonth) {
            previousExpense += amount;
        }
    });

    if (currentExpense === 0 && previousExpense === 0) {
        sourceUsed = "BudgetPlan";
        appData.budget.forEach(item => {
            const type = categoryTypes[item.category];
            if (type !== "Expense") return;
            const amount = Number(item.plannedAmount || 0);
            const itemYear = Number(item.year);
            if (itemYear === currentYear && item.month === currentMonth) {
                currentExpense += amount;
            }
            if (itemYear === previousYear && item.month === currentMonth) {
                previousExpense += amount;
            }
        });
    }

    if (previousExpense === 0 && appData.transactions && appData.transactions.length > 0) {
        sourceUsed = "Transactions (Fallback)";
        appData.transactions.forEach(tx => {
            const txDate = new Date(tx.Date || tx.date);
            if (isNaN(txDate.getTime())) return;

            const txYear = txDate.getFullYear();
            const txMonthStr = txDate.toLocaleString('en-US', { month: 'short' });
            const txType = tx["Budget Type"] || tx.budgetType;

            if (txType !== "Expense") return;
            const amount = Number(tx.Amount || tx.amount || 0);

            if (txYear === currentYear && txMonthStr === currentMonth && currentExpense === 0) {
                currentExpense += amount;
            }
            if (txYear === previousYear && txMonthStr === currentMonth) {
                previousExpense += amount;
            }
        });
    }

    // intelligence.js -> loadPersonalInflation()
    const rawInflationRate = previousExpense > 0 
        ? ((currentExpense - previousExpense) / previousExpense) * 100 
        : 0;
    
    const inflationRate = Number(rawInflationRate.toFixed(2));
    
    // Expose QA Metrics for qa.js
    window.qaInflation = {
        currentYear,
        previousYear,
        currentMonth,
        currentExpense,
        previousExpense,
        inflationRate,
        sourceUsed
    };

    logQATrace(
    "DI-005",
    "loadPersonalInflation",
    {
        currentExpense,
        previousExpense,
        sourceUsed
    },
    {
        inflationRate
    },
    !isNaN(inflationRate)
);

    if (previousExpense === 0) {
        container.innerHTML = `
            <div class="card">
                <h2>📊 Personal Inflation</h2>
                <div class="metric-row">
                    <span>Current Expenses</span>
                    <strong>${formatCurrency(currentExpense)}</strong>
                </div>
                <div class="metric-row">
                    <span>Prior Year</span>
                    <strong>No Data</strong>
                </div>
                <div class="metric-row">
                    <span>Personal Inflation</span>
                    <strong>N/A</strong>
                </div>
                <div class="metric-row">
                    <span>Status</span>
                    <strong>ℹ️ Need Previous Year Budget or Transactions</strong>
                </div>
            </div>
        `;
        return;
    }

    let status = "✅ Spending Stable";
    if (inflationRate > 5) status = "⚠️ Lifestyle Inflation";
    if (inflationRate > 10) status = "🚨 Expense Growth High";

    container.innerHTML = `
        <div class="card">
            <h2>📊 Personal Inflation</h2>
            <div class="metric-row">
                <span>Current Expenses</span>
                <strong>${formatCurrency(currentExpense)}</strong>
            </div>
            <div class="metric-row">
                <span>Prior Year</span>
                <strong>${formatCurrency(previousExpense)}</strong>
            </div>
            <div class="metric-row">
                <span>Personal Inflation</span>
                <strong>${inflationRate.toFixed(1)}%</strong>
            </div>
            <div class="metric-row">
                <span>Status</span>
                <strong>${status}</strong>
            </div>
        </div>
    `;
}

// intelligence.js -> DI-005 Purchase Evaluator
async function loadPurchaseEvaluator(testAmount = null) {
    const container = document.getElementById("purchaseEvaluator");

    // Allow manual input or injected test amount for QA
    const inputVal = document.getElementById("purchaseAmount")?.value;
    const purchaseAmount = testAmount !== null 
        ? testAmount 
        : Number(inputVal || 0);

    const selectedYear = getViewYear();
    const selectedMonth = getViewMonth();

    const categoryTypes = {};
    appData.categories.forEach(cat => {
        categoryTypes[cat.categoryName] = cat.budgetType;
    });

    let monthlyExpense = 0;
    let monthlyDebt = 0;

    appData.budget.forEach(item => {
        if (Number(item.year) !== selectedYear) return;
        if (item.month !== selectedMonth) return;

        const amount = Number(item.plannedAmount || 0);
        const type = categoryTypes[item.category];

        if (type === "Expense") monthlyExpense += amount;
        if (type === "Debt") monthlyDebt += amount;
    });

    const monthlyObligations = monthlyExpense + monthlyDebt;
    const bufferTarget = monthlyObligations * 3;

    let availableCash = 0;
    appData.accounts.forEach(account => {
        const balance = Number(account.currentBalance || account.balance || 0);
        if (account.netWorthType === "Asset") {
            availableCash += balance;
        }
    });

    const cashAfterPurchase = availableCash - purchaseAmount;
    const bufferRemaining = cashAfterPurchase - bufferTarget;
    const monthsCovered = monthlyObligations > 0 ? cashAfterPurchase / monthlyObligations : 0;

    let recommendation = "✅ Affordable";
    if (cashAfterPurchase < bufferTarget) {
        recommendation = "⚠️ Impacts Emergency Buffer";
    }
    if (cashAfterPurchase <= 0) {
        recommendation = "🚨 Not Recommended";
    }

    // Expose QA Metrics for qa.js
    window.qaPurchase = {
        purchaseAmount,
        availableCash,
        monthlyObligations,
        bufferTarget,
        cashAfterPurchase,
        bufferRemaining,
        monthsCovered: Number(monthsCovered.toFixed(2)),
        recommendation
    };

    logQATrace(
    "DI-006",
    "loadPurchaseEvaluator",
    {
        purchaseAmount,
        availableCash,
        bufferTarget
    },
    {
        cashAfterPurchase,
        bufferRemaining,
        monthsCovered,
        recommendation
    },
    recommendation !== ""
);

    if (!container) return;

    const showResults = purchaseAmount > 0;

    container.innerHTML = `
        <div class="card">
            <h2>🛒 Purchase Evaluator</h2>
            <div class="form-group">
                <input
                    type="number"
                    id="purchaseAmount"
                    placeholder="Purchase Amount"
                    value="${purchaseAmount || ""}">
                <button onclick="loadPurchaseEvaluator()">
                    Evaluate
                </button>
            </div>
            ${
                showResults
                ? `
                <hr>
                <div class="metric-row">
                    <span>Cash After Purchase</span>
                    <strong>${formatCurrency(cashAfterPurchase)}</strong>
                </div>
                <div class="metric-row">
                    <span>Buffer Remaining</span>
                    <strong>${formatCurrency(bufferRemaining)}</strong>
                </div>
                <div class="metric-row">
                    <span>Months Covered</span>
                    <strong>${monthsCovered.toFixed(1)}</strong>
                </div>
                <div class="metric-row">
                    <span>Recommendation</span>
                    <strong>${recommendation}</strong>
                </div>
                `
                : `
                <hr>
                <p>Enter a purchase amount to evaluate its impact on your finances.</p>
                `
            }
        </div>
    `;
}

// intelligence.js -> DI-006 Wealth Sweep Automation
async function loadWealthSweep() {
    const container = document.getElementById("wealthSweep");

    // Retrieve excess cash from DI-002/Buffer calculation
    const availableCash = window.qaBuffer?.availableCash || 0;
    const bufferTarget = window.qaBuffer?.bufferTarget || 0;
    const excessCash = Math.max(0, availableCash - bufferTarget);

    // Default Allocation Ratios: 20% Debt Payoff, 10% Emergency Top-up, 70% Investment
    const debtSweep = excessCash * 0.20;
    const emergencySweep = excessCash * 0.10;
    const investmentSweep = excessCash * 0.70;

    // Projected 3-Year Investment Return @ 8% CAGR
    const estimated3YrReturn = investmentSweep * (Math.pow(1 + 0.08, 3) - 1);
    const total3YrBenefit = debtSweep + investmentSweep + estimated3YrReturn;

    // Expose QA Metrics for qa.js
    window.qaSweep = {
        excessCash,
        debtSweep,
        emergencySweep,
        investmentSweep,
        estimated3YrReturn: Number(estimated3YrReturn.toFixed(2)),
        total3YrBenefit: Number(total3YrBenefit.toFixed(2))
    };
    logQATrace(
    "DI-007",
    "loadWealthSweep",
    {
        availableCash,
        bufferTarget,
        excessCash
    },
    {
        debtSweep,
        emergencySweep,
        investmentSweep,
        total3YrBenefit
    },
    Math.abs(
        (debtSweep + emergencySweep + investmentSweep)
        - excessCash
    ) < 1
);

    if (!container) return;

    container.innerHTML = `
        <div class="card">
            <h2>🧹 Wealth Sweep Automation</h2>
            ${
                excessCash > 0
                ? `
                <div class="metric-row">
                    <span>Available Excess Cash</span>
                    <strong>${formatCurrency(excessCash)}</strong>
                </div>
                <hr>
                <h3>Recommended Action Plan</h3>
                <div class="metric-row">
                    <span>💳 Debt Payoff Allocation (20%)</span>
                    <strong>${formatCurrency(debtSweep)}</strong>
                </div>
                <div class="metric-row">
                    <span>🛡️ Emergency Buffer Cushion (10%)</span>
                    <strong>${formatCurrency(emergencySweep)}</strong>
                </div>
                <div class="metric-row">
                    <span>📈 Wealth Investment Sweep (70%)</span>
                    <strong>${formatCurrency(investmentSweep)}</strong>
                </div>
                <hr>
                <div class="metric-row">
                    <span>Expected 3-Year Value Added</span>
                    <strong>${formatCurrency(total3YrBenefit)}</strong>
                </div>
                `
                : `<p>No excess cash detected above buffer targets for this period.</p>`
            }
        </div>
    `;
}

// intelligence.js -> DI-008: Monthly Wealth Action Plan
async function loadMonthlyWealthActionPlan() {
    const container = document.getElementById("monthlyWealthActionPlan");

    // Ensure prerequisite modules are updated
    await loadBufferVsInvest();
    await loadFinancialHealthAdvisor();
    await loadFundingOptimizationAdvisor();
    await loadWealthSweep();

    const actions = [];

    // 1. High Priority: Funding Deficits
    if (window.qaFundingAdvisor?.insightsCount > 0) {
        actions.push({
            priority: 1,
            badge: "🚨 Critical Deficit",
            title: "Resolve Account Funding Shortfalls",
            detail: "Address projected account deficits to prevent overdrafts on scheduled obligations.",
            impact: "Avoids penalty fees and keeps budget on track"
        });
    }

    // 2. High Priority: Savings Gap
    if (window.qaFinancialHealthAdvisor?.savingsRate < 20) {
        const gap = window.qaFinancialHealthAdvisor.wealthImpact;
        actions.push({
            priority: 2,
            badge: "🎯 Savings Gap",
            title: "Increase Monthly Savings Rate",
            detail: "Current savings rate is under 20%. Increase monthly contribution toward savings goals.",
            impact: `10-Year Net Worth Impact: +${formatCurrency(gap)}`
        });
    }

    // 3. Medium Priority: Wealth Sweep Capital Deployment
    if (window.qaSweep?.excessCash > 0) {
        const excess = window.qaSweep.excessCash;
        const invest = window.qaSweep.investmentSweep;
        const debt = window.qaSweep.debtSweep;
        const benefit = window.qaSweep.total3YrBenefit;

        actions.push({
            priority: 3,
            badge: "🧹 Wealth Sweep",
            title: `Deploy ${formatCurrency(excess)} Excess Cash`,
            detail: `Allocate ${formatCurrency(invest)} to investments & ${formatCurrency(debt)} to debt payoff.`,
            impact: `Estimated 3-Yr Return: +${formatCurrency(benefit)}`
        });
    }

    // Sort actions by priority
    actions.sort((a, b) => a.priority - b.priority);

    // Expose QA Metrics for qa.js
    window.qaActionPlan = {
        totalActions: actions.length,
        topPriority: actions[0]?.title || "Fully Optimized"
    };

logQATrace(
    "DI-008",
    "loadMonthlyWealthActionPlan",
    {
        fundingAlerts:
            window.qaFundingAdvisor?.insightsCount || 0,

        savingsRate:
            window.qaFinancialHealthAdvisor?.savingsRate || 0,

        excessCash:
            window.qaSweep?.excessCash || 0
    },
    {
        totalActions:
            actions.length,

        topPriority:
            actions[0]?.title || "Fully Optimized"
    },
    actions.length >= 0
);

    if (!container) return;

    container.innerHTML = `
        <div class="card">
            <h2>📋 Monthly Wealth Action Plan</h2>
            ${actions.length === 0 ? `
                <div class="advisor-action">
                    <div class="action-title">✅ Everything is Optimized!</div>
                    <p style="color: var(--text-muted); font-size: 0.85rem;">
                        No critical actions required for this period. Keep executing your current plan.
                    </p>
                </div>
            ` : ""}

            ${actions.map(act => `
                <div class="advisor-action priority-${act.priority}" style="margin-bottom: 12px;">
                    <div class="action-header" style="display: flex; justify-content: space-between; align-items: center;">
                        <div class="action-title" style="font-weight: bold;">${act.title}</div>
                        <span class="badge" style="font-size: 0.75rem; padding: 2px 8px; border-radius: 4px; background: rgba(255,255,255,0.1);">${act.badge}</span>
                    </div>
                    <p style="margin: 6px 0; font-size: 0.85rem; color: var(--text-muted);">${act.detail}</p>
                    <div class="allocation-row" style="font-size: 0.85rem; color: #10b981; font-weight: bold;">
                        <span>Projected Benefit:</span>
                        <span>${act.impact}</span>
                    </div>
                </div>
            `).join("")}
        </div>
    `;
}

async function loadScenarioWorkbench() {

    const container =
        document.getElementById("scenarioWorkbench");

    if (!container) return;

    container.innerHTML = `
        <div class="card">

            <h2>🧪 Scenario Simulator</h2>

            <div class="form-group">
                <label>Category</label>
                <select id="scenarioCategory"></select>
            </div>

            <div class="form-group">
                <label>Scenario Amount</label>
                <input
                    type="number"
                    id="scenarioAmount"
                    placeholder="Enter new amount">
            </div>

            <div class="action-buttons">
                <button onclick="runScenario()">
                    📊 Run Scenario
                </button>
            </div>

            <div id="scenarioResults"></div>

        </div>
    `;

    await loadScenarioCategories();
}
