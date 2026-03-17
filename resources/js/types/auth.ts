export interface UserRoleOption {
    value: string;
    label: string;
}

export const ROLE_OPTIONS: UserRoleOption[] = [
    { value: 'admin', label: 'Admin' },
    { value: 'student', label: 'Student' },
    { value: 'adviser', label: 'Adviser' },
    { value: 'panelist', label: 'Panelist' },
    { value: 'instructor', label: 'Instructor' },
    { value: 'dean', label: 'Dean' },
    { value: 'program_chairperson', label: 'Program Chair' },
];

export const ROLE_REDIRECTS: Record<string, string> = {
    admin: '/admin/dashboard',
    student: '/student/dashboard',
    adviser: '/adviser/dashboard',
    panelist: '/panelist/dashboard',
    instructor: '/instructor/dashboard',
    dean: '/dean/dashboard',
    program_chairperson: '/program_chairperson/dashboard',
};

export const ROLE_ROUTE_PREFIXES: Record<string, string[]> = {
    admin: ['/admin'],
    student: ['/student'],
    adviser: ['/adviser'],
    panelist: ['/panelist'],
    instructor: ['/instructor'],
    dean: ['/dean'],
    program_chairperson: ['/program_chairperson'],
};

export const normalizeRole = (role: string): string => {
    const normalizedRole = role.trim().toLowerCase().replace(/-/g, '_').replace(/\s+/g, '_');
    const aliases: Record<string, string> = {
        advisor: 'adviser',
        program_chair: 'program_chairperson',
        programchair: 'program_chairperson',
        panel_chair: 'program_chairperson',
        panelchair: 'program_chairperson',
    };

    return aliases[normalizedRole] ?? normalizedRole;
};
