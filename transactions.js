let transactionDisplayCount = 5;
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
        
        setTimeout(() => {
        
            const category =
                document.getElementById(
                    "txBudgetPosition"
                );
        
            if (
                category &&
                category.options.length > 0 &&
                !category.value
            ) {
                category.selectedIndex = 0;
            }
        
        }, 0);

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
        
        setTimeout(() => {
        
            const category =
                document.getElementById(
                    "txBudgetPosition"
                );
        
            if (
                category &&
                category.options.length > 0 &&
                !category.value
            ) {
                category.selectedIndex = 0;
            }
        
        }, 0);
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
        
        <div class="commitment-card">
        
            <div class="commitment-top-row">
        
                <div
                    class="activity-type ${badgeClass}">
        
                    ${budgetType.toUpperCase()}
        
                </div>
        
                <button
                    class="commitment-menu-btn"
                    onclick="
                        toggleTransactionMenu(
                            '${transactionId}'
                        )">
        
                    ⋮
        
                </button>
        
            </div>
        
            <div class="commitment-main-row">
        
                <div class="commitment-name">
        
                    ${details}
        
                </div>
        
                <div class="commitment-amount">
        
                    ${amountDisplay}
        
                </div>
        
            </div>
        
            <div class="commitment-due">
            
                ${account}
            
            </div>
            
            <div class="transaction-date">
            
                ${formatTransactionDate(
                    tx.Date || tx.date
                )}
            
            </div>
        
            <div
                id="tx-menu-${transactionId}"
                class="bill-menu hidden">
        
                <button
                    onclick="
                        editTransaction(
                            '${transactionId}'
                        )">
        
                    ✏️ Edit Activity
        
                </button>
        
                <button
                    onclick="
                        deleteTransactionRecord(
                            '${transactionId}'
                        )">
        
                    🗑 Delete Activity
        
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
    transactionDisplayCount = 5;
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
        transactionDisplayCount = 5;
        loadTransactions();
    };
}

function showMoreTransactions() {

    transactionDisplayCount += 5;

    loadTransactions();

}

function collapseTransactions() {
    transactionDisplayCount = 5;
    loadTransactions();

    requestAnimationFrame(() => {
        scrollToCardStart("execution");
    });
}

function toggleTransactionMenu(
    transactionId
) {

    document
        .querySelectorAll(
            "[id^='tx-menu-']"
        )
        .forEach(menu => {

            if (
                menu.id ===
                `tx-menu-${transactionId}`
            ) {

                menu.classList.toggle(
                    "hidden"
                );

            } else {

                menu.classList.add(
                    "hidden"
                );
            }

        });
}

function loadTransactions() {

    const container =
        document.getElementById(
            "transactionsList"
        );
    const MAX_ACTIVITY_CARDS = 20;

    if (!container) return;

    let recent =
        [...appData.transactions]
        .reverse()
        .slice(0, MAX_ACTIVITY_CARDS);

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
    
        const visible =
            recent.slice(
                0,
                transactionDisplayCount
            );
    
        container.innerHTML = `
            <div class="activity-grid">
                ${renderTransactionCards(
                    visible
                )}
            </div>
        `;
    
    if (recent.length > 5) {
    
        container.innerHTML += `
            <div class="show-more-container">
    
                <div class="show-more-label">
                    Showing
                    ${Math.min(
                        transactionDisplayCount,
                        recent.length
                    )}
                    of
                    ${recent.length}
                    activities
                </div>
    
                ${transactionDisplayCount < recent.length
                    ? `
                        <button
                            class="btn-secondary"
                            onclick="showMoreTransactions()">
                            View More Activities
                        </button>
                      `
                    : `
                        <button
                            class="btn-secondary"
                            onclick="collapseTransactions()">
                            Collapse Activities
                        </button>
                      `
                }
    
            </div>
        `;
    }
    
    }
    else {

        renderTransactionTable(
            container,
            recent
        );
    }
}

// Fix potential date timezone offsets when editing transactions
// Replace editTransaction in script.js
let editingTransactionId = null;

function resetTransactionForm() {
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
    resetTransactionForm()
}

let editingCategoryId = null;

function openCategoryModal() {

    const budgetType =
        document.getElementById(
            "txBudgetType"
        )?.value || "Expense";

    document.getElementById(
        "modalBudgetType"
    ).value = budgetType;

    const funding =
        document.getElementById(
            "modalFundingSource"
        );

    if (funding) {
        funding.innerHTML = "";

        appData.accounts.forEach(account => {
            funding.innerHTML += `
                <option value="${account.accountId}">
                    ${account.accountName}
                </option>
            `;
        });
    }

    document
        .getElementById("categoryModal")
        .classList.add("show");
}

function closeCategoryModal() {

    document
        .getElementById("categoryModal")
        .classList.remove("show");

    document.getElementById(
        "modalCategoryName"
    ).value = "";

    document.getElementById(
        "modalCategoryGroup"
    ).value = "Other";

    editingCategoryId = null;

    const title =
        document.querySelector(
            "#categoryModal h2"
        );

    if (title) {
        title.textContent =
            "🏷 Create Category";
    }
}

async function saveCategoryFromModal() {

    const categoryName =
        document.getElementById(
            "modalCategoryName"
        )?.value?.trim();

    const budgetType =
        document.getElementById(
            "modalBudgetType"
        )?.value;

    const group =
        document.getElementById(
            "modalCategoryGroup"
        )?.value || "Other";

    const fundingSource =
        document.getElementById(
            "modalFundingSource"
        )?.value;

    if (!categoryName) {
        showStatus(
            "⚠ Category name required",
            "warning"
        );
        return;
    }

    const action =
        editingCategoryId
            ? "updateCategory"
            : "addCategory";

    let url =
        `${BASE_URL}?action=${action}`
        + `&mode=${appMode}`
        + `&categoryName=${encodeURIComponent(categoryName)}`
        + `&budgetType=${encodeURIComponent(budgetType)}`
        + `&group=${encodeURIComponent(group)}`
        + `&preferredFundingSource=${encodeURIComponent(fundingSource)}`;

    if (editingCategoryId) {
        url +=
            `&categoryId=${encodeURIComponent(editingCategoryId)}`;
    }

    await fetch(url);

    await loadData();

    // Refresh BOTH consumers
    loadTransactionPositions();
    loadRecurringBillPositions();

    // Reselect newly-created category
    setTimeout(() => {

        const txCategory =
            document.getElementById(
                "txBudgetPosition"
            );

        if (txCategory) {
            txCategory.value = categoryName;
        }

        const billCategory =
            document.getElementById(
                "billBudgetPosition"
            );

        if (billCategory) {
            billCategory.value = categoryName;
        }

    }, 10);

    showStatus(
        editingCategoryId
            ? "✅ Category updated"
            : "✅ Category created",
        "success"
    );

    editingCategoryId = null;

    closeCategoryModal();
}


function editCategory(categoryId) {

    const category =
        appData.categories.find(
            c => c.categoryId === categoryId
        );

    if (!category) return;

    editingCategoryId = categoryId;

    const funding =
        document.getElementById(
            "modalFundingSource"
        );

    if (funding) {

        funding.innerHTML = "";

        appData.accounts.forEach(account => {

            funding.innerHTML += `
                <option value="${account.accountId}">
                    ${account.accountName}
                </option>
            `;
        });
    }

    document.getElementById(
        "modalCategoryName"
    ).value =
        category.categoryName || "";

    document.getElementById(
        "modalBudgetType"
    ).value =
        category.budgetType || "Expense";

    document.getElementById(
        "modalCategoryGroup"
    ).value =
        category.group || "Other";

    document.getElementById(
        "modalFundingSource"
    ).value =
        category.preferredFundingSourceId || "";

    document.querySelector(
        "#categoryModal h2"
    ).textContent =
        "✏️ Edit Category";

    document.querySelector(
        "#categoryModal button[type='button']"
    ).textContent =
        "Save Changes";

    document
        .getElementById("categoryModal")
        .classList.add("show");
}

function openCategoryManagerModal()
{
    renderCategoryManager();

    document
        .getElementById(
            "categoryManagerModal"
        )
        .classList.add("show");
}

function closeCategoryManagerModal()
{
    document
        .getElementById(
            "categoryManagerModal"
        )
        .classList.remove("show");
}

function renderCategoryManager()
{
    console.log("Categories:", appData.categories);
    console.log("Container:", document.getElementById("categoryManagerList"));
    const container =
        document.getElementById(
            "categoryManagerList"
        );

    if (!container)
        return;

    const categories =
        appData.categories || [];

    if (!categories.length)
    {
        container.innerHTML =
            "<p>No categories found.</p>";

        return;
    }

    const grouped = {};

    categories.forEach(category =>
    {
        const type =
            category.budgetType ||
            category["Budget Type"] ||
            "Other";

        if (!grouped[type])
        {
            grouped[type] = [];
        }

        grouped[type].push(category);
    });

    let html = "";

    Object.keys(grouped)
        .sort()
        .forEach(type =>
    {
        html += `
            <div class="category-group">

                <div class="category-group-title">
                    ${type}
                </div>
        `;

        grouped[type]
            .forEach(category =>
        {
            const categoryId =
                category.categoryId ||
                category["Category ID"] ||
                "";

            const categoryName =
                category.categoryName ||
                category["Category Name"] ||
                "Unnamed Category";

            html += `
                <div class="category-manager-row">

                    <div class="category-name">
                        ${categoryName}
                    </div>

                    <button
                        class="btn-secondary"
                        onclick="
                            closeCategoryManagerModal();
                            editCategory('${categoryId}');
                        ">
                        ✏️
                    </button>

                </div>
            `;
        });

        html += `</div>`;
    });

    html += `
        <div class="category-manager-footer">

            <button
                onclick="
                    closeCategoryManagerModal();
                    openCategoryModal();
                ">
                ➕ New Category
            </button>

        </div>
    `;

    container.innerHTML = html;
}
