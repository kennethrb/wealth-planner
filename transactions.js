let transactionSearchTerm = "";
let transactionFilter = "ALL";

function loadTransactionAccounts() {
    const dropdown = document.getElementById("txAccount");
    if (!dropdown) return;

    dropdown.innerHTML = "";

    appData.accounts.forEach(account => {
        const accountId = account.accountId || account["Account ID"];
        const name = account.accountName || account.name || account["Account Name"];

        dropdown.innerHTML += `
            <option value="${accountId}">
                ${name}
            </option>
        `;
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

    const type =
        document.getElementById(
            "txBudgetType"
        )?.value;

    const positionContainer =
        document.getElementById(
            "txBudgetPosition"
        )?.closest(".form-group");

    const transferContainer =
        document.getElementById(
            "txTransferContainer"
        );

    if (type === "Transfer") {

        if (positionContainer) {
            positionContainer.style.display =
                "none";
        }

        if (transferContainer) {
            transferContainer.style.display =
                "flex";
        }

    } else if (type === "Debt") {

        if (positionContainer) {
            positionContainer.style.display =
                "flex";
        }

        if (transferContainer) {
            transferContainer.style.display =
                "flex";
        }

        loadTransactionPositions();

    } else {

        if (positionContainer) {
            positionContainer.style.display =
                "flex";
        }

        if (transferContainer) {
            transferContainer.style.display =
                "none";
        }

        loadTransactionPositions();
    }
}

// Replace addTransaction in script.js
async function addTransaction() {
    const date = document.getElementById("txDate")?.value;
    const amount = document.getElementById("txAmount")?.value;
    const details = document.getElementById("txDetails")?.value;
    const account = document.getElementById("txAccount")?.value;
    const budgetType = document.getElementById("txBudgetType")?.value;
    let budgetPosition = document.getElementById("txBudgetPosition")?.value || "";
    const transferToAccount =
    (
        budgetType === "Transfer" ||
        budgetType === "Debt" ||
        budgetType === "Savings"
    )
        ? (
            document.getElementById(
                "txToAccount"
            )?.value || ""
          )
        : "";
    
    if (budgetType === "Transfer") {
        budgetPosition = "";
    }
    
    if (!date || !amount || !account) {
        showStatus("⚠ Please complete all required fields.", "warning");
        return;
    }
    
    const action = editingTransactionId ? "updateTransaction" : "addTransaction";
    
    let url = `${BASE_URL}?action=${action}`
        + `&mode=${appMode}`
        + `&date=${encodeURIComponent(date)}`
        + `&amount=${amount}`
        + `&details=${encodeURIComponent(details)}`
        + `&account=${encodeURIComponent(account)}`
        + `&budgetType=${encodeURIComponent(budgetType)}`
        + `&budgetPosition=${encodeURIComponent(budgetPosition)}`
        + `&transferToAccount=${encodeURIComponent(transferToAccount)}`;
    
    // Pass 'id' so backend updateTransaction(params) can read params.id
    if (editingTransactionId) {
        url += `&id=${encodeURIComponent(editingTransactionId)}`;
    }
    
    await fetch(url);
    
    // Reset state
    editingTransactionId = null;
    const cancelButton = document.getElementById("cancelTransactionEditBtn");
    if (cancelButton) {
        cancelButton.style.display = "none";
    }
    document.getElementById("txDate").value = "";
    document.getElementById("txAmount").value = "";
    document.getElementById("txDetails").value = "";
    
    const button = document.querySelector('button[onclick="addTransaction()"]');
    if (button) {
        button.innerHTML = "➕ Record Activity";
    }
    
    await loadData();
    
    await refreshUI();
    showStatus("✅ Transaction recorded", "success");
    closeTransactionModal();
}

function syncSavingsDestination()
{
    const budgetType =
        document.getElementById(
            "txBudgetType"
        )?.value;

    if (budgetType !== "Savings")
        return;

    const category =
        document.getElementById(
            "txBudgetPosition"
        )?.value;

    const destination =
        appData.accounts.find(
            a =>
                a.accountName === category
        );

    if (
        destination &&
        document.getElementById("txToAccount")
    )
    {
        document.getElementById(
            "txToAccount"
        ).value =
        destination.accountId;
    }
}

function renderTransactionCards(recent) {

    return recent.map(tx => {

        const budgetType =
            tx["Budget Type"] ||
            tx.budgetType ||
            "";

        const account =
            tx.Account ||
            tx.account ||
            tx["Account Name"] ||
            "Account";

        const details =
            tx.Details ||
            tx.details ||
            "Transaction";

        const amount =
            tx.Amount ||
            tx.amount ||
            0;

        const transactionId =
            tx.transactionId ||
            tx["Transaction ID"];

        const amountDisplay =
            budgetType === "Income"
                ? `+${formatCurrency(amount)}`
            : budgetType === "Transfer"
                ? `${formatCurrency(amount)}`
            : `-${formatCurrency(amount)}`;

        let badgeClass =
            "activity-info";

        if (budgetType === "Income") {
            badgeClass = "activity-income";
        }
        else if (budgetType === "Expense") {
            badgeClass = "activity-expense";
        }
        else if (budgetType === "Savings") {
            badgeClass = "activity-savings";
        }
        else if (budgetType === "Debt") {
            badgeClass = "activity-debt";
        }

        return `
            <div class="transaction-mobile-card">

                <div class="activity-type ${badgeClass}">
                    ${budgetType.toUpperCase()}
                </div>

                <div class="activity-title">
                    ${details}
                </div>

                <div class="activity-subline">
                
                    <span>
                        ${account}
                    </span>
                
                    <span>
                        ${formatTransactionDate(
                            tx.Date || tx.date
                        )}
                    </span>
                
                </div>
                
                <div class="activity-footer">
                
                    <div class="activity-amount">
                        ${amountDisplay}
                    </div>
                
                    <div class="activity-actions">


                    <button
                        class="btn-delete-row"
                        onclick="editTransaction('${transactionId}')">
                        ✏️
                    </button>

                    <button
                        class="btn-delete-row"
                        onclick="deleteTransactionRecord('${transactionId}')">
                        🗑️
                    </button>

                </div>

            </div>
        `;

    }).join("");
}

function renderTransactionTable(container, recent) {

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
                tx["Account Name"] ||
                "Account";
        
            const transferTo =
                tx["Transfer To Account"] ||
                tx.transferToAccount ||
                "";
        
            let flowDisplay =
                tx["Budget Position"] ||
                tx.budgetPosition ||
                tx.category ||
                "";
        
            if (budgetType === "Transfer") {
                flowDisplay = `
                    <strong>${account}</strong>
                    <br>
                    → ${transferTo}
                `;
            }
        
            const amountClass =
                budgetType === "Income" ? "amount-income" :
                budgetType === "Expense" ? "amount-expense" :
                budgetType === "Savings" ? "amount-savings" :
                budgetType === "Debt" ? "amount-debt" :
                budgetType === "Transfer" ? "amount-transfer" :
                "";
            const amountText =
                budgetType === "Income"
                    ? `+${formatCurrency(tx.Amount || tx.amount)}`
                    : formatCurrency(tx.Amount || tx.amount);
        
            return `
                <tr>
                    <td>
                        ${formatTransactionDate(tx.Date || tx.date)}
                    </td>
        
                    <td class="${amountClass}">
                        ${amountText}
                    </td>
        
                    <td>${account}</td>
                    <td>${flowDisplay}</td>
                    <td>${tx.Details || tx.details || ""}</td>
        
                    <td class="action-cell">

                  <button
                      class="btn-delete-row"
                      onclick="editTransaction('${tx.transactionId || tx['Transaction ID']}')">
                      ✏️
                  </button>
                
                  <button
                      class="btn-delete-row"
                      onclick="deleteTransactionRecord('${tx.transactionId || tx['Transaction ID']}')">
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

function setTransactionFilter(event, type){

    transactionFilter = type;

    document
        .querySelectorAll(
            ".activity-chip"
        )
        .forEach(chip =>
            chip.classList.remove(
                "active"
            )
        );

    event.target.classList.add(
        "active"
    );

    loadTransactions();
}

function registerTransactionFilters() {

    const search =
        document.getElementById(
            "transactionSearch"
        );

    if (!search) return;

    search.oninput = (e) => {

        transactionSearchTerm =
            e.target.value
                .toLowerCase();

        loadTransactions();
    };
}

function loadTransactions() {

    const container =
        document.getElementById(
            "transactionsList"
        );

    if (!container) return;

    let recent =
        [...appData.transactions]
        .reverse();

    if (transactionFilter !== "ALL") {

        recent =
            recent.filter(tx =>
                (
                    tx["Budget Type"]
                    || tx.budgetType
                ) === transactionFilter
            );
    }

    if (transactionSearchTerm) {

        recent =
            recent.filter(tx => {

                const searchText =
                `
                ${tx.Details || tx.details || ""}
                ${tx.Account || tx.account || ""}
                ${tx["Budget Type"] || tx.budgetType || ""}
                `
                .toLowerCase();

                return searchText.includes(
                    transactionSearchTerm
                );

            });
    }

    if (window.innerWidth <= 768) {

        container.innerHTML =
            renderTransactionCards(
                recent
            );

    } else {

        renderTransactionTable(
            container,
            recent
        );
    }
}

// Fix potential date timezone offsets when editing transactions
// Replace editTransaction in script.js
let editingTransactionId = null;

function cancelTransactionEdit() {
    editingTransactionId = null;
    document.getElementById("txDate").value = "";
    document.getElementById("txAmount").value = "";
    document.getElementById("txDetails").value = "";
    if (document.getElementById("txBudgetType")) {
        document.getElementById("txBudgetType").selectedIndex = 0;
    }
    if (document.getElementById("txBudgetPosition")) {
        document.getElementById("txBudgetPosition").selectedIndex = 0;
    }
    if (document.getElementById("txAccount")) {
        document.getElementById("txAccount").selectedIndex = 0;
    }
    if (document.getElementById("txToAccount")) {
        document.getElementById("txToAccount").selectedIndex = 0;
    }
    toggleTransactionFields();
    const saveButton = document.querySelector('button[onclick="addTransaction()"]');
    if (saveButton) {
        saveButton.innerHTML =
            "➕ Record Activity";
    }
    const cancelButton = document.getElementById("cancelTransactionEditBtn");
    if (cancelButton) {
        cancelButton.style.display = "none";
    }
    showStatus("Edit cancelled", "info");
}

function editTransaction(transactionId) {
    const tx = appData.transactions.find(t => (t.transactionId || t['Transaction ID']) === transactionId);
    if (!tx) return;
    
    // Store the actual unique ID instead of the row number
    editingTransactionId = tx.transactionId || tx['Transaction ID'];
    
    const rawDate = tx.Date || tx.date || "";
    let formattedDate = "";
    if (rawDate) {
        const parsed =
            parseTransactionDate(
                rawDate
            );
        
        if (parsed) {
        
            formattedDate =
                `${parsed.year}-${
                    String(
                        parsed.monthIndex + 1
                    ).padStart(2, "0")
                }-${
                    String(
                        parsed.day
                    ).padStart(2, "0")
                }`;
        }
    }
    
    document.getElementById("txDate").value = formattedDate;
    document.getElementById("txAmount").value = tx.Amount || 0;
    document.getElementById("txDetails").value = tx.Details || "";
    document.getElementById("txAccount").value =
    tx["Account ID"] ||
    tx.accountId ||
    "";
    document.getElementById("txBudgetType").value = tx["Budget Type"] || tx.budgetType || "";
    toggleTransactionFields();
    document.getElementById("txBudgetPosition").value = tx["Budget Position"] || tx.budgetPosition || "";
    
    const transferTo =
    tx["Transfer To Account ID"] ||
    tx.transferToAccountId ||
    "";
    if (document.getElementById("txToAccount")) {
        document.getElementById("txToAccount").value = transferTo;
    }
    
    const button = document.querySelector('button[onclick="addTransaction()"]');
    if (button) {
        button.innerHTML = "💾 Save Changes";
    }
    
    const cancelButton =
        document.getElementById(
            "cancelTransactionEditBtn"
        );
    
    if (cancelButton) {
        cancelButton.style.display =
            "inline-flex";
    }
    openTransactionModal();
}

async function deleteTransactionRecord(transactionId) {
    const confirmed = await showConfirmDialog("Delete Transaction", "Delete this transaction?");
    if (!confirmed) return;
    
    // Updated 'transactionId=' to 'id='
    await fetch(
        `${BASE_URL}?action=deleteTransaction`
        + `&mode=${appMode}`
        + `&id=${transactionId}`
    );
    
    await loadData();
    
    await refreshUI();
    showStatus("🗑 Transaction deleted", "success");
}

function loadTransferAccounts() {
    const dropdown = document.getElementById("txToAccount");
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

function openTransactionModal() {
    document
        .getElementById("transactionModal")
        .classList.add("show");
}

function closeTransactionModal() {
    document
        .getElementById("transactionModal")
        .classList.remove("show");
}
