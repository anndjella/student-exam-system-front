import {formatDate,formatDateTime} from "../../../utils/datetime";
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
                <td colSpan={showTeacher ? 6 : 5} className="center">
                  No exams
                </td>
              </tr>
            ) : (
              list.map((e) => {
                const id = e.id ?? e.ID;

                return (
                  <tr key={id}>
                    <td>{e.studentFullName}</td>
                    <td className="mono">{e.studentIndexNum}</td>
                    <td>{e.examDate ?? "-"}</td>
                    <td>{formatGrade(e.grade)}</td>

                    <td
                      className="note-col"
                      title={(e.note || "").trim()}
                    >
                      {shortNote(e.note)}
                    </td>
                    <td>{e.signedAt ? formatDateTime(e.signedAt) : "-"}</td>

                    {showTeacher && (
                      <td>
                        {e.enteredByTeacherName
                          ? `${e.enteredByTeacherName} (${e.enteredByEmployeeNumber ?? "-"})`
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