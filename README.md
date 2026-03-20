# Capstone Projects Management System (CPMS)

![Capstone Projects Management System Hero](docs/images/readme-hero-1.png)

A centralized platform for Davao del Norte State College to manage the full capstone lifecycle. CPMS streamlines how students, advisers, and instructors collaborate from initial concept submission through review, revisions, approvals, and final archiving. It provides role-based workflows, program set organization, and academic year tracking so capstone delivery is structured, transparent, and measurable.

![CPMS Multi-Device Preview](docs/images/readme-hero-2.png)

**Concept**
CPMS is built to remove the friction in capstone coordination. It organizes students into groups, links them with advisers, and provides a clear submission and review trail for capstone artifacts. The system focuses on a clean, green-themed UI and concise workflows to reduce administrative overhead and help students ship quality projects.

**Key Capabilities**
- Group management with adviser assignment and reassignment flows.
- Concept submission review with approve, request revision, and reject actions.
- Program set and academic year organization for cohort-based tracking.
- Role-based views for students, advisers, and instructors.
- Consistent, modal-driven UI for confirmations and approvals.

**Tech Stack (Based on This Repository)**
- Backend: Laravel 12, PHP 8.2+, Inertia.js v2, Laravel Wayfinder.
- Frontend: React 19, TypeScript, Tailwind CSS 4, Vite.
- UI/UX: MUI, Framer Motion, Lucide Icons.
- Tooling: ESLint, Prettier, Laravel Pint, Pest.
- Data: Relational database via Laravel Eloquent (configured in `.env`).

**Project Structure**
- `app/` Laravel application logic (controllers, models, policies).
- `routes/` HTTP routes for web and role-specific modules.
- `resources/js/pages/` Inertia React pages per role.
- `resources/js/components/` Shared React components and modals.
- `database/` Migrations, factories, and seeders.
- `public/` Static assets.
- `tests/` Pest tests.

**Local Development**
- Install dependencies and build assets: `composer run setup`.
- Run the app with Vite and queue worker: `composer run dev`.

---

If you move or rename the images, update the paths in this README.
