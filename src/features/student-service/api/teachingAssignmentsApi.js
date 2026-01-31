import { apiFetchJson } from "../../../api/client";

export async function createTeachingAssignment({ teacherId, subjectId, canGrade }, token) {
  return await apiFetchJson(
    "/api/teaching-assignments",
    {
      method: "POST",
      body: JSON.stringify({
        TeacherID: teacherId,
        SubjectID: subjectId,
        CanGrade: Boolean(canGrade),
      }),
    },
    token
  );
}

export async function updateCanGrade({ teacherId, subjectId, canGrade }, token) {
  return await apiFetchJson(
    `/api/teaching-assignments/teacher/${teacherId}/subject/${subjectId}/can-grade`,
    {
      method: "PUT",
      body: JSON.stringify({
        TeacherID: teacherId,
        SubjectID: subjectId,
        CanGrade: Boolean(canGrade),
      }),
    },
    token
  );
}

export async function deleteTeachingAssignment(teacherId, subjectId, token) {
  return await apiFetchJson(
    `/api/teaching-assignments/teacher/${teacherId}/subject/${subjectId}`,
    { method: "DELETE" },
    token
  );
}

export async function findTeacherByEmployeeNumber(employeeNumber, token) {
  const raw = (employeeNumber || "").trim();
  const parts = raw.split("/");
  if (parts.length !== 2) throw new Error("Employee number must be in format YYYY/NNNN.");

  const year = Number(parts[0]);
  const number = Number(parts[1]);

  if (!Number.isInteger(year) || year < 1900) throw new Error("Invalid year in employee number.");
  if (!Number.isInteger(number) || number < 0) throw new Error("Invalid number in employee number.");

  return await apiFetchJson(`/api/teachers/year/${year}/number/${number}`, { method: "GET" }, token);
}
