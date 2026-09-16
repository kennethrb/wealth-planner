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

