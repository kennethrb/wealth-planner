// ==================== FILE: accounts.js ====================
document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("addAccountForm");

    if (!form) return;

    form.addEventListener("submit", handleAddAccount);

});

async function handleAddAccount(event) {

    event.preventDefault();

    const name = document.getElementById("accountName").value.trim();
    const netWorthType = document.getElementById("netWorthType").value;
    const assetClass = document.getElementById("accountType").value;
    const openingBalance =
        document.getElementById("openingBalance").value;
    
    const currentBalance =
        openingBalance;

    try {

    const url =
        `${BASE_URL}?action=addAccount`
        + `&name=${encodeURIComponent(name)}`
        + `&netWorthType=${encodeURIComponent(netWorthType)}`
        + `&assetClass=${encodeURIComponent(assetClass)}`
        + `&openingBalance=${encodeURIComponent(openingBalance)}`
        + `&currentBalance=${encodeURIComponent(currentBalance)}`;

        console.log("REQUEST:", url);

        const response = await fetch(url);

        const text = await response.text();

        console.log("RAW RESPONSE:", text);

        const result = JSON.parse(text);

        console.log("RESULT:", result);

        if (!result.success) {
        showStatus(
            "Backend Error",
            "error"
        );
        
        console.error(result);
            return;
        }
        await loadData();
        await refreshUI();
        
        showStatus(
            "Account added successfully",
            "success"
        );
        

    } catch (error) {

        console.error(error);

        showStatus(
            error.message,
            "error"
        );
        
        console.error(error);
    }
}


function loadAccounts() {

    const container =
        document.getElementById("accounts");

    if (!container) return;

    if (!appData.accounts || appData.accounts.length === 0) {

        container.innerHTML = `
            <div class="goal-item">
                <span class="label">
                    No accounts found
                </span>
            </div>
        `;

        return;
    }

    container.innerHTML = `
        <div class="goals-container">

            ${appData.accounts.map(account => {

                const name =
                    account.name ||
                    account.accountName ||
                    "Unnamed Account";

                const balance =
                    Number(
                        account.currentBalance ||
                        account.balance ||
                        0
                    );

                const type =
                    account.netWorthType ||
                    "Asset";

                return `

                    <div class="goal-item">

                        <div class="item-header">

                            <span class="item-title">
                                💳 ${name}
                            </span>

                            <span class="item-value">
                                ${formatCurrency(balance)}
                            </span>

                        </div>

                        <div class="goal-details">

                            <span>
                                Type:
                                <strong class="${
                                    type === "Asset"
                                        ? "text-success"
                                        : "text-danger"
                                }">
                                    ${type}
                                </strong>
                            </span>

                            <div
                                style="
                                    display:flex;
                                    gap:8px;
                                    align-items:center;
                                "
                            >

                                <button
                                    class="btn-secondary"
                                    onclick="editAccount('${account.accountId}')"
                                    title="Edit Account"
                                >
                                    ✏️
                                </button>

                                <button
                                    class="btn-danger"
                                    onclick="deleteAccount('${account.accountId}')"
                                    title="Delete Account"
                                >
                                    🗑
                                </button>

                            </div>

                        </div>

                    </div>

                `;

            }).join("")}

        </div>
    `;
}

async function deleteAccount(accountId) {

    const confirmed =
        await showConfirmDialog(
            "Delete Account",
            "Are you sure you want to delete this account?"
        );

    if (!confirmed) return;

    const response = await fetch(
        `${BASE_URL}?action=deleteAccount`
        + `&accountId=${accountId}`
    );

    const text =
        await response.text();
    
    console.log("DELETE RESPONSE:", text);
    
    const result =
        JSON.parse(text);

    if (!result.success) {

        showStatus(
            "Delete failed",
            "error"
        );

        return;
    }

    await loadData();
    console.log(
        "ACCOUNTS AFTER DELETE:",
        appData.accounts
    );
    await refreshUI();

    showStatus(
        "🗑 Account deleted successfully",
        "success"
    );

}

async function editAccount(accountId) {

    const account =
        appData.accounts.find(
            a => a.accountId === accountId
        );

    if (!account) return;

    const newBalance =
        await showInputDialog(
            "Edit Account Balance",
            account.accountName,
            account.currentBalance
        );

    if (
        newBalance === null ||
        newBalance === ""
    ) {
        return;
    }

    const response = await fetch(
        `${BASE_URL}?action=updateAccount`
        + `&accountId=${accountId}`
        + `&currentBalance=${encodeURIComponent(newBalance)}`
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
        "✅ Account updated successfully",
        "success"
    );

}
