// ==================== FILE: monthlyWealthPlanEngine.js ====================

const MonthlyPlanStatus = {
    DRAFT: "DRAFT",
    ACTIVE: "ACTIVE",
    COMPLETED: "COMPLETED",
    ABANDONED: "ABANDONED"
};

function getMonthlyWealthPlan() {

    const advisor =
        getWealthAdvisorSummary();

    const recommendation =
        advisor?.recommendation ||
        advisor?.topRecommendation ||
        {};

    const opportunityEngine =
        getWealthOpportunities();

    const topOpportunity =
        opportunityEngine?.opportunities?.[0];

    const confidence =
        getRecommendationConfidence(
            recommendation
        );

    const narrative =
        getAdvisorNarrative();

    const executionSteps = [];

    console.log(
        "PLAN STATE",
        advisor?.wealthState
    );
  
    switch (recommendation?.id) {

        case "ALLOCATION_READY":

            executionSteps.push(
                {
                    id: "STEP001",
                    completed: false,
                    label:
                        "Allocate deployable capital"
                },
                {
                    id: "STEP002",
                    completed: false,
                    label:
                        "Prioritize highest ROI goal"
                }
            );

            break;

          case "PROTECT_LIQUIDITY":
          
              executionSteps.push(
                  {
                      id: "STEP001",
                      completed: false,
                      label:
                          "Preserve available cash reserves"
                  },
                  {
                      id: "STEP002",
                      completed: false,
                      label:
                          "Avoid discretionary spending"
                  },
                  {
                      id: "STEP003",
                      completed: false,
                      label:
                          "Increase liquidity coverage"
                  }
              );
          
              break;

        default:

            executionSteps.push(
                {
                    id: "STEP001",
                    completed: false,
                    label:
                        "Maintain current wealth strategy"
                }
            );
    }

    let wealthImpactNarrative = "";

    if (advisor?.wealthState === "PROTECTION_GAP") {
    
        wealthImpactNarrative =
            "Prevents future cash shortfalls and protects upcoming obligations.";
    
    }
    else if (advisor?.wealthState === "GOAL_ACCELERATION") {
    
        wealthImpactNarrative =
            "Accelerates goal completion and releases future capital.";
    
    }
    else {
    
        wealthImpactNarrative =
            "Improves long-term wealth growth.";
    }


    return {

        planId:
            `PLAN_${Date.now()}`,

        createdDate:
            new Date().toISOString(),

        financialMonth:
            getViewMonth(),

        financialYear:
            getViewYear(),

        primaryAction:
            recommendation?.title ||
            "Maintain Stability",

        secondaryAction:
            topOpportunity?.action ||
            "No secondary action recommended",

        advisorReason:
            recommendation?.reason ||
            "",

        wealthImpact:
            Number(
                topOpportunity?.wealthImpact || 0
            ),

        wealthImpactNarrative,

        confidence:
            confidence?.score || 0,

        risk:
            narrative?.riskIfIgnored ||
            "Protection requirements may remain underfunded.",

        alternatives:
            narrative?.alternativeActions ||
            [],

        executionSteps,

        completedSteps: 0,

        totalSteps:
            executionSteps.length,

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

        <h2>
            📋 MONTHLY WEALTH PLAN
        </h2>

        <div class="advisor-action priority">

            <div class="action-title">
                THIS MONTH'S PRIORITY
            </div>

            <p class="big-decision">
                ${plan.primaryAction}
            </p>

        </div>

        <div class="metric-row">

            <span>Plan Status</span>

            <strong style="color:#34d399">
                ${plan.status}
            </strong>

        </div>

        <div class="metric-row">

            <span>Confidence</span>

            <strong>
                ${plan.confidence}%
            </strong>

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

        <div class="advisor-action warning">
        
            <div class="action-title">
                URGENCY
            </div>
        
            <p>
                Immediate Action Required
            </p>
        
        </div>

        <div class="advisor-action success">

            <div class="action-title">
                WEALTH IMPACT
            </div>

            <p>
                ${plan.wealthImpactNarrative}
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
                EXECUTION PLAN
            </div>

            ${plan.executionSteps
                .map(step => `
                    <div style="
                        padding:8px 0;
                        border-bottom:
                        1px solid rgba(255,255,255,.08);
                    ">
                        ☐ ${step.label}
                    </div>
                `)
                .join("")}

        </div>

        <div class="advisor-action">

            <div class="action-title">
                ALTERNATIVES
            </div>

            ${
                plan.alternatives.length
                ? plan.alternatives
                    .map(
                        alt => `<p>• ${alt}</p>`
                    )
                    .join("")
                : "<p>No alternatives available</p>"
            }

        </div>

        <div class="metric-row">

            <span>Progress</span>

            <strong>
                ${plan.completedSteps}
                /
                ${plan.totalSteps}
                Complete
            </strong>

        </div>

    </div>

    `;
}
