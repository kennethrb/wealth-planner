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

        const type =
            String(account.type || "")
            .toLowerCase();

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
