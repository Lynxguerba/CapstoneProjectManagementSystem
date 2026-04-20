The project utilizes a modern Laravel + Inertia.js + React stack with TypeScript. Below is a breakdown of the dependencies.

  Backend (PHP/Composer)
   * Framework: Laravel 12 (laravel/framework)
   * Integration: Inertia.js for Laravel (inertiajs/inertia-laravel)
   * Routing/DX: Laravel Wayfinder (laravel/wayfinder) for route management.
   * Dev Tools: 
       * Testing: Pest (pestphp/pest)
       * Linting/Formatting: Pint (laravel/pint)
       * Other: Tinker, Collision, Sail, and Laravel Boost.

  Frontend (TypeScript/NPM)
   * Frameworks: React 19, Inertia.js (@inertiajs/react)
   * UI/Design:
       * Styling: Tailwind CSS 4 (tailwindcss, @tailwindcss/vite)
       * Component Library: Material UI (@mui/material, @mui/icons-material, @mui/x-charts)
       * Animations: Framer Motion
       * Utils: Lucide React, class-variance-authority, clsx, tailwind-merge
   * Domain-Specific:
       * Charts/Graphs: @xyflow/react (for node-based UI/diagrams)
       * Documents: pdfjs-dist and react-pdf-highlighter (for PDF management/annotation)
       * Signature: react-signature-canvas
   * Build/Tooling: Vite 7, TypeScript, ESLint (with React and TypeScript plugins), Prettier.

