// ==================== FILE: goals.js ====================

let goalDisplayCount = 5;

function showMoreGoals() {
    goalDisplayCount += 5;
    loadGoals();
}

function toggleGoalMenu(goalId) {

    document
        .querySelectorAll("[id^='goal-menu-']")
        .forEach(menu => {

            if (menu.id === `goal-menu-${goalId}`) {
                menu.classList.toggle("hidden");
            } else {
                menu.classList.add("hidden");
            }

        });

}

function openGoalModal() {

    document
        .getElementById("goalModal")
        ?.classList.add("show");

}

function closeGoalModal() {

    document
        .getElementById("goalModal")
        ?.classList.remove("show");

}

//Create a single source of truth lifecycle function.
function getGoalLifecycleState(goal) {

    const current =
        getGoalCurrent(goal);

    const target =
        Number(goal.target || 0);

    const explicitStatus =
        String(goal.status || "")
        .toUpperCase();

    if (explicitStatus === "ARCHIVED") {
        return "ARCHIVED";
    }

    if (explicitStatus === "GRADUATED") {
        return "GRADUATED";
    }

    if (target > 0 && current >= target) {
        return "FUNDED";
    }

    return "ACTIVE";
}
async function graduateGoal(goalId) {
    const confirmed = await showConfirmDialog("Graduate Goal", "Has this goal been completed?");
    if (!confirmed) return;
    const params = new URLSearchParams({
        action: "graduateGoal",
        mode: getCurrentMode(),
        goalId
    });
    const response = await fetch(`${BASE_URL}?${params}`);
    const result = await response.json();
    if (result.success) {
        await loadData();
        await refreshUI();
        showStatus("✅ Goal Graduated", "success");
    }
}

async function markGoalFunded(goalId) {
    const params = new URLSearchParams({
        action: "markGoalFunded",
        mode: getCurrentMode(),
        goalId
    });
    const response = await fetch(`${BASE_URL}?${params}`);
    const result = await response.json();
    if (result.success) {
        await loadData();
        await refreshUI();
        showStatus("💰 Goal Funded", "success");
    }
}

// Tracks whether the form is in "Add" mode (null) or "Edit" mode (goalId)
let editingGoalId = null;

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("addGoalForm");
    if (form) {
        form.addEventListener("submit", handleGoalFormSubmit);
    }

    // Optional: If you add a cancel button to your goal form markup
    const cancelBtn = document.getElementById("goalFormCancelBtn");
    if (cancelBtn) {
        cancelBtn.addEventListener("click", cancelGoalEdit);
    }
});

/**
 * READ: Renders active and graduated goals using the original card design
 */
function loadGoals() {

    const container =
        document.getElementById(
            "financialGoals"
        );

    if (!container) return;

    const allGoals =
        (appData.goals || [])
        .filter(
            g =>
                getGoalLifecycleState(g)
                !== "ARCHIVED"
        );

    if (!allGoals.length) {

        container.innerHTML = `
            <p>
                No active goals found.
            </p>
        `;

        return;
    }

    const visibleGoals =
        allGoals.slice(
            0,
            goalDisplayCount
        );

    const totalRemaining =
        allGoals.reduce(
            (sum, goal) => {

                const current =
                    getGoalCurrent(goal);

                const target =
                    Number(
                        goal.target || 0
                    );

                return (
                    sum +
                    Math.max(
                        0,
                        target - current
                    )
                );

            },
            0
        );

    container.innerHTML = `

        <div class="commitment-summary">

            <div class="commitment-label">
                GOAL PORTFOLIO
            </div>

            <div class="commitment-total">
                ${formatCurrency(totalRemaining)}
            </div>

            <div class="commitment-meta">
                ${allGoals.length}
                Active Goals
            </div>

        </div>

        <div class="commitment-grid">

            ${visibleGoals.map(goal => {

                const goalId =
                    goal.goalId ||
                    goal.id;

                const name =
                    goal.goal ||
                    "Goal";

                const current =
                    getGoalCurrent(goal);

                const target =
                    Number(
                        goal.target || 0
                    );

                const remaining =
                    Math.max(
                        0,
                        target - current
                    );

                const progress =
                    target > 0
                    ? Math.round(
                        (current / target) *
                        100
                    )
                    : 0;

                const status =
                    getGoalLifecycleState(
                        goal
                    );

                let forecast =
                    "";

                if (
                    status === "FUNDED"
                ) {

                    forecast =
                        "100% Complete";

                }
                else if (
                    status ===
                    "GRADUATED"
                ) {

                    forecast =
                        "Completed";

                }
                else {

                    forecast =
                        `${progress}% Complete`;

                }

                let subtitle =
                    "";

                if (
                    status ===
                    "FUNDED"
                ) {

                    subtitle =
                        "Protected";

                }
                else {

                    subtitle =
                        `${formatCurrency(
                            remaining
                        )} Remaining`;

                }

                return `

                    <div class="commitment-card">

                        <div class="commitment-top-row">

                            <div
                                class="
                                    commitment-badge
                                    commitment-bill
                                "
                            >
                                GOAL
                            </div>

                            <button
                                class="
                                    commitment-menu-btn
                                "
                                onclick="
                                    toggleGoalMenu(
                                        '${goalId}'
                                    )
                                "
                            >
                                ⋮
                            </button>

                        </div>

                        <div
                            class="
                                commitment-name
                            "
                        >
                            ${escapeHtml(
                                name
                            )}
                        </div>

                        <div
                            class="
                                commitment-amount
                            "
                        >
                            ${subtitle}
                        </div>

                        <div
                            class="
                                commitment-due
                            "
                        >
                            ${forecast}
                        </div>

                        <div
                            id="
                                goal-menu-${goalId}
                            "
                            class="
                                bill-menu
                                hidden
                            "
                        >

                            <button
                                onclick="
                                    editGoal(
                                        '${goalId}'
                                    )
                                "
                            >
                                ✏️ Edit Goal
                            </button>

                            <button
                                onclick="
                                    archiveGoal(
                                        '${goalId}'
                                    )
                                "
                            >
                                📦 Archive Goal
                            </button>

                            ${
                                status ===
                                "FUNDED"
                                ? `
                                <button
                                    onclick="
                                        graduateGoal(
                                            '${goalId}'
                                        )
                                    "
                                >
                                    🎓 Graduate Goal
                                </button>
                                `
                                : ""
                            }

                            <button
                                onclick="
                                    deleteGoal(
                                        '${goalId}'
                                    )
                                "
                            >
                                🗑 Delete Goal
                            </button>

                        </div>

                    </div>

                `;

            }).join("")}

        </div>

        ${
            allGoals.length >
            goalDisplayCount
                ? `
                <div
                    class="
                        show-more-container
                    "
                >

                    <div
                        class="
                            show-more-label
                        "
                    >
                        Showing
                        ${Math.min(
                            goalDisplayCount,
                            allGoals.length
                        )}
                        of
                        ${allGoals.length}
                        goals
                    </div>

                    <button
                        class="
                            btn-secondary
                        "
                        onclick="
                            showMoreGoals()
                        "
                    >
                        View More Goals
                    </button>

                </div>
                `
                : ""
        }

    `;
}

/**
 * Switch form to EDIT state and populate fields
 */
function editGoal(goalId) {
    const goals = (typeof appData !== "undefined" && appData.goals) ? appData.goals : [];
    const goal = goals.find(g => (g.goalId || g.id) === goalId);
    const elGoalAccount =
        document.getElementById(
            "goalAccountId"
        );
    
    if (elGoalAccount) {
        elGoalAccount.value =
            goal.goalAccountId || "";
    }
    if (!goal) {
        showStatus("Goal not found", "error");
        return;
    }
    const elProtectionRole =
        document.getElementById(
            "goalProtectionRole"
        );
    
    if (elProtectionRole) {
        elProtectionRole.value =
            goal.protectionRole ||
            "OPTIONAL";
    }

    editingGoalId = goalId;

    // 1. Populate Form Inputs
    const elName = document.getElementById("goalName");
    const elTarget = document.getElementById("goalTarget");
    const elContribution = document.getElementById("goalContribution");
    const elGoalMode = document.getElementById("goalMode");

    if (elName) elName.value = goal.goal || goal.goalName || "";
    if (elTarget) elTarget.value = goal.target || 0;
    if (elContribution) elContribution.value = goal.monthlyContribution || 0;
    if (elGoalMode) {
        elGoalMode.value =
            goal.goalMode || "VIRTUAL";
    }

    // 2. Update Form Action Controls
    const formTitle = document.getElementById("goalFormTitle");
    const submitBtn = document.getElementById("goalFormSubmitBtn");
    const cancelBtn = document.getElementById("goalFormCancelBtn");

    if (formTitle) formTitle.textContent = "✏️ Edit Goal";
    if (submitBtn) submitBtn.textContent = "Save Changes";

    // Show the cancel button
    if (cancelBtn) {
        cancelBtn.classList.remove("hidden");
    }

    openGoalModal();
}

/**
 * Cancel Edit mode and restore ADD state for goals
 */
function cancelGoalEdit() {
    editingGoalId = null;

    const form = document.getElementById("addGoalForm");
    if (form) form.reset();

    const formTitle = document.getElementById("goalFormTitle");
    const submitBtn = document.getElementById("goalFormSubmitBtn");
    const cancelBtn = document.getElementById("goalFormCancelBtn");
    const role =
        document.getElementById(
            "goalProtectionRole"
        );
    
    if (role) {
        role.value = "OPTIONAL";
    }

    if (formTitle) formTitle.textContent = "➕ Add Goal";
    if (submitBtn) submitBtn.textContent = "➕ Add Goal";
    
    // Hide cancel button if it uses the hidden class pattern
    if (cancelBtn) {
        cancelBtn.classList.add("hidden");
    }
    closeGoalModal();
}

/**
 * Unified Form Handler (Dispatches to CREATE or UPDATE based on state)
 */
async function handleGoalFormSubmit(event) {
    if (event) event.preventDefault();
    const goalAccountId =
        document.getElementById(
            "goalAccountId"
        )?.value || "";
    const goalMode =
        document.getElementById(
            "goalMode"
        )?.value || "VIRTUAL";

    const goalName = document.getElementById("goalName")?.value.trim() || "";
    const target = parseFloat(document.getElementById("goalTarget")?.value) || 0;
    const monthlyContribution = parseFloat(document.getElementById("goalContribution")?.value) || 0;

    const goalProtectionRole =
        document.getElementById(
            "goalProtectionRole"
        )?.value || "OPTIONAL";

    if (!goalName) {
        showStatus("Please enter a goal name", "warning");
        return;
    }

    const baseUrl = typeof GOOGLE_SCRIPT_URL !== "undefined" ? GOOGLE_SCRIPT_URL : (typeof BASE_URL !== "undefined" ? BASE_URL : "");
    const mode = getCurrentMode();

    if (editingGoalId) {
        // --- UPDATE ROUTE ---
        showStatus("Updating goal...", "info");
        try {
            const goals = (typeof appData !== "undefined" && appData.goals) ? appData.goals : [];
            const existingGoal = goals.find(g => (g.goalId || g.id) === editingGoalId);
            const currentAmount = existingGoal ? Number(existingGoal.current || 0) : 0;

            const params = new URLSearchParams({
                action: "updateGoal",
                mode: mode,
                goalId: editingGoalId,
                goal: goalName,
                target: target,
                current: currentAmount,
                monthlyContribution: monthlyContribution,
                goalMode: goalMode,
                protectionRole: goalProtectionRole,
                goalAccountId: goalAccountId
            });

            const response = await fetch(`${baseUrl}?${params.toString()}`);
            const result = await response.json();

            if (result.success) {
                showStatus("✅ Goal updated successfully", "success");
                cancelGoalEdit();
                if (typeof loadData === "function") await loadData();
                if (typeof refreshUI === "function") await refreshUI();
            } else {
                showStatus("Update failed: " + (result.error || result.message), "error");
            }
        } catch (error) {
            console.error("updateGoal error:", error);
            showStatus("Failed to update goal", "error");
        }
    } else {
        // --- CREATE ROUTE ---
        showStatus("Saving new goal...", "info");
        try {
            const params = new URLSearchParams({
                action: "addGoal",
                mode: mode,
                goal: goalName,
                target: target,
                current: 0,
                monthlyContribution: monthlyContribution,
                goalMode: goalMode,
                protectionRole: goalProtectionRole,
                goalAccountId: goalAccountId
            });

            const response = await fetch(`${baseUrl}?${params.toString()}`);
            const result = await response.json();

            if (result.success) {
                showStatus("✅ Goal added successfully", "success");
                cancelGoalEdit();
                if (typeof loadData === "function") await loadData();
                if (typeof refreshUI === "function") await refreshUI();
            } else {
                showStatus("Backend Error: " + (result.error || result.message), "error");
            }
        } catch (error) {
            console.error("addGoal error:", error);
            showStatus("Failed to add goal: " + error.message, "error");
        }
    }
}

/**
 * ARCHIVE: Soft-archive goal
 */
async function archiveGoal(goalId) {
    const confirmed = typeof showConfirmDialog === "function" 
        ? await showConfirmDialog("Archive Goal", "Archive this goal? It will be moved out of your active view.")
        : confirm("Archive this goal?");

    if (!confirmed) return;

    showStatus("Archiving goal...", "info");

    try {
        const baseUrl = typeof GOOGLE_SCRIPT_URL !== "undefined" ? GOOGLE_SCRIPT_URL : (typeof BASE_URL !== "undefined" ? BASE_URL : "");
        const mode = getCurrentMode();

        const params = new URLSearchParams({
            action: "archiveGoal",
            mode: mode,
            goalId: goalId
        });

        const response = await fetch(`${baseUrl}?${params.toString()}`);
        const result = await response.json();

        if (result.success) {
            showStatus("📦 Goal archived", "success");
            if (editingGoalId === goalId) cancelGoalEdit();
            if (typeof loadData === "function") await loadData();
            if (typeof refreshUI === "function") await refreshUI();
        } else {
            showStatus("Archive failed: " + (result.error || result.message), "error");
        }
    } catch (error) {
        console.error("archiveGoal error:", error);
        showStatus("Failed to archive goal", "error");
    }
}

/**
 * DELETE: Hard delete goal
 */
async function deleteGoal(goalId) {
    const confirmed = typeof showConfirmDialog === "function" 
        ? await showConfirmDialog("Delete Goal", "Are you sure you want to permanently delete this goal?")
        : confirm("Permanently delete this goal?");

    if (!confirmed) return;

    showStatus("Deleting goal...", "info");

    try {
        const baseUrl = typeof GOOGLE_SCRIPT_URL !== "undefined" ? GOOGLE_SCRIPT_URL : (typeof BASE_URL !== "undefined" ? BASE_URL : "");
        const mode = getCurrentMode();

        const params = new URLSearchParams({
            action: "deleteGoal",
            mode: mode,
            goalId: goalId
        });

        const response = await fetch(`${baseUrl}?${params.toString()}`);
        const result = await response.json();

        if (result.success) {
            showStatus("🗑 Goal deleted", "success");
            if (editingGoalId === goalId) cancelGoalEdit();
            if (typeof loadData === "function") await loadData();
            if (typeof refreshUI === "function") await refreshUI();
        } else {
            showStatus("Delete failed: " + (result.error || result.message), "error");
        }
    } catch (error) {
        console.error("deleteGoal error:", error);
        showStatus("Failed to delete goal", "error");
    }
}

function populateGoalAccounts() {

    const select =
        document.getElementById(
            "goalAccountId"
        );

    if (!select) return;

    select.innerHTML =
        '<option value="">No Linked Account</option>';

    (appData.accounts || []).forEach(account => {

        select.innerHTML += `
            <option value="${account.accountId}">
                ${account.accountName}
            </option>
        `;
    });

}

function getGoalCurrent(goal) {

    const mode =
        String(
            goal.goalMode || "VIRTUAL"
        ).toUpperCase();

    if (
        mode === "PROTECTED" &&
        goal.goalAccountId
    ) {

        const account =
            (appData.accounts || [])
                .find(
                    a =>
                    a.accountId ===
                    goal.goalAccountId
                );

        if (account) {
            return Number(
                account.currentBalance || 0
            );
        }
    }

    return Number(goal.current || 0);
}
