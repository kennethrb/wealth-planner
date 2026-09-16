document.addEventListener("DOMContentLoaded",
    () => {
        const form = document.getElementById("addGoalForm");
        if (!form) return;
        form.addEventListener("submit", handleAddGoal);
    });

async function handleAddGoal(event) {
    event.preventDefault();
    const goal = document.getElementById("goalName").value.trim();
    const target = document.getElementById("goalTarget").value;
    const monthlyContribution = document.getElementById("goalContribution").value;
    const response =
        await fetch(
            `${BASE_URL}?action=addGoal`
            + `&mode=${appMode}`
            + `&goal=${encodeURIComponent(goal)}`
            + `&target=${target}`
            + `&current=0`
            + `&monthlyContribution=${monthlyContribution}`
        );
    const result = await response.json();
    if (!result.success) {
        showStatus("Goal creation failed", "error");
        return;
    }
    document.getElementById("goalName").value = "";
    document.getElementById("goalTarget").value = "";
    document.getElementById("goalContribution").value = "";
    await loadData();
    await refreshUI();
    showStatus("✅ Goal added successfully", "success");
}

async function loadGoals() {
    const container = document.getElementById("financialGoals");
    if (!container) return;
    let html = `<div class="goals-container">`;
    appData.goals.forEach(goal => {
        const current = Number(goal.current || 0);
        const target = Number(goal.target || 1);

        const progress = ((current / target) * 100).toFixed(1);
        const remainingAmount = target - current;
        const monthlyContribution =
            Number(goal.monthlyContribution || 0);
        
        const status =
            goal.status || "ACTIVE";
        
        const statusBadge =
            status === "GRADUATED"
                ? "✅ Graduated"
                : status === "ARCHIVED"
                ? "📦 Archived"
                : "🎯 Active";
        
        let forecast = "N/A";
        let monthsRemaining = "N/A";
        
        if (monthlyContribution > 0) {
        
            const remainingAmount =
                target - current;
        
            monthsRemaining =
                Math.ceil(
                    remainingAmount /
                    monthlyContribution
                );
        
            const completionDate =
                new Date();
        
            completionDate.setMonth(
                completionDate.getMonth() +
                monthsRemaining
            );
        
            forecast =
                completionDate.toLocaleDateString(
                    "en-US",
                    {
                        year: "numeric",
                        month: "short"
                    }
                );
        }
        html += `
      <div class="goal-item">
        <div class="item-header">
          <span class="item-title">🎯 ${goal.goal}</span>
          <span class="item-value">${formatCurrency(current)}</span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width: ${Math.min(progress, 100)}%;"></div>
        </div>
        <div class="goal-details">
        
          <span>
              ${statusBadge}
          </span>
        
          <span>
              Target:
              ${formatCurrency(target)}
              (${progress}%)
          </span>
        
          <span>
              Est:
              <strong>${forecast}</strong>
              (${monthsRemaining} mos)
          </span>
        
          <div
              style="
                  display:flex;
                  gap:8px;
                  margin-top:8px;
              "
          >
        
              <button
                  class="btn-secondary"
                  onclick="editGoal('${goal.goalId}')"
              >
                  ✏️
              </button>
        
              <button
                  class="btn-secondary"
                  onclick="archiveGoal('${goal.goalId}')"
              >
                  📦
              </button>
        
              <button
                  class="btn-danger"
                  onclick="deleteGoal('${goal.goalId}')"
              >
                  🗑
              </button>
        
          </div>
        
        </div>
      </div>
    `;
    });
    html += `</div>`;
    container.innerHTML = html;
}

async function deleteGoal(goalId) {

    const confirmed =
        await showConfirmDialog(
            "Delete Goal",
            "Delete this goal?"
        );

    if (!confirmed)
        return;

    const response =
        await fetch(
            `${BASE_URL}?action=deleteGoal`
            + `&mode=${appMode}`
            + `&goalId=${goalId}`
        );

    const result =
        await response.json();

    if (!result.success) {

        showStatus(
            "Delete failed",
            "error"
        );

        return;
    }

    await loadData();
    await refreshUI();

    showStatus(
        "Goal deleted",
        "success"
    );
}

async function archiveGoal(goalId) {

    const confirmed =
        await showConfirmDialog(
            "Archive Goal",
            "Archive this goal?"
        );

    if (!confirmed)
        return;

    const response =
        await fetch(
            `${BASE_URL}?action=archiveGoal`
            + `&mode=${appMode}`
            + `&goalId=${goalId}`
        );

    const result =
        await response.json();

    if (!result.success) {

        showStatus(
            "Archive failed",
            "error"
        );

        return;
    }

    await loadData();
    await refreshUI();

    showStatus(
        "Goal archived",
        "success"
    );
}

async function editGoal(goalId) {

    const goal =
        appData.goals.find(
            g => g.goalId === goalId
        );

    if (!goal)
        return;

    const newTarget =
        await showInputDialog(
            "Edit Goal Target",
            goal.goal,
            goal.target
        );

    if (
        newTarget === null ||
        newTarget === ""
    ) {
        return;
    }

    const response =
        await fetch(
            `${BASE_URL}?action=updateGoal`
            + `&mode=${appMode}`
            + `&goalId=${goalId}`
            + `&goal=${encodeURIComponent(goal.goal)}`
            + `&target=${encodeURIComponent(newTarget)}`
            + `&current=${goal.current}`
            + `&monthlyContribution=${goal.monthlyContribution}`
            + `&status=${goal.status}`
        );

    const result =
        await response.json();

    if (!result.success) {

        showStatus(
            "Update failed",
            "error"
        );

        return;
    }

    await loadData();
    await refreshUI();

    showStatus(
        "✅ Goal updated",
        "success"
    );
}

