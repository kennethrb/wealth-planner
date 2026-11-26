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

    resetReceiptForm();
}

function resetReceiptForm() {

    const preview =
        document.getElementById(
            "receiptPreview"
        );

    document.getElementById(
        "receiptImage"
    ).value = "";

    preview.src = "";
    preview.style.display = "none";

    document.getElementById(
        "receiptDecisionCard"
    ).innerHTML = "";

    document.getElementById(
        "ocrMerchant"
    ).value = "";

    document.getElementById(
        "ocrAmount"
    ).value = "";

    document.getElementById(
        "ocrDate"
    ).value = "";

    if (
        document.getElementById(
            "ocrAccount"
        )
    ) {
        document.getElementById(
            "ocrAccount"
        ).selectedIndex = 0;
    }

    if (
        document.getElementById(
            "ocrCategory"
        )
    ) {
        document.getElementById(
            "ocrCategory"
        ).selectedIndex = 0;
    }
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

async function simulateOCR() {

    const file =
        document.getElementById(
            "receiptImage"
        )?.files?.[0];

    if (!file) return;

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
            Reading receipt...
        </p>

    </div>
    `;

    try {

        const result =
            await Tesseract.recognize(
                file,
                "eng"
            );

        const rawText =
            result.data.text || "";

        console.log(
            "OCR RESULT",
            rawText
        );

        populateOCRFields(
            rawText
        );

    } catch(error) {

        console.error(error);

        card.innerHTML =
        `
        <div class="advisor-action danger">

            <div class="action-title">
                OCR FAILED
            </div>

            <p>
                Could not read receipt.
            </p>

        </div>
        `;
    }
}

function populateOCRFields(
    text
) {

    const amount =
        extractAmount(text);

    const merchant =
        extractMerchant(text);

    const date =
        extractDate(text);

    document.getElementById(
        "ocrMerchant"
    ).value =
        merchant;

    document.getElementById(
        "ocrAmount"
    ).value =
        amount;

    document.getElementById(
        "ocrDate"
    ).value =
        date;

    renderOCRDecisionCard();
}

function extractMerchant(
    text
) {

    const lines =
        text.split("\n")
            .filter(
                line =>
                    line.trim()
            );

    if (
        lines.length === 0
    ) {
        return "";
    }

    return lines[0]
        .trim()
        .substring(0,50);
}

function extractAmount(
    text
) {

    const matches =
        text.match(
            /\d{1,3}(,\d{3})*(\.\d{2})/g
        );

    if (
        !matches ||
        !matches.length
    ) {
        return "";
    }

    const values =
        matches.map(
            value =>
                parseFloat(
                    value.replace(
                        /,/g,
                        ""
                    )
                )
        );

    return Math.max(
        ...values
    );
}

function extractDate(text) {

    // Format:
    // 11/22/2026
    // 11-22-2026

    let match =
        text.match(
            /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/
        );

    if (match) {

        const parts =
            match[0]
            .split(/[\/\-]/);

        let month =
            parts[0]
            .padStart(2, "0");

        let day =
            parts[1]
            .padStart(2, "0");

        let year =
            parts[2];

        if (year.length === 2) {
            year = "20" + year;
        }

        return `${year}-${month}-${day}`;
    }

    // Format:
    // NOV 22, 26

    match =
        text.match(
            /\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+\d{1,2},\s*\d{2,4}/i
        );

    if (match) {

        const dateString =
            match[0]
                .toUpperCase()
                .replace(",", "");

        const parts =
            dateString.split(/\s+/);

        const monthMap = {

            JAN: "01",
            FEB: "02",
            MAR: "03",
            APR: "04",
            MAY: "05",
            JUN: "06",
            JUL: "07",
            AUG: "08",
            SEP: "09",
            OCT: "10",
            NOV: "11",
            DEC: "12"

        };

        const month =
            monthMap[parts[0]];

        const day =
            parts[1]
                .padStart(2, "0");

        let year =
            parts[2];

        if (year.length === 2) {
            year = "20" + year;
        }

        return `${year}-${month}-${day}`;
    }

    return "";
}

function renderOCRDecisionCard() {

    const card =
        document.getElementById(
            "receiptDecisionCard"
        );

    card.innerHTML =
    `
    <div class="advisor-action priority">

        <div class="action-title">
            📷 RECEIPT READY
        </div>

        <p>
            Review extracted details and save transaction.
        </p>

    </div>
    `;
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

    document.getElementById(
        "txDate"
    ).value =
    document.getElementById(
        "ocrDate"
    ).value;

    document.getElementById(
        "txAmount"
    ).value =
    document.getElementById(
        "ocrAmount"
    ).value;

    document.getElementById(
        "txDetails"
    ).value =
    document.getElementById(
        "ocrMerchant"
    ).value;

    document.getElementById(
        "txAccount"
    ).value =
    document.getElementById(
        "ocrAccount"
    ).value;

    document.getElementById(
        "txBudgetType"
    ).value =
    "Expense";

    toggleTransactionFields();

    document.getElementById(
        "txBudgetPosition"
    ).value =
    document.getElementById(
        "ocrCategory"
    ).value;

    addTransaction();

    resetReceiptForm();

    document
        .getElementById(
            "receiptModal"
        )
        .classList
        .remove("show");
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
