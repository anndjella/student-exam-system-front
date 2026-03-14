
# Student Exam System - Frontend

This repository contains the **React frontend** for the Student Exam System.

The application communicates with the backend REST API and provides role‑based interfaces for students, teachers, and student service staff.

Backend repository:
https://github.com/anndjella/student-exam-system

---

# Technology Stack

- React
- React Router
- Vite
- JavaScript
- CSS

---

# Application Structure

The frontend is organized by **features and roles**.

src
 ├── api
 ├── auth
 ├── features
 │   ├── student
 │   ├── teacher
 │   ├── student-service
 │   ├── shared
 │   └── home
 ├── utils
 ├── styles

Each feature contains its own components, hooks, and API communication logic.

---

# Authentication

Authentication is implemented using **JWT tokens**.

The login response contains:

- user role
- person identifier
- username
- mustChangePassword flag

The token is stored in **sessionStorage**.

Users are required to change their password on first login.

---

# System Roles

The system supports three user roles:

- Student Service
- Teacher
- Student

All users can also access their **profile page** where they can view their account information.

# API Communication

The frontend communicates with the backend REST API.

Example base URL:

http://localhost:5000

A custom API client is used to normalize server and network errors.

---

# Running the Project

Install dependencies:

npm install

Start development server:

npm run dev

The application will run at:

http://localhost:5173