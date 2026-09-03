const BASE_URL =
"https://script.google.com/macros/s/AKfycbwZGBobKrROvavAglc9QZlBmbSggBudqJBH6dT7LrkPopdZDQVbCZ4FWhE926f1Z_Y-NQ/exec";

let viewState = {
    year: null,
    month: null
};

function getViewYear() {
    return viewState.year || getSelectedYear();
}

function getViewMonth() {
    return viewState.month || "Jan";
}

function loadViewYearDropdown() {

    const dropdown =
        document.getElementById("viewYear");

    if (!dropdown) return;

    const years =
        [...new Set(
            appData.budget.map(
                item => Number(item.year)
            )
        )]
        .filter(Boolean)
        .sort();

    dropdown.innerHTML =
        years.map(year =>
            `<option value="${year}">
                ${year}
            </option>`
        ).join("");

    if (!viewState.year) {

        viewState.year =
            Math.max(...years);

    }

    dropdown.value =
        viewState.year;
}

function getBudgetDataForPeriod() {

    const year = getViewYear();
    const month = getViewMonth();

    return appData.budget.filter(item =>
        Number(item.year) === Number(year) &&
        item.month === month
    );
}

function getCategoryTypeMap() {

    const map = {};

    appData.categories.forEach(cat => {
        map[cat.categoryName] = cat.budgetType;
    });

    return map;
}


let editingRowNumber = null;

let appData = {
    accounts: [],
    budget: [],
    categories: [],
    goals: [],
    transactions: [],
    recurringBills: []
};

function getSelectedYear() {
    return Number(document.getElementById("budgetYear")?.value) || new Date().getFullYear();
}

function getSelectedMonth() {
    return document.getElementById("actualMonth")?.value || "Jan";
}

async function addCategory() {
    const categoryName = document.getElementById("categoryName")?.value;
    const budgetType = document.getElementById("budgetType")?.value;
    const group = document.getElementById("categoryGroup")?.value;
    const preferredFundingSource =
        document.getElementById(
            "preferredFundingSource"
        )?.value;
    
    if (
        !categoryName ||
        !group ||
        !preferredFundingSource
    ) {
    
        showStatus(
            "⚠ Please complete all fields.",
            "warning"
        );
    
        return;
    }
    const confirmed = await showConfirmDialog("Add Category", `Add category "${categoryName}"?`);
    if (!confirmed) return;
    await fetch(`${BASE_URL}?action=addCategory` + `&categoryName=${encodeURIComponent(categoryName)}` + `&budgetType=${encodeURIComponent(budgetType)}` + `&group=${encodeURIComponent(group)}` + `&preferredFundingSource=${encodeURIComponent(preferredFundingSource)}`);
    await loadData();
    await loadCategoryDropdown();
    await loadScenarioCategories();
    showStatus(`✅ Category ${categoryName} added successfully`, "success");
    document.getElementById("categoryName").value = "";
    document.getElementById("categoryGroup").value = "";
    document.getElementById("budgetType").selectedIndex = 0;
    document.getElementById("preferredFundingSource").selectedIndex = 0;
}

function loadFundingSources() {
    const dropdown =
        document.getElementById(
            "preferredFundingSource"
        );

    if (!dropdown) return;

    dropdown.innerHTML = "";

    appData.accounts.forEach(account => {

        const accountId =
            account.accountId;

        const name =
            account.accountName;

        dropdown.innerHTML += `
            <option value="${accountId}">
                ${name}
            </option>
        `;
    });
}

// AFTER (ID-based)
async function deleteCategory() {
    const categoryId = document.getElementById("deleteCategorySelect")?.value;
    if (!categoryId) return;

    const confirmDelete = await showConfirmDialog("Delete Category", `Delete this category?`);
    if (!confirmDelete) return;

    await fetch(`${BASE_URL}?action=deleteCategory&categoryId=${encodeURIComponent(categoryId)}`);

    await loadData();
    await refreshUI();
    showStatus(`🗑 Category deleted`, "success");
}

// Single aggregated API call to prevent fetch bottlenecks
async function loadData() {
    try {
        const response = await fetch(`${BASE_URL}?action=getAllData`);
        const result = await response.json();
        appData.accounts = result.accounts || [];
        appData.budget = result.budget || [];
        appData.categories = result.categories || [];
        appData.goals = result.goals || [];
        appData.transactions = result.transactions || [];
        appData.recurringBills = result.recurringBills || [];
    } catch (error) {
        console.error("Failed to load application data:", error);
    }
}
async function loadScenarioCategories() {
    const dropdown = document.getElementById("scenarioCategory");
    if (!dropdown) return;
    dropdown.innerHTML = "";
    appData.categories.forEach(cat => {
        dropdown.innerHTML += `<option value="${cat.categoryName}">${cat.categoryName}</option>`;
    });
}

function getCurrentAmount(category) {
    const selectedYear = getViewYear();
    const selectedMonth = getViewMonth();
    const item = appData.budget.find(row => Number(row.year) === selectedYear && row.category === category && row.month === selectedMonth);
    return item ? Number(item.plannedAmount) : 0;
}

function runScenario() {
    const category = document.getElementById("scenarioCategory")?.value;
    const scenarioAmount = Number(document.getElementById("scenarioAmount")?.value || 0);
    const currentAmount = getCurrentAmount(category);
    const difference = scenarioAmount - currentAmount;
    const categoryInfo = appData.categories.find(c => c.categoryName === category);
    const budgetType = categoryInfo ? categoryInfo.budgetType : "";
    let income = 0,
        expense = 0,
        savings = 0,
        debt = 0;
    const selectedYear = getViewYear();
    const selectedMonth = getViewMonth();
    appData.budget.filter(item => Number(item.year) === selectedYear && item.month === selectedMonth).forEach(item => {
        const cat = appData.categories.find(c => c.categoryName === item.category);
        if (!cat) return;
        const amount = Number(item.plannedAmount);
        if (cat.budgetType === "Income") income += amount;
        if (cat.budgetType === "Expense") expense += amount;
        if (cat.budgetType === "Savings") savings += amount;
        if (cat.budgetType === "Debt") debt += amount;
    });
    const currentSurplus = income - expense - savings - debt;
    let scenarioSurplus = currentSurplus;
    if (budgetType === "Income") scenarioSurplus += difference;
    if (budgetType === "Expense" || budgetType === "Savings" || budgetType === "Debt") scenarioSurplus -= difference;
    const annualDifference = (scenarioSurplus - currentSurplus) * 12;
    const targetContainer = document.getElementById("scenarioResults") || document.getElementById("scenarioResult");
    if (!targetContainer) return;
    targetContainer.innerHTML = `
    <div class="card">
      <h3>Scenario Result</h3>
      <p>Category: <strong>${category}</strong></p>
      <p>Current Amount: <strong>${formatCurrency(currentAmount)}</strong></p>
      <p>Scenario Amount: <strong>${formatCurrency(scenarioAmount)}</strong></p>
      <p>Difference: <strong>${formatCurrency(difference)}</strong></p>
      <hr>
      <p>Current Monthly Surplus: <strong>${formatCurrency(currentSurplus)}</strong></p>
      <p>Scenario Monthly Surplus: <strong>${formatCurrency(scenarioSurplus)}</strong></p>
      <p>Annual Impact: <strong>${formatCurrency(annualDifference)}</strong></p>
    </div>
  `;
}

function loadBudgetVsActual() {
    const container = document.getElementById("budgetVsActual");
    if (!container) return;
    const selectedYear = getViewYear();
    const selectedMonth = getViewMonth();
    const monthMap = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
    const targetMonthIndex = monthMap[selectedMonth] ?? 0;

    const budgetMap = {};
    (appData.budget || []).filter(row => Number(row.year) === selectedYear && row.month === selectedMonth).forEach(row => {
        const cat = (row.category || "").trim();
        if (cat) budgetMap[cat] = Number(row.plannedAmount) || 0;
    });

    const actualMap = {};
    (appData.transactions || []).forEach(tx => {
        const rawDate = tx.Date || tx.date || tx.DATE;
        if (!rawDate) return;
        let txYear, txMonthIndex;
        if (typeof rawDate === "string" && rawDate.includes("-")) {
            const parts = rawDate.split("T")[0].split("-");
            txYear = Number(parts[0]);
            txMonthIndex = Number(parts[1]) - 1;
        } else {
            const txDate = new Date(rawDate);
            if (isNaN(txDate.getTime())) return;
            txYear = txDate.getFullYear();
            txMonthIndex = txDate.getMonth();
        }
        if (txYear !== selectedYear || txMonthIndex !== targetMonthIndex) return;
        const category = tx["Budget Position"] || tx["budgetPosition"] || tx["Category"] || tx["category"];
        if (!category) return;
        const rawAmount = tx.Amount || tx.amount || tx.AMOUNT || 0;
        actualMap[category] = (actualMap[category] || 0) + Math.abs(Number(rawAmount) || 0);
    });

    const categories = [...new Set([...Object.keys(budgetMap), ...Object.keys(actualMap)])];
    const categoryTypes = {};
    (appData.categories || []).forEach(cat => {
        const catName = (cat.categoryName || cat.category || cat.name || "").trim();
        const bType = (cat.budgetType || cat.type || "").trim();
        if (catName) {
            categoryTypes[catName] = bType.charAt(0).toUpperCase() + bType.slice(1).toLowerCase();
        }
    });

    const sections = ["Income", "Expense", "Savings", "Debt", "Other"];
    let rows = "";

    // Track totals per financial category
    const sectionTotals = { Income: { b: 0, a: 0 }, Expense: { b: 0, a: 0 }, Savings: { b: 0, a: 0 }, Debt: { b: 0, a: 0 }, Other: { b: 0, a: 0 } };

    sections.forEach(section => {
        const sectionCategories = categories.filter(cat => (categoryTypes[cat] || "Other") === section);
        if (sectionCategories.length === 0) return;

        rows += `<tr class="table-secondary section-${section.toLowerCase()}"><td colspan="4"><strong>${section.toUpperCase()}</strong></td></tr>`;
        
        let sBudget = 0;
        let sActual = 0;

        sectionCategories.forEach(cat => {
            const budget = budgetMap[cat] || 0;
            const actual = actualMap[cat] || 0;
            sBudget += budget;
            sActual += actual;
            const variance = section === "Income" ? actual - budget : budget - actual;

            rows += `
                <tr>
                    <td>${cat}</td>
                    <td>${formatCurrency(budget)}</td>
                    <td>${formatCurrency(actual)}</td>
                    <td class="${variance >= 0 ? "text-success" : "text-danger"}">
                        ${variance >= 0 ? "+" : ""}${formatCurrency(variance)}
                    </td>
                </tr>`;
        });

        sectionTotals[section].b = sBudget;
        sectionTotals[section].a = sActual;

        const sVariance = section === "Income" ? sActual - sBudget : sBudget - sActual;
        rows += `
            <tr class="section-total total-${section.toLowerCase()}">
                <td><strong>TOTAL ${section.toUpperCase()}</strong></td>
                <td><strong>${formatCurrency(sBudget)}</strong></td>
                <td><strong>${formatCurrency(sActual)}</strong></td>
                <td class="${sVariance >= 0 ? "text-success" : "text-danger"}">
                    <strong>${sVariance >= 0 ? "+" : ""}${formatCurrency(sVariance)}</strong>
                </td>
            </tr>`;
    });

    // Compute Net Grand Total (Net Surplus = Income - Outflows)
    const netBudget = sectionTotals.Income.b - (sectionTotals.Expense.b + sectionTotals.Savings.b + sectionTotals.Debt.b + sectionTotals.Other.b);
    const netActual = sectionTotals.Income.a - (sectionTotals.Expense.a + sectionTotals.Savings.a + sectionTotals.Debt.a + sectionTotals.Other.a);
    const netVariance = netActual - netBudget;

    rows += `
        <tr class="grand-total">
            <td><strong>NET SURPLUS / DEFICIT</strong></td>
            <td><strong>${formatCurrency(netBudget)}</strong></td>
            <td><strong>${formatCurrency(netActual)}</strong></td>
            <td class="${netVariance >= 0 ? "text-success" : "text-danger"}">
                <strong>${netVariance >= 0 ? "+" : ""}${formatCurrency(netVariance)}</strong>
            </td>
        </tr>`;

    container.innerHTML = `
        <div class="table-responsive">
            <table class="table table-hover align-middle">
                <thead>
                    <tr><th>Category</th><th>Budget</th><th>Actual</th><th>Variance</th></tr>
                </thead>
                <tbody>${rows || '<tr><td colspan="4" class="text-center text-muted">No data available for this period.</td></tr>'}</tbody>
            </table>
        </div>`;
}

async function refreshFinancialViews() {
    await Promise.all([
        loadUpcomingBills(),
        loadFinancialHealth(),
        loadProjection(),
        loadSummary(),
        loadFundingPlan(),
        loadBudgetVsActual(),
        loadBufferVsInvest(),
        loadFinancialHealthAdvisor(),       // DI-001
        loadFundingOptimizationAdvisor(),  // DI-002
        loadWealthProjectionAccelerator(), // DI-003
        loadNetWorthVelocity(),            // DI-004
        loadPersonalInflation(),           // DI-005
        loadPurchaseEvaluator(),           // DI-006
        loadWealthSweep(),                 // DI-007
        loadMonthlyWealthActionPlan()      // DI-008
        
    ]);
}

async function changeViewPeriod() {

    viewState.year =
        Number(
            document.getElementById("viewYear").value
        );

    viewState.month =
        document.getElementById("viewMonth").value;

    await Promise.all([
        loadFinancialHealth(),
        loadProjection(),
        loadFundingPlan(),
        loadBudgetVsActual(),
        loadFinancialHealthAdvisor(),       // DI-001
        loadFundingOptimizationAdvisor(),  // DI-002
        loadWealthProjectionAccelerator(), // DI-003
        loadNetWorthVelocity(),            // DI-004
        loadPersonalInflation(),           // DI-005
        loadPurchaseEvaluator(),           // DI-006
        loadWealthSweep(),                 // DI-007
        loadMonthlyWealthActionPlan(),     // DI-008
        loadBufferVsInvest(),
        loadSummary()
    ]);
}

async function refreshUI() {
    loadYearDropdown();
    loadViewYearDropdown();
    
    loadCategoryDropdown();

    loadFundingSources();

    loadTransferAccounts();
    loadTransactionAccounts();
    loadTransactionPositions();

    loadRecurringBillAccounts();
    loadRecurringBillPositions();

    loadTransactions();
    loadBudgetVsActual();
    loadScenarioCategories();

    await Promise.all([
        loadNetWorth(),
        loadProjection(),
        loadFinancialHealth(),
        loadFinancialHealthAdvisor(),       // DI-001
        loadFundingOptimizationAdvisor(),  // DI-002
        loadWealthProjectionAccelerator(), // DI-003
        loadNetWorthVelocity(),            // DI-004
        loadPersonalInflation(),           // DI-005
        loadPurchaseEvaluator(),           // DI-006
        loadWealthSweep(),                 // DI-007
        loadMonthlyWealthActionPlan(),     // DI-008
        loadBufferVsInvest(),
        loadReconciliation(),
        loadUpcomingBills(),
        loadRecurringBills(),
        loadGoals(),
        loadAccounts(),
        loadBudgetPlanner(),
        loadSummary(),
        loadFundingPlan()
    ]);
}
async function initializeApp() {
    await loadData();
    loadViewYearDropdown();
    await refreshUI();
    // Default Add Budget Item year to latest budget year
    const years = [...new Set(appData.budget.map(item => Number(item.year)))].filter(Boolean);
    const latestYear = years.length > 0 ? Math.max(...years) : new Date().getFullYear();
    const newYearInput = document.getElementById("newYear");
    if (newYearInput) {
        newYearInput.value = latestYear;
    }
  const monthNames = [
 "Jan","Feb","Mar","Apr",
 "May","Jun","Jul","Aug",
 "Sep","Oct","Nov","Dec"
];

    viewState.month =
    monthNames[new Date().getMonth()];
    document.getElementById("viewMonth").value =
    viewState.month;
  
    setupScrollSpy();
    toggleTransactionFields();
}
initializeApp();
// Back to Top Button Listener
const backToTop = document.getElementById("backToTop");
if (backToTop) {
    window.addEventListener("scroll", () => {
        if (window.scrollY > 500) {
            backToTop.classList.add("show");
        } else {
            backToTop.classList.remove("show");
        }
    });
    backToTop.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
}
// ScrollSpy Navigation
function setupScrollSpy() {
    const sections = document.querySelectorAll("section[id], div[id]");
    const navLinks = document.querySelectorAll(".section-nav a");
    if (!sections.length || !navLinks.length) return;
    let isClicking = false;
    let clickTimeout = null;
    const setActiveLink = (id) => {
        navLinks.forEach((link) => {
            if (link.getAttribute("href") === `#${id}`) {
                link.classList.add("active");
            } else {
                link.classList.remove("active");
            }
        });
    };
    navLinks.forEach((link) => {
        link.addEventListener("click", () => {
            const targetId = link.getAttribute("href").replace("#", "");
            isClicking = true;
            setActiveLink(targetId);
            clearTimeout(clickTimeout);
            clickTimeout = setTimeout(() => {
                isClicking = false;
            }, 800);
        });
    });
    const observerOptions = {
        root: null,
        rootMargin: "-20% 0px -60% 0px",
        threshold: 0.1
    };
    const observer = new IntersectionObserver((entries) => {
        if (isClicking) return;
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                setActiveLink(entry.target.getAttribute("id"));
            }
        });
    }, observerOptions);
    sections.forEach((section) => observer.observe(section));
}

function showIntelTab(tab) {

    document
        .querySelectorAll(".intel-panel")
        .forEach(panel => {
            panel.classList.remove("active");
        });

    document
        .getElementById(`tab-${tab}`)
        .classList.add("active");
}
