// ==================== FILE: monthlyWealthPlanEngine.js ====================

  
    const MonthlyPlanStatus = {
        DRAFT: "DRAFT",
        ACTIVE: "ACTIVE",
        COMPLETED: "COMPLETED",
        ABANDONED: "ABANDONED"
    };

function getMonthlyWealthPlan() {

    const advisor = getWealthAdvisorSummary();
    const opportunities = getWealthOpportunities();

    const primaryRecommendation =
        advisor.topRecommendation;

    const topOpportunity =
        opportunities.opportunities?.[0];

    const confidence =
        getRecommendationConfidence(
            primaryRecommendation
        );


    const narrative =
        getAdvisorNarrative();

    return {
    
        planId: `PLAN_${Date.now()}`,
    
        createdDate:
            new Date().toISOString(),
    
        financialMonth:
            getViewMonth(),
    
        financialYear:
            getViewYear(),
    
        primaryAction:
            primaryRecommendation?.title ||
            "Maintain Stability",
    
        secondaryAction:
            topOpportunity?.action || "",
    
        wealthImpact:
            Number(
                topOpportunity?.wealthImpact || 0
            ),
    
        advisorReason:
            primaryRecommendation?.reason || "",
    
        confidence:
            confidence.score,
    
        risk:
            narrative?.riskIfIgnored || "",
    
        alternatives:
            narrative?.alternativeActions || [],
    
        executionSteps: [],
    
        status:
            MonthlyPlanStatus.ACTIVE
    };
}

function loadMonthlyWealthPlanCard() {

    const plan =
        getMonthlyWealthPlan();

    const container =
        document.getElementById(
            "monthlyWealthPlan"
        );

    if (!container) return;

    container.innerHTML = `
    <div class="card">

        <h2>📋 MONTHLY WEALTH PLAN</h2>

        <div class="advisor-action priority">

            <div class="action-title">
                PRIMARY ACTION
            </div>

            <p>
                ${plan.primaryAction}
            </p>

        </div>

        <div class="advisor-action">
            <div class="action-title">
                SECONDARY ACTION
            </div>
        
            <p>
                ${plan.secondaryAction}
            </p>
        </div>

        <div class="advisor-action">

            <div class="action-title">
                WHY NOW
            </div>

            <p>
                ${plan.advisorReason}
            </p>

        </div>

        <div class="advisor-action success">

            <div class="action-title">
                WEALTH IMPACT
            </div>

            <p>
                ${formatCurrency(
                    plan.wealthImpact
                )}
            </p>

        </div>

        <div class="advisor-action warning">
        
            <div class="action-title">
                RISK
            </div>
        
            <p>
                ${plan.risk}
            </p>
        
        </div>

        <div class="advisor-action">
        
            <div class="action-title">
                ALTERNATIVES
            </div>
        
            ${
                plan.alternatives?.length
                ? plan.alternatives
                    .map(item => `
                        <p>${item}</p>
                    `)
                    .join("")
                : "<p>No alternatives available</p>"
            }
        
        </div>

        <div class="metric-row">

            <span>Confidence</span>

            <strong>
                ${plan.confidence}%
            </strong>

        </div>

    </div>
    `;
}
