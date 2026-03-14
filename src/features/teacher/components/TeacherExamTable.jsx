import { formatDate, formatDateTime } from "../../../utils/datetime";

function formatGrade(v) {
  if (v === null || v === undefined) return "N.I.";
  if (typeof v === "string" && v.trim() === "") return "N.I.";
  return v;
}

function shortNote(note) {
  const s = (note || "").trim();
  if (!s) return "-";
  return s.length > 40 ? s.slice(0, 40) + "..." : s;
}

function pick(obj, ...keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return "";
}

export default function TeacherExamTable({ exams, showTeacher }) {
  const list = Array.isArray(exams) ? exams : [];

  return (
    <div className="table-wrap">
      <div className="table-pad">
        <table className="table table-compact">
          <thead>
            <tr>
              <th>Student</th>
              <th>Index</th>
              <th>Date</th>
              <th>Grade</th>
              <th>Note</th>
              <th>Signed at</th>
              {showTeacher && <th>Entered by</th>}
            </tr>
          </thead>

          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={showTeacher ? 7 : 6} className="center">
                  No exams
                </td>
              </tr>
            ) : (
              list.map((e) => {
                const id = pick(e, "id", "ID");
                const studentFullName = pick(e, "studentFullName", "StudentFullName");
                const studentIndexNum = pick(e, "studentIndexNum", "StudentIndexNum");
                const examDate = pick(e, "examDate", "ExamDate");
                const grade = pick(e, "grade", "Grade");
                const note = pick(e, "note", "Note");
                const signedAt = pick(e, "signedAt", "SignedAt");
                const enteredByTeacherName = pick(e,"enteredByTeacherName","EnteredByTeacherName"
                );
                const enteredByEmployeeNumber = pick(e,"enteredByEmployeeNumber","EnteredByEmployeeNumber"
                );

                return (
                  <tr key={id}>
                    <td>{studentFullName || "-"}</td>
                    <td className="mono">{studentIndexNum || "-"}</td>
                    <td>{examDate ?? "-"}</td>
                    <td>{formatGrade(grade)}</td>

                    <td className="note-col" title={(note || "").trim()}>
                      {shortNote(note)}
                    </td>

                    <td>{signedAt ? formatDateTime(signedAt) : "-"}</td>

                    {showTeacher && (
                      <td>
                        {enteredByTeacherName
                          ? `${enteredByTeacherName}${
                              enteredByEmployeeNumber
                                ? ` (${enteredByEmployeeNumber})`
                                : ""
                            }`
                          : "-"}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}