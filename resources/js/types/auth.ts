export interface UserRoleOption {
    value: string;
    label: string;
}

export const ROLE_OPTIONS: UserRoleOption[] = [
    { value: 'student', label: 'Student' },
    { value: 'adviser', label: 'Adviser' },
    { value: 'panelist', label: 'Panelist' },
    { value: 'instructor', label: 'Instructor' },
    { value: 'dean', label: 'Dean' },
    { value: 'program_chairperson', label: 'Program Chair' },
];
