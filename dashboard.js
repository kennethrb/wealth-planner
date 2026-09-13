async function loadFinancialHealth() {
    const selectedYear = getViewYear();
    const selectedMonth = getViewMonth();
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
        if (item.month !== selectedMonth) return;
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

function getAssetClassTotals() {
    const totals = {};
    appData.accounts.forEach(account => {
        if (account.netWorthType !== "Asset") {
            return;
        }
        const assetClass = account.assetClass || "Unclassified";
        const balance = Number(account.currentBalance || account.balance || 0);
        totals[assetClass] = (totals[assetClass] || 0) + balance;
    });
    return totals;
}

function getAssetAllocation() {
    const totals = getAssetClassTotals();
    const totalAssets = Object.values(totals).reduce((sum, value) => sum + value, 0);
    const allocation = {};
    Object.entries(totals).forEach(([assetClass, value]) => {
        allocation[assetClass] = {
            amount: value,
            percent: totalAssets > 0 ? Number(
                ((value / totalAssets) * 100).toFixed(1)) : 0
        };
    });
    return allocation;
}

function loadAssetAllocationAdvisor() {
    const recommendation = getAssetAllocationRecommendation();
    document.getElementById("assetAllocationAdvisor").innerHTML = `
        <div class="card">
            <h2>🎯 Asset Allocation Advisor</h2>

            <div class="metric-row">
                <strong>${recommendation.title}</strong>
            </div>

            <p>
                ${recommendation.message}
            </p>
        </div>
    `;
}



async function loadNetWorth() {

    console.log("NETWORTH ACCOUNTS");
    console.table(
        appData.accounts.map(a => ({
            name: a.accountName,
            type: a.netWorthType,
            balance: a.currentBalance
        }))
    );
    let assets = 0,
        liabilities = 0;
    appData.accounts.forEach(account => {
        const balance = Number(account.currentBalance || account.balance || 0);
        if (account.netWorthType === "Asset") assets += balance;
        if (account.netWorthType === "Liability") liabilities += balance;
    });
    const netWorth = assets - liabilities;
    const isNegative = netWorth < 0;

        
    console.log({
        assets,
        liabilities,
        netWorth
    });

    
    document.getElementById("networth").innerHTML = `
    <div class="networth-banner ${isNegative ? 'negative' : 'positive'}">
    <div class="card-header">
        <h2> 💎 Net Worth </h2>
        <button class="info-button" onclick="showFeatureGuide('networth')"> ? </button>
    </div>
      <div class="big-amount">${formatCurrency(netWorth)}</div>
      <div class="networth-details">
        <span>Assets: <strong>${formatCurrency(assets)}</strong></span>
        <span>Liabilities: <strong>${formatCurrency(liabilities)}</strong></span>
      </div>
    </div>
  `;
}

async function loadProjection() {
    const selectedYear = getViewYear();
    const selectedMonth = getViewMonth();
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
        if (item.month !== selectedMonth) return;
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
      <div class="card-header">
            <h2>📈 Wealth Projection</h2>
        
            <button
                class="info-button"
                onclick="showFeatureGuide('projection')">
                ?
            </button>
        </div>
      <div class="metric-row"><span>Current Assets</span><strong>${formatCurrency(assets)}</strong></div>
      <div class="metric-row"><span>Current Net Worth</span><strong>${formatCurrency(assets - liabilities)}</strong></div>
      <hr>
      <div class="metric-row"><span>Projected Assets</span><strong>${formatCurrency(projectedAssets)}</strong></div>
      <div class="metric-row"><span>Projected Net Worth</span><strong>${formatCurrency(projectedNetWorth)}</strong></div>
    </div>
  `;
}

function loadFundingPlan() {

    const selectedYear = getViewYear();
    const selectedMonth = getViewMonth();

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

            if (item.month !== selectedMonth)
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
    const container = document.getElementById("reconciliation");
    if (!container) return;
    let reconciledCount = 0;
    let exceptionAccounts = [];
    appData.accounts.forEach(account => {
        const accountId = account.accountId;
        const openingBalance = Number(account.openingBalance || 0);
        const currentBalance = Number(account.currentBalance || 0);
        let expectedBalance = openingBalance;
        appData.transactions.forEach(tx => {
            const sourceAccountId = tx.accountId || tx["Account ID"];
            const destinationAccountId = tx.transferToAccountId || tx["Transfer To Account ID"];
            const amount = Number(tx.Amount || tx.amount || 0);
            const type = tx["Budget Type"] || tx.budgetType || "";
            //
            // Source Account
            //
            if (sourceAccountId === accountId) {
                switch (type) {
                    case "Income":
                        expectedBalance += amount;
                        break;
                    case "Expense":
                    case "Savings":
                    case "Debt":
                    case "Transfer":
                        expectedBalance -= amount;
                        break;
                }
            }
            //
            // Destination Account
            //
            if (destinationAccountId === accountId) {
                switch (type) {
                    case "Transfer":
                        expectedBalance += amount;
                        break;
                    case "Debt":
                        expectedBalance -= amount;
                        break;
                }
            }
        });
        const difference = currentBalance - expectedBalance;
        const reconciled = Math.abs(difference) < 0.01;
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
        (a, b) => b.variance - a.variance);
    const reviewCount = exceptionAccounts.length;
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
            <span>⚠️ Need Review</span>
            <strong>${reviewCount}</strong>
        </div>

        <hr>

        <h3>⚠️ Accounts Requiring Attention</h3>

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

function loadAdvisorDashboard() {

    const container =
        document.getElementById(
            "wealthAdvisor"
        );

    if (!container) return;

    const advisor =
        loadMonthlyWealthBrief();

    container.innerHTML = `

        <div class="card">

            <h2>
                🧠 Wealth Advisor
            </h2>

            <div class="advisor-headline">
                ${advisor.headline}
            </div>

            <div class="advisor-status ${
                advisor.confidenceLevel === "HIGH"
                    ? "success"
                    : advisor.confidenceLevel === "MEDIUM"
                    ? "warning"
                    : "danger"
            }">

                ${advisor.confidenceLevel}
                (${advisor.confidenceScore}%)

            </div>

            <div class="advisor-summary">

                ${advisor.summary}

            </div>

            <div class="advisor-impact">

                <div class="impact-label">

                    Potential Wealth Impact

                </div>

                <div class="impact-value">

                    ${advisor.projectedImpact}

                </div>

            </div>

            <hr>

            <div class="advisor-action">

                <div class="action-title">

                    Why This Matters

                </div>

                <p>

                    ${advisor.advisorReason}

                </p>

            </div>

            <hr>

            <h3>
                Top Actions
            </h3>

            ${advisor.topActions.map(action => `
                <div class="advisor-action priority">

                    <div class="action-title">

                        ${action.action}

                    </div>

                    <div class="allocation-row">

                        <span>
                            Source
                        </span>

                        <strong>
                            ${action.source}
                        </strong>

                    </div>

                </div>
            `).join("")}

            ${
                advisor.warnings.length
                ? `
                <hr>

                <h3>
                    Warnings
                </h3>

                ${advisor.warnings.map(w => `
                    <div class="advisor-action deficit">

                        <strong>
                            ${w.category}
                        </strong>

                        <p>
                            ${w.message}
                        </p>

                    </div>
                `).join("")}
                `
                : ""
            }

            ${
                advisor.opportunities.length
                ? `
                <hr>

                <h3>
                    Opportunities
                </h3>

                ${advisor.opportunities.map(o => `
                    <div class="advisor-action opportunity">

                        <strong>
                            ${o.category}
                        </strong>

                        <p>
                            ${o.action}
                        </p>

                    </div>
                `).join("")}
                `
                : ""
            }

        </div>

    `;
}
