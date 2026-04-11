import { Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ChevronRight, Filter, FolderOpen, GraduationCap, Search, Users } from 'lucide-react';
import React from 'react';

import ProgramChairpersonLayout from './_layout';

type ProgramSetSummary = {
    id: number;
    name: string;
    program: string | null;
    school_year: string | null;
    instructor_name?: string | null;
    students_count?: number;
    groups_count?: number;
    local_groups_count?: number;
    cross_set_groups_count?: number;
};

type ProgramChairConceptTitlesPageProps = {
    programSets?: ProgramSetSummary[];
    assignedProgram?: string | null;
    selectedAcademicYear?: string | null;
};

const normalizeAcademicYearLabel = (value: string): string =>
    value
        .replace(/^A\.?Y\.?\s*/i, '')
        .trim()
        .toLowerCase();

const formatCount = (value: number): string => new Intl.NumberFormat().format(value);

const ProgramChairpersonConceptTitlesPage = () => {
    const page = usePage<ProgramChairConceptTitlesPageProps>();
    const { props } = page;
    const programSets = props.programSets ?? [];
    const assignedProgram = typeof props.assignedProgram === 'string' && props.assignedProgram !== '' ? props.assignedProgram : null;
    const selectedAcademicYear =
        typeof props.selectedAcademicYear === 'string' && props.selectedAcademicYear !== '' ? props.selectedAcademicYear : null;
    const [searchTerm, setSearchTerm] = React.useState('');

    const schoolYearOptions = React.useMemo(() => {
        const schoolYears = programSets
            .map((programSet) => programSet.school_year)
            .filter((schoolYear): schoolYear is string => typeof schoolYear === 'string' && schoolYear.trim() !== '');

        return ['All', ...Array.from(new Set(schoolYears))];
    }, [programSets]);

    const selectedAcademicYearFilter = React.useMemo(() => {
        if (selectedAcademicYear === null || normalizeAcademicYearLabel(selectedAcademicYear) === 'all') {
            return 'All';
        }

        const normalizedSelectedAcademicYear = normalizeAcademicYearLabel(selectedAcademicYear);
        const matchedSchoolYear = schoolYearOptions.find((schoolYear) => normalizeAcademicYearLabel(schoolYear) === normalizedSelectedAcademicYear);

        return matchedSchoolYear ?? selectedAcademicYear;
    }, [schoolYearOptions, selectedAcademicYear]);

    const [selectedSchoolYear, setSelectedSchoolYear] = React.useState(selectedAcademicYearFilter);

    React.useEffect(() => {
        setSelectedSchoolYear(selectedAcademicYearFilter);
    }, [selectedAcademicYearFilter]);

    React.useEffect(() => {
        if (!schoolYearOptions.includes(selectedSchoolYear)) {
            setSelectedSchoolYear('All');
        }
    }, [schoolYearOptions, selectedSchoolYear]);

    const filteredProgramSets = React.useMemo(() => {
        const normalizedSearchTerm = searchTerm.trim().toLowerCase();

        return programSets.filter((programSet) => {
            const schoolYearLabel = programSet.school_year ?? '';
            const matchesSchoolYear =
                selectedSchoolYear === 'All' || normalizeAcademicYearLabel(schoolYearLabel) === normalizeAcademicYearLabel(selectedSchoolYear);
            const matchesSearch =
                normalizedSearchTerm === '' ||
                (programSet.name ?? '').toLowerCase().includes(normalizedSearchTerm) ||
                (programSet.program ?? '').toLowerCase().includes(normalizedSearchTerm) ||
                (programSet.instructor_name ?? '').toLowerCase().includes(normalizedSearchTerm) ||
                schoolYearLabel.toLowerCase().includes(normalizedSearchTerm);

            return matchesSchoolYear && matchesSearch;
        });
    }, [programSets, searchTerm, selectedSchoolYear]);

    const summary = React.useMemo(() => {
        return filteredProgramSets.reduce(
            (totals, programSet) => {
                return {
                    totalProgramSets: totals.totalProgramSets + 1,
                    totalStudents: totals.totalStudents + (programSet.students_count ?? 0),
                    totalGroups: totals.totalGroups + (programSet.groups_count ?? 0),
                };
            },
            {
                totalProgramSets: 0,
                totalStudents: 0,
                totalGroups: 0,
            },
        );
    }, [filteredProgramSets]);

    return (
        <ProgramChairpersonLayout title="Concept Titles" subtitle="Review concept-title program sets scoped to your assigned academic program">
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/program_chairperson/dashboard" className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Dashboard
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-semibold text-slate-800" aria-current="page">
                        Concept Titles
                    </span>
                </nav>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Assigned Program</p>
                        <p className="mt-2 text-2xl font-bold text-slate-900">{assignedProgram ?? 'Not Assigned'}</p>
                        <p className="mt-1 text-xs text-slate-500">Only program sets under this program are shown.</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Visible Program Sets</p>
                        <p className="mt-2 text-2xl font-bold text-slate-900">{formatCount(summary.totalProgramSets)}</p>
                        <p className="mt-1 text-xs text-slate-500">Based on current search and academic-year filter.</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Students / Groups</p>
                        <p className="mt-2 text-2xl font-bold text-slate-900">
                            {formatCount(summary.totalStudents)} / {formatCount(summary.totalGroups)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">Total enrolled students and groups across visible sets.</p>
                    </div>
                </div>

                <div className="">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="Search program set, program, instructor, or school year"
                                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-3 pl-9 text-sm text-slate-700 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                            />
                        </div>
                    </div>
                </div>

                {assignedProgram === null ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
                        <h3 className="text-base font-semibold text-amber-900">Program assignment is required</h3>
                        <p className="mt-2 text-sm text-amber-800">
                            No `program` is assigned to this Program Chairperson account yet. Ask an administrator to assign `BSIT` or `BSIS`.
                        </p>
                    </div>
                ) : filteredProgramSets.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                            <FolderOpen className="h-6 w-6" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-slate-900">No program sets found</h3>
                        <p className="mt-1 text-sm text-slate-500">
                            {searchTerm.trim() !== ''
                                ? 'Try a different search term or clear the academic-year filter.'
                                : `No program sets are currently available for ${assignedProgram}.`}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 text-sm">
                                <thead className="bg-slate-50">
                                    <tr className="text-left text-xs font-semibold tracking-wide text-slate-600 uppercase">
                                        <th className="px-4 py-3">Program Set</th>
                                        <th className="px-4 py-3">Program</th>
                                        <th className="px-4 py-3">Academic Year</th>
                                        <th className="px-4 py-3">Instructor</th>
                                        <th className="px-4 py-3 text-right">Students</th>
                                        <th className="px-4 py-3 text-right">Groups</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredProgramSets.map((programSet) => (
                                        <tr key={programSet.id} className="hover:bg-slate-50/60">
                                            <td className="px-4 py-3">
                                                <div className="flex items-start gap-2">
                                                    <span className="mt-0.5 rounded-lg bg-emerald-100 p-1 text-emerald-700">
                                                        <GraduationCap className="h-4 w-4" />
                                                    </span>
                                                    <div>
                                                        <p className="font-semibold text-slate-900">{programSet.name}</p>
                                                        <p className="text-xs text-slate-500">Program Set ID: {programSet.id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                                    {programSet.program ?? 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-700">{programSet.school_year ?? 'Unspecified'}</td>
                                            <td className="px-4 py-3 text-slate-700">{programSet.instructor_name ?? 'Unassigned'}</td>
                                            <td className="px-4 py-3 text-right font-medium text-slate-800">
                                                <span className="inline-flex items-center gap-1">
                                                    <Users className="h-3.5 w-3.5 text-slate-400" />
                                                    {formatCount(programSet.students_count ?? 0)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-slate-800">
                                                {formatCount(programSet.groups_count ?? 0)}
                                                {(programSet.cross_set_groups_count ?? 0) > 0 ? (
                                                    <span className="ml-1 text-xs text-slate-500">
                                                        ({formatCount(programSet.cross_set_groups_count ?? 0)} cross-set)
                                                    </span>
                                                ) : null}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </motion.section>
        </ProgramChairpersonLayout>
    );
};

export default ProgramChairpersonConceptTitlesPage;
