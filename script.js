const STORAGE_KEY = "students";

const form = document.getElementById("studentForm");
const studentsBody = document.querySelector("#dataTable tbody");
const searchInput = document.getElementById("studentSearch");
const formMessage = document.getElementById("formMessage");
const storageMessage = document.getElementById("storageMessage");
const totalMarks = document.getElementById("totalMarks");
const averageMarks = document.getElementById("averageMarks");
const submitButton = form.querySelector('button[type="submit"]');

let students = [];
let editingStudentId = null;

const loadStudents = () => {
  const savedStudents = localStorage.getItem(STORAGE_KEY);
  if (!savedStudents) {
    return [];
  }
  try {
    const parsedStudents = JSON.parse(savedStudents);
    if (!Array.isArray(parsedStudents)) {
      throw new Error("Saved student data must be a list.");
    }
    return parsedStudents;
  } catch (error) {
    console.error("Unable to load saved students:", error);
    return [];
  }
}

const saveStudents=(nextStudents) =>{
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextStudents));
    storageMessage.textContent = "";
    students = nextStudents;
    return true;
  } catch (error) {
    storageMessage.textContent = "Unable to save students";
    console.error("Unable to save students:", error);
    return false;
  }
}

const getGrade = (marks) => {
  if (marks >= 90) return "A";
  if (marks >= 80) return "B";
  if (marks >= 70) return "C";
  if (marks >= 60) return "D";
  return "F";
}

function addCell(row, value) {
  const cell = row.insertCell();
  cell.textContent = value;
  return cell;
}

const renderStudents = () => {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const matchingStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchTerm),
  );
  studentsBody.replaceChildren();

  matchingStudents.forEach((student) => {
    const row = studentsBody.insertRow();
    addCell(row, student.name);
    addCell(row, student.email);
    addCell(row, student.age);
    addCell(row, student.department);
    addCell(row, student.marks);
    addCell(row, getGrade(Number(student.marks)));

    const actions = row.insertCell();
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "Edit";
    editButton.dataset.action = "edit";
    editButton.dataset.studentId = student.id;

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.dataset.action = "delete";
    deleteButton.dataset.studentId = student.id;

    actions.append(editButton, deleteButton);
  });

  const marksSum = students.reduce(
    (sum, student) => sum + Number(student.marks),
    0,
  );
  totalMarks.textContent = marksSum.toFixed(2);
  averageMarks.textContent = students.length
    ? (marksSum / students.length).toFixed(2)
    : "0.00";
}

const setFieldError = (field, message) => {
  document.getElementById(`${field}Error`).textContent = message;
};

const clearErrors = () => {
  ["name", "email", "age", "department", "marks"].forEach((field) =>
    setFieldError(field, ""),
  );
  formMessage.textContent = "";
}

const validateStudent = (student) => {
  let isValid = true;

  if (!student.name) {
    setFieldError("name", "Name is required.");
    isValid = false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!student.email) {
    setFieldError("email", "Email is required.");
    isValid = false;
  } else if (!emailRegex.test(student.email)) {
    setFieldError("email", "Please enter a valid email address.");
    isValid = false;
  }

  if (!student.ageInput) {
    setFieldError("age", "Age is required.");
    isValid = false;
  } else if (
    !Number.isFinite(student.age) ||
    student.age <= 0 ||
    !Number.isInteger(student.age)
  ) {
    setFieldError("age", "Age must be a whole number greater than 0.");
    isValid = false;
  } else if (student.age < 5 || student.age > 100) {
    setFieldError("age", "Age must be between 5 and 100.");
    isValid = false;
  }

  if (!student.department) {
    setFieldError("department", "Department is required.");
    isValid = false;
  }

  if (!student.marksInput) {
    setFieldError("marks", "Marks are required.");
    isValid = false;
  } else if (!Number.isFinite(student.marks) || student.marks <= 0) {
    setFieldError("marks", "Marks must be greater than 0.");
    isValid = false;
  } else if (student.marks > 100) {
    setFieldError("marks", "Marks cannot exceed 100.");
    isValid = false;
  }

  return isValid;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  clearErrors();

  const student = {
    name: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim(),
    ageInput: document.getElementById("age").value.trim(),
    department: document.getElementById("department").value.trim(),
    marksInput: document.getElementById("marks").value.trim(),
  };
  student.age = Number(student.ageInput);
  student.marks = Number(student.marksInput);

  if (!validateStudent(student)) {
    return;
  }

  const nextStudents = editingStudentId
    ? students.map((existingStudent) =>
        existingStudent.id === editingStudentId
          ? { ...student, id: editingStudentId }
          : existingStudent,
      )
    : [
        ...students,
        { ...student, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` },
      ];

  if (saveStudents(nextStudents)) {
    form.reset();
    editingStudentId = null;
    submitButton.textContent = "Add Student";
    formMessage.textContent = "Student details saved.";
    renderStudents();
  }
});

studentsBody.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }

  const student = students.find(
    (item) => item.id === button.dataset.studentId,
  );
  if (!student) {
    return;
  }

  if (button.dataset.action === "edit") {
    document.getElementById("name").value = student.name;
    document.getElementById("email").value = student.email;
    document.getElementById("age").value = student.age;
    document.getElementById("department").value = student.department;
    document.getElementById("marks").value = student.marks;
    editingStudentId = student.id;
    submitButton.textContent = "Update Student";
    formMessage.textContent = `Editing ${student.name}.`;
    document.getElementById("name").focus();
    return;
  }

  if (button.dataset.action === "delete") {
    const nextStudents = students.filter((item) => item.id !== student.id);
    if (saveStudents(nextStudents)) {
      if (editingStudentId === student.id) {
        form.reset();
        editingStudentId = null;
        submitButton.textContent = "Add Student";
      }
      renderStudents();
    }
  }
});

searchInput.addEventListener("input", renderStudents);

students = loadStudents();
renderStudents();
