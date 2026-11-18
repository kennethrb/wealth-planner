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
            (appData.transactions || [])
                .map(tx => {
                    const d =
                        new Date(
                            tx.Date ||
                            tx.date
                        );
    
                    return d.getFullYear();
                })
                .filter(Boolean)
        )]
        .sort();

    if (years.length === 0) {
        years.push(
            new Date().getFullYear()
        );
    }

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


function getCategoryTypeMap() {

    const map = {};

    appData.categories.forEach(cat => {
        map[cat.categoryName] = cat.budgetType;
    });

    return map;
}


let editingRowNumber = null;

const APP_MODE = {
    PERSONAL: "PERSONAL",
    TEST: "TEST"
};

let appMode =
    localStorage.getItem("appMode")
    || APP_MODE.PERSONAL;

let appData = {
    accounts: [],
    categories: [],
    goals: [],
    transactions: [],
    recurringBills: [],
    advisorMemory: []
};

function getSelectedYear() {
    return Number(
        document.getElementById("viewYear")?.value
    ) || new Date().getFullYear();
}

function getSelectedMonth() {
    return getViewMonth();
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
    await fetch(
        `${BASE_URL}?action=addCategory`
        + `&mode=${appMode}`
        + `&categoryName=${encodeURIComponent(categoryName)}`
        + `&budgetType=${encodeURIComponent(budgetType)}`
        + `&group=${encodeURIComponent(group)}`
        + `&preferredFundingSource=${encodeURIComponent(preferredFundingSource)}`
    );
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

    await fetch(
        `${BASE_URL}?action=deleteCategory`
        + `&mode=${appMode}`
        + `&categoryId=${encodeURIComponent(categoryId)}`
    );

    await loadData();
    await refreshUI();
    showStatus(`🗑 Category deleted`, "success");
}

function recalculateAccountBalances() {

    const balances = {};

    appData.accounts.forEach(account => {

        balances[account.accountId] =
            Number(account.openingBalance || 0);

    });

    appData.transactions.forEach(tx => {

        const accountId =
            tx.accountId ||
            tx["Account ID"];

        const transferToId =
            tx.transferToAccountId ||
            tx["Transfer To Account ID"];

        const amount = Number(
            tx.Amount ||
            tx.amount ||
            0
        );

        const budgetType =
            tx.budgetType ||
            tx["Budget Type"] ||
            "";

        if (budgetType === "Transfer") {

            if (accountId && balances[accountId] !== undefined) {
                balances[accountId] -= amount;
            }

            if (transferToId && balances[transferToId] !== undefined) {
                balances[transferToId] += amount;
            }

            return;
        }

        if (budgetType === "Expense")
        {
            if (
                accountId &&
                balances[accountId] !== undefined
            )
            {
                balances[accountId] -= amount;
            }
        
            return;
        }
        
        if (budgetType === "Savings")
        {
            if (
                accountId &&
                balances[accountId] !== undefined
            )
            {
                balances[accountId] -= amount;
            }
        
            if (
                transferToId &&
                balances[transferToId] !== undefined
            )
            {
                balances[transferToId] += amount;
            }
        
            return;
        }
        
        if (budgetType === "Debt")
        {
            if (
                accountId &&
                balances[accountId] !== undefined
            )
            {
                balances[accountId] -= amount;
            }
        
            if (
                transferToId &&
                balances[transferToId] !== undefined
            )
            {
                balances[transferToId] -= amount;
            }
        
            return;
        }

        if (budgetType === "Income") {

            if (accountId && balances[accountId] !== undefined) {
                balances[accountId] += amount;
            }
        }

    });

    appData.accounts.forEach(account => {

        account.currentBalance =
            balances[account.accountId] || 0;

        account.balance =
            account.currentBalance;

    });

}

// Single aggregated API call to prevent fetch bottlenecks
async function loadData() {
    try {

        console.time("loadData");

        const response =
            await fetch(
                `${BASE_URL}?action=getAllData&mode=${appMode}`
            );

        const text =
            await response.text();

        console.log(
            "Payload Size:",
            (text.length / 1024).toFixed(2),
            "KB"
        );

        console.time("jsonParse");

        const result =
            JSON.parse(text);

        console.timeEnd("jsonParse");

        appData.accounts =
            result.accounts || [];

        appData.categories =
            result.categories || [];

        appData.goals =
            result.goals || [];

        appData.transactions =
            result.transactions || [];

        appData.recurringBills =
            result.recurringBills || [];

        appData.advisorMemory =
            result.advisorMemory || [];

        console.time("recalculateAccountBalances");

        recalculateAccountBalances();

        console.timeEnd(
            "recalculateAccountBalances"
        );

        console.timeEnd("loadData");

    } catch (error) {

        console.error(
            "Failed to load application data:",
            error
        );

    }
}


// THIS IS FOR SWITCHING FROM PERSONAL TO TEST DATA //
async function setAppMode(mode) {
    appMode = mode;
    localStorage.setItem("appMode", mode);
    await loadData();
    await refreshUI();
    updateEnvironmentBanner();
}

function updateEnvironmentButton() {
    const btn = document.getElementById("environmentToggle");
    if (!btn) return;
    btn.textContent = appMode === APP_MODE.TEST ? "🧪" : "👤";
}

function updateEnvironmentBanner() {
    const banner = document.getElementById("environmentBanner");
    if (!banner) return;
    if (appMode === APP_MODE.TEST) {
        banner.innerHTML = "🧪 TEST DATA MODE";
        banner.className = "environment-banner test";
    } else {
        banner.innerHTML = "👤 PERSONAL DATA MODE";
        banner.className = "environment-banner personal";
    }
    updateEnvironmentButton();
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

    const bill =
        (appData.recurringBills || [])
            .find(
                b =>
                    b.budgetPosition === category
            );

    return bill
        ? Number(
            bill.defaultAmount || 0
          )
        : 0;
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
    appData.recurringBills.forEach(item => {
        const amount = Number(item.defaultAmount || 0);
        const type = item.budgetType || "";
        if (type === "Income") income += amount;
        if (type === "Expense") expense += amount;
        if (type === "Savings") savings += amount;
        if (type === "Debt") debt += amount;
    });
    const currentSurplus = income - expense - savings - debt;
    let scenarioSurplus = currentSurplus;
    if (budgetType === "Income") scenarioSurplus += difference;
    if (budgetType === "Expense" || budgetType === "Savings" || budgetType === "Debt") scenarioSurplus -= difference;
    const annualDifference = (scenarioSurplus - currentSurplus) * 12;
    const targetContainer = document.getElementById("scenarioResults") || document.getElementById("scenarioResult");
    if (!targetContainer) return;
targetContainer.innerHTML = `
<div class="advisor-action priority">

    <div class="action-title">
        📊 Scenario Result
    </div>

    <div class="metric-row">
        <span>Category</span>
        <strong>${category}</strong>
    </div>

    <div class="metric-row">
        <span>Current Amount</span>
        <strong>${formatCurrency(currentAmount)}</strong>
    </div>

    <div class="metric-row">
        <span>Scenario Amount</span>
        <strong>${formatCurrency(scenarioAmount)}</strong>
    </div>

    <div class="metric-row">
        <span>Difference</span>
        <strong>${formatCurrency(difference)}</strong>
    </div>

    <div class="metric-row">
        <span>Current Monthly Surplus</span>
        <strong>${formatCurrency(currentSurplus)}</strong>
    </div>

    <div class="metric-row">
        <span>Scenario Monthly Surplus</span>
        <strong>${formatCurrency(scenarioSurplus)}</strong>
    </div>

    <div class="metric-row">
        <span>Annual Impact</span>
        <strong>${formatCurrency(annualDifference)}</strong>
    </div>

</div>
`;
}

async function refreshFinancialViews() {
    await Promise.all([
        loadUpcomingBills(),
        loadBufferVsInvest(),
        loadFinancialHealthAdvisor(),       // DI-001
        loadFundingOptimizationAdvisor(),  // DI-002
        loadAssetAllocationAdvisor(),
        loadWealthProjectionAccelerator(), // DI-003
        loadNetWorthVelocity(),            // DI-004
        loadPurchaseEvaluator(),           // DI-006
        loadWealthSweep(),                 // DI-007
        loadCashFlowCommandCenter(), // DI-009 - DI-009 becomes the operational bridge between Wealth Sweep and Action Plan.
        loadGoalFundingOptimizer(),      // DI-010
        loadCapitalAllocationOptimizer(), // DI-011
        loadAdvisorDashboard(),           // DI-015
        loadWealthOpportunityEngine(), // DI-012
        loadMonthlyWealthActionPlan(),    // DI-008
        loadPayCycleCard(),
        loadSafeToSpendCard(),
        loadPaydayPlan(),
        loadScenarioWorkbench(),
        loadBillExecutionQueue()
        
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
        loadFinancialHealthAdvisor(),       // DI-001
        loadFundingOptimizationAdvisor(),  // DI-002
        loadAssetAllocationAdvisor(),
        loadWealthProjectionAccelerator(), // DI-003
        loadNetWorthVelocity(),            // DI-004
        loadPurchaseEvaluator(),           // DI-006
        loadWealthSweep(),                 // DI-007
        loadCashFlowCommandCenter(),       // DI-009
        loadGoalFundingOptimizer(),        // DI-010
        loadCapitalAllocationOptimizer(),  // DI-011
        loadAdvisorDashboard(),            // DI-015
        loadWealthOpportunityEngine(), // DI-012
        loadMonthlyWealthActionPlan(),     // DI-008
        loadPayCycleCard(),
        loadSafeToSpendCard(),
        loadPaydayPlan(),
        loadBufferVsInvest(),
        loadScenarioWorkbench()
    ]);
}

async function refreshUI() {
    loadViewYearDropdown();
    
    loadCategoryDropdown();

    loadFundingSources();
    populateGoalAccounts();

    loadTransferAccounts();
    loadTransactionAccounts();
    loadTransactionPositions();

    loadRecurringBillAccounts();
    loadRecurringBillPositions();

    loadTransactions();
    registerTransactionFilters();
    loadScenarioCategories();

    await Promise.all([
        loadNetWorth(),
        loadCashRequirementPlan(),
        loadFinancialHealthAdvisor(),       // DI-001
        loadFundingOptimizationAdvisor(),  // DI-002
        loadAssetAllocationAdvisor(),
        loadWealthProjectionAccelerator(), // DI-003
        loadNetWorthVelocity(),            // DI-004
        loadPurchaseEvaluator(),           // DI-006
        loadWealthSweep(),                 // DI-007
        loadCashFlowCommandCenter(), // DI-009
        loadGoalFundingOptimizer(), // DI-010
        loadCapitalAllocationOptimizer(), // DI-011
        loadAdvisorDashboard(),
        loadWealthOpportunityEngine(), // DI-012
        loadMonthlyWealthActionPlan(),     // DI-008
        loadMonthlyWealthPlanCard(),
        loadPayCycleCard(),
        loadSafeToSpendCard(),
        loadPaydayPlan(),
        loadScenarioWorkbench(),
        loadBufferVsInvest(),
        loadUpcomingBills(),
        loadRecurringBills(),
        loadGoals(),
        loadAccounts(),
        loadReleasedCapitalCard(),
        loadBillExecutionQueue()
    ]);
}
async function initializeApp() {
    await loadData();
    
    // THIS IS FOR SWITCHING FROM PERSONAL TO TEST DATA //
    
    updateEnvironmentBanner();


    loadViewYearDropdown();
    
  const monthNames = [
     "Jan","Feb","Mar","Apr",
     "May","Jun","Jul","Aug",
     "Sep","Oct","Nov","Dec"
    ];
    
    document
    .getElementById("openTransactionModal")
    ?.addEventListener(
        "click",
        openTransactionModal
    );

    document
    .getElementById("openAccountModal")
    ?.addEventListener(
        "click",
        openAccountModal
    );

    document
    .getElementById("openGoalModal")
    ?.addEventListener(
        "click",
        openGoalModal
    );

    document
    .getElementById("openBillModal")
    ?.addEventListener(
        "click",
        openBillModal
    );

    viewState.month =
    monthNames[new Date().getMonth()];
    
    const viewMonthEl =
    document.getElementById("viewMonth");
    
    if (viewMonthEl) {
        viewMonthEl.value =
        viewState.month;
    }
    
    viewState.year =
    new Date().getFullYear();
    
    const viewYearEl =
    document.getElementById("viewYear");
    
    if (viewYearEl) {
        viewYearEl.value =
        viewState.year;
    }
    
    await refreshUI();
    showIntelTab('advisor');

  
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

const environmentToggle = document.getElementById("environmentToggle");
if (environmentToggle) {
    environmentToggle.addEventListener("click", async () => {
        const nextMode = appMode === APP_MODE.TEST ? APP_MODE.PERSONAL : APP_MODE.TEST;
        await setAppMode(nextMode);
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
        .forEach(panel => panel.classList.remove("active"));

    document
        .querySelectorAll(".intel-tabs button")
        .forEach(btn => btn.classList.remove("active"));

    document
        .getElementById(`tab-${tab}`)
        .classList.add("active");

    document
        .getElementById(`btn-${tab}`)
        .classList.add("active");
}

function loadCategoryDropdown() {
    const deleteSelect = document.getElementById("deleteCategorySelect");
    if (deleteSelect) deleteSelect.innerHTML = "";
    appData.categories.forEach(cat => {
        if (deleteSelect) {
            deleteSelect.innerHTML += `
                <option value="${cat.categoryId}">
                    ${cat.categoryName}
                </option>
            `;
        }
    });
}

function getCashRequirementPlan() {
    const categoryFundingMap = {};
    (appData.categories || []).forEach(cat => {
        categoryFundingMap[cat.categoryName] = {
        source:
        cat.preferredFundingSource || "",
            sourceId: cat.preferredFundingSourceId || ""
        };
    });
    const fundingSources = {};
    let cashRequirement = 0;
    (appData.recurringBills || []).filter(bill => bill.active !== false).forEach(bill => {
        const funding = categoryFundingMap[bill.budgetPosition];
        if (!funding) return;
        const source = funding.source;
        const amount = Number(bill.defaultAmount || 0);
        fundingSources[source] = (fundingSources[source] || 0) + amount;
        if (source && source.toLowerCase().includes("cash")) {
            cashRequirement += amount;
        }
    });
    return {
        cashRequirement,
        fundingSources
    };
}

function loadCashRequirementPlan() {
    const cashRequirement =
        (appData.recurringBills || [])
            .filter(bill => bill.active !== false)
            .filter(bill => {
    
                const account =
                    (appData.accounts || [])
                        .find(a =>
                            a.accountId === bill.accountId
                        );
    
                if (!account) {
                    return false;
                }
    
                const assetClass =
                    String(
                        account.assetClass ||
                        account.type ||
                        ""
                    ).toUpperCase();
    
                return assetClass === "CASH";
    
            })
            .reduce(
                (sum, bill) =>
                    sum +
                    Number(
                        bill.defaultAmount || 0
                    ),
                0
            );
    const fundingSources = {};
    (appData.recurringBills || []).filter(bill => bill.active !== false).forEach(bill => {
        const account = bill.account || "Unknown";
        fundingSources[account] = (fundingSources[account] || 0) + Number(bill.defaultAmount || 0);
    });
    const cashContainer = document.getElementById("cashToWithdraw");
    const fundingContainer = document.getElementById("fundingPlanList");
    if (!cashContainer || !fundingContainer) {
        return;
    }
    cashContainer.textContent = formatCurrency(cashRequirement);
    fundingContainer.innerHTML = Object.entries(fundingSources).sort(
        (a, b) => b[1] - a[1]).map(
        ([source, amount]) => `
                <div class="funding-row">
                    <span class="label">
                        ${source}
                    </span>
                    <span class="amount">
                        ${formatCurrency(amount)}
                    </span>
                </div>
            `).join("");
}

// ====================
// Shared UI Helpers
// ====================

function scrollToCardStart(elementId, offset = 100) {
    const el = document.getElementById(elementId);

    if (!el) return;

    const top =
        el.getBoundingClientRect().top +
        window.pageYOffset -
        offset;

    window.scrollTo({
        top,
        behavior: "smooth"
    });
}
