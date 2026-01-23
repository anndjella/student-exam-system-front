import "./SubjectCard.css";

export function SubjectCard({ subject }) {
  return (
    <div className="subject-card">
      <div className="subject-header">
        <div className="subject-name">{subject.name}</div>
        <div className="subject-code">{subject.code}</div>
      </div>

      <div className="subject-info">
        <span className="pill">{subject.ects} ECTS</span>
      </div>

      <div className="subject-teachers">
        <strong>Teachers:</strong>{" "}
        {subject.teachers.length === 0
          ? "No teachers assigned"
          : subject.teachers.map(t => (
              <span key={t.id}>
                {t.firstName} {t.lastName}{" "}
              </span>
            ))}
      </div>
    </div>
  );
}
