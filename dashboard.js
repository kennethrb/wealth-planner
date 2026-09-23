

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
            
                    case "Savings":
                        expectedBalance += amount;
                        break;
            
                    case "Debt":
                        expectedBalance -= amount;
                        break;
                }
            }
        });
const difference =
    currentBalance -
    expectedBalance;

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
    const container = document.getElementById("wealthAdvisor");
    if (!container) return;
    const advisor = loadMonthlyWealthBrief();
    const executiveBrief =
        window.qaExecutiveBrief;
    const narrative =
        advisor.narrative || {};
    const confidenceBreakdown =
        advisor.confidenceBreakdown;
    const previousRecommendation =
        getLatestAdvisorMemory();
    const effectiveness =
        getAdvisorEffectiveness();
    const monthlyReview =
        getMonthlyWealthReview();
    const outcomeDetails =
        previousRecommendation
            ? getRecommendationOutcome(
                previousRecommendation
              )
            : null;
    container.innerHTML = ` <div class="card wealth-advisor-premium">
        <div class="card-header">
            <h2>🧠 Wealth Advisor</h2>
            <button class="info-button" onclick="showFeatureGuide('wealthAdvisor')"> ? </button>
        </div>
        <div class="advisor-recommendation">
            <div class="advisor-recommendation-label"> Recommended Action </div>
            <div class="advisor-recommendation-title"> ${advisor.headline} </div>
        </div>
        <div class="advisor-impact">
            <div class="impact-label"> Safe To Spend </div>
            <div class="impact-value"> ${formatCurrency( executiveBrief.safeToSpend )} </div>
        </div>
        <div class="advisor-mini-grid">
            <div class="advisor-mini-card">
                <div class="advisor-mini-label"> Current Mode </div>
                <div class="advisor-mini-value"> ${executiveBrief.currentMode} </div>
            </div>
            <div class="advisor-mini-card">
                <div class="advisor-mini-label"> Confidence </div>
                <div class="advisor-mini-value"> ${executiveBrief.confidence}% </div>
            </div>
            <div class="advisor-mini-card">
                <div class="advisor-mini-label"> Opportunities </div>
                <div class="advisor-mini-value"> ${executiveBrief.opportunities} </div>
            </div>
            <div class="advisor-mini-card">
                <div class="advisor-mini-label"> Risks </div>
                <div class="advisor-mini-value"> ${executiveBrief.risks} </div>
            </div>
        </div>
        <div class="advisor-section-card">
            <div class="advisor-section-title">
                Confidence Drivers
            </div>
            ${confidenceBreakdown.factors.map(factor => `
                <div class="allocation-row">
                    <span>
                        ${factor.message}
                    </span>
                    <strong>
                        ${
                            factor.status === "GOOD"
                                ? "✅"
                                : factor.status === "FAIR"
                                    ? "🟡"
                                    : "⚠️"
                        }
                    </strong>
                </div>
            `).join("")}
        </div>
        <div class="advisor-section-card">
            <div class="advisor-section-title"> 🎯 Why Now </div>
            <div class="advisor-section-text"> ${narrative.reason || "No explanation available"} </div>
        </div>
        <div class="advisor-section-card">
            <div class="advisor-section-title"> 📈 Wealth Impact </div>
            <div class="advisor-section-text"> ${narrative.wealthImpact || "No impact available"} </div>
        </div>
        <div class="advisor-section-card">
            <div class="advisor-section-title"> ⚠️ Risk If Ignored </div>
            <div class="advisor-section-text"> ${narrative.riskIfIgnored || "No risk available"} </div>
        </div> ${narrative.alternativeActions?.length ? ` <div class="advisor-section-card">
            <div class="advisor-section-title"> Alternative Actions </div> ${narrative.alternativeActions .map(action => ` <div class="advisor-alt-item"> ${action} </div> `) .join("")}
        </div> ` : ""} <div class="advisor-impact">
            <div class="impact-label"> Potential Wealth Impact </div>
            <div class="impact-value"> ${advisor.projectedImpact} </div>
        </div>
        ${previousRecommendation ? `
        
        <div class="advisor-section-card">
        
            <div class="advisor-section-title">
                Previous Recommendation
            </div>
        
            <div class="advisor-section-text">
                ${previousRecommendation.recommendation}
                ${previousRecommendation.outcome ? `
                
                    <div class="advisor-outcome">
                
                        ${previousRecommendation.outcome}
                
                    </div>
                
                    <div class="advisor-outcome">
                
                        Wealth Impact
                
                        <strong>
                
                            ${outcomeDetails.wealthImpact}
                
                        </strong>
                
                    </div>
                
                ` : ""}
            </div>
            <div class="allocation-row">
                <span>Status</span>
                <span
                    class="advisor-status-badge
                    advisor-status-${
                        previousRecommendation.status
                        .toLowerCase()
                    }">
                    ${
                        previousRecommendation.status === "COMPLETED"
                            ? "✅"
                            : previousRecommendation.status === "DEFERRED"
                                ? "⏸️"
                                : previousRecommendation.status === "IGNORED"
                                    ? "⚠️"
                                    : "🟡"
                    }
                    ${previousRecommendation.status}
                </span>
            </div>
                    ${previousRecommendation.status === "PENDING" ? `
                    
                    <div class="advisor-outcome-actions">
                    
                        <select
                            class="advisor-outcome-select"
                    
                            onchange="
                    
                                if(this.value){
                    
                                    updateAdvisorStatus(
                    
                                        '${previousRecommendation.recommendationId}',
                    
                                        this.value,
                    
                                        this.value === 'COMPLETED'
                                        
                                            ? '${outcomeDetails?.outcome || ""}'
                                        
                                            : ''
                    
                                    );
                    
                                }
                    
                            ">
                    
                            <option value="">
                                Select Outcome...
                            </option>
                    
                            <option value="COMPLETED">
                                ✅ Mark Completed
                            </option>
                    
                            <option value="DEFERRED">
                                ⏸️ Deferred
                            </option>
                    
                            <option value="IGNORED">
                                ⚠️ Ignored
                            </option>
                    
                        </select>
                    
                    </div>
                    
                    ` : ""}
        </div>
        
        ` : ""}

        <div class="advisor-section-card">
            <div class="advisor-section-title"> Advisor Effectiveness </div>
            <div class="advisor-mini-grid">
                <div class="advisor-mini-card">
                    <div class="advisor-mini-label"> Success Rate </div>
                    <div class="advisor-mini-value"> ${effectiveness.successRate}% </div>
                </div>
                <div class="advisor-mini-card">
                    <div class="advisor-mini-label"> Executed </div>
                    <div class="advisor-mini-value"> ${effectiveness.completed} </div>
                </div>
                <div class="advisor-mini-card">
                    <div class="advisor-mini-label"> Deferred </div>
                    <div class="advisor-mini-value"> ${effectiveness.deferred} </div>
                </div>
                <div class="advisor-mini-card">
                    <div class="advisor-mini-label"> Ignored </div>
                    <div class="advisor-mini-value"> ${effectiveness.ignored} </div>
                </div>
            </div>
            <div class="advisor-outcome"> Advisor Performance: ${effectiveness.effectivenessLevel} </div>
        </div>
        <div class="advisor-section-card">
            <div class="advisor-section-title"> Monthly Wealth Review </div>
            <div class="advisor-mini-grid">
                <div class="advisor-mini-card">
                    <div class="advisor-mini-label"> Executed </div>
                    <div class="advisor-mini-value"> ${monthlyReview.executed} </div>
                </div>
                <div class="advisor-mini-card">
                    <div class="advisor-mini-label"> Deferred </div>
                    <div class="advisor-mini-value"> ${monthlyReview.deferred} </div>
                </div>
                <div class="advisor-mini-card">
                    <div class="advisor-mini-label"> Ignored </div>
                    <div class="advisor-mini-value"> ${monthlyReview.ignored} </div>
                </div>
                <div class="advisor-mini-card">
                    <div class="advisor-mini-label"> Success Rate </div>
                    <div class="advisor-mini-value"> ${monthlyReview.successRate}% </div>
                </div>
            </div>
            <div class="advisor-outcome"> Top Outcome <strong> ${monthlyReview.topOutcome} </strong>
            </div>
            <div class="advisor-outcome"> Next Focus <strong> ${monthlyReview.nextFocus} </strong>
            </div>
            <div class="advisor-outcome">
            
                Wealth Impact Created
            
                <strong>
            
                    ${formatCurrency(
                        monthlyReview.wealthImpactCreated
                    )}
            
                </strong>
            
            </div>
        </div>
        <div class="advisor-chat-card">
            <div class="advisor-section-title"> Ask Wealth Advisor </div>
            <div class="advisor-chat">
                <input type="text" id="advisorQuestion" placeholder="What should I do next?" class="advisor-input">
                <button onclick="askAdvisorQuestion()" class="advisor-button"> Ask </button>
            </div>
            <div id="advisorResponse"></div>
        </div>
    </div> `;
}

function askAdvisorQuestion() {
    const question = document.getElementById("advisorQuestion")?.value || "";
    if (!question) return;
    const response = askWealthAdvisor(question);
    document.getElementById("advisorResponse").innerHTML = ` <div class="advisor-action priority">
    <div class="action-title"> ${response.answer} </div>
    <div class="allocation-row">
        <span> Confidence </span>
        <strong> ${response.confidence}% </strong>
    </div>
    <div class="allocation-row">
        <span> Source </span>
        <strong> ${response.source} </strong>
    </div>
</div> 
`;
}
