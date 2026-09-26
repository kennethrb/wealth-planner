// ==================== FILE: goals.js ====================

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
    const container = document.getElementById("financialGoals");
    if (!container) return;

    const goals = (typeof appData !== "undefined" && appData.goals) ? appData.goals : [];
    // Display Active & Graduated goals (Filter out archived ones from main list)
    const displayGoals = goals.filter(g => g.status !== "ARCHIVED");

    if (displayGoals.length === 0) {
        container.innerHTML = `
            <div class="goal-item">
                <span class="label">No active goals found</span>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="goals-container">
            ${displayGoals.map(goal => {
                const id = goal.goalId || goal.id;
                const name = goal.goal || goal.goalName || "Unnamed Goal";
                const current = Number(goal.current || 0);
                const target = Number(goal.target || 1);
                const monthlyContribution = Number(goal.monthlyContribution || 0);

                const progress = target > 0 ? ((current / target) * 100).toFixed(1) : 0;
                const remainingAmount = Math.max(0, target - current);

                const status = goal.status || (current >= target ? "GRADUATED" : "ACTIVE");

                const statusBadge =
                    status === "GRADUATED"
                        ? "✅ Graduated"
                        : status === "ARCHIVED"
                        ? "📦 Archived"
                        : "🎯 Active";

                let forecast = "N/A";
                let monthsRemaining = "N/A";

                if (monthlyContribution > 0 && remainingAmount > 0) {
                    monthsRemaining = Math.ceil(remainingAmount / monthlyContribution);
                    const completionDate = new Date();
                    completionDate.setMonth(completionDate.getMonth() + monthsRemaining);

                    forecast = completionDate.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short"
                    });
                } else if (remainingAmount === 0) {
                    forecast = "Achieved";
                    monthsRemaining = 0;
                }

                return `
                    <div class="goal-item" id="goal-card-${id}">
                        <div class="item-header">
                            <span class="item-title">🎯 ${escapeHtml(name)}</span>
                            <span class="item-value">${typeof formatCurrency === "function" ? formatCurrency(current) : current}</span>
                        </div>

                        <div class="progress-bar-bg" style="margin: 8px 0; background: rgba(255,255,255,0.1); height: 6px; border-radius: 3px; overflow: hidden;">
                            <div class="progress-bar-fill" style="width: ${Math.min(progress, 100)}\%; background:${status === "GRADUATED" ? "#34d399" : "#60a5fa"}; height: 100%;"></div>
                        </div>

                        <div class="goal-details">
                            <span>${statusBadge}</span>

                            <span>
                                Target: ${typeof formatCurrency === "function" ? formatCurrency(target) : target} (${progress}%)
                            </span>

                            <span>
                                Est: <strong>${forecast}</strong>${typeof monthsRemaining === "number" ? `(${monthsRemaining} mos)` : ""}
                            </span>

                            <div style="display:flex; gap:8px; align-items:center; margin-top:8px;">
                                <button
                                    class="btn-secondary"
                                    onclick="editGoal('${id}')"
                                    title="Edit Goal"
                                >
                                    ✏️
                                </button>
                                <button
                                    class="btn-secondary"
                                    onclick="archiveGoal('${id}')"
                                    title="Archive Goal"
                                >
                                    📦
                                </button>
                                <button
                                    class="btn-danger"
                                    onclick="deleteGoal('${id}')"
                                    title="Delete Goal"
                                >
                                    🗑
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join("")}
        </div>
    `;
}

/**
 * Switch form to EDIT state and populate fields
 */
function editGoal(goalId) {
    const goals = (typeof appData !== "undefined" && appData.goals) ? appData.goals : [];
    const goal = goals.find(g => (g.goalId || g.id) === goalId);
    if (!goal) {
        showStatus("Goal not found", "error");
        return;
    }

    editingGoalId = goalId;

    // 1. Populate Form Inputs
    const elName = document.getElementById("goalName");
    const elTarget = document.getElementById("goalTarget");
    const elContribution = document.getElementById("goalContribution");

    if (elName) elName.value = goal.goal || goal.goalName || "";
    if (elTarget) elTarget.value = goal.target || 0;
    if (elContribution) elContribution.value = goal.monthlyContribution || 0;

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

    // 3. Scroll smoothly to the form
    const form = document.getElementById("addGoalForm");
    if (form) {
        form.scrollIntoView({ behavior: "smooth", block: "center" });
    }
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

    if (formTitle) formTitle.textContent = "➕ Add Goal";
    if (submitBtn) submitBtn.textContent = "➕ Add Goal";
    
    // Hide cancel button if it uses the hidden class pattern
    if (cancelBtn) {
        cancelBtn.classList.add("hidden");
    }
}

/**
 * Unified Form Handler (Dispatches to CREATE or UPDATE based on state)
 */
async function handleGoalFormSubmit(event) {
    if (event) event.preventDefault();

    const goalName = document.getElementById("goalName")?.value.trim() || "";
    const target = parseFloat(document.getElementById("goalTarget")?.value) || 0;
    const monthlyContribution = parseFloat(document.getElementById("goalContribution")?.value) || 0;

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
                monthlyContribution: monthlyContribution
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
                monthlyContribution: monthlyContribution
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

/**
 * Helper: Resolve current mode
 */
function getCurrentMode() {
    if (typeof CURRENT_MODE !== "undefined") return CURRENT_MODE;
    if (typeof appMode !== "undefined") return appMode;
    if (typeof appData !== "undefined" && appData.mode) return appData.mode;
    return "TEST";
}

/**
 * Helper: HTML Sanitizer
 */
function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
