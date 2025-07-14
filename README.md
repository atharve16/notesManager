### 📁 `frontend/README.md`

```markdown
# 🖼️ Notes Manager – Frontend

A responsive frontend application built with **Next.js** and **Tailwind CSS** that allows users to manage notes and bookmarks.  
Users can create, view, update, and delete notes and bookmarks, filter them by tags, and search using keywords.

---

## 🔧 Tech Stack

- **Framework:** Next.js (React)
- **Styling:** Tailwind CSS
- **Backend API:** [Notes Manager Backend](../backend)

---

## 📁 Folder Structure

````

frontend/
├── pages/
│   ├── notes/
│   ├── bookmarks/
├── components/
├── styles/
├── public/
├── .env.local
└── README.md

````

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 16.x

### Setup

```bash
git clone https://github.com/yourusername/notes-manager-frontend.git
cd notes-manager-frontend
npm install
touch .env.local
````

### .env.local Example

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

### Start Development Server

```bash
npm run dev
```

App runs at: `http://localhost:3000`

---

## 🖥️ Pages

* `/notes` – List, search, filter, and manage notes
* `/bookmarks` – List, search, filter, and manage bookmarks

---

## ✅ Features

* CRUD for notes and bookmarks
* Filter by tags
* Search by keywords
* Responsive design using Tailwind CSS
* (Optional) Mark as favorite

---

## 🧑‍💻 Author

Made by **Atharve Agrawal**

---

## 📄 License

MIT

```

---