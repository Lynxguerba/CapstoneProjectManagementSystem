<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;

class InstructorController extends Controller
{
    public function dashboard()
    {
        return Inertia::render('Instructor/Dashboard');
    }

    public function groups()
    {
        return Inertia::render('Instructor/Groups/Index');
    }

    public function groupShow($group)
    {
        return Inertia::render('Instructor/Groups/Show', [
            'group' => $group
        ]);
    }

    public function advisers()
    {
        return Inertia::render('Instructor/Advisers/Index');
    }

    public function schedules()
    {
        return Inertia::render('Instructor/Schedules/Index');
    }

    public function deadlines()
    {
        return Inertia::render('Instructor/Deadlines/Index');
    }

    public function deadlinesCreate()
    {
        return Inertia::render('Instructor/Deadlines/Create');
    }

    public function payments()
    {
        return Inertia::render('Instructor/Payments/Index');
    }

    public function deployments()
    {
        return Inertia::render('Instructor/Deployments/Index');
    }

    public function analytics()
    {
        return Inertia::render('Instructor/Analytics/Index');
    }

    public function documents()
    {
        return Inertia::render('Instructor/Documents/Index');
    }
}
