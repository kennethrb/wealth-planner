/**
 * ==========================================
 * Protection Engine
 * DI-027
 * Single Source of Truth
 * ==========================================
 */

const ProtectionState = {
  NO_DATA: "NO_DATA",
  ACTIVE: "ACTIVE",
  PROTECTION: "PROTECTION",
  OPTIMIZED: "OPTIMIZED",
  PAUSED: "PAUSED"
};

function getUnifiedProtectionStatus(
    accounts = [],
    recurringBills = [],
    goals = [],
    debts = []
) {

    const totalCash =
        getTotalLiquidAssets(accounts);

    const commitments =
        getCommitmentSummary();

    const tier1 =
        getTier1Protection(
            recurringBills,
            debts
        );

    const tier2 =
        getTier2Protection(
            commitments
        );

    const tier3 =
        getTier3Protection(
            goals
        );

  const commitments =
      getCommitmentSummary();

  const protectionRequirement =
      tier1.requiredAmount +
      tier2.requiredAmount +
      tier3.requiredAmount;

  const protectionGap =
      Math.max(0, protectionRequirement - totalCash);

  const availableCapital =
      Math.max(0, totalCash - protectionRequirement);

  let state = ProtectionState.ACTIVE;

  if (accounts.length === 0) {
      state = ProtectionState.NO_DATA;
  } else if (protectionGap > 0) {
      state = ProtectionState.PROTECTION;
  } else if (availableCapital === 0) {
      state = ProtectionState.OPTIMIZED;
  }

  return {
      state,
      totalCash,
  
      requiredProtection:
          protectionRequirement,
  
      protectionGap,
  
      availableCapital,
  
      tier1,
      tier2,
      tier3,
  
      recommendation
  };
}

function getTier1Protection(
    recurringBills = [],
    debts = []
) {

    const protectedBills =
        recurringBills.filter(
            bill => bill.isProtected === true
        );

    const billProtection =
        protectedBills.reduce(
            (sum, bill) =>
                sum + Number(
                    bill.defaultAmount ||
                    bill.amount ||
                    0
                ),
            0
        );

    const debtProtection =
        debts.reduce(
            (sum, debt) =>
                sum + Number(debt.minimumPayment || 0),
            0
        );

    return {
        tier: "TIER_1",
        name: "Protected Obligations",
        requiredAmount:
            billProtection + debtProtection
    };
}

function getTier2Protection(commitments)
{
    return {
        tier: "TIER_2",
        name: "Operating Buffer",
        requiredAmount:
            commitments.totalCommitments *
            CONFIG.payCycle.bufferReserveRatio
    };
}

function getTier3Protection(goals = []) {

    const emergencyGoals =
        goals.filter(
            goal =>
                goal.type === "EMERGENCY_FUND"
        );

    const requiredAmount =
        emergencyGoals.reduce(
            (sum, goal) =>
                sum + Number(goal.targetAmount || 0),
            0
        );

    return {
        tier: "TIER_3",
        name: "Strategic Protection",
        requiredAmount
    };
}

function getProtectionRecommendation(
    state,
    protectionGap,
    availableCapital
) {

    switch(state) {

        case "NO_DATA":
            return {
                priority: "HIGH",
                action:
                    "Create your first account"
            };

        case "PROTECTION":
            return {
                priority: "CRITICAL",
                action:
                    `Increase protected reserves by ₱${protectionGap}`
            };

        case "OPTIMIZED":
            return {
                priority: "MEDIUM",
                action:
                    "Continue executing wealth plan"
            };

        case "ACTIVE":
            return {
                priority: "HIGH",
                action:
                    `Deploy ₱${availableCapital} toward highest priority goal`
            };

        default:
            return null;
    }
}
