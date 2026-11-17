# LearnHub – MERN Learning Management System with Live Classes

LearnHub is a full-stack Learning Management System (LMS) built on the MERN stack with interactive Live Classes powered by LiveKit, automated quizzes, Razorpay payment processing, and comprehensive multi-role access control for Students, Instructors, and Administrators.

---

## Architecture & Technology Stack

### Client (`client/`)
- **Framework**: React 19 + Vite 8
- **State Management**: Redux Toolkit & React-Redux
- **Routing**: React Router DOM v7 (with role-based route guards)
- **Live Video Conferencing**: `@livekit/components-react` & `livekit-client`
- **Charts & Visualizations**: Recharts
- **Icons & Feedback**: Lucide React & React Hot Toast
- **HTTP Client**: Axios with dynamic base URL and JWT interceptor

### Server (`server/`)
- **Runtime**: Node.js & Express 5
- **Database**: MongoDB Atlas with Mongoose ODM
- **Authentication**: JWT & bcryptjs password hashing
- **File Uploads**: Multer (configured for high-capacity videos and course images)
- **Video Calling Backend**: LiveKit Server SDK (secure token issuance & waiting rooms)
- **Payment Gateway**: Razorpay (HMAC-SHA256 signature verification)
- **Logging & Security**: Morgan, CORS, Cookie-Parser

---

## Multi-Role Capabilities

### 1. Student
- **Authentication**: Register, login, session restoration.
- **Course Discovery**: Browse published courses, view curricula, explore previews.
- **Enrollment & Payments**: Direct free enrollment or checkout for paid courses via Razorpay with instant verification.
- **Learning Portal**: Interactive video player, mark lessons complete, track dynamic percentage progress.
- **Assessment**: Timed quizzes with server-validated durations, question navigator, and automated scoring.
- **Live Sessions**: Join live video classrooms or wait in real-time waiting rooms.
- **Notifications**: In-app notifications for enrollments, new lessons, quizzes, and live lectures.

### 2. Instructor
- **Course Studio**: Create, edit, publish/unpublish, and delete courses.
- **Curriculum Builder**: Upload lesson videos with progress tracking, set free preview toggles.
- **Quiz Management**: Create, edit, and delete assessments with custom marks, timers, and passing thresholds. View student attempt scores and pass/fail analytics.
- **Live Classroom**: Schedule lectures, broadcast video/audio via LiveKit, manage live calls.
- **Analytics Dashboard**: Recharts-powered student enrollment visualizer, revenue metrics, and course KPIs.
- **Students Directory**: Track individual student progress and lesson completion rates.

### 3. Administrator
- **Platform Governance**: View aggregate KPIs (total users, courses, verified revenue, enrollments).
- **User Management**: Search, filter by role, activate/deactivate accounts.
- **Course Moderation**: Review all platform courses, toggle publishing, remove inappropriate content.
- **Secure Provisioning**: Dedicated server-side admin provisioning script.

---

## Getting Started

### Prerequisites
- Node.js 18+ (tested on Node v20/v24)
- npm or pnpm
- MongoDB Atlas cluster URI
- LiveKit Cloud account (URL, API Key, Secret)
- Razorpay account (Key ID, Secret)

### 1. Backend Configuration
Copy `.env.example` to `server/.env` and supply your credentials:
```bash
cd server
cp .env.example .env
```
Environment variables reference:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/learnhub
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:5173
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_key
LIVEKIT_API_SECRET=your_secret
RAZORPAY_KEY_ID=rzp_test_your_id
RAZORPAY_KEY_SECRET=your_secret
ADMIN_NAME=LearnHub Administrator
ADMIN_EMAIL=admin@learnhub.com
ADMIN_PASSWORD=AdminSecurePassword2026!
```

Install dependencies:
```bash
npm install
```

Seed the initial administrator account:
```bash
node scripts/seedAdmin.js
```

Start the backend server:
```bash
npm run dev
# or for production:
npm start
```

### 2. Frontend Configuration
Copy `.env.example` to `client/.env`:
```bash
cd ../client
cp .env.example .env
```
Environment variables:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Install dependencies and start development server:
```bash
npm install
npm run dev
```

Build for production:
```bash
npm run build
```

---

## API Documentation

### Authentication & Users
- `POST /api/auth/register` - Create student or instructor account
- `POST /api/auth/login` - Authenticate user & return JWT
- `GET /api/users/profile` - Current user profile
- `PUT /api/users/profile` - Update profile bio, avatar, or name
- `GET /api/users/student/stats` - Enrolled student analytics
- `GET /api/users/instructor/stats` - Instructor KPIs & Recharts analytics data
- `GET /api/users/instructor/students` - Enrolled student directory
- `GET /api/users/admin/stats` - Platform-wide statistics (Admin only)
- `GET /api/users/admin/users` - User directory with role filter & search (Admin only)
- `PATCH /api/users/admin/users/:id/status` - Toggle active/deactive status (Admin only)
- `GET /api/users/admin/courses` - All courses for moderation (Admin only)

### Courses & Lessons
- `GET /api/courses` - List published courses
- `GET /api/courses/:id` - Single course details
- `POST /api/courses` - Create course (Instructor/Admin)
- `PUT /api/courses/:id` - Update course (Instructor/Admin)
- `DELETE /api/courses/:id` - Delete course (Instructor/Admin)
- `GET /api/courses/instructor/my-courses` - List instructor's courses
- `POST /api/lessons/:courseId` - Upload lesson video (Multer)
- `GET /api/lessons/:courseId` - Fetch course lessons for enrolled student/instructor

### Enrollments & Progress
- `POST /api/enrollments` - Enroll in course (Free)
- `GET /api/enrollments/my-courses` - List student's enrolled courses
- `PUT /api/enrollments/:id/progress` - Update progress percentage
- `POST /api/enrollments/:courseId/lessons/:lessonId/complete` - Mark lesson complete

### Quizzes
- `POST /api/quizzes` - Create quiz (Instructor/Admin)
- `GET /api/quizzes/instructor/my-quizzes` - List instructor's quizzes with attempt counts
- `GET /api/quizzes/course/:courseId` - Get course quizzes (Student: answers hidden)
- `GET /api/quizzes/:id` - Single quiz details (Owner: with answers, Student: hidden)
- `PUT /api/quizzes/:id` - Update quiz questions & duration (Instructor/Admin)
- `DELETE /api/quizzes/:id` - Delete quiz & attempts (Instructor/Admin)
- `POST /api/quizzes/:quizId/start` - Initiate quiz session & server-side timer
- `POST /api/quizzes/:quizId/submit` - Submit answers with server scoring
- `GET /api/quizzes/my-results` - Student quiz history
- `GET /api/quizzes/:id/attempts` - View student performance & scores (Instructor/Admin)
- `PATCH /api/quizzes/:quizId/publish` - Toggle published status

### Live Classes
- `POST /api/live-classes` - Schedule live lecture (Instructor/Admin)
- `GET /api/live-classes/instructor/my-classes` - List instructor's scheduled classes
- `GET /api/live-classes/upcoming` - List upcoming lectures for enrolled student
- `POST /api/live-classes/:id/join` - Join class or enter waiting room (LiveKit token)
- `PATCH /api/live-classes/:id/status` - Update status (start/end/cancel)
- `DELETE /api/live-classes/:id` - Delete scheduled class

### Payments
- `POST /api/payments/create-order` - Create Razorpay order for paid course
- `POST /api/payments/verify` - Verify HMAC signature & unlock course enrollment
- `GET /api/payments/my-payments` - Student payment history
- `GET /api/payments/admin/all` - Platform revenue records (Admin only)

### Notifications
- `GET /api/notifications` - User in-app notifications
- `PATCH /api/notifications/:id/read` - Mark single notification as read
- `PATCH /api/notifications/read-all` - Mark all notifications as read

---

## Production Deployment

### Frontend (Vercel)
1. Push repository to GitHub/GitLab.
2. In Vercel, import the `client` directory.
3. Configure Environment Variables:
   - `VITE_API_BASE_URL`: `https://your-api-domain.com/api`
4. The included `client/vercel.json` automatically manages client-side SPA routing fallback.

### Backend (Render, Railway, AWS, DigitalOcean)
1. Set root directory to `server`.
2. Build command: `npm install`
3. Start command: `node index.js`
4. Configure all environment variables from `server/.env.example`.
5. For high-scale persistent video and image uploads across ephemeral hosting instances, point `server/uploads` or configure an S3/Cloudinary compatible bucket driver.
