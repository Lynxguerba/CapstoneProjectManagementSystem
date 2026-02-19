import { Link } from "@inertiajs/react";
import logo from "../../images/cpms-logo.png";
import { useState } from "react";

export default function Dashboard() {
  const currentRole: string = "Project Manager";
  const canUpload: boolean = currentRole === "Project Manager" || currentRole === "System Analyst";

  const [docType, setDocType] = useState<string>("Outline");

  // Document type → files mapping with status and sample deadlines
  const docFiles: Record<string, { name: string; status: "Pending" | "Completed"; deadline?: string }[]> = {
    Concept: [
      { name: "Concept Paper", status: "Pending", deadline: "Feb 15, 2026" },
      { name: "Recommendation", status: "Completed", deadline: "Feb 18, 2026" },
      { name: "Acknowledgement Receipt", status: "Pending", deadline: "Feb 20, 2026" },
    ],
    Outline: [
      { name: "Chapter 1-2 Paper", status: "Completed", deadline: "Mar 5, 2026" },
      { name: "Recommendation", status: "Pending", deadline: "Mar 8, 2026" },
      { name: "Acknowledgement Receipt", status: "Completed", deadline: "Mar 10, 2026" },
      { name: "Acceptance Paper", status: "Pending", deadline: "Mar 12, 2026" },
    ],
    "Pre-Deployment": [
      { name: "Recommendation", status: "Pending", deadline: "Apr 1, 2026" },
      { name: "Endorsement", status: "Pending", deadline: "Apr 3, 2026" },
      { name: "Deployment", status: "Pending", deadline: "Apr 5, 2026" },
    ],
    Deployment: [
      { name: "Recommendation", status: "Pending", deadline: "Apr 15, 2026" },
      { name: "Endorsement", status: "Pending", deadline: "Apr 17, 2026" },
      { name: "Deployment", status: "Pending", deadline: "Apr 20, 2026" },
    ],
    Final: [
      { name: "Chapter 1-2", status: "Pending", deadline: "May 1, 2026" },
      { name: "Recommendation", status: "Pending", deadline: "May 3, 2026" },
      { name: "Acknowledgement Receipt", status: "Pending", deadline: "May 5, 2026" },
    ],
  };

  // Calculate progress percentage
  const totalFiles = docFiles[docType].length;
  const completedFiles = docFiles[docType].filter(f => f.status === "Completed").length;
  const progressPercent = Math.round((completedFiles / totalFiles) * 100);

  // Group members
  const members = [
    { name: "Juan", role: "Project Manager" },
    { name: "Maria", role: "System Analyst" },
    { name: "Carlo", role: "Programmer" },
    { name: "Ana", role: "Documentarian" },
  ];

  // Panelists
  const panelists = [
    { title: "Adviser", name: "Prof. Santos" },
    { title: "Panel Chairman", name: "Dr. Cruz" },
    { title: "Panelist 1", name: "Mr. Ramirez" },
    { title: "Panelist 2", name: "Ms. Lopez" },
  ];

  return (
    <div className="bg-slate-100 min-h-screen flex font-sans text-slate-700">

      {/* SIDEBAR */}
      <aside className="w-56 bg-slate-900 text-slate-100 flex flex-col fixed h-screen shadow-lg">
        <div className="p-6 border-b border-slate-700 text-center">
          <img src={logo} alt="Capstone Logo" className="w-20 h-20 mx-auto mb-3 rounded-full object-cover border-2 border-slate-600 shadow" />
          <h1 className="text-xl font-semibold">Capstone MS</h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link href="/student/dashboard" className="block px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600">📊 Dashboard</Link>
          <Link href="/student/projects" className="block px-4 py-2 rounded-lg hover:bg-slate-700">📁 My Projects</Link>
          <Link href="/student/submissions" className="block px-4 py-2 rounded-lg hover:bg-slate-700">🗂 Submissions</Link>
        </nav>

        <div className="p-4 border-t border-slate-700 text-sm text-slate-400">
          Logged in as <br />
          <span className="font-medium text-slate-200">{currentRole}</span>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-y-auto ml-56">

        {/* TOP BAR */}
        <div className="bg-white border-b px-8 py-4 flex justify-between items-center fixed top-0 left-56 right-0 z-40 shadow">
          <h2 className="text-lg font-semibold text-slate-800">Student Dashboard</h2>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-white font-semibold">
              J
            </div>
            <div className="text-sm leading-tight">
              <p className="font-medium text-slate-800">Juan Dela Cruz</p>
              <p className="text-slate-500 text-xs">BSIT - Group 1</p>
            </div>
          </div>
        </div>

        <div className="p-8 mt-24 space-y-8">

          {/* GROUP MEMBERS */}
          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Group Members</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {members.map(member => (
                <div key={member.name} className="bg-white rounded-xl p-4 shadow hover:shadow-lg transition">
                  <h3 className="font-semibold text-slate-800">{member.name}</h3>
                  <p className="text-sm text-slate-600">{member.role}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CAPSTONE TITLE */}
          <section className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Capstone Title:</h2>
                <p className="text-slate-600 text-sm italic">"Enter Approved Capstone Title Here"</p>
              </div>
              <span className="bg-amber-500 text-white text-xs px-3 py-1 rounded-full h-fit">In Progress</span>
            </div>

            {/* PANELISTS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 text-sm">
              {panelists.map(p => (
                <div key={p.title}>
                  <p className="text-slate-500">{p.title}</p>
                  <p className="font-medium text-slate-800">{p.name}</p>
                </div>
              ))}
            </div>
          </section>

          {/* DEADLINES TRACKER */}
          <section className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Upcoming Deadlines</h2>
            <div className="space-y-3 text-sm">
              {docFiles[docType].map((file) => (
                <div key={file.name} className="flex justify-between items-center bg-slate-50 p-3 rounded-md shadow-sm">
                  <div>
                    <p className="text-slate-700 font-medium">{file.name}</p>
                    {file.deadline && <p className="text-slate-500 text-xs">Deadline: {file.deadline}</p>}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${file.status === "Pending" ? "bg-amber-500 text-white" : "bg-teal-500 text-white"}`}>
                    {file.status}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* DEFENSE SCHEDULE */}
          <section className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Next Defense Schedule</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-50 p-4 rounded-md shadow-sm">
                <p className="text-slate-600">Date:</p>
                <p className="font-medium text-slate-800">March 25, 2026</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-md shadow-sm">
                <p className="text-slate-600">Venue:</p>
                <p className="font-medium text-slate-800">Room 101, GAD Building</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-md shadow-sm">
                <p className="text-slate-600">Time:</p>
                <p className="font-medium text-slate-800">9:00 AM - 11:00 AM</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-md shadow-sm">
                <p className="text-slate-600">Panel:</p>
                <p className="font-medium text-slate-800">Prof. Santos, Dr. Cruz, Mr. Ramirez, Ms. Lopez</p>
              </div>
            </div>
          </section>

          {/* SUBMISSIONS */}
          <section className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Submissions</h2>

            {/* Document Type Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Document Type:</label>
              <select
                value={docType}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDocType(e.target.value)}
                className="border border-slate-300 rounded-md p-2 w-64 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition shadow-sm hover:shadow-md"
              >
                {Object.keys(docFiles).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              {/* Progress Bar */}
              <div className="mt-4">
                <p className="text-sm text-slate-600 mb-1">Completion: {progressPercent}%</p>
                <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                  <div
                    className="h-3 rounded-full transition-all"
                    style={{ width: `${progressPercent}%`, backgroundColor: '#f59e0b' }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Upload Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {docFiles[docType].map(file => (
                <div key={file.name} className="bg-white rounded-xl shadow p-4 border-l-4 border-amber-500 relative">
                  <h3 className="font-semibold mb-2 text-amber-700">{file.name}</h3>
                  <span className={`absolute top-2 right-2 text-white text-xs px-2 py-1 rounded-full font-semibold ${file.status === "Pending" ? "bg-amber-500" : "bg-teal-500"}`}>
                    {file.status}
                  </span>
                  {canUpload ? (
                    <button className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-md text-sm mt-2">
                      Upload / Submit
                    </button>
                  ) : (
                    <button className="bg-slate-400 text-white px-4 py-2 rounded-md text-sm cursor-not-allowed mt-2">
                      View
                    </button>
                  )}
                </div>
              ))}
            </div>

          </section>
        </div>
      </main>
    </div>
  );
}
