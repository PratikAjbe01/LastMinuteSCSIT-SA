# LastMinute SCSIT - Academic Resource Hub 📚

A full-stack web application designed for the students of the School of Computer Science & IT (SCSIT), Indore. It serves as a centralized platform to access and share academic resources like previous year question papers, notes, and syllabi, making exam preparation more efficient and collaborative.

## ✨ Key Features

  * *Course & Semester Navigation:* Easily browse through all academic programs and their respective semesters.
  * *Categorized Document Viewing:* View files organized by subject and categorized as Question Papers, Notes, or Syllabi.
  * *Advanced Filtering & Search:* A powerful "All Files" page with client-side filtering by course, semester, subject, year, category, and file type, plus a real-time search by name.
  * *Secure In-App File Viewer:* A custom-built viewer for images and PDFs with controls for zoom and rotation. Right-click and download are disabled to protect content.
  * *Mobile-First Responsive Design:* A seamless experience across all devices, from desktops to mobile phones.
  * *Smooth Animations:* Built with Framer Motion for a fluid and modern user experience.

### 🔐 Admin Features

  * *Secure Authentication:* Admins can log in to access protected routes and management features.
  * *Detailed File Upload:* An intuitive form for uploading files with all necessary metadata (course, subject, year, etc.).
  * *File Management Dashboard:* A dedicated "My Files" page where admins can view, edit (name/year), and delete their own uploads.

-----

## 🛠 Tech Stack

### *Frontend*

  * *Framework:* React
  * *Routing:* React Router
  * *Styling:* Tailwind CSS
  * *Animation:* Framer Motion
  * *State Management:* Zustand
  * *Icons:* Lucide React
  * *HTTP Client:* Fetch API

### *Backend*

  * *Framework:* Node.js with Express
  * *Database:* MongoDB with Mongoose
  * *File Storage:* Cloudinary
  * *Authentication:* JWT (JSON Web Tokens)
  * *File Handling:* Multer for multipart/form-data

-----

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### *Prerequisites*

  * Node.js (v18 or later)
  * npm or yarn
  * MongoDB (local instance or a cloud URI from MongoDB Atlas)
  * A Cloudinary account for file storage

-----

## 📝 API Endpoints

Here are the main API routes used in the application:

| Method | Route                               | Description                                     | Protected |
| :----- | :---------------------------------- | :---------------------------------------------- | :-------- |
| POST | /api/files/upload                 | Upload a new file.                              | Admin     |
| GET  | /api/files/fetchAllFiles          | Get a list of all files for the public.         | No        |
| POST | /api/files/fetchFilesCourseAndSemester | Get files for a specific course and semester. | No        |
| POST | /api/files/adminfiles             | Get all files uploaded by the logged-in admin.  | Admin     |
| PUT  | /api/files/update                 | Update a file's metadata (name, year).          | Admin     |
| POST | /api/files/delete                 | Delete a file from database and Cloudinary.     | Admin     |
| GET  | /api/files/proxy                  | Proxy for serving PDF files inline.             | No        |

-----

## 📄 License

This project is licensed under the MIT License - see the LICENSE.md file for details.