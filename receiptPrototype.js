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

function extractDate(
    text
) {

    const match =
        text.match(
            /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/
        );

    if (!match)
        return "";

    const parts =
        match[0]
        .split(/[\/\-]/);

    const month =
        parts[0]
        .padStart(
            2,
            "0"
        );

    const day =
        parts[1]
        .padStart(
            2,
            "0"
        );

    let year =
        parts[2];

    if (
        year.length === 2
    ) {
        year =
            "20" + year;
    }

    return `${year}-${month}-${day}`;
}

function renderOCRDecisionCard() {

    const card =
        document.getElementById(
            "receiptDecisionCard"
        );

    card.innerHTML =
    `
    <div class="advisor-action success">

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
            OCR Extraction Completed
        </p>

    </div>

    <div class="advisor-action">

        <div class="action-title">
            WHY NOW
        </div>

        <p>
            Receipt details captured automatically
        </p>

    </div>

    <div class="advisor-action success">

        <div class="action-title">
            WEALTH IMPACT
        </div>

        <p>
            Faster transaction capture improves wealth intelligence
        </p>

    </div>

    <div class="advisor-action warning">

        <div class="action-title">
            RISK
        </div>

        <p>
            Verify extracted values before saving
        </p>

    </div>

    <div class="advisor-action">

        <div class="action-title">
            ALTERNATIVE
        </div>

        <p>
            Manual transaction entry
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
