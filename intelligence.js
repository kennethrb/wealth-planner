/**
 * Wealth Planner Intelligence Engine
 */

//Create Budget Summary Engine
function getBudgetSummary(year = getViewYear(), month = getViewMonth()) {
    const categoryTypes = {};
    (appData.categories || []).forEach(cat => {
        categoryTypes[cat.categoryName] = cat.budgetType;
    });
    let income = 0;
    let expense = 0;
    let savings = 0;
    let debt = 0;
    (appData.budget || []).forEach(item => {
        if (Number(item.year) !== year) return;
        if (item.month !== month) return;
        const amount = Number(item.plannedAmount || 0);
        const type = categoryTypes[item.category];
        if (type === "Income") income += amount;
        if (type === "Expense") expense += amount;
        if (type === "Savings") savings += amount;
        if (type === "Debt") debt += amount;
    });
    return {
        income,
        expense,
        savings,
        debt,
        monthlyObligations: expense + debt,
        monthlySurplus: income - expense - savings - debt
    };
}

//Create Capital Position Engine
function getCapitalPosition() {
    const budget = getBudgetSummary();
    const availableCash = getTotalLiquidAssets(appData.accounts || []);
    const bufferTarget = budget.monthlyObligations * CONFIG.buffer.months;
    const excessCash = Math.max(0, availableCash - bufferTarget);
    return {
        availableCash,
        monthlyObligations: budget.monthlyObligations,
        bufferTarget,
        excessCash
    };
}

function getOpportunityCapital() {
    const availableCash = getTotalLiquidAssets(appData.accounts || []);
    const remainingBills =
    getCycleBills()
    .reduce(
        (sum, bill) =>
            sum +
            Number(
                bill.defaultAmount || 0
            ),
        0
    );
    const coverage = remainingBills === 0 ? CONFIG.cashFlow.unlimitedCoverage : availableCash / remainingBills;
    const surplus = availableCash - remainingBills;
    const opportunity =
        surplus > 0
            ? surplus *
              CONFIG.opportunityAllocation.reserveRatio
            : 0;
    return {
        availableCash,
        remainingBills,
        coverage,
        surplus,
        opportunity
    };
}


function getCapitalAllocationPlan() {
    const opportunity = getOpportunityCapital().opportunity;
    const allocationBase = Math.max(0, opportunity);
    return {
        opportunity: allocationBase,
        emergencyAllocation:
            allocationBase *
            CONFIG.capitalAllocation.emergencyFund,
        
        debtAllocation:
            allocationBase *
            CONFIG.capitalAllocation.debtReduction,
        
        goalAllocation:
            allocationBase *
            CONFIG.capitalAllocation.goals,
        
        investmentAllocation:
            allocationBase *
            CONFIG.capitalAllocation.investments
    };
}

/**
 * ============================================================
 * DI-011 CAPITAL RECOMMENDATION ENGINE
 * ============================================================
 *
 * PURPOSE
 * Generate all available capital deployment opportunities.
 *
 * This engine does NOT determine priority.
 *
 * Priority selection is handled by:
 *
 * getCapitalAllocationPriority()
 *
 * Output:
 * Available Wealth Opportunities
 *
 * Future Consumer:
 * - DI-011 Smart Priority Rules
 * - DI-015 Wealth Advisor Copilot
 *
 * ============================================================
 */
function getCapitalAllocationRecommendation() {
    const plan = getCapitalAllocationPlan();
    const recommendations = [];
    const emergencyStatus = getEmergencyFundGap();
    if (!emergencyStatus.fullyFunded && plan.emergencyAllocation > 0) {
        recommendations.push({
            eligible: true,
            category: "Emergency Fund",
            amount: Number(plan.emergencyAllocation.toFixed(2)),
            action: `Allocate ${formatCurrency(plan.emergencyAllocation)} to Emergency Fund`
        });
    }
    if (plan.debtAllocation > 0) {
        recommendations.push({
            eligible: true,
            category: "Debt Reduction",
            amount: Number(plan.debtAllocation.toFixed(2)),
            action: `Pay ${formatCurrency(plan.debtAllocation)} toward debt`
        });
    }
    if (plan.goalAllocation > 0) {
        recommendations.push({
            eligible: true,
            category: "Goals",
            amount: Number(plan.goalAllocation.toFixed(2)),
            action: `Fund goals with ${formatCurrency(plan.goalAllocation)}`
        });
    }
    if (plan.investmentAllocation > 0) {
        recommendations.push({
            eligible: true,
            category: "Investments",
            amount: Number(plan.investmentAllocation.toFixed(2)),
            action: `Invest ${formatCurrency(plan.investmentAllocation)}`
        });
    }

    return recommendations;
}

function getRecommendationScores() {
    const scores = [];
    const cashFlow = getOpportunityCapital();
    const emergency = getEmergencyFundGap();
    const goal = window.qaGoalFundingOptimizer;
    const sweep = window.qaSweep;
    //
    // Emergency Fund
    //
    let emergencyScore = 0;
    if (!emergency.fullyFunded) {
        emergencyScore += 50;
        emergencyScore += Math.min(emergency.gap / 10000, 30);
    }
    scores.push({
        category: "Emergency Fund",
        score: emergencyScore,
        action: "Increase emergency fund reserves"
    });
    //
    // Goal Completion
    //
    let goalScore = 0;
    if (
        goal &&
        goal.completable &&
        cashFlow.coverage >= CONFIG.cashFlow.healthyCoverage
    ) {
    
        goalScore += 100;
    
    }
    scores.push({
        category: "Goal Completion",
        score: goalScore,
        action: goal?.priorityAction
    });
    //
    // Investment Growth
    //
    let investScore = 0;
    if (sweep && sweep.total3YrBenefit > 0) {
        investScore += 40;
        investScore += Math.min(sweep.total3YrBenefit / 100000, 20);
    }
    scores.push({
        category: "Investments",
        score: investScore,
        action: "Deploy available capital into growth assets"
    });
    //
    // Debt Reduction
    //
    let debtScore = 0;
    if (sweep && sweep.debtSweep > 0) {
        debtScore += 25;
        debtScore += Math.min(sweep.debtSweep / 5000, 40);
    }
    scores.push({
        category: "Debt Reduction",
        score: debtScore,
        action: `Apply ${formatCurrency(
                sweep.debtSweep
            )} toward debt`
    });

    let cashFlowScore = 0;
    if (cashFlow.coverage < CONFIG.cashFlow.minimumCoverage) {
        cashFlowScore = 999;
    }
    scores.push({
        category: "Cash Flow Protection",
        score: cashFlowScore,
        action: "Protect liquidity"
    });
    
    scores.sort(
        (a, b) => b.score - a.score);
    return scores;
}

/**
 * ============================================================
 * DI-011 SMART PRIORITY ENGINE
 * ============================================================
 *
 * PURPOSE
 * Determine the highest-priority wealth action
 * based on the user's current financial position.
 * ============================================================
 */
function getCapitalAllocationPriority() {
    const scores = getRecommendationScores();
    const winner = scores[0];
    return {
        priority: 1,
        category: winner.category,
        action: winner.action,
        priorityScore: winner.score
    };
}

/**
 * ============================================================
 * TOP WEALTH ACTION
 * ============================================================
 *
 * PURPOSE
 * Returns the highest priority wealth action available.
 *
 * Future Consumer:
 * DI-015 Wealth Advisor Copilot
 *
 * ============================================================
 */
function getTopWealthAction() {
    return getCapitalAllocationPriority();
}

/*******************************************************
 * DI-015 Wealth Advisor
 *
 * Purpose:
 * Aggregate all intelligence engines into a single
 * advisor view.
 *
 * Consumes:
 * DI-009 Cash Flow Command Center
 * DI-010 Goal Funding Optimizer
 * DI-011 Capital Allocation Optimizer
 * DI-012 Wealth Opportunity Engine
 *
 * Outputs:
 * Top Action
 * Action Queue
 * Warnings
 * Opportunities
 *******************************************************/
function getWealthAdvisorSummary() {
    // Advisor recommendation queue
    const actions = getWealthAdvisorActions();
    const topAction = actions[0] || null;
    // Advisor warnings
    const warnings = [];
    // DI-012 Wealth Opportunity Engine
    const opportunityEngine = getWealthOpportunities();
    const graduation =
        getGoalGraduationRecommendation();
    const safeSpend =
        getSafeToSpend();

    /**
     * Cash Flow Warning
     *
     * Detect insufficient coverage
     * for upcoming obligations.
     */
    if (window.qaCashFlow && window.qaCashFlow.coverage < CONFIG.cashFlow.minimumCoverage) {
        warnings.push({
            category: "Cash Flow",
            message: "Available cash is insufficient for upcoming obligations"
        });
    }
    return {
        generatedAt: new Date().toISOString(),
        status: "ACTIVE",
        // Highest-priority recommendation
        topAction,
        // Full advisor queue
        actions,
        // Risk alerts
        warnings,
        safeToSpend: safeSpend.safeToSpend,
        goalGraduation: graduation,
        // DI-012 opportunities
        opportunities: opportunityEngine.opportunities
    };
}

/**
 * =========================================================
 * DI-012 Wealth Opportunity Engine
 * =========================================================
 *
 * Purpose:
 * Detect wealth-building opportunities using existing
 * Decision Intelligence outputs.
 *
 * Goal:
 * Answer:
 * "What opportunities am I currently missing?"
 *
 * Dependencies:
 * DI-009 Cash Flow Command Center
 * DI-010 Goal Funding Optimizer
 * DI-011 Capital Allocation Optimizer
 * DI-007 Wealth Sweep
 *
 * Output:
 * {
 *     opportunities: [],
 *     estimatedImpact: number
 * }
 *
 */
function getWealthOpportunities() {
    const opportunities = [];
    const cashFlow = getOpportunityCapital();
    const goalPlan = window.qaGoalFundingOptimizer;
    const sweep = window.qaSweep;
    /**
     * Idle Cash Opportunity
     *
     * Detect deployable cash that is
     * currently generating no return.
     */
    if (cashFlow.opportunity > 50000) {
        opportunities.push({
            category: "Idle Cash",
            priority: "HIGH",
            action: `Deploy ₱${cashFlow.opportunity.toLocaleString()} of idle cash`,
            impact: cashFlow.opportunity
        });
    }
    /**
     * Goal Completion Opportunity
     *
     * Detect goals that can be
     * completed immediately.
     */
    if (goalPlan && goalPlan.completable) {
        opportunities.push({
            category: "Goal Completion",
            priority: "HIGH",
            action: goalPlan.priorityAction,
            impact: goalPlan.suggestedFunding
        });
    }
    /**
     * Investment Growth Opportunity
     */
    if (sweep && sweep.investmentSweep > 0) {
        opportunities.push({
            category: "Investment Growth",
            priority: "MEDIUM",
            action: `Invest ₱${sweep.investmentSweep.toLocaleString()}`,
            impact: sweep.total3YrBenefit
        });
    }
    /**
     * Debt Optimization Opportunity
     */
    if (sweep && sweep.debtSweep > 0) {
        opportunities.push({
            category: "Debt Optimization",
            priority: "MEDIUM",
            action: `Apply ₱${sweep.debtSweep.toLocaleString()} toward debt reduction`,
            impact: sweep.debtSweep
        });
    }
    opportunities.sort(
        (a, b) => b.impact - a.impact);
    return {
        count: opportunities.length,
        estimatedImpact: opportunities.reduce(
            (sum, item) => sum + item.impact, 0),
        opportunities
    };
}


/*******************************************************
 * DI-012 Wealth Opportunity Engine
 *
 * Purpose:
 * Detect missed wealth opportunities.
 *
 * Answers:
 *
 * "What opportunities am I missing?"
 *
 *******************************************************/
function loadWealthOpportunityEngine() {
    const output = getWealthOpportunities();
    logQATrace("DI-012", "loadWealthOpportunityEngine", {}, output, true);
    return output;
}

function getWealthAdvisorActions() {
    const actions = [];
    const priorityAction = getCapitalAllocationPriority();
    actions.push({
        priority: priorityAction.priority,
        category: priorityAction.category,
        action: priorityAction.action,
        source: "DI-011"
    });
    if (window.qaGoalFundingOptimizer && priorityAction.category !== "Goal Completion") {
        actions.push({
            priority: 2,
            category: "Goal Funding",
            action: window.qaGoalFundingOptimizer.priorityAction,
            source: "DI-010"
        });
    }
    actions.sort(
        (a, b) => a.priority - b.priority);
    return actions;
}

function loadWealthAdvisor() {
    const advisor = getWealthAdvisorSummary();
    window.qaWealthAdvisor = advisor;
    logQATrace(
        "DI-015",
        "loadWealthAdvisor",
        {},
        {
            topAction:
                advisor.topAction.category,
    
            totalActions:
                advisor.actions.length,
    
            topActionMatches:
                advisor.topAction.category ===
                advisor.actions[0].category,
    
            warnings:
                advisor.warnings.length,
            safeToSpend: 
                advisor.safeToSpend,
    
            opportunities:
                advisor.opportunities.length
        },
        true
    );
    return advisor;
}

function getAdvisorConfidence(action) {
    const opportunity = getOpportunityCapital();
    const emergencyGap = getEmergencyFundGap();
    const liquidity = opportunity.coverage || 0;
    if (liquidity < CONFIG.cashFlow.minimumCoverage) {
        return {
            score: 90,
            level: "LIQUIDITY PROTECTION"
        };
    }
    let score = 50;
    if (liquidity >= 12) score += 20;
    else if (liquidity >= 6) score += 10;
    else score -= 10;
    if (emergencyGap.gap <= 0) score += 15;
    else if (emergencyGap.gap <= 50000) score += 5;
    if (opportunity.opportunity > 100000) score += 10;
    else if (opportunity.opportunity > 50000) score += 5;
    if (action?.category === "Emergency Fund") score += 10;
    score = Math.max(0, Math.min(score, 100));
    return {
        score,
        level: score >= 90 ? "HIGH" : score >= 70 ? "MEDIUM" : "LOW"
    };
}

function getConfidenceReason(score) {
    if (score >= 90) return "Strong financial data supports this recommendation.";
    if (score >= 70) return "Healthy liquidity and available opportunity capital support this recommendation.";
    return "Recommendation is based on limited supporting indicators.";
}

function getAdvisorState() {
    const goal = window.qaGoalFundingOptimizer;
    const cashFlow = window.qaCashFlow;
    if (cashFlow && cashFlow.coverage < CONFIG.cashFlow.minimumCoverage) {
        return {
            state: "PROTECTION MODE",
            objective: "Protect Liquidity"
        };
    }
    if (goal && goal.completable) {
        return {
            state: "ACCELERATION MODE",
            objective: "Complete Important Goals"
        };
    }
    return {
        state: "OPTIMIZATION MODE",
        objective: "Deploy Capital Efficiently"
    };
}

function getMonthlyWealthBrief() {
    const advisor = getWealthAdvisorSummary();
    const advisorState =
    getAdvisorState();
    const opportunity =
        getOpportunityCapital().opportunity;
    const safeSpend =
        getSafeToSpend();
    
    const projectedBenefit =
        window.qaSweep?.total3YrBenefit || 0;
    const advisorReason = getAdvisorExplanation();
    const confidence =
        getAdvisorConfidence(
            advisor.topAction
        );
    const opportunityEngine =
        getWealthOpportunities();

    
    return {
    
        generatedAt:
            new Date().toISOString(),

        advisorState:
            advisorState.state,
        
        advisorObjective:
            advisorState.objective,
    
        headline:
            advisor.topAction?.action,
        
        confidenceLevel:
            confidence.level,
        
        confidenceScore:
            confidence.score,
        
        confidenceReason:
            getConfidenceReason(
                confidence.score
            ),
    
        advisorReason,
    
        summary:
        safeSpend.safeToSpend <= 0
            ? `Liquidity protection is currently required.
               Available cash should remain reserved
               for obligations and protection targets.`
            : `You can safely spend
               ${formatCurrency(
                   safeSpend.safeToSpend
               )}
               before your next payday while
               keeping obligations protected.`,
    
        projectedImpact:
        projectedBenefit <= 0
            ? "No deployable capital currently available."
            : `Potential 3-Year Wealth Benefit:
               ${formatCurrency(projectedBenefit)}`,
    
        topActions:
            advisor.actions.slice(0, 3),
    
        warnings:
            advisor.warnings,
    
        opportunities:
            opportunityEngine.opportunities
    };
}

function loadMonthlyWealthBrief() {
    const brief = getMonthlyWealthBrief();
    window.qaWealthBrief = brief;
    logQATrace("DI-015", "loadMonthlyWealthBrief", {}, {
        headline: brief.headline,
        confidenceLevel: brief.confidenceLevel,
        confidenceScore: brief.confidenceScore,
        advisorReason: brief.advisorReason,
        summary: brief.summary,
        projectedImpact: brief.projectedImpact,
        topActions: brief.topActions.length,
        warnings: brief.warnings.length,
        opportunities: brief.opportunities.length
        
    }, true);
    return brief;
}

function getAdvisorExplanation() {

    const priority =
        getCapitalAllocationPriority();

    switch (priority.category) {

        case "Cash Flow Protection":
            return "Available cash is insufficient to safely cover upcoming obligations. Capital preservation is currently the highest priority.";

        case "Emergency Fund":
            return "Emergency reserves remain below target levels. Strengthening liquidity improves resilience before deploying capital into growth opportunities.";

        case "Goal Completion":
            return window.qaGoalFundingOptimizer?.reason ||
                "This goal offers the fastest path to measurable progress.";

        case "Investments":
            return "Core protections are satisfied. Available capital can now be directed toward long-term wealth growth.";

        case "Debt Reduction":
            return "Reducing debt improves financial flexibility and lowers future cash obligations.";

        default:
            return "No explanation available.";
    }
}



/**
 * ============================================================
 * EMERGENCY FUND GAP ENGINE
 * ============================================================
 *
 * PURPOSE
 * Determine how much emergency funding is still needed.
 *
 * Formula:
 * Target Emergency Fund
 * minus
 * Existing Emergency Savings
 *
 * ============================================================
 */
function getEmergencyFundGap() {
    const monthlyObligations = getBudgetSummary().monthlyObligations;
    const targetEmergencyFund = monthlyObligations * CONFIG.emergencyFundMonths;
    const emergencyGoals = (appData.goals || []).filter(goal => String(goal.goal || "").toLowerCase().includes("emergency"));
    const currentEmergencyFund = emergencyGoals.reduce(
        (sum, goal) => sum + Number(goal.current || 0), 0);
    const gap = Math.max(0, targetEmergencyFund - currentEmergencyFund);
    return {
        targetEmergencyFund,
        currentEmergencyFund,
        gap,
        fullyFunded: gap === 0
    };
}


function loadCapitalAllocationOptimizer() {
    const plan = getCapitalAllocationPlan();
    const recommendations = getCapitalAllocationRecommendation();
    logQATrace("DI-011", "loadCapitalAllocationOptimizer", {
        opportunity: plan.opportunity
    }, {
        plan,
        recommendations
    }, plan.opportunity >= 0);
    window.qaCapitalAllocation = plan;
    window.qaCapitalAllocationRecommendations = recommendations;
    return {
        plan,
        recommendations
    };
}

function isLiquidAccount(account) {
    const type = String(account.assetClass || account.type || account["Type"] || "").trim().toLowerCase();
    return ["cash", "checking", "savings"].includes(type);
}

/**
 * Calculates total liquid assets.
 *
 * @param {Array<Object>} accounts
 * @returns {number}
 */
function getTotalLiquidAssets(accounts = []) {
    return accounts
        .filter(account =>
            account.netWorthType === "Asset" &&
            isLiquidAccount(account) &&
            !account.protected
        )
        .reduce((total, account) => {

            const balance =
                Number(
                    account.currentBalance ??
                    account.balance ??
                    0
                );

            const minimumBalance =
                Number(
                    account.minimumBalance ??
                    0
                );

            return total +
                Math.max(
                    0,
                    balance - minimumBalance
                );

        }, 0);
}

/**
 * WPOS-001
 * Calculate current pay cycle boundaries.
 */
function getCurrentPayCycle() {
    const paydayDay = CONFIG.payCycle.paydayDay;
    const today = new Date();
    const currentDay = today.getDate();
    let cycleStart;
    let cycleEnd;
    let nextPayday;
    if (currentDay >= paydayDay) {
        cycleStart = new Date(today.getFullYear(), today.getMonth(), paydayDay);
        nextPayday = new Date(today.getFullYear(), today.getMonth() + 1, paydayDay);
    } else {
        cycleStart = new Date(today.getFullYear(), today.getMonth() - 1, paydayDay);
        nextPayday = new Date(today.getFullYear(), today.getMonth(), paydayDay);
    }
    cycleEnd = new Date(nextPayday);
    cycleEnd.setDate(cycleEnd.getDate() - 1);
    const daysRemaining = Math.ceil(
        (nextPayday - today) / (1000 * 60 * 60 * 24));
    return {
        cycleStart,
        cycleEnd,
        nextPayday,
        daysRemaining
    };
}

/**
 * WPOS-001
 * Returns active bills for pay cycle analysis.
 *
 * NOTE:
 * Due day logic will be enhanced
 * in Phase 2.
 */
function getCycleBills() {
    const cycle = getCurrentPayCycle();
    return (appData.recurringBills || []).filter(bill => bill.active !== false).filter(bill => {
        const dueDate = getNextDueDate(Number(bill.dueDay));
        return (dueDate <= cycle.nextPayday);
    });
}

/**
 * DI-017
 * Safe spendable cash before next payday.
 */
function getSafeToSpend() {
    const availableCash = getTotalLiquidAssets(appData.accounts || []);
    const protectedBills = getCycleBills().reduce(
        (sum, bill) => sum + Number(bill.defaultAmount || 0), 0);
    const monthlyObligations =
        getBudgetSummary()
            .monthlyObligations;
    
    const protectedBuffer =
        monthlyObligations *
        CONFIG.payCycle.bufferReserveRatio;
    const safeToSpend = Math.max(0, availableCash - protectedBills - protectedBuffer);
    return {
        availableCash,
        protectedBills,
        protectedBuffer,
        safeToSpend
    };
}

/**
 * P3 Payday Engine Phase 1
 * Generates recommended allocation plan
 * for the current pay cycle.
 */
function getPaydayPlan() {
    const cycle = getCurrentPayCycle();
    const safeSpend = getSafeToSpend();
    const allocation = getCapitalAllocationPlan();
    const topAction = getCapitalAllocationPriority();
    return {
        nextPayday: cycle.nextPayday,
        daysRemaining: cycle.daysRemaining,
        safeToSpend: safeSpend.safeToSpend,
        emergencyFund: allocation.emergencyAllocation,
        debtReduction: allocation.debtAllocation,
        goals: allocation.goalAllocation,
        investments: allocation.investmentAllocation,
        opportunityCapital: allocation.opportunity,
        topAction
    };
}

/**
 * DI-019
 * Detect completed goals and
 * released contribution capacity.
 */
function getGraduatedGoals() {
    const goals = appData.goals || [];
    const graduated = goals.filter(goal => {
        const current = Number(goal.current || 0);
        const target = Number(goal.target || 0);
        return (target > 0 && current >= target);
    });
    const releasedMonthlyContribution = graduated.reduce(
        (sum, goal) => sum + Number(goal.monthlyContribution || 0), 0);
    return {
        graduatedCount: graduated.length,
        releasedMonthlyContribution,
        goals: graduated
    };
}

/**
 * DI-019
 * Recommend where released goal
 * contributions should go next.
 */
function getGoalGraduationRecommendation() {
    const graduation = getGraduatedGoals();
    if (graduation.graduatedCount === 0) {
        return {
            status: "NONE"
        };
    }
    return {
        status: "ACTIVE",
        releasedMonthlyContribution: graduation.releasedMonthlyContribution,
        recommendedDestination: "Investments",
        action: `Redirect ${formatCurrency(
                graduation.releasedMonthlyContribution
            )} per month to Investments.`
    };
}

/**
 * P3 Payday Engine Phase 2
 * Render payday allocation plan.
 */
function loadPaydayPlan() {
    const plan = getPaydayPlan();
    const graduation = getGoalGraduationRecommendation();
    const cycle = getCurrentPayCycle();
    const container = document.getElementById("paydayPlan");
    if (!container) return;
    const safeSpend = getSafeToSpend();
    const requiredProtection =
        safeSpend.protectedBills +
        safeSpend.protectedBuffer;
    
    const protectionGap =
        Math.max(
            0,
            requiredProtection -
            safeSpend.availableCash
        );
    const protectedCash = (appData.accounts || []).filter(account => account.netWorthType === "Asset" && isLiquidAccount(account) && account.protected).reduce(
        (sum, account) => sum + Number(account.currentBalance || account.balance || 0), 0);
    const preservationMode = plan.opportunityCapital <= 0;
    if (preservationMode) {
        container.innerHTML = `
            <div class="card">

                <h2>💰 Payday Plan</h2>

                <div class="metric-row">
                    <span>Current Cycle</span>
                    <strong>
                        ${cycle.cycleStart.toLocaleDateString()}
                        →
                        ${cycle.cycleEnd.toLocaleDateString()}
                    </strong>
                </div>

                <div class="metric-row">
                    <span>Next Payday</span>
                    <strong>
                        ${plan.nextPayday.toLocaleDateString()}
                    </strong>
                </div>

                <div class="metric-row">
                    <span>Days Remaining</span>
                    <strong>
                        ${plan.daysRemaining}
                    </strong>
                </div>

                <hr>

                <div class="advisor-action warning">

                    <div class="action-title">
                        🛡️ Capital Preservation Mode
                    </div>

                    <p>
                        No deployable capital is currently available.
                        Available cash must remain protected for
                        upcoming obligations and reserve targets.
                    </p>

                </div>

                <div class="metric-row">
                    <span>Protected Reserves</span>
                    <strong>
                        ${formatCurrency(
                            protectedCash
                        )}
                    </strong>
                </div>

                <div class="metric-row">
                    <span>Upcoming Bills</span>
                    <strong>
                        ${formatCurrency(
                            safeSpend.protectedBills
                        )}
                    </strong>
                </div>

                <div class="metric-row">
                    <span>Protected Buffer</span>
                    <strong>
                        ${formatCurrency(
                            safeSpend.protectedBuffer
                        )}
                    </strong>
                </div>

                <div class="metric-row">
                    <span>Available Cash</span>
                    <strong>
                        ${formatCurrency(
                            safeSpend.availableCash
                        )}
                    </strong>
                </div>
                
                <div class="metric-row">
                    <span>Required Protection</span>
                    <strong>
                        ${formatCurrency(
                            requiredProtection
                        )}
                    </strong>
                </div>
                
                <div class="metric-row">
                    <span>Protection Gap</span>
                    <strong style="color:#ef4444;">
                        ${formatCurrency(
                            protectionGap
                        )}
                    </strong>
                </div>

                <hr>

                <div class="advisor-action priority">

                    <div class="action-title">
                        🎯 Recommended Action
                    </div>

                    <p>
                        Maintain liquidity until the next payday.
                        Avoid discretionary spending and preserve
                        cash for upcoming obligations.
                    </p>

                </div>

                <div class="metric-row">
                    <span>Highest Priority</span>
                    <strong>
                        ${plan.topAction.action}
                    </strong>
                </div>

            </div>
        `;
        return;
    }
    container.innerHTML = `
        <div class="card">

            <h2>💰 Payday Plan</h2>

            <div class="metric-row">
                <span>Current Cycle</span>
                <strong>
                    ${cycle.cycleStart.toLocaleDateString()}
                    →
                    ${cycle.cycleEnd.toLocaleDateString()}
                </strong>
            </div>

            <div class="metric-row">
                <span>Next Payday</span>
                <strong>
                    ${plan.nextPayday.toLocaleDateString()}
                </strong>
            </div>

            <div class="metric-row">
                <span>Days Remaining</span>
                <strong>
                    ${plan.daysRemaining}
                </strong>
            </div>

            <hr>

            <div class="metric-row">
                <span>Opportunity Capital</span>
                <strong>
                    ${formatCurrency(
                        plan.opportunityCapital
                    )}
                </strong>
            </div>

            <hr>

            <div class="metric-row">
                <span>🛡️ Emergency Fund</span>
                <strong>
                    ${formatCurrency(
                        plan.emergencyFund
                    )}
                </strong>
            </div>

            <div class="metric-row">
                <span>💳 Debt Reduction</span>
                <strong>
                    ${formatCurrency(
                        plan.debtReduction
                    )}
                </strong>
            </div>

            <div class="metric-row">
                <span>🎯 Goals</span>
                <strong>
                    ${formatCurrency(
                        plan.goals
                    )}
                </strong>
            </div>

            <div class="metric-row">
                <span>📈 Investments</span>
                <strong>
                    ${formatCurrency(
                        plan.investments
                    )}
                </strong>
            </div>

            <hr>

            <div class="metric-row">
                <span>Safe-To-Spend</span>
                <strong>
                    ${formatCurrency(
                        plan.safeToSpend
                    )}
                </strong>
            </div>

            <hr>

            <h3>⭐ Recommended Execution Order</h3>

            <div class="advisor-action">
                <div class="action-title">
                    1️⃣ Fund Emergency Reserve
                </div>
                <div class="allocation-row">
                    <span>Amount</span>
                    <strong>
                        ${formatCurrency(
                            plan.emergencyFund
                        )}
                    </strong>
                </div>
            </div>

            <div class="advisor-action">
                <div class="action-title">
                    2️⃣ Reduce Debt
                </div>
                <div class="allocation-row">
                    <span>Amount</span>
                    <strong>
                        ${formatCurrency(
                            plan.debtReduction
                        )}
                    </strong>
                </div>
            </div>

            <div class="advisor-action">
                <div class="action-title">
                    3️⃣ Fund Goals
                </div>
                <div class="allocation-row">
                    <span>Amount</span>
                    <strong>
                        ${formatCurrency(
                            plan.goals
                        )}
                    </strong>
                </div>
            </div>

            <div class="advisor-action">
                <div class="action-title">
                    4️⃣ Invest Remaining Capital
                </div>
                <div class="allocation-row">
                    <span>Amount</span>
                    <strong>
                        ${formatCurrency(
                            plan.investments
                        )}
                    </strong>
                </div>
            </div>

            <hr>

            <div class="advisor-action priority">

                <div class="action-title">
                    🎯 Highest Priority
                </div>

                <p>
                    ${plan.topAction.action}
                </p>

            </div>

            ${
                graduation.status === "ACTIVE"
                    ? `
                    <hr>

                    <div class="advisor-action success">

                        <div class="action-title">
                            🎓 Goal Graduated
                        </div>

                        <p>
                            ${graduation.action}
                        </p>

                        <div class="allocation-row">
                            <span>
                                Released Monthly Contribution
                            </span>

                            <strong>
                                ${formatCurrency(
                                    graduation.releasedMonthlyContribution
                                )}
                            </strong>
                        </div>

                    </div>
                    `
                    : ""
            }

        </div>
    `;
}

/**
 * WPOS-001
 * Pay cycle dashboard card.
 */
function loadPayCycleCard() {
    const cycle = getCurrentPayCycle();
    const container = document.getElementById("payCycleCard");
    if (!container) return;
    container.innerHTML = `
        <div class="card">
    
        <div class="card-header">
            <h2>📅 Pay Cycle</h2>
        
            <button
                class="info-button"
                onclick="showFeatureGuide('payCycle')">
                ?
            </button>
        </div>
    
            <div class="metric-row">
                <span>Cycle</span>
                <strong>
                    ${cycle.cycleStart.toLocaleDateString()}
                    →
                    ${cycle.cycleEnd.toLocaleDateString()}
                </strong>
            </div>
    
            <div class="metric-row">
                <span>Next Payday</span>
                <strong>
                    ${cycle.nextPayday.toLocaleDateString()}
                </strong>
            </div>
    
            <div class="metric-row">
                <span>Days Remaining</span>
                <strong>
                    ${cycle.daysRemaining}
                </strong>
            </div>
    
        </div>
    `;
}

/**
 * DI-017
 * Safe-To-Spend card.
 */
function loadSafeToSpendCard() {
    const result = getSafeToSpend();
    const container = document.getElementById("safeToSpendCard");
    if (!container) return;
    const requiredProtection = result.protectedBills + result.protectedBuffer;
    const protectionGap = Math.max(0, requiredProtection - result.availableCash);
    const spendingHold = result.safeToSpend <= 0;
    if (spendingHold) {
        container.innerHTML = `
            <div class="card">

                <div class="card-header">

                    <h2>
                        💵 Safe To Spend
                    </h2>

                    <button
                        class="info-button"
                        onclick="showFeatureGuide('safeToSpend')">
                        ?
                    </button>

                </div>

                <div class="advisor-action warning">

                    <div class="action-title">
                        🛡️ Spending Hold
                    </div>

                    <p>
                        Available cash is currently
                        insufficient to safely cover
                        obligations and protection
                        targets.
                    </p>

                </div>

                <div class="metric-row">
                    <span>Available Cash</span>
                    <strong>
                        ${formatCurrency(
                            result.availableCash
                        )}
                    </strong>
                </div>

                <div class="metric-row">
                    <span>Protected Bills</span>
                    <strong>
                        ${formatCurrency(
                            result.protectedBills
                        )}
                    </strong>
                </div>

                <div class="metric-row">
                    <span>Protected Buffer</span>
                    <strong>
                        ${formatCurrency(
                            result.protectedBuffer
                        )}
                    </strong>
                </div>

                <div class="metric-row">
                    <span>Required Protection</span>
                    <strong>
                        ${formatCurrency(
                            requiredProtection
                        )}
                    </strong>
                </div>

                <div class="metric-row">
                    <span>Protection Gap</span>
                    <strong style="color:#ef4444;">
                        ${formatCurrency(
                            protectionGap
                        )}
                    </strong>
                </div>

                <hr>

                <div class="advisor-action priority">

                    <div class="action-title">
                        🎯 Recommended Action
                    </div>

                    <p>
                        Preserve liquidity until
                        obligations are fully protected.
                        Avoid discretionary spending.
                    </p>

                </div>

            </div>
        `;
        return;
    }
    container.innerHTML = `
        <div class="card">

            <div class="card-header">

                <h2>
                    💵 Safe To Spend
                </h2>

                <button
                    class="info-button"
                    onclick="showFeatureGuide('safeToSpend')">
                    ?
                </button>

            </div>

            <div class="hero-metric">

                <div class="hero-value">
                    ${formatCurrency(
                        result.safeToSpend
                    )}
                </div>

            </div>

            <div class="metric-row">
                <span>Available Cash</span>
                <strong>
                    ${formatCurrency(
                        result.availableCash
                    )}
                </strong>
            </div>

            <div class="metric-row">
                <span>Protected Bills</span>
                <strong>
                    ${formatCurrency(
                        result.protectedBills
                    )}
                </strong>
            </div>

            <div class="metric-row">
                <span>Protected Buffer</span>
                <strong>
                    ${formatCurrency(
                        result.protectedBuffer
                    )}
                </strong>
            </div>

            <div class="metric-row">
                <span>Safe-To-Spend</span>
                <strong style="color:#10b981;">
                    ${formatCurrency(
                        result.safeToSpend
                    )}
                </strong>
            </div>

        </div>
    `;
}

function roundMoney(value) {
    return Number(value.toFixed(2));
}

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

    const capital = getCapitalPosition();
    const availableCash = capital.availableCash;
    const monthlyObligations = capital.monthlyObligations;
    const bufferTarget = capital.bufferTarget;
    const excessCash = capital.excessCash;

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
        const investAmount =
            excessCash *
            CONFIG.bufferVsInvest.invest;
        
        const debtAmount =
            excessCash *
            CONFIG.bufferVsInvest.debt;


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
                <span>Buffer Target (${CONFIG.buffer.months}x)</span>
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

    const budget = getBudgetSummary();
    
    const income = budget.income;
    const expense = budget.expense;
    const savings = budget.savings;
    const debt = budget.debt;

    const monthlyVelocity = savings + debt;
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
            <h2>📈 Wealth Contribution</h2>
    
            <div class="metric-row">
                <span>Current Net Worth</span>
                <strong>${formatCurrency(netWorth)}</strong>
            </div>
    
            <div class="metric-row">
                <span>Monthly Wealth Contribution</span>
                <strong>${formatCurrency(monthlyVelocity)}</strong>
            </div>
    
            <div class="metric-row">
                <span>Annual Wealth Contribution</span>
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

    const budget = getBudgetSummary();
    const income = budget.income;
    const expenses = budget.expense;
    const savings = budget.savings;
    const debt = budget.debt;
    const monthlySurplus = budget.monthlySurplus;
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;
    const debtRate = income > 0 ? (debt / income) * 100 : 0;
    
    let status = "Healthy";
    
    if (
        savingsRate < CONFIG.financialHealth.savingsTargetRate ||
        debtRate > CONFIG.financialHealth.maxDebtRate
    ) {
        status = "Needs Improvement";
    }

    const problems = [];
    const actions = [];

    if (savingsRate < CONFIG.financialHealth.savingsTargetRate) {

    problems.push(
        `Savings rate is below recommended ${CONFIG.financialHealth.savingsTargetRate}%`
    );

    const targetSavingsRate = CONFIG.financialHealth.savingsTargetRate;
    
    const savingsGap =
        income * (targetSavingsRate / 100) - savings;
    
    actions.push({
        priority: 1,
        title: "Increase Savings",
        amount: Math.max(0, savingsGap)
    });
    }

    if (
        debtRate >
        CONFIG.financialHealth.maxDebtRate
    ) {

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
        invest:
            monthlySurplus *
            CONFIG.surplusDeployment.invest,
        
        debt:
            monthlySurplus *
            CONFIG.surplusDeployment.debt,
        
        emergency:
            monthlySurplus *
            CONFIG.surplusDeployment.emergency
        });
    
    }


    const wealthImpact =
        monthlySurplus * 12 * 10;

    const isHealthy =
        savingsRate >=
            CONFIG.financialHealth.savingsTargetRate &&
        debtRate <=
            CONFIG.financialHealth.maxDebtRate;
    
    if (isHealthy) {
    
        container.innerHTML = "";
        return;
    
    }

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
            : "⚠️ Needs Improvement"}
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

    const capital = getCapitalPosition();
    const totalObligations = capital.monthlyObligations;
    const bufferTarget = capital.bufferTarget;
    const totalAvailableCash = capital.availableCash;
    const excessCash = capital.excessCash;
    const insights = [];
    const accounts = appData.accounts || [];
    accounts.forEach(account => {
    const balance =
        Math.max(
            0,
            Number(
                account.currentBalance ||
                account.balance ||
                0
            ) -
            Number(
                account.minimumBalance ||
                0
            )
        );
        
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
                .filter(a =>
                    isLiquidAccount(a) &&
                    !a.protected &&
                    a.id !== account.id &&
                    (
                        Number(
                            a.currentBalance ||
                            a.balance ||
                            0
                        ) >
                        Number(
                            a.minimumBalance ||
                            0
                        )
                    )
                )
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
    if (excessCash > 0) {
        insights.push({
            type: "IDLE_CASH",
            title: "Idle Cash Detected",
            excessAmount: excessCash,
            goalAllocation:
                excessCash *
                CONFIG.idleCashAllocation.goals,
            
            investAllocation:
                excessCash *
                CONFIG.idleCashAllocation.investments
        });
    }

    console.table(insights);

    // Expose QA Metrics
    window.qaFundingAdvisor = {
    
        totalObligations,
        bufferTarget,
        totalAvailableCash,
        excessCash,
    
        deficitCount:
    
            insights.filter(
                i => i.type === "DEFICIT"
            ).length,
    
        idleCashCount:
    
            insights.filter(
                i => i.type === "IDLE_CASH"
            ).length
    };
        logQATrace(
            "DI-002",
            "loadFundingOptimizationAdvisor",
            {
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
    
    if (insights.length === 0) {
    
        container.style.display = "none";
        container.innerHTML = "";
        return;
    
    }
    
    container.style.display = "";

    container.innerHTML = `
        <div class="card">
        <div class="card-header">
            <h2>⚡ Funding Optimization Advisor</h2>
        
            <button
                class="info-button"
                onclick="showFeatureGuide('fundingOptimization')">
                ?
            </button>
        </div>
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
                                <span>🎯 Goal Reserve (${CONFIG.idleCashAllocation.goals * 100}%)</span>
                                <strong>${formatCurrency(item.goalAllocation)}</strong>
                            </div>
                            <div class="allocation-row">
                                <span>📈 Investment Sweep (${CONFIG.idleCashAllocation.investments * 100}%)</span>
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

function getAssetAllocationRecommendation() {
    const allocation = getAssetAllocation();
    const cashAmount = allocation.Cash?.amount || 0;
    const cashPercent = allocation.Cash?.percent || 0;
    const totalAssets = Object.values(allocation).reduce(
        (sum, item) => sum + item.amount, 0);
    const targetCashPercent = CONFIG.assetAllocation.targetCashPercent;
    const targetCashAmount = totalAssets * (targetCashPercent / 100);
    const excessCash = Math.max(0, cashAmount - targetCashAmount);
    return {
        status: cashPercent > CONFIG.assetAllocation.warningCashPercent ? "warning" : "good",
        title: cashPercent > CONFIG.assetAllocation.warningCashPercent ? "High Cash Allocation" : "Asset Allocation Healthy",
        currentPercent: cashPercent,
        targetPercent: targetCashPercent,
        cashAmount,
        excessCash
    };
}

async function loadAssetAllocationAdvisor() {
    const container = document.getElementById("assetAllocationAdvisor");
    if (!container) return;
    const rec = getAssetAllocationRecommendation();
    if (rec.status === "good") {
    
        container.style.display = "none";
        container.innerHTML = "";
        return;
    
    }
    
    container.style.display = "";
    container.innerHTML = `
        <div class="card">
            <h2>🎯 Asset Allocation Advisor</h2>

            <div class="metric-row">
                <span>Status</span>
                <strong>${rec.title}</strong>
            </div>

            <div class="metric-row">
                <span>Current Cash</span>
                <strong>${rec.currentPercent}%</strong>
            </div>

            <div class="metric-row">
                <span>Target Cash</span>
                <strong>${rec.targetPercent}%</strong>
            </div>

            <div class="metric-row">
                <span>Excess Cash</span>
                <strong>${formatCurrency(rec.excessCash)}</strong>
            </div>

            <hr>

            <div class="advisor-action priority">
                <div class="action-title">
                    🚀 Recommended Action
                </div>

                <div class="allocation-row">
                    <span>Deploy Into Growth Assets</span>
                    <strong>${formatCurrency(rec.excessCash)}</strong>
                </div>
            </div>
        </div>
    `;
}

async function loadWealthProjectionAccelerator() {
        const container = document.getElementById("wealthProjectionAccelerator");
        if (!container) return;
        const budget = getBudgetSummary();
        const monthlySurplus = budget.monthlySurplus;
        const investableAmount = Math.max(0, monthlySurplus * CONFIG.projection.investableRatio); // Assume 70% sweep into investments
        const annualReturnRate =
            CONFIG.wealthProjection.annualReturn; // Assumed 7% conservative annual return

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
            monthlySurplus
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
                <strong>${(CONFIG.wealthProjection.annualReturn * 100).toFixed(1)}%</strong>
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
    if (inflationRate > CONFIG.inflation.warning) status = "⚠️ Lifestyle Inflation";
    if (inflationRate > CONFIG.inflation.critical) status = "🚨 Expense Growth High";

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

    const capital = getCapitalPosition();
    // DI-017 Safe-To-Spend
    const safeSpend = getSafeToSpend();
    const availableCash = capital.availableCash;
    const monthlyObligations = capital.monthlyObligations;
    const bufferTarget = capital.bufferTarget;

    const cashAfterPurchase = availableCash - purchaseAmount;
    const safeSpendAfterPurchase = safeSpend.safeToSpend - purchaseAmount;
    const bufferRemaining = cashAfterPurchase - bufferTarget;
    const monthsCovered =
        monthlyObligations > 0
            ? cashAfterPurchase /
              monthlyObligations
            : null;
    const monthsCoveredDisplay =
        Number.isFinite(monthsCovered)
            ? monthsCovered.toFixed(1)
            : "N/A";



    let recommendation = "✅ Within Safe-To-Spend";
    if (purchaseAmount > safeSpend.safeToSpend) {
        recommendation = "⚠️ Exceeds Safe-To-Spend";
    }
    if (safeSpendAfterPurchase < 0) {
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
        monthsCovered:Number((monthsCovered ?? 0).toFixed(2)),
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
    !isNaN(cashAfterPurchase) &&
    !isNaN(bufferRemaining)
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
                    <span>Safe-To-Spend Remaining</span>
                    <strong> ${formatCurrency(safeSpendAfterPurchase)} </strong>
                </div>
                <div class="metric-row">
                    <span>Months Covered</span>
                    <strong>${monthsCoveredDisplay}</strong>
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
    const capital = getCapitalPosition();
    const availableCash = capital.availableCash;
    const bufferTarget = capital.bufferTarget;
    const excessCash = capital.excessCash;

    // Default Allocation Ratios: 20% Debt Payoff, 10% Emergency Top-up, 70% Investment
    const debtSweep = roundMoney(excessCash * CONFIG.wealthSweep.debt);
    const emergencySweep = roundMoney(excessCash * CONFIG.wealthSweep.emergency);
    const investmentSweep = roundMoney(excessCash * CONFIG.wealthSweep.investment);

    // Projected 3-Year Investment Return @ 8% CAGR
    const estimated3YrReturn = investmentSweep * (Math.pow(1 + CONFIG.wealthSweep.projectedReturn, 3) - 1);
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
        <div class="card-header">
            <h2>🧹 Wealth Sweep Automation</h2>
        
            <button
                class="info-button"
                onclick="showFeatureGuide('wealthSweep')">
                ?
            </button>
        </div>
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
                <span>
                    💳 Debt Payoff Allocation
                    (${CONFIG.wealthSweep.debt * 100}%)
                </span>
                    <strong>${formatCurrency(debtSweep)}</strong>
                </div>
                <div class="metric-row">
                <span>
                    🛡️ Emergency Buffer Cushion
                    (${CONFIG.wealthSweep.emergency * 100}%)
                </span>
                    <strong>${formatCurrency(emergencySweep)}</strong>
                </div>
                <div class="metric-row">
                <span>
                    📈 Wealth Investment Sweep
                    (${CONFIG.wealthSweep.investment * 100}%)
                </span>
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
    await loadGoalFundingOptimizer();

    const actions = [];

    // 1. High Priority: Funding Deficits
    if (window.qaFundingAdvisor?.deficitCount > 0){
        actions.push({
            priority: 1,
            badge: "🚨 Critical Deficit",
            title: "Resolve Account Funding Shortfalls",
            detail: "Address projected account deficits to prevent overdrafts on scheduled obligations.",
            impact: "Avoids penalty fees and keeps budget on track"
        });
    }

    // 2. High Priority: Savings Gap
    if (window.qaFinancialHealthAdvisor?.savingsRate < CONFIG.financialHealth.savingsTargetRate) {
        const gap = window.qaFinancialHealthAdvisor.wealthImpact;
        actions.push({
            priority: 3,
            badge: "🎯 Savings Gap",
            title: "Increase Monthly Savings Rate",
            detail: `Current savings rate is under ${CONFIG.financialHealth.savingsTargetRate}%.`,
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
            priority: 2,
            badge: "🧹 Wealth Sweep",
            title: `Deploy ${formatCurrency(excess)} Excess Cash`,
            detail: `Allocate ${formatCurrency(invest)} to investments & ${formatCurrency(debt)} to debt payoff.`,
            impact: `Estimated 3-Yr Return: +${formatCurrency(benefit)}`
        });
    }

    if (
        window.qaCashFlow?.coverage <
        CONFIG.cashFlow.minimumCoverage
    ) {
    
        actions.unshift({
            priority: 0,
            badge: "🚨 Cash Flow Risk",
            title: "Resolve Immediate Cash Flow Shortfall",
            detail:
                "Available cash is insufficient for upcoming obligations.",
            impact:
                "Prevents overdrafts and missed payments"
        });
    
    }

    if (window.qaGoalFundingOptimizer) {
    
        actions.push({
    
            priority: 1,
    
            badge: "🎯 Goal Funding",
    
            title:
                window.qaGoalFundingOptimizer.priorityAction,
    
            detail:
                window.qaGoalFundingOptimizer.reason,
    
            impact:
                "Accelerates goal completion and improves wealth momentum"
    
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
    !isNaN(actions.length)
);

    if (!container) return;

    container.innerHTML = `
        <div class="card">
        <div class="card-header">
            <h2>📋 Monthly Wealth Action Plan</h2>
        
            <button
                class="info-button"
                onclick="showFeatureGuide('monthlyActionPlan')">
                ?
            </button>
        </div>
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


async function loadCashFlowCommandCenter() {

    const container =
        document.getElementById(
            "cashFlowCommandCenter"
        );

    if (!container) return;

    const capital =
        getOpportunityCapital();

    const safeSpend =
        getSafeToSpend();

    const availableCash =
        capital.availableCash;

    const remainingBills =
        capital.remainingBills;

    const coverage =
        capital.coverage;

    const surplus =
        capital.surplus;

    const opportunity =
        capital.opportunity;

    const requiredProtection =
        safeSpend.protectedBills +
        safeSpend.protectedBuffer;

    const protectionGap =
        Math.max(
            0,
            requiredProtection -
            safeSpend.availableCash
        );

    let status;
    let recommendation;

    if (
        coverage <
        CONFIG.cashFlow.minimumCoverage
    ) {

        status =
            "🚨 Liquidity Protection Mode";

        recommendation =
            "Protect liquidity before deploying capital.";

    } else if (
        coverage <
        CONFIG.cashFlow.healthyCoverage
    ) {

        status =
            "⚠️ Tight Cash Flow";

        recommendation =
            "Maintain liquidity and avoid major purchases until obligations are covered.";

    } else {

        status =
            "✅ Healthy Position";

        recommendation =
            `You can safely deploy ${formatCurrency(opportunity)} today without impacting upcoming obligations.`;

    }

    window.qaCashFlow = {
        availableCash,
        remainingBills,
        surplus,
        opportunity,
        coverage,
        status,
        recommendation
    };

    logQATrace(
        "DI-009",
        "loadCashFlowCommandCenter",
        {
            availableCash,
            remainingBills
        },
        {
            surplus,
            opportunity,
            coverage,
            status
        },
        coverage >= 0
    );

    const protectionMode =
        opportunity <= 0;

    if (protectionMode) {

        container.innerHTML = `
        <div class="card">

            <div class="card-header">

                <h2>
                    💰 Cash Flow Command Center
                </h2>

                <button
                    class="info-button"
                    onclick="showFeatureGuide('cashFlow')">
                    ?
                </button>

            </div>

            <div class="advisor-status danger">
                🚨 Liquidity Protection Mode
            </div>

            <div class="advisor-action priority">

                <div class="action-title">
                    🎯 Recommended Action
                </div>

                <p>
                    Protect liquidity before deploying capital.
                    Available cash is currently insufficient
                    to satisfy protection requirements.
                </p>

            </div>

            <hr>

            <div class="metric-row">
                <span>Available Cash</span>
                <strong>
                    ${formatCurrency(
                        availableCash
                    )}
                </strong>
            </div>

            <div class="metric-row">
                <span>Upcoming Bills</span>
                <strong>
                    ${formatCurrency(
                        remainingBills
                    )}
                </strong>
            </div>

            <div class="metric-row">
                <span>Protected Buffer</span>
                <strong>
                    ${formatCurrency(
                        safeSpend.protectedBuffer
                    )}
                </strong>
            </div>

            <div class="metric-row">
                <span>Required Protection</span>
                <strong>
                    ${formatCurrency(
                        requiredProtection
                    )}
                </strong>
            </div>

            <div class="metric-row">
                <span>Protection Gap</span>
                <strong style="color:#ef4444;">
                    ${formatCurrency(
                        protectionGap
                    )}
                </strong>
            </div>

            <div class="metric-row">
                <span>Coverage Ratio</span>
                <strong>
                    ${coverage.toFixed(1)}x
                </strong>
            </div>

        </div>
        `;

        return;
    }

    container.innerHTML = `
    <div class="card">

        <div class="card-header">

            <h2>
                💰 Cash Flow Command Center
            </h2>

            <button
                class="info-button"
                onclick="showFeatureGuide('cashFlow')">
                ?
            </button>

        </div>

        <div class="advisor-status success">
            ${status}
        </div>

        <div class="advisor-action priority">

            <div class="action-title">
                🎯 Recommended Next Action
            </div>

            <p>
                ${recommendation}
            </p>

        </div>

        <hr>

        <div class="hero-metric">

            <div class="hero-label">
                Available Wealth Opportunity
            </div>

            <div class="hero-value">
                ${formatCurrency(
                    opportunity
                )}
            </div>

        </div>

        <hr>

        <h3>
            Recommended Deployment Plan
        </h3>

        <div class="metric-row">
            <span>🎯 Goals</span>
            <strong>
                ${formatCurrency(
                    opportunity *
                    CONFIG.cashFlowDeployment.goals
                )}
            </strong>
        </div>

        <div class="metric-row">
            <span>📈 Investments</span>
            <strong>
                ${formatCurrency(
                    opportunity *
                    CONFIG.cashFlowDeployment.investments
                )}
            </strong>
        </div>

        <div class="metric-row">
            <span>💳 Debt Reduction</span>
            <strong>
                ${formatCurrency(
                    opportunity *
                    CONFIG.cashFlowDeployment.debtReduction
                )}
            </strong>
        </div>

        <hr>

        <div class="metric-row">
            <span>Coverage Ratio</span>
            <strong>
                ${coverage.toFixed(1)}x
            </strong>
        </div>

        <div class="metric-row">
            <span>Upcoming Bills</span>
            <strong>
                ${formatCurrency(
                    remainingBills
                )}
            </strong>
        </div>

    </div>
    `;
}

async function loadGoalFundingOptimizer() {

    try {

        const container =
            document.getElementById(
                "goalFundingOptimizer"
            );

        if (!container) return;

        const goals =
            appData.goals || [];

        const opportunity =
            getOpportunityCapital().opportunity;

        if (goals.length === 0) {
        
            container.style.display = "none";
            container.innerHTML = "";
        
            return;
        }
        
        if (opportunity <= 0) {
        
            const safeSpend =
                getSafeToSpend();
        
            const requiredProtection =
                safeSpend.protectedBills +
                safeSpend.protectedBuffer;
        
            const protectionGap =
                Math.max(
                    0,
                    requiredProtection -
                    safeSpend.availableCash
                );
        
            container.style.display = "";
        
            container.innerHTML = `
        
                <div class="card">
        
                    <div class="card-header">
        
                        <h2>
                            🎯 Goal Funding Optimizer
                        </h2>
        
                        <button
                            class="info-button"
                            onclick="showFeatureGuide('goalFunding')">
                            ?
                        </button>
        
                    </div>
        
                    <div class="advisor-action warning">
        
                        <div class="action-title">
                            ⏸ Goal Funding Paused
                        </div>
        
                        <p>
                            No deployable capital is
                            currently available for
                            goal acceleration.
                        </p>
        
                    </div>
        
                    <div class="metric-row">
                        <span>Available Capital</span>
                        <strong>
                            ${formatCurrency(opportunity)}
                        </strong>
                    </div>
        
                    <div class="metric-row">
                        <span>Required Protection</span>
                        <strong>
                            ${formatCurrency(
                                requiredProtection
                            )}
                        </strong>
                    </div>
        
                    <div class="metric-row">
                        <span>Protection Gap</span>
                        <strong style="color:#ef4444;">
                            ${formatCurrency(
                                protectionGap
                            )}
                        </strong>
                    </div>
        
                    <hr>
        
                    <div class="advisor-action priority">
        
                        <div class="action-title">
                            🎯 Recommended Action
                        </div>
        
                        <p>
                            Increase liquidity before
                            allocating capital toward
                            goals.
                        </p>
        
                    </div>
        
                </div>
        
            `;
        
            return;
        }
        container.style.display = "";

        const rankedGoals =
            goals
                .map(goal => {

                    const current =
                        Number(goal.current || 0);

                    const target =
                        Number(goal.target || 0);

                    const monthlyContribution =
                        Number(
                            goal.monthlyContribution || 1
                        );

                    const remaining =
                        Math.max(
                            0,
                            target - current
                        );

                    const completion =
                        target > 0
                            ? current / target
                            : 0;

                    const monthsToFinish =
                        remaining /
                        Math.max(
                            monthlyContribution,
                            1
                        );

                    const completable =
                        remaining <= opportunity;
                    
                    const score =
                        (completable ? 1000 : 0) +
                        (completion * 100);

                    const reason =
                        completable
                            ? "Can be completed immediately"
                            : "Highest progress toward completion";
                    
                    return {
                        ...goal,
                        remaining,
                        completion,
                        monthsToFinish,
                        completable,
                        score,
                        reason
                    };

                })
                .filter(goal =>
                    goal.remaining > 0
                )
                .sort(
                    (a, b) =>
                        b.score - a.score
                );

        const bestGoal =
            rankedGoals[0];

        if (!bestGoal) {

        container.style.display = "none";
        container.innerHTML = "";
        return;

        }

        container.style.display = "";

        const suggestedFunding =
            Math.min(
                opportunity,
                bestGoal.remaining
            );

        const newRemaining =
            bestGoal.remaining -
            suggestedFunding;
        
        const completed =
            newRemaining <= 0;

        const remainingOpportunity =
            opportunity -
            suggestedFunding;

        window.qaGoalFundingOptimizer = {
            goal: bestGoal.goal,
            opportunity,
            suggestedFunding,
            remaining: bestGoal.remaining,
            completion: bestGoal.completion,
            reason: bestGoal.reason,
            completable: bestGoal.completable
        };

        window.qaGoalFundingOptimizer.priorityAction =
            `Fund ${bestGoal.goal} with ${formatCurrency(suggestedFunding)}`;

        logQATrace(
            "DI-010",
            "loadGoalFundingOptimizer",
            {
                goals: goals.length,
                opportunity
            },
            {
                selectedGoal:
                    bestGoal.goal,
                suggestedFunding
            },
            true
        );

        container.innerHTML = `

            <div class="card">

                <div class="card-header">
                    <h2>🎯 Goal Funding Optimizer</h2>
                
                    <button
                        class="info-button"
                        onclick="showFeatureGuide('goalFunding')">
                        ?
                    </button>
                </div>

                <div class="advisor-action priority">

                    <div class="action-title">
                        Recommended Goal
                    </div>

                    <p>
                        <strong>
                            ${bestGoal.goal}
                        </strong>
                    </p>

                </div>

                <div class="metric-row">
                    <span>Progress</span>
                    <strong>
                        ${(bestGoal.completion * 100).toFixed(1)}%
                    </strong>
                </div>

                <div class="metric-row">
                    <span>Remaining</span>
                    <strong>
                        ${formatCurrency(bestGoal.remaining)}
                    </strong>
                </div>

                <div class="metric-row">
                    <span>Available Capital</span>
                    <strong style="color:#10b981;">
                        ${formatCurrency(opportunity)}
                    </strong>
                </div>

                <div class="metric-row">
                    <span>Suggested Funding</span>
                    <strong>
                        ${formatCurrency(suggestedFunding)}
                    </strong>
                </div>

                <div class="metric-row">
                    <span>Outcome</span>
                    <strong>
                        ${
                            completed
                                ? "✅ Goal Complete"
                                : formatCurrency(newRemaining) + " Remaining"
                        }
                    </strong>
                </div>

                <div class="metric-row">
                    <span>Remaining Opportunity</span>
                    <strong style="color:#10b981;">
                        ${formatCurrency(remainingOpportunity)}
                    </strong>
                </div>
                
                <hr>
                
                <div class="advisor-action priority">
                
                    <div class="action-title">
                        🎯 Recommended Action
                    </div>
                
                    <p>
                        Fully fund this goal using
                        <strong style="color:#10b981;">
                            ${formatCurrency(suggestedFunding)}
                        </strong>
                        to accelerate completion and free future cash flow for other goals.
                    </p>
                
                </div>

                <div class="metric-row">
                    <span>Reason</span>
                    <strong>${bestGoal.reason}</strong>
                </div>


            </div>

        `;

    } catch(error) {

        console.error(
            "DI-010 Failed",
            error
        );

    }

}

/**
 * ============================================================
 * DI-016 Conversational Wealth Advisor
 * ============================================================
 */

const ADVISOR_ROUTES = {
    explanation: ["why", "why should", "why is", "explain", "reason"],
    // DI-015 Wealth Advisor
    advisor: ["next", "focus", "priority", "recommend", "best action", "should i do", "top action"],
    // DI-012 Opportunities
    opportunity: ["opportunity", "opportunities", "missing", "improve", "optimize", "optimization"],
    // DI-010 Goals
    goal: ["goal", "fund", "target", "save for"],
    // DI-011 Investments
    investment: ["invest", "investment", "allocation", "portfolio"],
    // DI-006 Purchase
    purchase: ["purchase", "afford", "buy", "spender"],
    // DI-009 Cash Flow
    cashflow: [
        "cash flow",
        "cashflow",
        "liquidity",
        "cash position",
    
        "how much can i spend",
        "safe to spend",
        "safe-to-spend",
        "spend",
        "spending",
        "available cash",
        "how much available"
    ]
};


function routeAdvisorQuestion(question) {
    const q = String(question || "").toLowerCase();
    for (const [route, keywords] of Object.entries(ADVISOR_ROUTES)) {
        if (keywords.some(keyword => q.includes(keyword))) {
            return route;
        }
    }
    return "advisor";
}

function askWealthAdvisor(question) {
    const route = routeAdvisorQuestion(question);
    switch (route) {
        case "opportunity":
            return buildOpportunityResponse();
        case "goal":
            return buildGoalResponse();
        case "purchase":
            return buildPurchaseResponse();
        case "investment":
            return buildInvestmentResponse();
        case "cashflow":
            return buildCashFlowResponse();
        case "explanation":
            return buildExplanationResponse();
        default:
            return buildAdvisorResponse();
    }
}

function buildAdvisorResponse() {
    const brief = getMonthlyWealthBrief();
    return {
        answer: brief.headline,
        confidence: brief.confidenceScore,
        source: "DI-015",
        generatedAt: new Date().toISOString()
    };
}

function buildOpportunityResponse() {
    const result = getWealthOpportunities();
    const item = result.opportunities[0];
    return {
        answer: item ? item.action : "No opportunities detected",
        confidence: 90,
        source: "DI-012",
        generatedAt: new Date().toISOString()
    };
}

function buildGoalResponse() {
    const goal = window.qaGoalFundingOptimizer;
    return {
        answer: goal ? goal.priorityAction : "No goal recommendation available",
        confidence: 85,
        source: "DI-010",
        generatedAt: new Date().toISOString()
    };
}

function buildInvestmentResponse() {
    const priority = getCapitalAllocationPriority();
    return {
        answer: priority.action,
        confidence: 85,
        source: "DI-011",
        generatedAt: new Date().toISOString()
    };
}

function buildCashFlowResponse() {
    const safeSpend = getSafeToSpend();
    const payCycle = getCurrentPayCycle();
    return {
        answer: `You can safely spend
        ${formatCurrency(
            safeSpend.safeToSpend
        )}
        before your next payday
        in ${payCycle.daysRemaining}
        days.`,
        confidence: 95,
        source: "DI-017",
        generatedAt: new Date().toISOString()
    };
}

function buildPurchaseResponse() {
    const purchase = window.qaPurchase;
    return {
        answer: purchase?.recommendation || "Run Purchase Evaluator first",
        confidence: 80,
        source: "DI-006",
        generatedAt: new Date().toISOString()
    };
}

function loadConversationalAdvisorQA(question) {
    const result = askWealthAdvisor(question);
    window.qaConversationalAdvisor = result;
    console.log("🧪 DI-016", question, result);
    return result;
}

function buildExplanationResponse() {
    const advisor = getWealthAdvisorSummary();
    const explanation = getAdvisorExplanation();
    return {
        answer: explanation,
        confidence: getAdvisorConfidence(advisor.topAction).score,
        source: "DI-015",
        generatedAt: new Date().toISOString()
    };
}
