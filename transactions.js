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

// Replace addTransaction in script.js
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
    
    const confirmed = await showConfirmDialog("Save Transaction", "Do you want to save this transaction?");
    if (!confirmed) return;
    
    const action = editingTransactionId ? "updateTransaction" : "addTransaction";
    
    let url = `${BASE_URL}?action=${action}`
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
    await loadData();
    
    // Reset state
    editingTransactionId = null;
    document.getElementById("txDate").value = "";
    document.getElementById("txAmount").value = "";
    document.getElementById("txDetails").value = "";
    
    const button = document.querySelector('button[onclick="addTransaction()"]');
    if (button) {
        button.innerHTML = "➕ Add Transaction";
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

// Fix potential date timezone offsets when editing transactions
// Replace editTransaction in script.js
let editingTransactionId = null;

function editTransaction(transactionId) {
    const tx = appData.transactions.find(t => (t.transactionId || t['Transaction ID']) === transactionId);
    if (!tx) return;
    
    // Store the actual unique ID instead of the row number
    editingTransactionId = tx.transactionId || tx['Transaction ID'];
    
    const rawDate = tx.Date || tx.date || "";
    let formattedDate = "";
    if (rawDate) {
        const date = new Date(rawDate);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        formattedDate = `${year}-${month}-${day}`;
    }
    
    document.getElementById("txDate").value = formattedDate;
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

async function deleteTransactionRecord(transactionId) {
    const confirmed = await showConfirmDialog("Delete Transaction", "Delete this transaction?");
    if (!confirmed) return;
    
    // Updated 'transactionId=' to 'id='
    await fetch(`${BASE_URL}?action=deleteTransaction&id=${transactionId}`);
    
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
            <option value="${accountId}">
                ${name}
            </option>
        `;
    });
}
