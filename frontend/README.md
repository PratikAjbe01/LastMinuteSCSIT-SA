# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

```
frontend
├─ .eslintrc.cjs
├─ index.html
├─ package-lock.json
├─ package.json
├─ postcss.config.js
├─ public
│  ├─ authfavicon.png
│  ├─ lastminute.mp3
│  ├─ lastminute2.mp3
│  ├─ loadinggif.gif
│  └─ vite.svg
├─ README.md
├─ src
│  ├─ App.jsx
│  ├─ components
│  │  ├─ CelebrationEffect.jsx
│  │  ├─ EditProfileModal.jsx
│  │  ├─ FloatingShape.jsx
│  │  ├─ Footer.jsx
│  │  ├─ Header.jsx
│  │  ├─ Input.jsx
│  │  ├─ lazyLoadImage
│  │  │  └─ Img.jsx
│  │  ├─ LoadingSpinner.jsx
│  │  ├─ PasswordStrengthMeter.jsx
│  │  ├─ Testimonials.jsx
│  │  └─ UploadVerify.jsx
│  ├─ context
│  │  └─ ValuesContext.jsx
│  ├─ fileComponents
│  │  ├─ FileViewer.jsx
│  │  ├─ Input.jsx
│  │  ├─ SemesterPage.jsx
│  │  └─ UploadPage.jsx
│  ├─ index.css
│  ├─ main.jsx
│  ├─ pages
│  │  ├─ About.jsx
│  │  ├─ AdminFilesPage.jsx
│  │  ├─ AllFilesPage.jsx
│  │  ├─ AllUsersPage.jsx
│  │  ├─ AttendanceManagerPage.jsx
│  │  ├─ Courses.jsx
│  │  ├─ DashboardPage.jsx
│  │  ├─ DocumentsPage.jsx
│  │  ├─ EmailVerificationPage.jsx
│  │  ├─ ForgotPasswordPage.jsx
│  │  ├─ Home.jsx
│  │  ├─ LeaderBoardPage.jsx
│  │  ├─ LoginPage.jsx
│  │  ├─ ManageTestimonials.jsx
│  │  ├─ PlannerPage.jsx
│  │  ├─ ResetPasswordPage.jsx
│  │  ├─ Semesters.jsx
│  │  ├─ ShareFilePage.jsx
│  │  ├─ SignUpPage.jsx
│  │  ├─ ToolsPage.jsx
│  │  ├─ UploadDocumentPage.jsx
│  │  ├─ UserFilesPage.jsx
│  │  ├─ UserProfilePage.jsx
│  │  └─ VerifyEmailPage.jsx
│  ├─ store
│  │  └─ authStore.js
│  └─ utils
│     ├─ Data.js
│     ├─ date.js
│     └─ urls.js
├─ tailwind.config.js
├─ vercel.json
└─ vite.config.js

```
```
frontend
├─ .eslintrc.cjs
├─ index.html
├─ package-lock.json
├─ package.json
├─ postcss.config.js
├─ public
│  ├─ authfavicon.png
│  ├─ lastminute.mp3
│  ├─ lastminute2.mp3
│  ├─ loadinggif.gif
│  └─ vite.svg
├─ README.md
├─ src
│  ├─ App.jsx
│  ├─ components
│  │  ├─ CelebrationEffect.jsx
│  │  ├─ EditProfileModal.jsx
│  │  ├─ FloatingShape.jsx
│  │  ├─ Footer.jsx
│  │  ├─ Header.jsx
│  │  ├─ Input.jsx
│  │  ├─ lazyLoadImage
│  │  │  └─ Img.jsx
│  │  ├─ LoadingSpinner.jsx
│  │  ├─ PasswordStrengthMeter.jsx
│  │  ├─ Testimonials.jsx
│  │  └─ UploadVerify.jsx
│  ├─ context
│  │  └─ ValuesContext.jsx
│  ├─ fileComponents
│  │  ├─ FileViewer.jsx
│  │  ├─ Input.jsx
│  │  ├─ SemesterPage.jsx
│  │  └─ UploadPage.jsx
│  ├─ index.css
│  ├─ main.jsx
│  ├─ pages
│  │  ├─ About.jsx
│  │  ├─ AdminFilesPage.jsx
│  │  ├─ AllFilesPage.jsx
│  │  ├─ AllUsersPage.jsx
│  │  ├─ AttendanceManagerPage.jsx
│  │  ├─ Courses.jsx
│  │  ├─ DashboardPage.jsx
│  │  ├─ DocumentsPage.jsx
│  │  ├─ EmailVerificationPage.jsx
│  │  ├─ ForgotPasswordPage.jsx
│  │  ├─ Home.jsx
│  │  ├─ LeaderBoardPage.jsx
│  │  ├─ LoginPage.jsx
│  │  ├─ ManageTestimonials.jsx
│  │  ├─ PlannerPage.jsx
│  │  ├─ ResetPasswordPage.jsx
│  │  ├─ Semesters.jsx
│  │  ├─ ShareFilePage.jsx
│  │  ├─ SignUpPage.jsx
│  │  ├─ ToolsPage.jsx
│  │  ├─ UploadDocumentPage.jsx
│  │  ├─ UserFilesPage.jsx
│  │  ├─ UserProfilePage.jsx
│  │  └─ VerifyEmailPage.jsx
│  ├─ store
│  │  └─ authStore.js
│  └─ utils
│     ├─ Data.js
│     ├─ date.js
│     └─ urls.js
├─ tailwind.config.js
├─ vercel.json
└─ vite.config.js

```