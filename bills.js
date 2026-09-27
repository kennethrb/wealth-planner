async function addRecurringBill() {
    const billNameInput = document.getElementById("billName");
    const commitmentType =
        document.getElementById(
            "billCommitmentType"
        )?.value || "BILL";
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

    if (editingBillId) {
    
        await fetch(
            `${BASE_URL}?action=updateRecurringBill`
            + `&mode=${appMode}`
            + `&billId=${editingBillId}`
            + `&amount=${amount}`
            + `&commitmentType=${encodeURIComponent(commitmentType)}`
        );
    
    } else {
    
        await fetch(
            `${BASE_URL}?action=addRecurringBill`
            + `&mode=${appMode}`
            + `&billName=${encodeURIComponent(billName)}`
            + `&commitmentType=${encodeURIComponent(commitmentType)}`
            + `&budgetType=${encodeURIComponent(budgetType)}`
            + `&budgetPosition=${encodeURIComponent(budgetPosition)}`
            + `&amountType=${encodeURIComponent(amountType)}`
            + `&amount=${amount}`
            + `&dueDay=${dueDay}`
            + `&account=${encodeURIComponent(account)}`
        );
    
    }

    await loadData();
    loadRecurringBills();
    await refreshFinancialViews();
    cancelRecurringBillEdit();

    // Reset Form Input Fields
    if (billNameInput) billNameInput.value = "";
    if (amountInput) amountInput.value = "";
    if (dueDayInput) dueDayInput.value = "";

    showStatus(
        editingBillId
            ? "✅ Recurring bill updated"
            : "✅ Recurring bill created",
        "success"
    );
}

async function deleteRecurringBill(billId) {
    const confirmed = await showConfirmDialog("Delete Recurring Bill", "Delete this recurring bill?");
    if (!confirmed) return;
    await fetch(
        `${BASE_URL}?action=deleteRecurringBill`
        + `&mode=${appMode}`
        + `&billId=${billId}`
    );
    await loadData();
    loadRecurringBills();
    await refreshFinancialViews();
    showStatus("🗑 Recurring Bill Deleted", "success");
}

// Edit recurring bill amount

let editingBillId = null;
function editRecurringBill(billId) {
    const formTitle =
        document.getElementById(
            "billFormTitle"
        );
    const form =
        document.getElementById(
            "billName"
        );
    
    if (form) {
        form.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }
    
    if (formTitle) {
        formTitle.textContent =
            "✏️ Edit Recurring Bill";
    }
    const bill =
        appData.recurringBills.find(
            b => b.billId === billId
        );

    if (!bill) return;

    editingBillId = billId;

    document.getElementById("billName").value =
        bill.billName;

    document.getElementById("billCommitmentType").value =
        bill.commitmentType || "BILL";

    document.getElementById("billBudgetType").value =
        bill.budgetType;

    loadRecurringBillPositions();

    document.getElementById("billBudgetPosition").value =
        bill.budgetPosition;

    document.getElementById("billAmountType").value =
        bill.amountType;

    document.getElementById("billAmount").value =
        bill.defaultAmount;

    document.getElementById("billDueDay").value =
        bill.dueDay;

    document.getElementById("billAccount").value =
        bill.accountId;

    document.getElementById(
        "billFormSubmitBtn"
    ).textContent =
        "Save Changes";

    document.getElementById(
        "billFormCancelBtn"
    ).classList.remove("hidden");
}

function cancelRecurringBillEdit() {
    const formTitle =
        document.getElementById(
            "billFormTitle"
        );
    
    if (formTitle) {
        formTitle.textContent =
            "➕ Add Recurring Bill";
    }

    editingBillId = null;

    document.getElementById("billName").value = "";
    document.getElementById("billAmount").value = "";
    document.getElementById("billDueDay").value = "";

    document.getElementById(
        "billCommitmentType"
    ).value = "BILL";

    document.getElementById(
        "billFormSubmitBtn"
    ).textContent = "➕ Add Bill";

    document.getElementById(
        "billFormCancelBtn"
    ).classList.add("hidden");
}

// Generate transactions from recurring bills
async function generateBills() {
  const confirmed = await showConfirmDialog("Generate Bills","Generate transactions from all active recurring bills?");
  if (!confirmed) return;

    const response =
        await fetch(
            `${BASE_URL}?action=generateBills`
            + `&mode=${appMode}`
        );
  const result = await response.json();

  await loadData();

  loadTransactions();
  await refreshFinancialViews();

  showStatus(`✅ ${result.count} bills generated`,"success");
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

  const checkIsPaid =
    isBillPaidThisCycle;

  // Helper: calculate raw remaining days for sorting
    const getDaysRemaining = (bill) => {
    
        if (checkIsPaid(bill))
            return 999;
    
        const dueDate =
            getNextDueDate(
                Number(bill.dueDay)
            );
    
        return Math.ceil(
            (dueDate - today) /
            (1000 * 60 * 60 * 24)
        );
    
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
    const isPaid = checkIsPaid(bill);
    const amount = Number(bill.defaultAmount || 0);

    totalBillsAmount += amount;

    if (isPaid) {
        paidCount++;
        paidAmount += amount;
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
        return (
            tx.budgetPosition === bill.budgetPosition &&
            txDate.getMonth() === currentMonth &&
            txDate.getFullYear() === currentYear
        );
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
        const isPaid = checkIsPaid(bill);
        const dueDate =
            getNextDueDate(
                Number(bill.dueDay)
            );
        
        const daysRemaining =
            Math.ceil(
                (dueDate - today) /
                (1000 * 60 * 60 * 24)
            );
        let status = "";
        let statusClass = "";

        if (isPaid) {
            status = "✅ Paid";
            statusClass = "text-success";
        } else if (daysRemaining <= 0) {
            status = "🔴 Due Today";
            statusClass = "bill-overdue";
        } else if (daysRemaining <= 7) {
            status = `🟡 Due in ${daysRemaining} day(s)`;
            statusClass = "bill-due-soon";
        } else {
            status = `🔵 Due in ${daysRemaining} day(s)`;
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
        <strong>${bill.billName}</strong>
        
        <small>
        ${bill.commitmentType}
        •
        ${bill.budgetType}
        •
        Due Day ${bill.dueDay}
        </small>
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
        const accountId =
            account.accountId ||
            account["Account ID"];

        const name =
            account.accountName ||
            account.name ||
            account["Account Name"];

        dropdown.innerHTML += `
            <option value="${accountId}">
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

function getNextDueDate(dueDay) {

    const today = new Date();

    let dueDate =
        new Date(
            today.getFullYear(),
            today.getMonth(),
            dueDay
        );

    if (dueDate < today) {

        dueDate =
            new Date(
                today.getFullYear(),
                today.getMonth() + 1,
                dueDay
            );

    }

    return dueDate;
}

function isBillPaidThisCycle(bill) {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    return (appData.transactions || []).some(tx => {
        const txDate = new Date(tx.Date || tx.date);
        return (tx.budgetPosition === bill.budgetPosition && txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear);
    });
}
