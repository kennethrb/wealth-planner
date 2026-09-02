async function loadBudgetPlanner() {
    const selectedYear = getSelectedYear();
    const budgetData = appData.budget.filter(item => Number(item.year) === selectedYear);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const categories = {};
    const categoryTypes = {};
    appData.categories.forEach(cat => {
        categoryTypes[cat.categoryName] = cat.budgetType;
    });
    budgetData.forEach(item => {
        if (!categories[item.category]) categories[item.category] = {};
        categories[item.category][item.month] = Number(item.plannedAmount);
    });
    const container = document.getElementById("budget");
    if (!container) return;
    let html = `
    <div class="table-responsive">
      <table>
        <tr>
          <th>Category</th>
          ${months.map(m => `<th>${m}</th>`).join('')}
        </tr>
  `;
    const sections = ["Income", "Expense", "Savings", "Debt"];
    sections.forEach(section => {
        html += `
      <tr class="section-${section.toLowerCase()}">
        <td colspan="${months.length + 1}"><strong>${section.toUpperCase()}</strong></td>
      </tr>
    `;
        Object.keys(categories).forEach(category => {
            if (categoryTypes[category] === section) {
                html += `
          <tr style="height: 38px;">
            <td style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
              <span>${category}</span>
              <span onclick="deleteBudgetItem('${category}')" style="cursor: pointer; opacity: 0.5; font-size: 12px;" title="Delete row">🗑</span>
            </td>
        `;
                months.forEach(month => {
                    const amount = categories[category][month] || "";
                    html += `<td><input type="number" value="${amount}" id="${category}|${month}"></td>`;
                });
                html += `</tr>`;
            }
        });
    });
    const years = [...new Set(appData.budget.map(item => Number(item.year)))].filter(Boolean);
    const currentYear = getSelectedYear();
    const nextYear = currentYear + 1;
    html += `
      </table>
    </div>
    <div class="action-buttons">
      <button onclick="saveBudgetChanges()">💾 Save Budget</button>
      <button onclick="copyJanuaryToWholeYear()">📑 Copy Jan → Year</button>
      <button onclick="copyCurrentYearToNextYear()">📅 Create ${nextYear}</button>
    </div>
  `;
    container.innerHTML = html;
    document
    .querySelectorAll("#budget input[type='number']")
    .forEach(input => {
      input.addEventListener("input", () => {
        hasUnsavedBudgetChanges = true;
      });
    });
}

async function loadSummary() {
    const selectedYear = getSelectedYear();
    const budgetData = appData.budget.filter(item => Number(item.year) === selectedYear);
    const categoryTypes = {};
    appData.categories.forEach(cat => {
        categoryTypes[cat.categoryName] = cat.budgetType;
    });
    const monthlyTotals = {};
    budgetData.forEach(item => {
        const month = item.month;
        if (!monthlyTotals[month]) {
            monthlyTotals[month] = {
                Income: 0,
                Expense: 0,
                Savings: 0,
                Debt: 0
            };
        }
        const type = categoryTypes[item.category];
        if (type) {
            monthlyTotals[month][type] += Number(item.plannedAmount);
        }
    });
    let html = `
    <table>
      <tr>
        <th>Month</th>
        <th class="col-income">Income</th>
        <th class="col-expense">Expense</th>
        <th class="col-savings">Savings</th>
        <th class="col-debt">Debt</th>
        <th>Remaining</th>
      </tr>
  `;
    Object.keys(monthlyTotals).forEach(month => {
        const {
            Income,
            Expense,
            Savings,
            Debt
        } = monthlyTotals[month];
        const remaining = Income - Expense - Savings - Debt;
        html += `
      <tr>
        <td>${month}</td>
        <td class="col-income">${formatCurrency(Income)}</td>
        <td class="col-expense">${formatCurrency(Expense)}</td>
        <td class="col-savings">${formatCurrency(Savings)}</td>
        <td class="col-debt">${formatCurrency(Debt)}</td>
        <td>${formatCurrency(remaining)}</td>
      </tr>
    `;
    });
    html += `</table>`;
    document.getElementById("summary").innerHTML = html;
}

async function addBudgetItem() {
    const year = document.getElementById("newYear")?.value;
    const month = document.getElementById("newMonth")?.value;
    const category = document.getElementById("newCategory")?.value;
    const amount = document.getElementById("newAmount")?.value;
    if (!amount || Number(amount) <= 0) {
        showStatus("⚠ Amount must be greater than zero", "warning");
        return;
    }
    const confirmed = await showConfirmDialog("Add Budget Item", `Add budget item "${category}" for ${month} ${year}?`);
    if (!confirmed) return;
    const response = await fetch(`${BASE_URL}?action=addBudgetItem` + `&year=${year}` + `&month=${month}` + `&category=${encodeURIComponent(category)}` + `&amount=${amount}`);
    const result = await response.json();
    if (!result.success) {
        showStatus(`⚠ ${result.message || "Unable to add budget item"}`, "warning");
        return;
    }
    await loadData();
    // Refresh year dropdown
    loadYearDropdown();
    // Automatically switch to the year just added
    const yearDropdown = document.getElementById("budgetYear");
    if (yearDropdown) {
        yearDropdown.value = year;
    }
    await Promise.all([
        loadBudgetPlanner(),
        loadSummary(),
        loadFinancialHealth(),
        loadProjection(),
        loadFundingPlan(),
        loadBudgetVsActual()
    ]);
    showStatus(result.message || "✅ Budget updated", "success");
}

async function deleteBudgetItem(category) {
    const selectedYear = getSelectedYear();
    const confirmed = await showConfirmDialog("Delete Budget Item", `Delete "${category}" from ${selectedYear}?`);
    if (!confirmed) return;
    await fetch(`${BASE_URL}?action=deleteBudgetItem` + `&year=${selectedYear}` + `&category=${encodeURIComponent(category)}`);
    await loadData();
    await Promise.all([
        loadBudgetPlanner(),
        loadSummary(),
        loadFinancialHealth(),
        loadProjection(),
        loadFundingPlan(),
        loadBudgetVsActual()
    ]);
    showStatus(`🗑 Deleted ${category} from ${selectedYear}`, "success");
}

async function saveBudgetChanges(silent = false) {
    if (!silent) {
        const confirmed = await showConfirmDialog("Save Budget", "Save all changes to the budget?");
        if (!confirmed) return;
    }
    const inputs = document.querySelectorAll("#budget input[type='number']");
    const budgetItems = [];
    const selectedYear = getSelectedYear();
    inputs.forEach(input => {
        const [category, month] = input.id.split("|");
        budgetItems.push({
            year: selectedYear,
            month: month,
            category: category,
            amount: input.value
        });
    });
    try {
        const response = await fetch(BASE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },
            body: JSON.stringify({
                action: "saveAllBudgets",
                budgetItems: budgetItems
            })
        });
        const result = await response.json();
        if (result.success) {
        hasUnsavedBudgetChanges = false;
        await loadData();
        await refreshUI();
        if (!silent) {
        showStatus(
            `✅ Saved ${budgetItems.length} items successfully`,
            "success"
        );
    }
    } else {
            showStatus("❌ Failed to save budget changes.", "error");
        }
    } catch (error) {
        console.error("Save error:", error);
        showStatus("❌ Error saving budget changes.", "error");
    }
}

async function copyJanuaryToWholeYear() {
    if (hasUnsavedBudgetChanges) {
        const saveFirst = await showConfirmDialog("Unsaved Changes", "Save budget changes before copying January values to the whole year?");
        if (!saveFirst) return;
        await saveBudgetChanges(true);
    }
    const confirmed = await showConfirmDialog("Copy Budget", "Copy January budget amounts to all other months?");
    if (!confirmed) return;
    await fetch(`${BASE_URL}?action=copyJanuaryToWholeYear`);
    await loadData();
    await refreshUI();
    showStatus("✅ January copied to all months", "success");
}

async function copyCurrentYearToNextYear() {
    const confirmed = await showConfirmDialog("Create Budget Year", "Generate next year's budget?");
    if (!confirmed) return;
    const selectedYear = getSelectedYear();
    const response = await fetch(`${BASE_URL}?action=copyCurrentYearToNextYear` + `&year=${selectedYear}`);
    const result = await response.json();
    await loadData();
    loadYearDropdown();
    if (result.success) {
        document.getElementById("budgetYear").value = result.nextYear;
        // Keep Add Budget Item in sync
        const addYearInput = document.getElementById("newYear");
        if (addYearInput) {
            addYearInput.value = result.nextYear;
        }
        await changeBudgetYear();
        showStatus(`✅ ${result.nextYear} budget created`, "success");
    } else {
        showStatus(result.message || "❌ Failed to create next year budget", "error");
    }
}

async function changeBudgetYear() {
    if (hasUnsavedBudgetChanges) {
        const proceed = await showConfirmDialog("Unsaved Changes", "You have unsaved budget changes. Continue without saving?");
        if (!proceed) {
            return;
        }
    }
    await Promise.all([
        loadBudgetPlanner(),
        loadSummary(),
        loadFinancialHealth(),
        loadProjection(),
        loadFundingPlan(),
        loadBudgetVsActual()
    ]);
}

async function loadCategoryDropdown() {
    const addSelect = document.getElementById("newCategory");
    const deleteSelect = document.getElementById("deleteCategorySelect");
    if (addSelect) addSelect.innerHTML = "";
    if (deleteSelect) deleteSelect.innerHTML = "";
    appData.categories.forEach(cat => {
        if (addSelect) addSelect.innerHTML += `<option value="${cat.categoryName}">${cat.categoryName}</option>`;
        if (deleteSelect) deleteSelect.innerHTML += `<option value="${cat.categoryId}">${cat.categoryName}</option>`;
    });
}

function loadYearDropdown() {
    const dropdown = document.getElementById("budgetYear");
    if (!dropdown) return;
    const selectedYear = Number(dropdown.value);
    const years = [...new Set(appData.budget.map(item => Number(item.year)))].filter(Boolean).sort((a, b) => a - b);
    dropdown.innerHTML = years.map(year => `<option value="${year}">
                ${year}
            </option>`).join("");
    // Preserve existing user selection
    if (selectedYear && years.includes(selectedYear)) {
        dropdown.value = selectedYear;
        return;
    }
    // Default to current year if available
    const currentYear = new Date().getFullYear();
    if (years.includes(currentYear)) {
        dropdown.value = currentYear;
    } else {
        // Fallback to latest budget year
        dropdown.value = Math.max(...years);
    }
}

let hasUnsavedBudgetChanges = false;
