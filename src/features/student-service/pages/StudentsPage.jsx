// import { useCallback, useState } from "react";
// import { useAuth } from "../../../auth/AuthContext";
// import { Modal } from "../../shared/components/Modal";
// import { usePagedQuery } from "../hooks/usePagedQuery";
// import {
//   listStudents,
//   createStudent,
//   updateStudent,
//   deleteStudent,
// } from "../api/studentsSSApi";

// /* helpers */
// function idOf(x) {
//   return x?.id ?? x?.ID;
// }
// function firstNameOf(x) {
//   return x?.firstName ?? x?.FirstName ?? "";
// }
// function lastNameOf(x) {
//   return x?.lastName ?? x?.LastName ?? "";
// }
// function fullNameOf(x) {
//   return `${firstNameOf(x)} ${lastNameOf(x)}`.trim();
// }
// function indexOf(x) {
//   return x?.indexNumber ?? x?.IndexNumber ?? "";
// }
// function dobOf(x) {
//   return x?.dateOfBirth ?? x?.DateOfBirth ?? null;
// }
// function ectsOf(x) {
//   return x?.ectsCount ?? x?.ECTSCount ?? null;
// }
// function gpaOf(x) {
//   return x?.gpa ?? x?.GPA ?? null;
// }
// function fmtDate(v) {
//   if (!v) return "-";
//   return String(v).substring(0, 10); // YYYY-MM-DD
// }
// function fmtGpa(v) {
//   if (v === null || v === undefined) return "-";
//   const n = Number(v);
//   return Number.isFinite(n) ? n.toFixed(2) : "-";
// }

// export function StudentsPage() {
//   const { token, role } = useAuth();
//   const isStudentService = role === "StudentService";

//   const fetcher = useCallback((args) => listStudents(args, token), [token]);
//   const {
//     items,
//     total,
//     query,
//     setQuery,
//     loading,
//     error,
//     reload,
//     loadMore,
//     canLoadMore,
//     take,
//   } = usePagedQuery(fetcher, { take: 20 });

//   const [modalOpen, setModalOpen] = useState(false);
//   const [mode, setMode] = useState("create"); // create | edit
//   const [editing, setEditing] = useState(null);
//   const [saving, setSaving] = useState(false);
//   const [formError, setFormError] = useState("");

//   const [form, setForm] = useState({
//     jmbg: "",
//     firstName: "",
//     lastName: "",
//     indexNumber: "",
//   });

//   function openCreate() {
//     setMode("create");
//     setEditing(null);
//     setFormError("");
//     setForm({ jmbg: "", firstName: "", lastName: "", indexNumber: "" });
//     setModalOpen(true);
//   }

//   function openEdit(s) {
//     setMode("edit");
//     setEditing(s);
//     setFormError("");
//     setForm({
//       jmbg: "",
//       firstName: firstNameOf(s),
//       lastName: lastNameOf(s),
//       indexNumber: indexOf(s),
//     });
//     setModalOpen(true);
//   }

//   function closeModal() {
//     setModalOpen(false);
//     setSaving(false);
//     setFormError("");
//     setEditing(null);
//   }

//   async function onSubmit(e) {
//     e.preventDefault();
//     if (!token) return;

//     setSaving(true);
//     setFormError("");

//     try {
//       if (mode === "create") {
//         await createStudent(
//           {
//             jmbg: form.jmbg,
//             firstName: form.firstName,
//             lastName: form.lastName,
//             indexNumber: form.indexNumber,
//           },
//           token
//         );
//       } else {
//         await updateStudent(
//           idOf(editing),
//           {
//             firstName: form.firstName || null,
//             lastName: form.lastName || null,
//             indexNumber: form.indexNumber || null,
//           },
//           token
//         );
//       }

//       await reload();
//       closeModal();
//     } catch (err) {
//       setFormError(err?.message ?? "Save failed.");
//     } finally {
//       setSaving(false);
//     }
//   }

//   async function onDelete(s) {
//     if (!token) return;
//     if (!window.confirm("Soft delete this student?")) return;

//     try {
//       await deleteStudent(idOf(s), token);
//       await reload();
//     } catch (err) {
//       alert(err?.message ?? "Delete failed.");
//     }
//   }

//   if (!isStudentService) {
//     return (
//       <div className="container">
//         <div className="alert-error">Forbidden</div>
//       </div>
//     );
//   }

//   return (
//     <div className="container">
//       <div className="page-header">
//         <div>
//           <h1 className="page-title">Students</h1>
//           <div className="page-subtitle">Batch loading and search.</div>
//         </div>
//         <button className="btn" onClick={reload} disabled={loading}>
//           Refresh
//         </button>
//       </div>

//       {error && <div className="alert-error" style={{ marginBottom: 12 }}>{error}</div>}

//       <div className="card" style={{ padding: 12, marginBottom: 12 }}>
//         <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
//           <input
//             className="input"
//             style={{ width: 320 }}
//             placeholder="Search by name or index..."
//             value={query}
//             onChange={(e) => setQuery(e.target.value)}
//           />
//           <div style={{ flex: 1 }} />
//           <button className="btn btn-primary" onClick={openCreate}>
//             Add student
//           </button>
//         </div>

//         <div className="page-subtitle" style={{ marginTop: 8 }}>
//           Showing <span className="mono">{items.length}</span> of{" "}
//           <span className="mono">{total}</span>
//         </div>
//       </div>

//       <div className="card" style={{ padding: 12 }}>
//         <div className="table-wrap">
//           <table className="table">
//             <thead>
//               <tr>
//                 <th style={{ width: 70, textAlign: "center" }}>No.</th>
//                 <th>Name</th>
//                 <th style={{ width: 140 }}>Date of birth</th>
//                 <th style={{ width: 220 }}>Index number</th>
//                 <th style={{ width: 110 }}>ECTS</th>
//                 <th style={{ width: 110 }}>GPA</th>
//                 <th style={{ width: 190 }}>Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {loading && items.length === 0 ? (
//                 <tr>
//                   <td colSpan={7} style={{ padding: 10 }}>Loading...</td>
//                 </tr>
//               ) : items.length === 0 ? (
//                 <tr>
//                   <td colSpan={7} style={{ padding: 10 }}>No results.</td>
//                 </tr>
//               ) : (
//                 items.map((s, i) => (
//                   <tr key={idOf(s)}>
//                     <td className="mono" style={{ textAlign: "center" }}>{i + 1}</td>
//                     <td>{fullNameOf(s)}</td>
//                     <td className="mono">{fmtDate(dobOf(s))}</td>
//                     <td className="mono">{indexOf(s)}</td>
//                     <td className="mono">{ectsOf(s) ?? "-"}</td>
//                     <td className="mono">{fmtGpa(gpaOf(s))}</td>
//                     <td>
//                       <div style={{ display: "flex", gap: 8 }}>
//                         <button className="btn" onClick={() => openEdit(s)}>Edit</button>
//                         <button className="btn" onClick={() => onDelete(s)}>Delete</button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>

//         <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center" }}>
//           <button className="btn" onClick={loadMore} disabled={loading || !canLoadMore}>
//             {loading ? "Loading..." : canLoadMore ? "Load more" : "No more"}
//           </button>
//           <span className="badge">Batch: {take}</span>
//         </div>
//       </div>

//       <Modal
//         open={modalOpen}
//         title={mode === "create" ? "Create student" : "Edit student"}
//         onClose={closeModal}
//       >
//         <form onSubmit={onSubmit} style={{ display: "grid", gap: 10, maxWidth: 560 }}>
//           {mode === "create" && (
//             <input
//               className="input"
//               placeholder="JMBG"
//               value={form.jmbg}
//               onChange={(e) => setForm((p) => ({ ...p, jmbg: e.target.value }))}
//               required
//             />
//           )}

//           <input
//             className="input"
//             placeholder="First name"
//             value={form.firstName}
//             onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
//             required={mode === "create"}
//           />
//           <input
//             className="input"
//             placeholder="Last name"
//             value={form.lastName}
//             onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
//             required={mode === "create"}
//           />
//           <input
//             className="input"
//             placeholder="Index number (e.g. 2021/0123)"
//             value={form.indexNumber}
//             onChange={(e) => setForm((p) => ({ ...p, indexNumber: e.target.value }))}
//             required={mode === "create"}
//           />

//           <button className="btn btn-primary" disabled={saving}>
//             {saving ? "Saving..." : mode === "create" ? "Create" : "Save changes"}
//           </button>

//           {formError && <div className="alert-error">{formError}</div>}
//         </form>
//       </Modal>
//     </div>
//   );
// }
import { useAuth } from "../../../auth/AuthContext";
import { StudentsTablePage } from "../../shared/pages/StudentsTablePage";

export function SSStudentsPage() {
  const { role } = useAuth();
  if (role !== "StudentService") {
    return (
      <div className="container">
        <div className="alert-error">Forbidden</div>
      </div>
    );
  }

  return <StudentsTablePage readOnly={false} allowCreate={true} title="Students" />;
}
