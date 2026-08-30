// Universal Philippine Peso Currency Formatter
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
};

const BASE_URL =
"https://script.google.com/macros/s/AKfycbwZGBobKrROvavAglc9QZlBmbSggBudqJBH6dT7LrkPopdZDQVbCZ4FWhE926f1Z_Y-NQ/exec";

let hasUnsavedBudgetChanges = false;
let editingRowNumber = null;

let appData = {
    accounts: [],
    budget: [],
    categories: [],
    goals: [],
    transactions: [],
    recurringBills: []
};

function showStatus(message, type = "success") {
    const status = document.getElementById("globalStatus");
    if (!status) return;
    status.className = `status-banner ${type}`;
    status.innerHTML = message;
    status.style.display = "block";
    clearTimeout(status.timeoutId);
    status.timeoutId = setTimeout(() => {
        status.classList.add("hide");
        setTimeout(() => {
            status.style.display = "none";
            status.classList.remove("hide");
        }, 300);
    }, 4000);
}

function showConfirmDialog(title, message) {
    return new Promise(resolve => {
        const modal = document.getElementById("confirmModal");
        const titleElement = document.getElementById("confirmTitle");
        const messageElement = document.getElementById("confirmMessage");
        const okButton = document.getElementById("confirmOk");
        const cancelButton = document.getElementById("confirmCancel");
        if (!modal) {
            resolve(confirm(`${title}\n\n${message}`));
            return;
        }
        titleElement.textContent = title;
        messageElement.textContent = message;
        modal.classList.add("show");
        okButton.onclick = () => {
            modal.classList.remove("show");
            resolve(true);
        };
        cancelButton.onclick = () => {
            modal.classList.remove("show");
            resolve(false);
        };
    });
}

// Show reusable input dialog
function showInputDialog(title, message, value = "") {
  return new Promise(resolve => {
    const modal = document.getElementById("inputModal");
    const titleEl = document.getElementById("inputTitle");
    const messageEl = document.getElementById("inputMessage");
    const inputEl = document.getElementById("inputValue");
    const saveBtn = document.getElementById("inputSave");
    const cancelBtn = document.getElementById("inputCancel");

    titleEl.textContent = title;
    messageEl.textContent = message;
    inputEl.value = value;

    modal.classList.add("show");

    saveBtn.onclick = () => {
      modal.classList.remove("show");
      resolve(inputEl.value);
    };

    cancelBtn.onclick = () => {
      modal.classList.remove("show");
      resolve(null);
    };

    inputEl.focus();
    inputEl.select();
  });
}

function getSelectedYear() {
    const yearSelect = document.getElementById("yearSelect"); // Ensure this matches your HTML ID
    return yearSelect ? Number(yearSelect.value) : new Date().getFullYear();
}

// Ensure this runs when your page initializes or populates dropdowns
document.getElementById("yearSelect")?.addEventListener("change", () => {
    loadBudgetPlanner();
});

function getSelectedMonth() {
    const val = document.getElementById("actualMonth")?.value;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    if (!val || val === "CURRENT") {
        return months[new Date().getMonth()];
    }
    return val;
}

function loadTransactionAccounts() {
    const dropdown = document.getElementById("txAccount");
    if (!dropdown) return;
    dropdown.innerHTML = "";
    appData.accounts.forEach(account => {
        const name = account.accountName || account.name;
        dropdown.innerHTML += `<option value="${name}">${name}</option>`;
    });
}

function loadTransactionPositions() {
    const type = document.getElementById("txBudgetType")?.value;
    const dropdown = document.getElementById("txBudgetPosition");
    if (!dropdown) return;
    dropdown.innerHTML = "";
    appData.categories.filter(c => c.budgetType === type).forEach(cat => {
        dropdown.innerHTML += `<option value="${cat.categoryName}">${cat.categoryName}</option>`;
    });
}

function toggleTransactionFields() {
    const type = document.getElementById("txBudgetType")?.value;
    const positionContainer = document.getElementById("txBudgetPosition")?.closest(".form-group");
    const transferContainer = document.getElementById("txTransferContainer");
    if (type === "Transfer") {
        if (positionContainer) {
            positionContainer.style.display = "none";
        }
        if (transferContainer) {
            transferContainer.style.display = "flex";
        }
    } else {
        if (positionContainer) {
            positionContainer.style.display = "flex";
        }
        if (transferContainer) {
            transferContainer.style.display = "none";
        }
        loadTransactionPositions();
    }
}

async function addTransaction() {
    const date = document.getElementById("txDate")?.value;
    const amount = document.getElementById("txAmount")?.value;
    const details = document.getElementById("txDetails")?.value;
    const account = document.getElementById("txAccount")?.value;
    const budgetType = document.getElementById("txBudgetType")?.value;
    let budgetPosition = document.getElementById("txBudgetPosition")?.value || "";
    const transferToAccount = document.getElementById("txToAccount")?.value || "";
    if (budgetType === "Transfer") {
        budgetPosition = "";
    }
    if (!date || !amount || !account) {
        showStatus("⚠ Please complete all required fields.", "warning");
        return;
    }
    const confirmed = await showConfirmDialog("Add Transaction", "Do you want to add this transaction?");
    if (!confirmed) return;
    const action =
        editingRowNumber
            ? "updateTransaction"
            : "addTransaction";
    
    let url =
        `${BASE_URL}?action=${action}`
        + `&date=${encodeURIComponent(date)}`
        + `&amount=${amount}`
        + `&details=${encodeURIComponent(details)}`
        + `&account=${encodeURIComponent(account)}`
        + `&budgetType=${encodeURIComponent(budgetType)}`
        + `&budgetPosition=${encodeURIComponent(budgetPosition)}`
        + `&transferToAccount=${encodeURIComponent(transferToAccount)}`;
    
    if (editingRowNumber) {
    
        url +=
            `&rowNumber=${editingRowNumber}`;
    }
    
    await fetch(url);
    await loadData();
    editingRowNumber = null;
    
    document.getElementById(
        "txDate"
    ).value = "";
    
    document.getElementById(
        "txAmount"
    ).value = "";
    
    document.getElementById(
        "txDetails"
    ).value = "";
    
    const button =
        document.querySelector(
            'button[onclick="addTransaction()"]'
        );
    
    if (button) {
        button.innerHTML =
            "➕ Add Transaction";
    }
    loadTransactions();
    await refreshFinancialViews();
    showStatus("✅ Transaction recorded", "success");
}

function loadTransactions() {

    const container =
        document.getElementById(
            "transactionsList"
        );

    if (!container) return;

    const recent =
        [...appData.transactions]
            .reverse()
            .slice(0, 20);

    container.innerHTML = `
    <div class="table-responsive">
      <table>
        <tr>
          <th>Date</th>
          <th>Amount</th>
          <th>Account</th>
          <th>Flow / Category</th>
          <th>Details</th>
          <th></th>
        </tr>

        ${recent.map(tx => {

            const budgetType =
                tx["Budget Type"] ||
                tx.budgetType ||
                "";

            const account =
                tx.Account ||
                tx.account ||
                "";

            const transferTo =
                tx["Transfer To Account"] ||
                tx.transferToAccount ||
                "";

            let flowDisplay =
                tx["Budget Position"] ||
                tx.budgetPosition ||
                tx.category ||
                "";

            if (
                budgetType === "Transfer"
            ) {

                flowDisplay = `
                    <strong>${account}</strong>
                    <br>
                    → ${transferTo}
                `;
            }

            return `
            <tr>
                <td>${new Date(tx.Date || tx.date).toLocaleDateString()}</td>
            
                <td>${formatCurrency(tx.Amount || tx.amount)}</td>
            
                <td>${account}</td>
            
                <td>${flowDisplay}</td>
            
                <td>${tx.Details || tx.details || ""}</td>
            
                <td class="action-cell">
                  <button
                      class="btn-delete-row"
                      onclick="editTransaction(${tx.rowNumber})">
                      ✏️
                  </button>
              
                  <button
                      class="btn-delete-row"
                      onclick="deleteTransactionRecord(${tx.rowNumber})">
                      🗑
                  </button>
              </td>
            </tr>
            `;

        }).join("")}

      </table>
    </div>
  `;
}

function editTransaction(rowNumber) {
    const tx = appData.transactions.find(t => t.rowNumber === rowNumber);
    if (!tx) return;
    editingRowNumber = rowNumber;
    const rawDate =
        tx.Date || tx.date || "";
    let formattedDate = "";
    if (rawDate) {
        const date = new Date(rawDate);
        formattedDate =
            date.toISOString().split("T")[0];
    }
    document.getElementById("txDate").value =
        formattedDate;
    document.getElementById("txAmount").value = tx.Amount || 0;
    document.getElementById("txDetails").value = tx.Details || "";
    document.getElementById("txAccount").value = tx.Account || "";
    document.getElementById("txBudgetType").value = tx["Budget Type"] || tx.budgetType || "";
    toggleTransactionFields();
    document.getElementById("txBudgetPosition").value = tx["Budget Position"] || tx.budgetPosition || "";
    const transferTo = tx["Transfer To Account"] || tx.transferToAccount || "";
    if (document.getElementById("txToAccount")) {
        document.getElementById("txToAccount").value = transferTo;
    }
    const button = document.querySelector('button[onclick="addTransaction()"]');
    if (button) {
        button.innerHTML = "💾 Save Changes";
    }
}

async function deleteTransactionRecord(rowNumber) {
    const confirmed = await showConfirmDialog("Delete Transaction", "Delete this transaction?");
    if (!confirmed) return;
    await fetch(`${BASE_URL}?action=deleteTransaction&rowNumber=${rowNumber}`);
    await loadData();
    loadTransactions();
    await refreshFinancialViews();
    showStatus("🗑 Transaction deleted", "success");
}

function loadTransferAccounts() {
    const dropdown = document.getElementById("txToAccount");
    if (!dropdown) return;
    dropdown.innerHTML = "";
    appData.accounts.forEach(account => {
        const name = account.accountName || account.name;
        dropdown.innerHTML += `
            <option value="${name}">
                ${name}
            </option>
        `;
    });
}

async function addRecurringBill() {
    const billNameInput = document.getElementById("billName");
    const budgetTypeInput = document.getElementById("billBudgetType");
    const budgetPositionInput = document.getElementById("billBudgetPosition");
    const amountTypeInput = document.getElementById("billAmountType");
    const amountInput = document.getElementById("billAmount");
    const dueDayInput = document.getElementById("billDueDay");
    const accountInput = document.getElementById("billAccount");

    const billName = billNameInput?.value;
    const budgetType = budgetTypeInput?.value;
    const budgetPosition = budgetPositionInput?.value;
    const amountType = amountTypeInput?.value;
    const amount = amountInput?.value;
    const dueDay = dueDayInput?.value;
    const account = accountInput?.value;

    if (!billName || !amount || !dueDay) {
        showStatus("⚠ Please complete all required fields.", "warning");
        return;
    }

    await fetch(`${BASE_URL}?action=addRecurringBill` + 
        `&billName=${encodeURIComponent(billName)}` + 
        `&budgetType=${encodeURIComponent(budgetType)}` + 
        `&budgetPosition=${encodeURIComponent(budgetPosition)}` + 
        `&amountType=${encodeURIComponent(amountType)}` + 
        `&amount=${amount}` + 
        `&dueDay=${dueDay}` + 
        `&account=${encodeURIComponent(account)}`
    );

    await loadData();
    loadRecurringBills();
    await refreshFinancialViews();

    // Reset Form Input Fields
    if (billNameInput) billNameInput.value = "";
    if (amountInput) amountInput.value = "";
    if (dueDayInput) dueDayInput.value = "";

    showStatus("✅ Recurring bill created", "success");
}

async function deleteRecurringBill(billId) {
    const confirmed = await showConfirmDialog("Delete Recurring Bill", "Delete this recurring bill?");
    if (!confirmed) return;
    await fetch(`${BASE_URL}?action=deleteRecurringBill` + `&billId=${billId}`);
    await loadData();
    loadRecurringBills();
    await refreshFinancialViews();
    showStatus("🗑 Recurring Bill Deleted", "success");
}

// Edit recurring bill amount
async function editRecurringBill(billId) {
    const bill = appData.recurringBills.find(b => b.billId === billId);
    if (!bill) return;
  
    const newAmount = await showInputDialog(
      "Edit Recurring Bill",
      bill.billName,
      bill.defaultAmount
    );
  
    if (newAmount === null) return;
    if (isNaN(newAmount) || Number(newAmount) < 0) {
      showStatus("⚠ Invalid amount","warning");
      return;
    }
  
    await fetch(
      `${BASE_URL}?action=updateRecurringBill` +
      `&billId=${billId}` +
      `&amount=${newAmount}`
    );
  
    await loadData();
  
    loadRecurringBills();
    await refreshFinancialViews();
  
    showStatus("✅ Recurring Bill Updated","success");
  }

// Generate transactions from recurring bills
async function generateBills() {
  const confirmed = await showConfirmDialog("Generate Bills","Generate transactions from all active recurring bills?");
  if (!confirmed) return;

  const response = await fetch(`${BASE_URL}?action=generateBills`);
  const result = await response.json();

  await loadData();

  loadTransactions();
  await refreshFinancialViews();

  showStatus(`✅ ${result.count} bills generated`,"success");
}

function loadAccounts() {
    const container = document.getElementById("accounts");
    if (!container) return;
    if (!appData.accounts || appData.accounts.length === 0) {
        container.innerHTML = `<div class="goal-item"><span class="label">No accounts found</span></div>`;
        return;
    }
    container.innerHTML = `
    <div class="goals-container">
      ${appData.accounts.map(account => {
        const name = account.name || account.accountName || 'Unnamed Account';
        const balance = Number(account.currentBalance || account.balance || 0);
        const type = account.netWorthType || 'Asset';

        return `
          <div class="goal-item">
            <div class="item-header">
              <span class="item-title">💳 ${name}</span>
              <span class="item-value">${formatCurrency(balance)}</span>
            </div>
            <div class="goal-details">
              <span>Type: <strong>${type}</strong></span>
              <span>Status: <strong class="${type === 'Asset' ? 'text-success' : 'text-danger'}">Active</strong></span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function loadUpcomingBills() {
  const container = document.getElementById("upcomingBills");
  if (!container) return;

  const activeBills = (appData.recurringBills || []).filter(bill => bill.active);

  if (!activeBills.length) {
    container.innerHTML = `
      <div class="card">
        <h2>📅 Upcoming Bills</h2>
        <p>No recurring bills found.</p>
      </div>
    `;
    return;
  }

  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Helper: check if paid this month
  const checkIsPaid = (billName) => {
    return (appData.transactions || []).some(tx => {
      const txDate = new Date(tx.Date || tx.date);
      const details = tx.Details || tx.details || "";
      return details === billName &&
        txDate.getMonth() === currentMonth &&
        txDate.getFullYear() === currentYear;
    });
  };

  // Helper: calculate raw remaining days for sorting
  const getDaysRemaining = (bill) => {
    if (checkIsPaid(bill.billName)) return 999;
    const diff = bill.dueDay - currentDay;
    return diff < 0 ? -100 + diff : diff;
  };

  // Sort by urgency: Overdue -> Due Soon -> Future -> Paid
  activeBills.sort((a, b) => getDaysRemaining(a) - getDaysRemaining(b));

  // Calculate totals BEFORE rendering HTML
  let paidCount = 0;
  let dueCount = 0;
  let overdueCount = 0;
  let totalBillsAmount = 0;
  let paidAmount = 0;

  activeBills.forEach(bill => {
    const isPaid = checkIsPaid(bill.billName);
    const amount = Number(bill.defaultAmount || 0);

    totalBillsAmount += amount;

    if (isPaid) {
      paidCount++;
      paidAmount += amount;
    } else if (bill.dueDay < currentDay) {
      overdueCount++;
    } else {
      dueCount++;
    }
  });

  const remainingAmount = totalBillsAmount - paidAmount;
  // Find next unpaid bill due
  const nextBill = activeBills
    .filter(bill => !(appData.transactions || []).some(tx => {
      const txDate = new Date(tx.Date || tx.date);
      const details = tx.Details || tx.details || "";
      return details === bill.billName &&
        txDate.getMonth() === currentMonth &&
        txDate.getFullYear() === currentYear;
    }))
    .sort((a,b) => a.dueDay - b.dueDay)[0];
  // Calculate bill completion percentage
  const totalBills = activeBills.length;
  const completionPercent = totalBills > 0 ? Math.round((paidCount / totalBills) * 100) : 0;

  container.innerHTML = `
    <div class="card">
      <h2>🔔 Upcoming Bills</h2>
      <div class="funding-row">
      <span>Bill Completion</span>
      <span>${paidCount}/${totalBills} (${completionPercent}%)</span>
    </div>
    
    <div class="progress-mini">
      <div class="progress-mini-fill" style="width:${completionPercent}%"></div>
    </div>


      <div class="funding-row">
        <span>✅ Paid Bills</span>
        <span>${paidCount}</span>
      </div>
      <div class="funding-row">
        <span>🟡 Remaining Bills</span>
        <span>${dueCount}</span>
      </div>
      <div class="funding-row">
        <span>🔴 Overdue Bills</span>
        <span>${overdueCount}</span>
      </div>
      <div class="funding-row">
        <span>Total Bills</span>
        <span>${formatCurrency(totalBillsAmount)}</span>
      </div>
      <div class="funding-row">
        <span>Paid Amount</span>
        <span>${formatCurrency(paidAmount)}</span>
      </div>
      <div class="funding-row">
        <span>Remaining Amount</span>
        <span>${formatCurrency(remainingAmount)}</span>
      </div>
      ${nextBill ? `
      <div class="funding-row">
        <span>📅 Next Bill Due</span>
        <span></span>
      </div>
      
      <div class="funding-row">
        <div>
          <div>${nextBill.billName}</div>
          <small>Due Day ${nextBill.dueDay}</small>
        </div>
        <span>${formatCurrency(nextBill.defaultAmount)}</span>
      </div>
      ` : `
      <div class="funding-row">
        <span>🎉 All Bills Paid</span>
        <span>✅</span>
      </div>
      `}

      <hr>

      ${activeBills.map(bill => {
        const isPaid = checkIsPaid(bill.billName);
        const daysRemaining = bill.dueDay - currentDay;
        let status = "";
        let statusClass = "";

        if (isPaid) {
          status = "✅ Paid";
          statusClass = "text-success";
        } else if (daysRemaining < 0) {
          status = `🔴 Overdue by ${Math.abs(daysRemaining)} day(s)`;
          statusClass = "bill-overdue";
        } else if (daysRemaining <= 7) {
          status = `🟡 Due in ${daysRemaining} day(s)`;
          statusClass = "bill-due-soon";
        } else {
          status = `🟢 Due in ${daysRemaining} day(s)`;
          statusClass = "bill-upcoming";
        }

        return `
          <div class="funding-row">
            <div>
              <div>${bill.billName}</div>
              <small class="${statusClass}">${status}</small>
            </div>
            <span class="amount">${formatCurrency(bill.defaultAmount)}</span>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function loadRecurringBills() {
  const container = document.getElementById("recurringBillsList");
  if (!container) return;

  const bills = appData.recurringBills || [];

  if (!bills.length) {
    container.innerHTML = "<p>No recurring bills found.</p>";
    return;
  }

  container.innerHTML = bills.map(bill => `
    <div class="funding-row">
      <div>
        <strong>${bill.billName}</strong><br>
        <small>${bill.budgetType} • Due Day ${bill.dueDay}</small>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <span>${formatCurrency(bill.defaultAmount)}</span>
        <button class="btn-delete-row" onclick="editRecurringBill('${bill.billId}')">✏️</button>
        <button class="btn-delete-row" onclick="deleteRecurringBill('${bill.billId}')">🗑</button>
      </div>
    </div>
  `).join("");
}

function loadRecurringBillAccounts() {
    const dropdown = document.getElementById("billAccount");
    if (!dropdown) return;
    dropdown.innerHTML = "";
    appData.accounts.forEach(account => {
        const name = account.accountName || account.name;
        dropdown.innerHTML += `
      <option value="${name}">
        ${name}
      </option>
    `;
    });
}

function loadRecurringBillPositions() {
    const type = document.getElementById("billBudgetType")?.value;
    const dropdown = document.getElementById("billBudgetPosition");
    if (!dropdown) return;
    dropdown.innerHTML = "";
    appData.categories.filter(cat => cat.budgetType === type).forEach(cat => {
        dropdown.innerHTML += `
        <option value="${cat.categoryName}">
          ${cat.categoryName}
        </option>
      `;
    });
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

async function loadCategoryDropdown() {
    const addSelect = document.getElementById("newCategory");
    const deleteSelect = document.getElementById("deleteCategorySelect");
    if (addSelect) addSelect.innerHTML = "";
    if (deleteSelect) deleteSelect.innerHTML = "";
    appData.categories.forEach(cat => {
        if (addSelect) addSelect.innerHTML += `<option value="${cat.categoryName}">${cat.categoryName}</option>`;
        if (deleteSelect) deleteSelect.innerHTML += `<option value="${cat.categoryName}">${cat.categoryName}</option>`;
    });
}

function loadYearDropdowns() {
    const dropdowns = [document.getElementById("actualYear"), document.getElementById("budgetYear")].filter(Boolean);
    if (dropdowns.length === 0) return;
    
    // Extract unique years from budget dataset
    const years = [...new Set((appData.budget || []).map(item => item.year))].filter(Boolean);
    years.sort((a, b) => a - b);

    dropdowns.forEach(dropdown => {
        const selectedVal = dropdown.value;
        let html = `<option value="CURRENT">Current Year (${new Date().getFullYear()})</option>`;
        html += years.map(year => `<option value="${year}">${year}</option>`).join("");
        
        dropdown.innerHTML = html;
        if (selectedVal) {
            dropdown.value = selectedVal;
        } else {
            dropdown.value = "CURRENT";
        }
    });
}

function loadFundingSources() {

    const dropdown =
        document.getElementById(
            "preferredFundingSource"
        );

    if (!dropdown) return;

    dropdown.innerHTML = "";

    appData.accounts.forEach(account => {

        const name =
            account.accountName ||
            account.name;

        dropdown.innerHTML += `
            <option value="${name}">
                ${name}
            </option>
        `;
    });
}

async function deleteCategory() {
    const categoryName = document.getElementById("deleteCategorySelect")?.value;
    if (!categoryName) return;
    const confirmDelete = await showConfirmDialog("Delete Category", `Delete "${categoryName}"?\nThis will remove related budget entries.`);
    if (!confirmDelete) return;
    await fetch(`${BASE_URL}?action=deleteCategory&categoryName=${encodeURIComponent(categoryName)}`);
    await loadData();
    await loadCategoryDropdown();
    await loadScenarioCategories();
    showStatus(`🗑 Category ${categoryName} deleted`, "success");
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
    loadYearDropdowns();
    // Automatically switch to the year just added
    const yearDropdown = document.getElementById("budgetYear");
    if (yearDropdown) {
        yearDropdown.value = year;
    }
    await Promise.all([
        loadBudgetPlanner(),
        loadSummary(),
        loadDashboard(),
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
        loadDashboard(),
        loadProjection(),
        loadFundingPlan(),
        loadBudgetVsActual()
    ]);
    showStatus(`🗑 Deleted ${category} from ${selectedYear}`, "success");
}

async function loadBudgetPlanner() {
    const selectedYear = getSelectedYear();
    
    // Filter budget data for the selected year
    const budgetData = appData.budget.filter(item => Number(item.year) === selectedYear);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Map planned amounts by category and month
    const categories = {};
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

        // Iterate over all available categories to display empty rows when data is missing for the year
        appData.categories.forEach(cat => {
            if (cat.budgetType === section) {
                const category = cat.categoryName;
                html += `
                <tr style="height: 38px;">
                  <td style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                    <span>${category}</span>
                    <span onclick="deleteBudgetItem('${category}')" style="cursor: pointer; opacity: 0.5; font-size: 12px;" title="Delete row">🗑</span>
                  </td>
                `;

                months.forEach(month => {
                    const amount = (categories[category] && categories[category][month] !== undefined) 
                        ? categories[category][month] 
                        : "";
                    html += `<td><input type="number" value="${amount}" id="${category}|${month}"></td>`;
                });

                html += `</tr>`;
            }
        });
    });

    const currentYear = getSelectedYear();
    const nextYear = currentYear + 1;

    html += `
      </table>
    </div>
    <div class="action-buttons">
      <button onclick="saveBudgetChanges()">💾 Save Budget</button>
      <button onclick="copyJanuaryToWholeYear()">📑 Replicate Year</button>
      <button onclick="copyCurrentYearToNextYear()">📅 Create ${nextYear}</button>
    </div>
    `;

    container.innerHTML = html;

    // Track unsaved changes on input interaction
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
async function loadDashboard() {
    const selectedYear = getSelectedYear();
    const budgetData = appData.budget.filter(item => Number(item.year) === selectedYear);
    const categoryTypes = {};
    appData.categories.forEach(cat => {
        categoryTypes[cat.categoryName] = cat.budgetType;
    });
    let income = 0,
        expense = 0,
        savings = 0,
        debt = 0;
    budgetData.forEach(item => {
        if (item.month !== "Jan") return;
        const type = categoryTypes[item.category];
        const amount = Number(item.plannedAmount);
        if (type === "Income") income += amount;
        if (type === "Expense") expense += amount;
        if (type === "Savings") savings += amount;
        if (type === "Debt") debt += amount;
    });
    const remaining = income - expense - savings - debt;
    const annualSurplus = remaining * 12;
    const savingsRate = income > 0 ? ((savings / income) * 100).toFixed(1) : "0.0";
    const debtRate = income > 0 ? ((debt / income) * 100).toFixed(1) : "0.0";
    document.getElementById("dashboard").innerHTML = `
    <div class="card">
      <h2>💰 Financial Health</h2>
      <div class="metric-row"><span>Monthly Surplus</span><strong>${formatCurrency(remaining)}</strong></div>
      <div class="metric-row"><span>Annual Surplus</span><strong>${formatCurrency(annualSurplus)}</strong></div>
      <div class="metric-row"><span>Savings Rate</span><strong>${savingsRate}%</strong></div>
      <div class="metric-row"><span>Debt Rate</span><strong>${debtRate}%</strong></div>
      <div class="metric-row"><span>Status</span><strong>${remaining > 0 ? "✅ Positive Cash Flow" : "❌ Negative Cash Flow"}</strong></div>
    </div>
  `;
}
async function loadGoals() {
    const container = document.getElementById("financialGoals");
    if (!container) return;
    let html = `<div class="goals-container">`;
    appData.goals.forEach(goal => {
        const current = Number(goal.current || 0);
        const target = Number(goal.target || 1);
        const monthlyContribution = Number(goal.monthlyContribution || 1);
        const progress = ((current / target) * 100).toFixed(1);
        const remainingAmount = target - current;
        const monthsRemaining = Math.ceil(remainingAmount / monthlyContribution);
        const completionDate = new Date();
        completionDate.setMonth(completionDate.getMonth() + monthsRemaining);
        const forecast = completionDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short"
        });
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
          <span>Target: ${formatCurrency(target)} (${progress}%)</span>
          <span>Est: <strong>${forecast}</strong> (${monthsRemaining} mos)</span>
        </div>
      </div>
    `;
    });
    html += `</div>`;
    container.innerHTML = html;
}
async function loadNetWorth() {
    let assets = 0,
        liabilities = 0;
    appData.accounts.forEach(account => {
        const balance = Number(account.currentBalance || account.balance || 0);
        if (account.netWorthType === "Asset") assets += balance;
        if (account.netWorthType === "Liability") liabilities += balance;
    });
    const netWorth = assets - liabilities;
    const isNegative = netWorth < 0;
    document.getElementById("networth").innerHTML = `
    <div class="networth-banner ${isNegative ? 'negative' : 'positive'}">
      <h2>💎 Net Worth</h2>
      <div class="big-amount">${formatCurrency(netWorth)}</div>
      <div class="networth-details">
        <span>Assets: <strong>${formatCurrency(assets)}</strong></span>
        <span>Liabilities: <strong>${formatCurrency(liabilities)}</strong></span>
      </div>
    </div>
  `;
}
async function loadProjection() {
    const selectedYear = getSelectedYear();
    const budgetData = appData.budget.filter(item => Number(item.year) === selectedYear);
    const categoryTypes = {};
    appData.categories.forEach(cat => {
        categoryTypes[cat.categoryName] = cat.budgetType;
    });
    let assets = 0,
        liabilities = 0;
    appData.accounts.forEach(account => {
        const balance = Number(account.currentBalance || account.balance || 0);
        if (account.netWorthType === "Asset") assets += balance;
        if (account.netWorthType === "Liability") liabilities += balance;
    });
    let income = 0,
        expense = 0,
        savings = 0,
        debt = 0;
    budgetData.forEach(item => {
        if (item.month !== "Jan") return;
        const amount = Number(item.plannedAmount);
        const type = categoryTypes[item.category];
        if (type === "Income") income += amount;
        if (type === "Expense") expense += amount;
        if (type === "Savings") savings += amount;
        if (type === "Debt") debt += amount;
    });
    const monthlySurplus = income - expense - savings - debt;
    const annualSurplus = monthlySurplus * 12;
    const projectedAssets = assets + annualSurplus;
    const projectedNetWorth = projectedAssets - liabilities;
    document.getElementById("projection").innerHTML = `
    <div class="card">
      <h2>📈 Wealth Projection</h2>
      <div class="metric-row"><span>Current Assets</span><strong>${formatCurrency(assets)}</strong></div>
      <div class="metric-row"><span>Current Net Worth</span><strong>${formatCurrency(assets - liabilities)}</strong></div>
      <hr>
      <div class="metric-row"><span>Projected Assets</span><strong>${formatCurrency(projectedAssets)}</strong></div>
      <div class="metric-row"><span>Projected Net Worth</span><strong>${formatCurrency(projectedNetWorth)}</strong></div>
    </div>
  `;
}

function loadFundingPlan() {

    const selectedYear = getSelectedYear();

    const container =
        document.getElementById(
            "fundingPlanList"
        );

    const cashContainer =
        document.getElementById(
            "cashToWithdraw"
        );

    if (
        !container ||
        !appData.budget ||
        !appData.categories
    ) return;

    const categoryTypes = {};
    const fundingSources = {};

    appData.categories.forEach(cat => {

        categoryTypes[
            cat.categoryName
        ] = cat.budgetType;

        fundingSources[
            cat.categoryName
        ] =
            cat.preferredFundingSource || "";

    });

    let totalIncome = 0;
    let totalExpense = 0;
    let totalSavings = 0;
    let totalDebt = 0;
    let cashToWithdraw = 0;

    const fundingRequirements = {};

    appData.budget
        .filter(
            item =>
                Number(item.year) === selectedYear
        )
        .forEach(item => {

            if (item.month !== "Jan")
                return;

            const amount =
                Number(
                    item.plannedAmount
                ) || 0;

            const type =
                categoryTypes[
                    item.category
                ];

            const source =
                fundingSources[
                    item.category
                ];

            if (type === "Income")
                totalIncome += amount;

            if (type === "Expense")
                totalExpense += amount;

            if (type === "Savings")
                totalSavings += amount;

            if (type === "Debt")
                totalDebt += amount;

            if (
                source &&
                type !== "Income"
            ) {
            
                if (
                    !fundingRequirements[
                        source
                    ]
                ) {
            
                    fundingRequirements[
                        source
                    ] = 0;
            
                }
            
                fundingRequirements[
                    source
                ] += amount;
            
                if (
                    source === "Cash Wallet"
                ) {
            
                    cashToWithdraw += amount;
            
                }
            }

        });

    if (cashContainer) {

        cashContainer.textContent =
            formatCurrency(
                cashToWithdraw
            );

    }

    let fundingHtml = "";

    Object.entries(
        fundingRequirements
    )
    .sort(
        (a, b) => b[1] - a[1]
    )
    .forEach(
        ([source, amount]) => {
    
            fundingHtml += `
                <div class="funding-row">
                    <span class="label">
                        ${source}
                    </span>
    
                    <span class="amount">
                        ${formatCurrency(amount)}
                    </span>
                </div>
            `;
        }
    );

    container.innerHTML = `
        <div class="funding-row">
            <span class="label">
                Total Monthly Income
            </span>

            <span class="amount">
                ${formatCurrency(totalIncome)}
            </span>
        </div>

        <div class="funding-row">
            <span class="label">
                Total Expenses
            </span>

            <span class="amount">
                ${formatCurrency(totalExpense)}
            </span>
        </div>

        <div class="funding-row">
            <span class="label">
                Total Savings
            </span>

            <span class="amount">
                ${formatCurrency(totalSavings)}
            </span>
        </div>

        <div class="funding-row">
            <span class="label">
                Total Debt Payments
            </span>

            <span class="amount">
                ${formatCurrency(totalDebt)}
            </span>
        </div>

        <hr>

        <h3>Funding Sources</h3>

        ${fundingHtml}
    `;
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
    loadYearDropdowns();
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
    const selectedYear = getSelectedYear();
    const item = appData.budget.find(row => Number(row.year) === selectedYear && row.category === category && row.month === "Jan");
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
    const selectedYear = getSelectedYear();
    appData.budget.filter(item => Number(item.year) === selectedYear && item.month === "Jan").forEach(item => {
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
        loadDashboard(),
        loadProjection(),
        loadFundingPlan(),
        loadBudgetVsActual()
    ]);
}

function loadBudgetVsActual() {
    const container = document.getElementById("budgetVsActual");
    if (!container) return;
    const selectedYear = Number(getSelectedYear());
    const selectedMonth = getSelectedMonth();
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
        loadDashboard(),
        loadProjection(),
        loadSummary(),
        loadFundingPlan(),
        loadBudgetVsActual()
    ]);
}

async function refreshUI() {
    loadYearDropdowns(); // Updated from loadYearDropdown()
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
        loadDashboard(),
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
    await refreshUI();
    // Default Add Budget Item year to latest budget year
    const years = [...new Set(appData.budget.map(item => Number(item.year)))].filter(Boolean);
    const latestYear = years.length > 0 ? Math.max(...years) : new Date().getFullYear();
    const newYearInput = document.getElementById("newYear");
    if (newYearInput) {
        newYearInput.value = latestYear;
    }
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
