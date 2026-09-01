/**
 * Wealth Planner Intelligence Engine
 *
 * Roadmap Features
 *
 * 1. Buffer vs Invest
 * 2. Net Worth Velocity
 * 3. Personal Inflation Engine
 * 4. Purchase Evaluator
 * 5. Wealth Sweep Engine
 */
async function loadBufferVsInvest() {

    const selectedYear = getSelectedYear();

    const budgetData =
        appData.budget.filter(
            item => Number(item.year) === selectedYear
        );

    const categoryTypes = {};

    appData.categories.forEach(cat => {
        categoryTypes[cat.categoryName] =
            cat.budgetType;
    });

    let monthlyExpense = 0;
    let monthlyDebt = 0;

    budgetData.forEach(item => {

        if (item.month !== "Jan")
            return;

        const type =
            categoryTypes[item.category];

        const amount =
            Number(item.plannedAmount || 0);

        if (type === "Expense")
            monthlyExpense += amount;

        if (type === "Debt")
            monthlyDebt += amount;
    });

    const monthlyObligations =
        monthlyExpense +
        monthlyDebt;

    const bufferTarget =
        monthlyObligations * 3;

    let availableCash = 0;

    appData.accounts.forEach(account => {

        const balance =
            Number(
                account.currentBalance ||
                account.balance ||
                0
            );

        const isAsset =
            account.netWorthType === "Asset";

        if (!isAsset)
            return;

        availableCash += balance;
    });

    const excessCash =
        availableCash - bufferTarget;

    let recommendationHtml = "";

    if (excessCash <= 0) {

        recommendationHtml = `
            <div class="metric-row">
                <span>Status</span>
                <strong>
                    ⚠️ Build Emergency Buffer
                </strong>
            </div>

            <div class="metric-row">
                <span>Shortfall</span>
                <strong>
                    ${formatCurrency(
                        Math.abs(excessCash)
                    )}
                </strong>
            </div>
        `;

    } else {

        const investAmount =
            excessCash * 0.8;

        const debtAmount =
            excessCash * 0.2;

        recommendationHtml = `
            <div class="metric-row">
                <span>Status</span>
                <strong>
                    ✅ Excess Cash Available
                </strong>
            </div>

            <div class="metric-row">
                <span>Invest</span>
                <strong>
                    ${formatCurrency(
                        investAmount
                    )}
                </strong>
            </div>

            <div class="metric-row">
                <span>Debt Reduction</span>
                <strong>
                    ${formatCurrency(
                        debtAmount
                    )}
                </strong>
            </div>
        `;
    }

    const container =
        document.getElementById(
            "bufferVsInvest"
        );

    if (!container)
        return;

    container.innerHTML = `
        <div class="card">

            <h2>
                🧠 Buffer vs Invest
            </h2>

            <div class="metric-row">
                <span>
                    Available Cash
                </span>
                <strong>
                    ${formatCurrency(
                        availableCash
                    )}
                </strong>
            </div>

            <div class="metric-row">
                <span>
                    Monthly Obligations
                </span>
                <strong>
                    ${formatCurrency(
                        monthlyObligations
                    )}
                </strong>
            </div>

            <div class="metric-row">
                <span>
                    Buffer Target (3x)
                </span>
                <strong>
                    ${formatCurrency(
                        bufferTarget
                    )}
                </strong>
            </div>

            <div class="metric-row">
                <span>
                    Excess Cash
                </span>
                <strong>
                    ${formatCurrency(
                        excessCash
                    )}
                </strong>
            </div>

            <hr>

            ${recommendationHtml}

        </div>
    `;
}

async function loadNetWorthVelocity() {

    const container =
        document.getElementById(
            "netWorthVelocity"
        );

    if (!container) return;

    let assets = 0;
    let liabilities = 0;

    appData.accounts.forEach(account => {

        const balance =
            Number(
                account.currentBalance ||
                account.balance ||
                0
            );

        if (
            account.netWorthType === "Asset"
        ) {
            assets += balance;
        }

        if (
            account.netWorthType === "Liability"
        ) {
            liabilities += balance;
        }
    });

    const netWorth =
        assets - liabilities;

    const selectedYear =
        getViewYear();

    const selectedMonth =
        getViewMonth();

    const categoryTypes = {};

    appData.categories.forEach(cat => {
        categoryTypes[
            cat.categoryName
        ] = cat.budgetType;
    });

    let income = 0;
    let expense = 0;
    let savings = 0;
    let debt = 0;

    appData.budget.forEach(item => {

        if (
            Number(item.year) !== selectedYear
        ) return;

        if (
            item.month !== selectedMonth
        ) return;

        const amount =
            Number(
                item.plannedAmount || 0
            );

        const type =
            categoryTypes[
                item.category
            ];

        if (type === "Income")
            income += amount;

        if (type === "Expense")
            expense += amount;

        if (type === "Savings")
            savings += amount;

        if (type === "Debt")
            debt += amount;
    });

    const monthlyVelocity =
        income -
        expense -
        savings -
        debt;

    const annualVelocity =
        monthlyVelocity * 12;

    const projectedNetWorth =
        netWorth +
        annualVelocity;

    container.innerHTML = `
        <div class="card">

            <h2>
                📈 Net Worth Velocity
            </h2>

            <div class="metric-row">
                <span>
                    Current Net Worth
                </span>
                <strong>
                    ${formatCurrency(netWorth)}
                </strong>
            </div>

            <div class="metric-row">
                <span>
                    Monthly Velocity
                </span>
                <strong>
                    ${formatCurrency(monthlyVelocity)}
                </strong>
            </div>

            <div class="metric-row">
                <span>
                    Annual Velocity
                </span>
                <strong>
                    ${formatCurrency(annualVelocity)}
                </strong>
            </div>

            <div class="metric-row">
                <span>
                    Projected Next Year
                </span>
                <strong>
                    ${formatCurrency(projectedNetWorth)}
                </strong>
            </div>

        </div>
    `;
}

async function loadPersonalInflation() {

    const container =
        document.getElementById(
            "personalInflation"
        );

    if (!container) return;

    const currentYear =
        getViewYear();

    const currentMonth =
        getViewMonth();

    const previousYear =
        currentYear - 1;

    const categoryTypes = {};

    appData.categories.forEach(cat => {
        categoryTypes[
            cat.categoryName
        ] = cat.budgetType;
    });

    let currentExpense = 0;
    let previousExpense = 0;

    appData.budget.forEach(item => {

        const type =
            categoryTypes[
                item.category
            ];

        if (type !== "Expense")
            return;

        const amount =
            Number(
                item.plannedAmount || 0
            );

        if (
            Number(item.year) === currentYear &&
            item.month === currentMonth
        ) {
            currentExpense += amount;
        }

        if (
            Number(item.year) === previousYear &&
            item.month === currentMonth
        ) {
            previousExpense += amount;
        }
    });

    // No historical data available
    if (previousExpense === 0) {

        container.innerHTML = `
            <div class="card">

                <h2>
                    📊 Personal Inflation
                </h2>

                <div class="metric-row">
                    <span>
                        Current Expenses
                    </span>

                    <strong>
                        ${formatCurrency(
                            currentExpense
                        )}
                    </strong>
                </div>

                <div class="metric-row">
                    <span>
                        Prior Year
                    </span>

                    <strong>
                        No Data
                    </strong>
                </div>

                <div class="metric-row">
                    <span>
                        Personal Inflation
                    </span>

                    <strong>
                        N/A
                    </strong>
                </div>

                <div class="metric-row">
                    <span>
                        Status
                    </span>

                    <strong>
                        ℹ️ Need Previous Year Budget
                    </strong>
                </div>

            </div>
        `;

        return;
    }

    const inflationRate =
        (
            (
                currentExpense -
                previousExpense
            ) /
            previousExpense
        ) * 100;

    let status =
        "✅ Spending Stable";

    if (inflationRate > 5) {
        status =
            "⚠️ Lifestyle Inflation";
    }

    if (inflationRate > 10) {
        status =
            "🚨 Expense Growth High";
    }

    container.innerHTML = `
        <div class="card">

            <h2>
                📊 Personal Inflation
            </h2>

            <div class="metric-row">
                <span>
                    Current Expenses
                </span>

                <strong>
                    ${formatCurrency(
                        currentExpense
                    )}
                </strong>
            </div>

            <div class="metric-row">
                <span>
                    Prior Year
                </span>

                <strong>
                    ${formatCurrency(
                        previousExpense
                    )}
                </strong>
            </div>

            <div class="metric-row">
                <span>
                    Personal Inflation
                </span>

                <strong>
                    ${inflationRate.toFixed(1)}%
                </strong>
            </div>

            <div class="metric-row">
                <span>
                    Status
                </span>

                <strong>
                    ${status}
                </strong>
            </div>

        </div>
    `;
}

async function loadPurchaseEvaluator() {

    const container =
        document.getElementById(
            "purchaseEvaluator"
        );

    if (!container) return;

    const purchaseAmount =
        Number(
            document.getElementById(
                "purchaseAmount"
            )?.value || 0
        );

    const selectedYear =
        getViewYear();

    const selectedMonth =
        getViewMonth();

    const categoryTypes = {};

    appData.categories.forEach(cat => {
        categoryTypes[
            cat.categoryName
        ] = cat.budgetType;
    });

    let monthlyExpense = 0;
    let monthlyDebt = 0;

    appData.budget.forEach(item => {

        if (
            Number(item.year) !== selectedYear
        ) return;

        if (
            item.month !== selectedMonth
        ) return;

        const amount =
            Number(
                item.plannedAmount || 0
            );

        const type =
            categoryTypes[
                item.category
            ];

        if (type === "Expense")
            monthlyExpense += amount;

        if (type === "Debt")
            monthlyDebt += amount;

    });

    const monthlyObligations =
        monthlyExpense +
        monthlyDebt;

    const bufferTarget =
        monthlyObligations * 3;

    let availableCash = 0;

    appData.accounts.forEach(account => {

        const balance =
            Number(
                account.currentBalance ||
                account.balance ||
                0
            );

        if (
            account.netWorthType === "Asset"
        ) {
            availableCash += balance;
        }

    });

    const cashAfterPurchase =
        availableCash - purchaseAmount;

    const bufferRemaining =
        cashAfterPurchase -
        bufferTarget;

    const monthsCovered =
        monthlyObligations > 0
            ? cashAfterPurchase /
              monthlyObligations
            : 0;

    let recommendation =
        "✅ Affordable";

    if (
        cashAfterPurchase <
        bufferTarget
    ) {
        recommendation =
            "⚠️ Impacts Emergency Buffer";
    }

    if (
        cashAfterPurchase <= 0
    ) {
        recommendation =
            "🚨 Not Recommended";
    }

    const showResults =
        purchaseAmount > 0;

    container.innerHTML = `
        <div class="card">

            <h2>
                🛒 Purchase Evaluator
            </h2>

            <div class="form-row">

                <input
                    type="number"
                    id="purchaseAmount"
                    placeholder="Purchase Amount"
                    value="${
                        purchaseAmount || ""
                    }">

                <button
                    onclick="loadPurchaseEvaluator()">
                    Evaluate
                </button>

            </div>

            ${
                showResults
                ? `
                <hr>

                <div class="metric-row">
                    <span>
                        Cash After Purchase
                    </span>

                    <strong>
                        ${formatCurrency(
                            cashAfterPurchase
                        )}
                    </strong>
                </div>

                <div class="metric-row">
                    <span>
                        Buffer Remaining
                    </span>

                    <strong>
                        ${formatCurrency(
                            bufferRemaining
                        )}
                    </strong>
                </div>

                <div class="metric-row">
                    <span>
                        Months Covered
                    </span>

                    <strong>
                        ${monthsCovered.toFixed(1)}
                    </strong>
                </div>

                <div class="metric-row">
                    <span>
                        Recommendation
                    </span>

                    <strong>
                        ${recommendation}
                    </strong>
                </div>
                `
                : `
                <hr>

                <p>
                    Enter a purchase amount
                    to evaluate its impact
                    on your finances.
                </p>
                `
            }

        </div>
    `;
}

async function loadWealthSweep() {

    const container =
        document.getElementById(
            "wealthSweep"
        );

    if (!container) return;

    const selectedYear =
        getViewYear();

    const selectedMonth =
        getViewMonth();

    const categoryTypes = {};

    appData.categories.forEach(cat => {

        categoryTypes[
            cat.categoryName
        ] = cat.budgetType;

    });

    let monthlyExpense = 0;
    let monthlyDebt = 0;

    appData.budget.forEach(item => {

        if (
            Number(item.year) !== selectedYear
        ) return;

        if (
            item.month !== selectedMonth
        ) return;

        const amount =
            Number(
                item.plannedAmount || 0
            );

        const type =
            categoryTypes[
                item.category
            ];

        if (type === "Expense")
            monthlyExpense += amount;

        if (type === "Debt")
            monthlyDebt += amount;

    });

    const monthlyObligations =
        monthlyExpense +
        monthlyDebt;

    const bufferTarget =
        monthlyObligations * 3;

    let availableCash = 0;

    appData.accounts.forEach(account => {

        const balance =
            Number(
                account.currentBalance ||
                account.balance ||
                0
            );

        if (
            account.netWorthType === "Asset"
        ) {
            availableCash += balance;
        }

    });

    const excessCash =
        availableCash -
        bufferTarget;

    if (excessCash <= 0) {

        container.innerHTML = `
            <div class="card">

                <h2>
                    🧹 Wealth Sweep
                </h2>

                <div class="metric-row">
                    <span>
                        Status
                    </span>

                    <strong>
                        Build Buffer First
                    </strong>
                </div>

            </div>
        `;

        return;
    }

    const debtSweep =
        excessCash * 0.20;

    const emergencySweep =
        excessCash * 0.10;

    const investmentSweep =
        excessCash * 0.70;

    container.innerHTML = `
        <div class="card">

            <h2>
                🧹 Wealth Sweep
            </h2>

            <div class="metric-row">
                <span>
                    Excess Cash
                </span>

                <strong>
                    ${formatCurrency(
                        excessCash
                    )}
                </strong>
            </div>

            <hr>

            <div class="metric-row">
                <span>
                    Debt Reduction
                </span>

                <strong>
                    ${formatCurrency(
                        debtSweep
                    )}
                </strong>
            </div>

            <div class="metric-row">
                <span>
                    Emergency Fund
                </span>

                <strong>
                    ${formatCurrency(
                        emergencySweep
                    )}
                </strong>
            </div>

            <div class="metric-row">
                <span>
                    Investments
                </span>

                <strong>
                    ${formatCurrency(
                        investmentSweep
                    )}
                </strong>
            </div>

        </div>
    `;
}
