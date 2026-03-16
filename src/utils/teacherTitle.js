export const TEACHER_TITLE_OPTIONS = [
  { value: 1, label: "Assistant professor" },
  { value: 2, label: "Associate professor" },
  { value: 3, label: "Full professor" },
  { value: 4, label: "Professor emeritus" },
];

export function getTeacherTitleLabel(value) {
  const numericValue = Number(value);
  return TEACHER_TITLE_OPTIONS.find((x) => x.value === numericValue)?.label ?? "Unknown";
}