import { Link } from "@inertiajs/react";
import logo from "../../images/cpms-logo.png";

export default function MyProjects() {
  const projects = [
    {
      title: "Capstone Project Management System",
      status: "In Progress",
      progress: 65,
    },
  ];

  return (
    <div className="bg-slate-100 min-h-screen flex font-sans text-slate-700">

      {/* SIDEBAR */}
      <aside className="w-56 bg-slate-900 text-slate-100 flex flex-col fixed h-screen shadow-lg">
        <div className="p-6 border-b border-slate-700 text-center">
          <img
            src={logo}
            alt="Capstone Logo"
            className="w-20 h-20 mx-auto mb-3 rounded-full object-cover border-2 border-slate-600 shadow"
          />
          <h1 className="text-xl font-semibold">Capstone MS</h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link
            href="/student/dashboard"
            className="block px-4 py-2 rounded-lg hover:bg-slate-700 transition"
          >
            📊 Dashboard
          </Link>

          <Link
            href="/student/projects"
            className="block px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition"
          >
            📁 My Projects
          </Link>

          <Link
            href="/student/submissions"
            className="block px-4 py-2 rounded-lg hover:bg-slate-700 transition"
          >
            🗂 Submissions
          </Link>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-y-auto ml-56 p-8">
        <h2 className="text-2xl font-semibold text-slate-800 mb-6">
          My Projects
        </h2>

        {/* PROJECT CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.title}
              className="bg-white rounded-2xl shadow-md p-6 hover:shadow-xl transition"
            >
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                {project.title}
              </h3>

              <span className="inline-block bg-amber-500 text-white text-xs px-3 py-1 rounded-full mb-4">
                {project.status}
              </span>

              {/* Progress Bar */}
              <div>
                <p className="text-sm text-slate-600 mb-1">
                  Completion: {project.progress}%
                </p>

                <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                  <div
                    className="h-3 rounded-full bg-amber-500 transition-all"
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* View Button */}
              <button className="mt-5 w-full bg-slate-800 hover:bg-slate-900 text-white py-2 rounded-lg text-sm transition">
                View Project
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
