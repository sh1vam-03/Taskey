# taskey

<div align="center">
  <h3>A Collaborative Full-Stack Task Management Platform</h3>
  <p>Streamline your workflow, boost productivity, and achieve your goals</p>
  
  <p>
    <a href="#about">About</a> •
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#team">Team</a> •
    <a href="#contributing">Contributing</a>
  </p>
</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [Development Workflow](#development-workflow)
- [Team](#team)
- [Project Status](#project-status)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [License](#license)
- [Documentation](#documentation)
- [Support](#support)

---

## 📚 Documentation

For detailed technical specifications, please refer to our internal documentation:

- **[📖 Agile Scrum Backlog](docs/scrum_backlog.md)** - Feature roadmap, sprint plans, and task assignments.
- **[🏗️ System Architecture](docs/architecture.md)** - High-level design, context diagrams, and tech stack details.
- **[📡 API Reference](docs/api_reference.md)** - Endpoints, request/response schemas, and error codes.
- **[🗄️ Database Schema](docs/database_schema.md)** - ER Diagrams, table definitions, and relationships.
- **[🧪 Testing Strategy](docs/testing_strategy.md)** - QA protocols, testing tools, and coverage goals.

---

## 🎯 Overview

**taskey** is a modern, full-stack task management and productivity tracking application designed to help individuals and teams organize their work efficiently. The platform combines intuitive task management with powerful analytics to provide insights into productivity patterns.

### Key Capabilities

- **Task Management:** Create, organize, and track tasks with ease
- **Activity Tracking:** Monitor progress with date-based activity logs
- **Smart Categorization:** Organize tasks by Work, Study, Personal, and custom categories
- **Productivity Analytics:** Visualize your performance through interactive dashboards
- **Collaborative Ready:** Built with team workflows in mind

This project serves as both a **functional productivity solution** and a **comprehensive learning resource** for aspiring full-stack developers, making it an ideal portfolio piece for internships and entry-level positions.

---

## ✨ Features

### Current Features

- ✅ User authentication system (signup & login)
- ✅ Full CRUD operations for tasks
- ✅ Task categorization with custom labels
- ✅ Activity status tracking
- ✅ Date-based filtering and task history
- ✅ RESTful API architecture
- ✅ Responsive design

### Upcoming Features

- 🔄 Productivity dashboard with charts
- 🔄 Real-time notifications
- 🔄 Team collaboration tools
- 🔄 Advanced filtering and search
- 🔄 Task priority management

---

## 📁 Project Structure

```

taskey/
├── frontend/ # Next.js frontend application
│ ├── components/ # Reusable React components
│ ├── pages/ # Next.js pages and routing
│ ├── styles/ # CSS and styling files
│ └── utils/ # Utility functions and helpers
│
├── backend/ # Node.js + Express backend API
│ ├── controllers/ # Request handlers
│ ├── models/ # Database models
│ ├── routes/ # API route definitions
│ ├── middleware/ # Custom middleware
│ └── config/ # Configuration files
│
├── docs/ # Documentation and specifications
│ ├── api/ # API documentation
│ └── architecture/ # System architecture docs
│
├── .gitignore # Git ignore rules
├── LICENSE # MIT License
└── README.md # Project documentation

```

---

## 🛠️ Tech Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| **Next.js** | React framework for production |
| **Tailwind CSS** | Utility-first CSS framework |
| **HTML5/CSS3** | Core web technologies |
| **Axios** | HTTP client for API requests |

### Backend

| Technology | Purpose |
|------------|---------|
| **Node.js** | JavaScript runtime environment |
| **Express.js** | Web application framework |
| **JWT** | Authentication and authorization |
| **bcrypt** | Password hashing |

### Database

- **PostgreSQL** or **MongoDB** (Implementation in progress)
- **Sequelize/Mongoose** for ORM/ODM

### Development Tools

- **Git & GitHub** - Version control and collaboration
- **Postman** - API development and testing
- **ESLint** - Code linting and formatting
- **dotenv** - Environment variable management

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher) or **yarn**
- **Git** (v2.30.0 or higher)
- **Code Editor** (VS Code recommended)

### Backend Setup

1. Navigate to the backend directory:
```
cd backend
```


2. Install dependencies:
```
npm install
```


3. Create a `.env` file (see [Environment Variables](#environment-variables))

4. Start the development server:
```
npm run dev
```


5. Verify the server is running:
- Server URL: `http://localhost:5000`
- Health check: `GET http://localhost:5000/api/health`

### Frontend Setup

1. Navigate to the frontend directory:
```
cd frontend
```


2. Install dependencies:
```
npm install
```


3. Start the development server:
```
npm run dev
```


4. Open your browser and visit:
```
http://localhost:3000
```


---

## 🔐 Environment Variables

Create a `.env` file in the **backend** directory with the following variables:
```
# Server Configuration
PORT=5000
NODE_ENV=development

# Database (to be configured)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=taskey_db
DB_USER=your_username
DB_PASSWORD=your_password

# JWT Configuration (to be added)
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```


> **Note:** Never commit your `.env` file to version control. It's already included in `.gitignore`.

---

## 🔄 Development Workflow

### Architecture

- **Frontend and backend** are developed as separate, independent services
- **RESTful APIs** expose backend functionality to the frontend
- **JSON** is used for data exchange between client and server

### Git Workflow

1. Create a new branch for each feature:
```
git checkout -b feature/task-categories
```


2. Make your changes and commit regularly:
```
git add .
git commit -m "Add: task category filtering"
```


3. Push your branch:
```
git push origin feature/task-categories
```


4. Open a Pull Request for review

### Branch Naming Convention

- `feature/feature-name` - New features
- `bugfix/issue-description` - Bug fixes
- `hotfix/critical-fix` - Urgent production fixes
- `docs/update-description` - Documentation updates

### Commit Message Format

- Brief description
- More detailed explanation if needed
- Use bullet points for multiple changes


**Types:** Add, Update, Fix, Remove, Refactor, Docs, Style, Test

---

## 👥 Team

Tasky is a collaborative, real-world project developed by a small team of student developers. The focus is on **clean backend architecture, practical frontend development, API design, testing, and documentation**, aligned with internship and entry-level industry expectations.

---

<table align="center">
  <tr>
    <!-- Atharv -->
    <td align="center" width="33%">
      <img src="https://github.com/atharvkundalkar.png" width="110" alt="Atharv Kundalkar" /><br /><br />
      <strong>Atharv Kundalkar</strong><br />
      <sub>Frontend Developer</sub><br /><br />
      <div align="left">
        • UI / UX Implementation<br />
        • Reusable Component Design<br />
        • Responsive Layouts<br />
        • Frontend API Integration
      </div><br />
      <a href="https://github.com/atharvkundalkar">GitHub</a> |
      <a href="https://linkedin.com/in/atharv-kundalkar-52467028b">LinkedIn</a> |
      <a href="https://instagram.com/atharvkundalkar_47">Instagram</a><br />
      <sub>📧 atharvkundalkar1@gmail.com</sub>
    </td>
    <!-- Balaji -->
    <td align="center" width="33%">
      <img src="https://github.com/sh1vam-03.png" width="110" alt="Balaji Bokare" /><br /><br />
      <strong>Balaji Bokare</strong><br />
      <sub>Backend Developer</sub><br /><br />
      <div align="left">
        • REST API Development<br />
        • Authentication & Security<br />
        • Database Design & Queries<br />
        • Testing, Debugging & Documentation
      </div><br />
      <a href="https://github.com/sh1vam-03">GitHub</a> |
      <a href="https://linkedin.com/in/sh1vam~03">LinkedIn</a> |
      <a href="https://instagram.com/sh1vam_03">Instagram</a><br />
      <sub>📧 l1acker03@gmail.com</sub>
    </td>
    <!-- Dinesh -->
    <td align="center" width="33%">
      <img src="https://github.com/Dinesh-more99.png" width="110" alt="Dinesh More" /><br /><br />
      <strong>Dinesh More</strong><br />
      <sub>Frontend Developer</sub><br /><br />
      <div align="left">
        • UI Development & Styling<br />
        • Frontend–Backend Coordination<br />
        • UI Testing & Bug Fixes<br />
        • Layout & Usability Improvements
      </div><br />
      <a href="https://github.com/Dinesh-more99">GitHub</a> |
      <a href="https://linkedin.com/in/dinesh~more">LinkedIn</a> |
      <a href="https://instagram.com/dineshmore5523">Instagram</a><br />
      <sub>📧 dineshmore9970@gmail.com</sub>
    </td>
  </tr>
</table>

---

### 🤝 Collaboration & Workflow

- Clear role ownership with cross-support
- GitHub-based collaboration (issues, commits, pull requests)
- Focus on clean code, learning, and maintainability
- Designed as a **portfolio-ready project** for internships & junior developer roles

---

### 🚀 Open for Opportunities

We are open to:
- Internship & entry-level roles  
- Open-source collaboration  
- Feedback, reviews, and mentorship  

Feel free to reach out through GitHub or LinkedIn.

---

### How to Contribute

1. **Fork the repository**
   - Click the "Fork" button at the top right of this page

2. **Clone your fork**
```
git clone https://github.com/your-username/taskey.git
cd taskey
```


3. **Create a feature branch**
```
git checkout -b feature/amazing-feature
```


4. **Make your changes**
- Write clean, readable code
- Follow the existing code style
- Add comments where necessary

5. **Commit your changes**
```
git commit -m "Add: amazing feature description"
```


6. **Push to your branch**
```
git push origin feature/amazing-feature
```


7. **Open a Pull Request**
- Provide a clear description of your changes
- Link any related issues

### Code Style Guidelines

- Use meaningful variable and function names
- Keep functions small and focused
- Write self-documenting code
- Add comments for complex logic
- Follow ESLint rules

### Reporting Issues

Found a bug or have a suggestion? [Open an issue](https://github.com/sh1vam/taskey/issues) with:
- Clear title and description
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Screenshots if applicable

---

## 🗺️ Roadmap

### Phase 1: Foundation (Current)
- ✅ Project setup and initialization
- 🔄 User authentication and authorization
- 🔄 Core task CRUD operations
- 🔄 Basic activity tracking

### Phase 2: Enhanced Features
- ⏳ Database integration (PostgreSQL/MongoDB)
- ⏳ Advanced task filtering and search
- ⏳ Task priority and deadline management
- ⏳ User profile management

### Phase 3: Analytics & Insights
- ⏳ Productivity dashboard with visualizations
- ⏳ Weekly/monthly reports
- ⏳ Goal tracking and progress monitoring
- ⏳ Performance analytics

### Phase 4: Collaboration
- ⏳ Team workspaces
- ⏳ Task assignment and sharing
- ⏳ Real-time notifications
- ⏳ Activity feed

### Phase 5: Production Ready
- ⏳ Comprehensive testing suite
- ⏳ Performance optimization
- ⏳ Security hardening
- ⏳ Deployment documentation
- ⏳ CI/CD pipeline setup

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### What this means:
- ✅ Commercial use allowed
- ✅ Modification allowed
- ✅ Distribution allowed
- ✅ Private use allowed
- ℹ️ Attribution required
- ℹ️ License and copyright notice must be included

---

## 💬 Support

### Getting Help

- 📖 **Documentation:** Check the `/docs` folder for detailed guides
- 🐛 **Bug Reports:** [Open an issue](https://github.com/sh1vam-03/taskey/issues)
- 💡 **Feature Requests:** [Start a discussion](https://github.com/sh1vam-03/taskey/discussions)
- 👥 **Team Contact:** Reach out to any team member via their social links above

### Show Your Support

If you find this project helpful:
- ⭐ **Star this repository** to show your support
- 🍴 **Fork it** to build your own version
- 📢 **Share it** with others who might benefit
- 🤝 **Contribute** to make it even better

---

## 🏆 Acknowledgments

Special thanks to:
- Our mentors and instructors who guided us throughout this project
- The open-source community for inspiration and resources
- Everyone who has contributed to making this project better

---

<div align="center">
<p><strong>Built with ❤️ by the taskey Team</strong></p>
<p>Making productivity simple and accessible for everyone</p>

<br>

<p>
 <a href="https://github.com/atharvkundalkar">Developer 1</a> •
 <a href="https://github.com/sh1vam-03">Developer 2</a> •
 <a href="https://github.com/Dinesh-more99">Developer 3</a>
</p>

<br>

<p>
 <a href="#taskey">Back to Top ↑</a>
</p>
</div>