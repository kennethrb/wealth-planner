/**
 * QA Utility Framework
 */

const DEBUG_QA = true;

window.qaTraceLog = [];

function logQATrace(
    featureId,
    functionName,
    inputs,
    outputs,
    isPass = true
) {

    if (!DEBUG_QA) return;

    const trace = {
        timestamp: new Date().toISOString(),
        featureId,
        functionName,
        inputs,
        outputs,
        status: isPass ? "PASS" : "FAIL"
    };

    window.qaTraceLog.push(trace);

    console.group(
        `🧪 [QA TRACE] ${featureId} -> ${functionName}`
    );

    console.log("📥 Inputs:", inputs);
    console.log("📤 Outputs:", outputs);
    console.log(
        "🚦 Status:",
        trace.status
    );

    console.groupEnd();
}

function printQASummary() {

    if (!DEBUG_QA) return;

    console.group("📋 QA TRACE SUMMARY");

    console.table(
        window.qaTraceLog.map(t => ({
            Feature: t.featureId,
            Function: t.functionName,
            Status: t.status,
            Time: t.timestamp
        }))
    );

    console.groupEnd();
}

function printQAFailures() {

    if (!DEBUG_QA) return;

    const failures =
        window.qaTraceLog.filter(
            trace => trace.status === "FAIL"
        );

    if (failures.length === 0) {
        console.log(
            "✅ No QA trace failures detected."
        );
        return;
    }

    console.group(
        "🚨 QA FAILURE REPORT"
    );

    console.table(
        failures.map(t => ({
            Feature: t.featureId,
            Function: t.functionName,
            Time: t.timestamp
        }))
    );

    console.groupEnd();
}
