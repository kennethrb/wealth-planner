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
    const currentBalance = document.getElementById("openingBalance").value;

    try {

        const url =
            `${BASE_URL}?action=addAccount`
            + `&name=${encodeURIComponent(name)}`
            + `&netWorthType=${encodeURIComponent(netWorthType)}`
            + `&assetClass=${encodeURIComponent(assetClass)}`
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

    if (
        !appData.accounts ||
        appData.accounts.length === 0
    ) {

        container.innerHTML = `
            <div class="goal-item">
                No accounts found
            </div>
        `;

        return;
    }

    container.innerHTML =
        appData.accounts.map(account => `

            <div class="goal-item">

                <div class="item-header">
                    <strong>
                        ${account.accountName}
                    </strong>

                    <span>
                        ${formatCurrency(
                            account.currentBalance
                        )}
                    </span>
                </div>

                <div class="goal-details">

                    <span>
                        ${account.netWorthType}
                    </span>

                    <div
                        style="
                            display:flex;
                            gap:8px;
                        "
                    >

                        <button
                            class="btn-secondary"
                            onclick="editAccount(
                                '${account.accountId}'
                            )"
                        >
                            ✏️ Edit
                        </button>

                        <button
                            class="btn-danger"
                            onclick="deleteAccount(
                                '${account.accountId}'
                            )"
                        >
                            🗑 Delete
                        </button>

                    </div>

                </div>

            </div>

        `).join("");

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

    const result = await response.json();

    if (!result.success) {

        showStatus(
            "Delete failed",
            "error"
        );

        return;
    }

    await loadData();
    loadAccounts();

    showStatus(
        "Account deleted successfully",
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
        prompt(
            "New Balance",
            account.currentBalance
        );

    if (newBalance === null) return;

    const response = await fetch(
        `${BASE_URL}?action=updateAccount`
        + `&accountId=${accountId}`
        + `&currentBalance=${newBalance}`
    );

    const result = await response.json();

    if (!result.success) {
    showStatus(
        "Update failed",
        "error"
    );
        return;
    }

    await loadData();

    loadAccounts();
}
