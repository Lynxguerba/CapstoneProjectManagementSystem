export type RequirementStage = 'Concept' | 'Outline' | 'Pre-Deployment' | 'Deployment' | 'Final';

const baseRequirementTypeOptions = [
    'Concept Papers',
    'Project Outline',
    'Manuscript',
    'Minutes',
    'Recommendation Letter',
    'Acknowledgement Receipt',
    'Evaluation Sheet',
];

export const getRequirementTypeOptions = (stage: RequirementStage, currentRequirementType?: string | null): string[] => {
    let options = baseRequirementTypeOptions;

    if (stage === 'Outline') {
        options = options.filter((option) => option !== 'Concept Papers');
    }

    const normalizedCurrentRequirementType = currentRequirementType?.trim() ?? '';

    if (normalizedCurrentRequirementType !== '' && !options.includes(normalizedCurrentRequirementType)) {
        return [normalizedCurrentRequirementType, ...options];
    }

    return options;
};
