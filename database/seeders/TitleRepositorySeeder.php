<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\TitleCategory;
use App\Models\TitleRepository;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

class TitleRepositorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $academicYears = [
            ['start_year' => 2022, 'end_year' => 2023, 'label' => 'A.Y 2022-2023', 'is_current' => false],
            ['start_year' => 2023, 'end_year' => 2024, 'label' => 'A.Y 2023-2024', 'is_current' => false],
            ['start_year' => 2024, 'end_year' => 2025, 'label' => 'A.Y 2024-2025', 'is_current' => false],
        ];

        $academicYearByLabel = collect($academicYears)
            ->mapWithKeys(function (array $academicYear): array {
                $record = AcademicYear::query()->updateOrCreate(
                    ['start_year' => $academicYear['start_year'], 'end_year' => $academicYear['end_year']],
                    ['label' => $academicYear['label'], 'is_current' => false],
                );

                return [$academicYear['label'] => $record->id];
            });

        $categories = [
            [
                'program' => 'BSIT',
                'name' => 'Software Development',
                'description' => 'Web, mobile, and progressive web applications.',
            ],
            [
                'program' => 'BSIT',
                'name' => 'Intelligent Systems',
                'description' => 'AI, machine learning, and natural language processing projects.',
            ],
            [
                'program' => 'BSIT',
                'name' => 'Emerging Technologies',
                'description' => 'Blockchain, IoT, and AR/VR implementations.',
            ],
            [
                'program' => 'BSIT',
                'name' => 'Network & Security',
                'description' => 'Network tooling, cybersecurity, and security framework projects.',
            ],
            [
                'program' => 'BSIT',
                'name' => 'Game Development',
                'description' => 'Educational games and simulation-focused software.',
            ],
            [
                'program' => 'BSIS',
                'name' => 'Enterprise Resource Planning (ERP)',
                'description' => 'Integrated systems for business operations and workflows.',
            ],
            [
                'program' => 'BSIS',
                'name' => 'Decision Support Systems (DSS)',
                'description' => 'Analytics and business intelligence decision tools.',
            ],
            [
                'program' => 'BSIS',
                'name' => 'E-Commerce & Digital Markets',
                'description' => 'Digital marketplace, CRM, and supply-chain systems.',
            ],
            [
                'program' => 'BSIS',
                'name' => 'Information Management & Archiving',
                'description' => 'Records digitization, routing, and retrieval platforms.',
            ],
            [
                'program' => 'BSIS',
                'name' => 'Health or Government Informatics',
                'description' => 'EMR, e-governance, and public-service informatics systems.',
            ],
        ];

        $categoryIdByKey = collect($categories)
            ->mapWithKeys(function (array $category): array {
                $record = TitleCategory::query()->updateOrCreate(
                    ['program' => $category['program'], 'name' => $category['name']],
                    ['description' => $category['description']],
                );

                return [$category['program'].'::'.$category['name'] => $record->id];
            });

        $titles = [
            ['title' => 'Barangay Service Request Portal with SMS Alerts', 'program' => 'BSIT', 'category' => 'Software Development', 'ay' => 'A.Y 2023-2024', 'adviser' => 'Prof. Noel Rivera', 'status' => 'Approved'],
            ['title' => 'Campus Asset Tracking Mobile Application', 'program' => 'BSIT', 'category' => 'Software Development', 'ay' => 'A.Y 2024-2025', 'adviser' => 'Prof. Lena Cruz', 'status' => 'Approved'],
            ['title' => 'Student Attrition Risk Predictor using Machine Learning', 'program' => 'BSIT', 'category' => 'Intelligent Systems', 'ay' => 'A.Y 2022-2023', 'adviser' => 'Prof. Carlo Mendoza', 'status' => 'Approved'],
            ['title' => 'AI-Based Ticket Classification for IT Helpdesk', 'program' => 'BSIT', 'category' => 'Intelligent Systems', 'ay' => 'A.Y 2024-2025', 'adviser' => 'Prof. Diana Ramos', 'status' => 'Archived'],
            ['title' => 'IoT Flood Monitoring with Real-Time Alerting', 'program' => 'BSIT', 'category' => 'Emerging Technologies', 'ay' => 'A.Y 2023-2024', 'adviser' => 'Prof. Miko Tan', 'status' => 'Approved'],
            ['title' => 'Blockchain-Based Certificate Verification Platform', 'program' => 'BSIT', 'category' => 'Emerging Technologies', 'ay' => 'A.Y 2024-2025', 'adviser' => 'Prof. Hazel Lim', 'status' => 'Approved'],
            ['title' => 'Automated Network Incident Response Dashboard', 'program' => 'BSIT', 'category' => 'Network & Security', 'ay' => 'A.Y 2022-2023', 'adviser' => 'Prof. Jules Aquino', 'status' => 'Approved'],
            ['title' => 'Campus Penetration Testing Toolkit', 'program' => 'BSIT', 'category' => 'Network & Security', 'ay' => 'A.Y 2023-2024', 'adviser' => 'Prof. Vince Javier', 'status' => 'Archived'],
            ['title' => 'Gamified Coding Fundamentals for Senior High', 'program' => 'BSIT', 'category' => 'Game Development', 'ay' => 'A.Y 2024-2025', 'adviser' => 'Prof. Nina Velasco', 'status' => 'Approved'],
            ['title' => 'Simulation Game for Disaster Preparedness Training', 'program' => 'BSIT', 'category' => 'Game Development', 'ay' => 'A.Y 2023-2024', 'adviser' => 'Prof. Ralph Gomez', 'status' => 'Approved'],

            ['title' => 'Integrated Procurement and Inventory ERP for SMEs', 'program' => 'BSIS', 'category' => 'Enterprise Resource Planning (ERP)', 'ay' => 'A.Y 2024-2025', 'adviser' => 'Prof. Maria Elise', 'status' => 'Approved'],
            ['title' => 'HR and Payroll ERP Module for Private Schools', 'program' => 'BSIS', 'category' => 'Enterprise Resource Planning (ERP)', 'ay' => 'A.Y 2023-2024', 'adviser' => 'Prof. Rey Balagtas', 'status' => 'Approved'],
            ['title' => 'Enrollment Demand Forecast Dashboard', 'program' => 'BSIS', 'category' => 'Decision Support Systems (DSS)', 'ay' => 'A.Y 2022-2023', 'adviser' => 'Prof. Karen Lao', 'status' => 'Approved'],
            ['title' => 'Retail KPI Monitoring and Decision Workbench', 'program' => 'BSIS', 'category' => 'Decision Support Systems (DSS)', 'ay' => 'A.Y 2024-2025', 'adviser' => 'Prof. Allan Reyes', 'status' => 'Archived'],
            ['title' => 'Local Product Marketplace with Supplier Portal', 'program' => 'BSIS', 'category' => 'E-Commerce & Digital Markets', 'ay' => 'A.Y 2023-2024', 'adviser' => 'Prof. Tricia Cruz', 'status' => 'Approved'],
            ['title' => 'CRM-Integrated Online Distribution Platform', 'program' => 'BSIS', 'category' => 'E-Commerce & Digital Markets', 'ay' => 'A.Y 2024-2025', 'adviser' => 'Prof. Mark Yulo', 'status' => 'Approved'],
            ['title' => 'Digital Records Lifecycle and Archiving System', 'program' => 'BSIS', 'category' => 'Information Management & Archiving', 'ay' => 'A.Y 2022-2023', 'adviser' => 'Prof. Liza Dizon', 'status' => 'Approved'],
            ['title' => 'Automated Document Routing for University Offices', 'program' => 'BSIS', 'category' => 'Information Management & Archiving', 'ay' => 'A.Y 2023-2024', 'adviser' => 'Prof. Brian Santos', 'status' => 'Archived'],
            ['title' => 'Municipal E-Services and Case Tracking Portal', 'program' => 'BSIS', 'category' => 'Health or Government Informatics', 'ay' => 'A.Y 2024-2025', 'adviser' => 'Prof. Erika Uy', 'status' => 'Approved'],
            ['title' => 'Electronic Clinic Referral and Patient Queue System', 'program' => 'BSIS', 'category' => 'Health or Government Informatics', 'ay' => 'A.Y 2023-2024', 'adviser' => 'Prof. Gio Navarro', 'status' => 'Approved'],
        ];

        $adviserIdByName = $this->resolveAdviserUsers(
            collect($titles)
                ->pluck('adviser')
                ->filter()
                ->values(),
        );

        foreach ($titles as $title) {
            $categoryKey = $title['program'].'::'.$title['category'];
            $categoryId = $categoryIdByKey->get($categoryKey);
            $academicYearId = $academicYearByLabel->get($title['ay']);
            $adviserId = $adviserIdByName->get((string) $title['adviser']);

            if (! is_int($categoryId) || ! is_int($academicYearId) || ! is_int($adviserId)) {
                continue;
            }

            TitleRepository::query()->updateOrCreate(
                [
                    'academic_year_id' => $academicYearId,
                    'title' => $title['title'],
                ],
                [
                    'title_category_id' => $categoryId,
                    'adviser_id' => $adviserId,
                    'status' => $title['status'],
                    'created_by' => null,
                ],
            );
        }
    }

    /**
     * @param  Collection<int, string>  $adviserNames
     * @return Collection<string, int>
     */
    private function resolveAdviserUsers(Collection $adviserNames): Collection
    {
        $defaultAdviserId = User::query()
            ->where('email', 'adviser@dnsc.ic.ph')
            ->value('id');

        if (! is_int($defaultAdviserId)) {
            return collect();
        }

        return $adviserNames
            ->map(fn (string $adviserName): string => trim($adviserName))
            ->filter(fn (string $adviserName): bool => $adviserName !== '')
            ->mapWithKeys(fn (string $adviserName): array => [$adviserName => $defaultAdviserId]);
    }
}
