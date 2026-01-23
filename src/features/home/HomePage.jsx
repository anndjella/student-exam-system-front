import { useAuth } from "../../auth/AuthContext";

export function HomePage() {
  const { role, payload } = useAuth();

  let title = "Home";

  if (role === "Student") title = "Student Home";
  else if (role === "Teacher") title = "Teacher Home";
  else if (role === "StudentService") title = "Student Service Home";

  return (
    <div style={{ padding: 16 }}>
      <h2>{title}</h2>
      <p>
        Welcome,<b>{payload?.uname ?  ` ${payload.uname}` : ""}</b>. Choose an option from the menu.
      </p>
    </div>
  );
}
