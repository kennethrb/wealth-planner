async function loadFinancialHealth() {
    const selectedYear = getSelectedYear();
    const budgetData = appData.budget.filter(item => Number(item.year) === selectedYear);
    const categoryTypes = {};
    appData.categories.forEach(cat => {
        categoryTypes[cat.categoryName] = cat.budgetType;
    });
    let income = 0,
        expense = 0,
        savings = 0,
        debt = 0;
    budgetData.forEach(item => {
        if (item.month !== "Jan") return;
        const type = categoryTypes[item.category];
        const amount = Number(item.plannedAmount);
        if (type === "Income") income += amount;
        if (type === "Expense") expense += amount;
        if (type === "Savings") savings += amount;
        if (type === "Debt") debt += amount;
    });
    const remaining = income - expense - savings - debt;
    const annualSurplus = remaining * 12;
    const savingsRate = income > 0 ? ((savings / income) * 100).toFixed(1) : "0.0";
    const debtRate = income > 0 ? ((debt / income) * 100).toFixed(1) : "0.0";
    document.getElementById("dashboard").innerHTML = `
    <div class="card">
      <h2>💰 Financial Health</h2>
      <div class="metric-row"><span>Monthly Surplus</span><strong>${formatCurrency(remaining)}</strong></div>
      <div class="metric-row"><span>Annual Surplus</span><strong>${formatCurrency(annualSurplus)}</strong></div>
      <div class="metric-row"><span>Savings Rate</span><strong>${savingsRate}%</strong></div>
      <div class="metric-row"><span>Debt Rate</span><strong>${debtRate}%</strong></div>
      <div class="metric-row"><span>Status</span><strong>${remaining > 0 ? "✅ Positive Cash Flow" : "❌ Negative Cash Flow"}</strong></div>
    </div>
  `;
}

async function loadNetWorth() {
    let assets = 0,
        liabilities = 0;
    appData.accounts.forEach(account => {
        const balance = Number(account.currentBalance || account.balance || 0);
        if (account.netWorthType === "Asset") assets += balance;
        if (account.netWorthType === "Liability") liabilities += balance;
    });
    const netWorth = assets - liabilities;
    const isNegative = netWorth < 0;
    document.getElementById("networth").innerHTML = `
    <div class="networth-banner ${isNegative ? 'negative' : 'positive'}">
      <h2>💎 Net Worth</h2>
      <div class="big-amount">${formatCurrency(netWorth)}</div>
      <div class="networth-details">
        <span>Assets: <strong>${formatCurrency(assets)}</strong></span>
        <span>Liabilities: <strong>${formatCurrency(liabilities)}</strong></span>
      </div>
    </div>
  `;
}

async function loadProjection() {
    const selectedYear = getSelectedYear();
    const budgetData = appData.budget.filter(item => Number(item.year) === selectedYear);
    const categoryTypes = {};
    appData.categories.forEach(cat => {
        categoryTypes[cat.categoryName] = cat.budgetType;
    });
    let assets = 0,
        liabilities = 0;
    appData.accounts.forEach(account => {
        const balance = Number(account.currentBalance || account.balance || 0);
        if (account.netWorthType === "Asset") assets += balance;
        if (account.netWorthType === "Liability") liabilities += balance;
    });
    let income = 0,
        expense = 0,
        savings = 0,
        debt = 0;
    budgetData.forEach(item => {
        if (item.month !== "Jan") return;
        const amount = Number(item.plannedAmount);
        const type = categoryTypes[item.category];
        if (type === "Income") income += amount;
        if (type === "Expense") expense += amount;
        if (type === "Savings") savings += amount;
        if (type === "Debt") debt += amount;
    });
    const monthlySurplus = income - expense - savings - debt;
    const annualSurplus = monthlySurplus * 12;
    const projectedAssets = assets + annualSurplus;
    const projectedNetWorth = projectedAssets - liabilities;
    document.getElementById("projection").innerHTML = `
    <div class="card">
      <h2>📈 Wealth Projection</h2>
      <div class="metric-row"><span>Current Assets</span><strong>${formatCurrency(assets)}</strong></div>
      <div class="metric-row"><span>Current Net Worth</span><strong>${formatCurrency(assets - liabilities)}</strong></div>
      <hr>
      <div class="metric-row"><span>Projected Assets</span><strong>${formatCurrency(projectedAssets)}</strong></div>
      <div class="metric-row"><span>Projected Net Worth</span><strong>${formatCurrency(projectedNetWorth)}</strong></div>
    </div>
  `;
}

function loadFundingPlan() {

    const selectedYear = getSelectedYear();

    const container =
        document.getElementById(
            "fundingPlanList"
        );

    const cashContainer =
        document.getElementById(
            "cashToWithdraw"
        );

    if (
        !container ||
        !appData.budget ||
        !appData.categories
    ) return;

    const categoryTypes = {};
    const fundingSources = {};

    appData.categories.forEach(cat => {

        categoryTypes[
            cat.categoryName
        ] = cat.budgetType;

        fundingSources[
            cat.categoryName
        ] =
            cat.preferredFundingSource || "";

    });

    let totalIncome = 0;
    let totalExpense = 0;
    let totalSavings = 0;
    let totalDebt = 0;
    let cashToWithdraw = 0;

    const fundingRequirements = {};

    appData.budget
        .filter(
            item =>
                Number(item.year) === selectedYear
        )
        .forEach(item => {

            if (item.month !== "Jan")
                return;

            const amount =
                Number(
                    item.plannedAmount
                ) || 0;

            const type =
                categoryTypes[
                    item.category
                ];

            const source =
                fundingSources[
                    item.category
                ];

            if (type === "Income")
                totalIncome += amount;

            if (type === "Expense")
                totalExpense += amount;

            if (type === "Savings")
                totalSavings += amount;

            if (type === "Debt")
                totalDebt += amount;

            if (
                source &&
                type !== "Income"
            ) {
            
                if (
                    !fundingRequirements[
                        source
                    ]
                ) {
            
                    fundingRequirements[
                        source
                    ] = 0;
            
                }
            
                fundingRequirements[
                    source
                ] += amount;
            
                if (
                    source === "Cash Wallet"
                ) {
            
                    cashToWithdraw += amount;
            
                }
            }

        });

    if (cashContainer) {

        cashContainer.textContent =
            formatCurrency(
                cashToWithdraw
            );

    }

    let fundingHtml = "";

    Object.entries(
        fundingRequirements
    )
    .sort(
        (a, b) => b[1] - a[1]
    )
    .forEach(
        ([source, amount]) => {
    
            fundingHtml += `
                <div class="funding-row">
                    <span class="label">
                        ${source}
                    </span>
    
                    <span class="amount">
                        ${formatCurrency(amount)}
                    </span>
                </div>
            `;
        }
    );

    container.innerHTML = `
        <div class="funding-row">
            <span class="label">
                Total Monthly Income
            </span>

            <span class="amount">
                ${formatCurrency(totalIncome)}
            </span>
        </div>

        <div class="funding-row">
            <span class="label">
                Total Expenses
            </span>

            <span class="amount">
                ${formatCurrency(totalExpense)}
            </span>
        </div>

        <div class="funding-row">
            <span class="label">
                Total Savings
            </span>

            <span class="amount">
                ${formatCurrency(totalSavings)}
            </span>
        </div>

        <div class="funding-row">
            <span class="label">
                Total Debt Payments
            </span>

            <span class="amount">
                ${formatCurrency(totalDebt)}
            </span>
        </div>

        <hr>

        <h3>Funding Sources</h3>

        ${fundingHtml}
    `;
}

function loadReconciliation() {

    const container =
        document.getElementById("reconciliation");

    if (!container) return;

    let reconciledCount = 0;
    let exceptionAccounts = [];

    appData.accounts.forEach(account => {

        const accountId =
            account.accountId;

        const openingBalance =
            Number(account.openingBalance || 0);

        const currentBalance =
            Number(account.currentBalance || 0);

        let expectedBalance =
            openingBalance;

        appData.transactions.forEach(tx => {

            const txAccountId =
                tx.accountId ||
                tx["Account ID"];

            if (txAccountId !== accountId) return;

            const amount =
                Number(
                    tx.Amount ||
                    tx.amount ||
                    0
                );

            const type =
                tx["Budget Type"] ||
                tx.budgetType ||
                "";

            if (type === "Income") {
                expectedBalance += amount;
            }

            if (
                type === "Expense" ||
                type === "Savings" ||
                type === "Debt"
            ) {
                expectedBalance -= amount;
            }

        });

        const difference =
            currentBalance - expectedBalance;

        const reconciled =
            Math.abs(difference) < 0.01;

        if (reconciled) {

            reconciledCount++;

        } else {

            exceptionAccounts.push({
                name: account.accountName,
                variance: Math.abs(difference),
                difference
            });

        }

    });

    exceptionAccounts.sort(
        (a, b) => b.variance - a.variance
    );

    const reviewCount =
        exceptionAccounts.length;

    container.innerHTML = `
        <div class="card">
            <h2>✅ Account Reconciliation</h2>
        <div class="funding-row">
            <span>🏦 Total Accounts</span>
            <strong>${appData.accounts.length}</strong>
        </div>

        <div class="funding-row">
            <span>✅ Reconciled</span>
            <strong>${reconciledCount}</strong>
        </div>

        <div class="funding-row">
            <span>⚠ Need Review</span>
            <strong>${reviewCount}</strong>
        </div>

        <hr>

        <h3>⚠ Accounts Requiring Attention</h3>

        ${
            reviewCount === 0

                ? `
                    <p>
                        🎉 All accounts reconciled.
                    </p>
                  `

                : exceptionAccounts
                    .slice(0, 5)
                    .map(acc => `
                        <div class="funding-row">

                            <span>
                                ${acc.name}
                            </span>

                            <strong class="${
                                acc.difference < 0
                                    ? "text-danger"
                                    : "text-warning"
                            }">

                                ${formatCurrency(
                                    acc.difference
                                )}

                            </strong>

                        </div>
                    `)
                    .join("")
        }

    `;

}
