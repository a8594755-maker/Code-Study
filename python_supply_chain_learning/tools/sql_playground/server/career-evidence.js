export class CareerEvidenceError extends Error {
  constructor(message, code = "INVALID_CAREER_EVIDENCE") {
    super(message);
    this.name = "CareerEvidenceError";
    this.code = code;
  }
}

export function validateCareerEvidence(question, payload = {}) {
  const lab = question?.careerLab;
  if (!lab?.requiredEvidence) {
    throw new CareerEvidenceError("這一題沒有必交的 Tool Lab 證據。", "EVIDENCE_NOT_REQUIRED");
  }

  const expectedChecks = (lab.evidenceChecks || []).map((item) => item.id);
  const submittedChecks = [...new Set(
    (Array.isArray(payload.checks) ? payload.checks : [])
      .map((item) => String(item || "").trim())
      .filter(Boolean),
  )];
  const missingChecks = expectedChecks.filter((id) => !submittedChecks.includes(id));
  if (missingChecks.length) {
    throw new CareerEvidenceError("請完成 Tool Lab 的全部證據檢查。", "EVIDENCE_CHECKS_INCOMPLETE");
  }

  const note = String(payload.note || "").trim();
  const minimumCharacters = lab.minimumEvidenceCharacters || 40;
  if (note.length < minimumCharacters) {
    throw new CareerEvidenceError(
      `證據說明至少需要 ${minimumCharacters} 個字，請寫下檔名、檢查結果與你如何驗證。`,
      "EVIDENCE_NOTE_TOO_SHORT",
    );
  }

  return {
    completed: true,
    tool: lab.tool,
    artifact: lab.artifact,
    checks: expectedChecks,
    note: note.slice(0, 2000),
  };
}
