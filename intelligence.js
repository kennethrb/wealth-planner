/**
 * Wealth Planner Intelligence Engine
 */

const DEBUG_QA = true;

async function loadBufferVsInvest() {
    const selectedYear = getViewYear();
    const selectedMonth = getViewMonth();

    const budgetData = appData.budget.filter(
        item => Number(item.year) === selectedYear
    );

    const categoryTypes = {};
    appData.categories.forEach(cat => {
        categoryTypes[cat.categoryName] = cat.budgetType;
    });

    let monthlyExpense = 0;
    let monthlyDebt = 0;

    budgetData.forEach(item => {
        if (item.month !== selectedMonth) return;
        const type = categoryTypes[item.category];
        const amount = Number(item.plannedAmount || 0);

        if (type === "Expense") monthlyExpense += amount;
        if (type === "Debt") monthlyDebt += amount;
    });

    const monthlyObligations = monthlyExpense + monthlyDebt;
    const bufferTarget = monthlyObligations * 3;

    let availableCash = 0;
    appData.accounts.forEach(account => {
        const balance = Number(account.currentBalance || account.balance || 0);
        const isAsset = account.netWorthType === "Asset";
        if (!isAsset) return;
        availableCash += balance;
    });

    const excessCash = availableCash - bufferTarget;

    // Expose QA Metrics[cite: 6]
    window.qaBuffer = {
        availableCash,
        monthlyObligations,
        bufferTarget,
        excessCash
    };

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

    const inflationRate = previousExpense > 0 
        ? ((currentExpense - previousExpense) / previousExpense) * 100 
        : null;

    // Expose QA Metrics[cite: 6]
    window.qaInflation = {
        currentYear,
        previousYear,
        currentMonth,
        currentExpense,
        previousExpense,
        inflationRate,
        sourceUsed
    };

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

async function loadPurchaseEvaluator() {
    const container = document.getElementById("purchaseEvaluator");
    if (!container) return;

    const purchaseAmount = Number(
        document.getElementById("purchaseAmount")?.value || 0
    );

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

    // Expose QA Metrics[cite: 6]
    window.qaPurchase = {
        purchaseAmount,
        cashAfterPurchase,
        bufferRemaining,
        monthsCovered,
        recommendation
    };

    const showResults = purchaseAmount > 0;

    container.innerHTML = `
        <div class="card">
            <h2>🛒 Purchase Evaluator</h2>
            <div class="form-row">
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

async function loadWealthSweep() {
    const container = document.getElementById("wealthSweep");
    if (!container) return;

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

    const excessCash = availableCash - bufferTarget;

    if (excessCash <= 0) {
        // Expose QA Metrics for negative/zero excess cash[cite: 6]
        window.qaSweep = {
            excessCash,
            debtSweep: 0,
            emergencySweep: 0,
            investmentSweep: 0
        };

        container.innerHTML = `
            <div class="card">
                <h2>🧹 Wealth Sweep</h2>
                <div class="metric-row">
                    <span>Status</span>
                    <strong>Build Buffer First</strong>
                </div>
            </div>
        `;
        return;
    }

    const debtSweep = excessCash * 0.20;
    const emergencySweep = excessCash * 0.10;
    const investmentSweep = excessCash * 0.70;

    // Expose QA Metrics[cite: 6]
    window.qaSweep = {
        excessCash,
        debtSweep,
        emergencySweep,
        investmentSweep
    };

    container.innerHTML = `
        <div class="card">
            <h2>🧹 Wealth Sweep</h2>
            <div class="metric-row">
                <span>Excess Cash</span>
                <strong>${formatCurrency(excessCash)}</strong>
            </div>
            <hr>
            <div class="metric-row">
                <span>Debt Reduction</span>
                <strong>${formatCurrency(debtSweep)}</strong>
            </div>
            <div class="metric-row">
                <span>Emergency Fund</span>
                <strong>${formatCurrency(emergencySweep)}</strong>
            </div>
            <div class="metric-row">
                <span>Investments</span>
                <strong>${formatCurrency(investmentSweep)}</strong>
            </div>
        </div>
    `;
}
