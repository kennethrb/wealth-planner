// ====================
// receiptPrototype.js
// OCR Prototype V0.1
// ====================

document.addEventListener("DOMContentLoaded", () => {

    document
        .getElementById("openReceiptModal")
        ?.addEventListener(
            "click",
            openReceiptModal
        );

    document
        .getElementById("receiptImage")
        ?.addEventListener(
            "change",
            previewReceipt
        );

});

function openReceiptModal() {

    loadOCRCategories();

    loadOCRAccounts();

    document
        .getElementById(
            "receiptModal"
        )
        ?.classList
        .add("show");
}

function closeReceiptModal() {

    document
        .getElementById("receiptModal")
        ?.classList
        .remove("show");

    document
        .getElementById("receiptImage").value = "";

    document
        .getElementById("receiptPreview").style.display = "none";

    document
        .getElementById("receiptDecisionCard").innerHTML = "";
}

function previewReceipt(event) {

    const file =
        event.target.files[0];

    if (!file) return;

    const reader =
        new FileReader();

    reader.onload = function(e) {

        const img =
            document.getElementById(
                "receiptPreview"
            );

        img.src =
            e.target.result;

        img.style.display =
            "block";

        simulateOCR();
    };

    reader.readAsDataURL(file);
}

function simulateOCR() {

    const card =
        document.getElementById(
            "receiptDecisionCard"
        );

    card.innerHTML =
        `
        <div class="advisor-action priority">
            <div class="action-title">
                📷 ANALYZING RECEIPT
            </div>

            <p>
                Processing...
            </p>
        </div>
        `;

    setTimeout(() => {

        document.getElementById(
            "ocrMerchant"
        ).value =
            "Tong Yang Venice";

        document.getElementById(
            "ocrAmount"
        ).value =
            4704.86;

        document.getElementById(
            "ocrDate"
        ).value =
            "2026-11-22";

        const account =
            document.getElementById(
                "ocrAccount"
            );
        
        if (
            account &&
            account.options.length > 0
        ){
            account.selectedIndex = 0;
        }

        const category =
            document.getElementById(
                "ocrCategory"
            );

        if (category) {

            for (
                let i = 0;
                i < category.options.length;
                i++
            ) {

                if (
                    category.options[i]
                        .text
                        .toLowerCase()
                        .includes("dining")
                ) {

                    category.selectedIndex = i;
                    break;
                }
            }
        }

        card.innerHTML =
            `
            <div class="advisor-action priority">

                <div class="action-title">
                    RECOMMENDED ACTION
                </div>

                <p>
                    Save Receipt Transaction
                </p>

            </div>

            <div class="advisor-action">

                <div class="action-title">
                    CONFIDENCE
                </div>

                <p>
                    High
                </p>

            </div>

            <div class="advisor-action">

                <div class="action-title">
                    WHY NOW
                </div>

                <p>
                    Transaction detected successfully
                </p>

            </div>

            <div class="advisor-action success">

                <div class="action-title">
                    WEALTH IMPACT
                </div>

                <p>
                    Improves spending intelligence
                </p>

            </div>

            <div class="advisor-action warning">

                <div class="action-title">
                    RISK
                </div>

                <p>
                    Merchant category could be incorrect
                </p>

            </div>
            `;

    }, 1200);
}

function loadOCRCategories() {

    const dropdown =
        document.getElementById(
            "ocrCategory"
        );

    if (!dropdown) return;

    dropdown.innerHTML = "";

    (appData.categories || [])
        .forEach(category => {

            dropdown.innerHTML +=
                `
                <option
                    value="${category.categoryName}">
                    ${category.categoryName}
                </option>
                `;
        });
}

function loadOCRAccounts() {

    const dropdown =
        document.getElementById(
            "ocrAccount"
        );

    if (!dropdown) return;

    dropdown.innerHTML = "";

    (appData.accounts || [])
        .forEach(account => {

            dropdown.innerHTML +=
            `
            <option
                value="${account.accountId}">
                ${account.accountName}
            </option>
            `;
        });
}

function saveReceiptDraft() {

    document.getElementById("txDate").value =
        document.getElementById("ocrDate").value;

    document.getElementById("txAmount").value =
        document.getElementById("ocrAmount").value;

    document.getElementById("txDetails").value =
        document.getElementById("ocrMerchant").value;

    document.getElementById("txAccount").value =
        document.getElementById("ocrAccount").value;

    document.getElementById("txBudgetType").value =
        "Expense";

    toggleTransactionFields();

    document.getElementById("txBudgetPosition").value =
        document.getElementById("ocrCategory").value;

    closeReceiptModal();

    addTransaction();
}

document.addEventListener(
    "DOMContentLoaded",
    () => {

        document
            .getElementById(
                "recordActivityLauncher"
            )
            ?.addEventListener(
                "click",
                openActivityMethodModal
            );

    }
);

function openActivityMethodModal(){

    document
        .getElementById(
            "activityMethodModal"
        )
        ?.classList
        .add("show");
}

function closeActivityMethodModal(){

    document
        .getElementById(
            "activityMethodModal"
        )
        ?.classList
        .remove("show");
}

function openManualTransactionFlow(){

    closeActivityMethodModal();

    openTransactionModal();
}

function openReceiptFlow(){

    closeActivityMethodModal();

    openReceiptModal();
}
