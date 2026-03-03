import { useMe } from "../hooks/useMe";
import { formatDate } from "../../../utils/datetime";

function titleToText(title) {
  switch (title) {
    case 1:
      return "Assistant Professor";
    case 2:
      return "Associate Professor";
    case 3:
      return "Full Professor";
    case 4:
      return "Professor Emeritus";
    default:
      return "-";
  }
}

export function MePage() {
  const { me, loading, error, reload } = useMe();

  const isStudent = Boolean(me?.indexNumber);
  const isTeacher = Boolean(me?.employeeNumber);

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <div className="page-subtitle">Your account details.</div>
        </div>
        <button className="btn" onClick={reload} disabled={loading}>
          Refresh
        </button>
      </div>

      {loading && <div className="page-subtitle">Loading...</div>}
      {!loading && error && <div className="alert-error">{error}</div>}

      {!loading && !error && me && (
        <div className="card" style={{ padding: 12 }}>
          <div className="table-wrap">
            <table className="table profile-table" >
              <tbody>
                <tr>
                  <th style={{ width: 220 }}>First name</th>
                  <td>{me.firstName || "-"}</td>
                </tr>
                <tr>
                  <th>Last name</th>
                  <td>{me.lastName || "-"}</td>
                </tr>
                <tr>
                  <th>JMBG</th>
                  <td className="mono">{me.jmbg || "-"}</td>
                </tr>
                <tr>
                  <th>Date of birth</th>
                  <td>{formatDate(me.dateOfBirth)}</td>
                </tr>

                {/* Student-only */}
                {isStudent && (
                  <tr>
                    <th>Index number</th>
                    <td className="mono">{me.indexNumber}</td>
                  </tr>
                )}

                {/* Teacher-only */}
                {isTeacher && (
                  <>
                    <tr>
                      <th>Employee number</th>
                      <td className="mono">{me.employeeNumber}</td>
                    </tr>
                    <tr>
                      <th>Title</th>
                      <td>{titleToText(me.title)}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
