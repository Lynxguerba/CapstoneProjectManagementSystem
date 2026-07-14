# Deploying Capstone Project Management System to InfinityFree

Yes, it is possible to deploy this Laravel 12 + Inertia.js (React + Tailwind CSS v4) application to InfinityFree (Free Tier). However, because InfinityFree is a free shared hosting platform, it has certain constraints:
- **No SSH/Terminal access** (cannot run `composer install`, `php artisan`, etc. on the server).
- **Strict `open_basedir` restrictions** (all application files must reside inside the `htdocs` folder; you cannot upload files outside `htdocs`).
- **No Node.js daemon** (you cannot run `npm run dev` or `vite` on the server).

Follow this step-by-step guide to successfully deploy your application.

---

## Step 1: Pre-requisites & Account Setup

1. **Set PHP Version**: 
   - Laravel 12 requires **PHP 8.2 or greater**.
   - Log in to your InfinityFree client area, go to your hosting account, open the **Control Panel (cPanel)**, search for **Alter PHP Version**, and set it to **8.2** or **8.3** (whichever is the highest available).

2. **Create a MySQL Database**:
   - In the Control Panel, go to **MySQL Databases**.
   - Create a new database (e.g., `epiz_XXX_cpms`).
   - Note down the **DB Host**, **DB Username**, **DB Password**, and **DB Name** provided.

---

## Step 2: Local Preparation (Build & Package)

Since you cannot run installation or compilation commands on InfinityFree, you must perform them locally first.

1. **Build Frontend Assets (Inertia & Tailwind)**:
   - Run the build command locally to compile React and Tailwind assets into static files:
     ```bash
     npm run build
     ```
   - This creates files inside the `public/build/` directory. **Do not upload `node_modules`** to the server, as Node is not run there.

2. **Prepare PHP Dependencies**:
   - Run Composer with production optimization to exclude development packages and speed up autoloader performance:
     ```bash
     composer install --no-dev --optimize-autoloader
     ```

3. **Generate App Key**:
   - If you haven't already, generate your local application key:
     ```bash
     php artisan key:generate
     ```
   - Note this key (from your `.env` file) as you will manually copy it to the production server.

---

## Step 3: Package for Faster Upload (Golden Trick)

Uploading thousands of small files (like those in the `vendor/` directory) via FTP can take several hours and easily fail. Instead, follow this zip-and-extract trick:

1. **Create a ZIP Archive**:
   - Compress your entire project directory into a single `.zip` file.
   - **IMPORTANT: Exclude the following files/folders from the ZIP**:
     - `node_modules/` (already compiled)
     - `.git/` (git history)
     - `backups/` (old database dumps)
     - `tests/`
     - `.env` (you will create a fresh one on the server)

2. **Upload the ZIP File**:
   - Go to the Control Panel on InfinityFree and open the **Online File Manager**.
   - Navigate into the **`htdocs/`** directory.
   - Upload the ZIP file directly into `htdocs/`.

3. **Extract the Archive**:
   - In the Online File Manager, select the uploaded ZIP file and click **Unzip/Extract**.
   - This will unpack the entire project structure in seconds inside `htdocs/`.
   - Delete the ZIP file after extraction.

---

## Step 4: Security and Rewrites (`.htaccess`)

Because your whole project structure is inside the web-accessible `htdocs` folder, you **must** configure an `.htaccess` file at the root of `htdocs` to rewrite traffic to the `public/` folder and prevent direct access to sensitive files like `.env`.

1. Create a file named **`.htaccess`** in the root of your `htdocs/` folder (the directory containing `app`, `bootstrap`, `.env.example`, etc.).
2. Add the following configuration:

```apache
# Disable directory indexing
Options -Indexes

# Block public access to sensitive files
<FilesMatch "\.(env|json|lock|git|yml|yaml|md)$">
    Order allow,deny
    Deny from all
</FilesMatch>

# Block public access to backend folders
RedirectMatch 404 /(app|bootstrap|config|database|resources|routes|storage|tests|vendor|node_modules)/

# Rewrite all requests to the public/ directory
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{REQUEST_URI} !^/public/
    RewriteRule ^(.*)$ public/$1 [L,QSA]
</IfModule>
```

---

## Step 5: Configure Production Env (`.env`)

1. In the Online File Manager inside `htdocs/`, create a new file named **`.env`**.
2. Copy the contents of your local `.env` (or `.env.example`) and edit the following production values:
   ```ini
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=http://your-domain.infinityfreeapp.com  # Your InfinityFree domain name

   DB_CONNECTION=mysql
   DB_HOST=sqlXXX.infinityfree.com                 # Hostname from MySQL Databases section
   DB_PORT=3306
   DB_DATABASE=epiz_XXX_cpms                       # DB Name
   DB_USERNAME=epiz_XXX                            # DB Username
   DB_PASSWORD=your_mysql_password                 # DB Password
   
   # Set this to the key generated in Step 2
   APP_KEY=base64:YOUR_GENERATED_APP_KEY...
   ```

---

## Step 6: Deploy Database Migrations & Symlinks (No SSH Workarounds)

Since you do not have SSH to run `php artisan` commands, use the following workarounds:

### Option A: Export and Import Database (Easiest)
1. Export your local MySQL database using phpMyAdmin or the `backup.sh` snapshot.
2. Open phpMyAdmin in the InfinityFree Control Panel.
3. Select your database, go to the **Import** tab, upload the SQL file, and click **Go**.

### Option B: Temporary Web Route Workaround (Automated)
If you want to run migrations or generate symlinks via the browser, you can add temporary helper routes in `routes/web.php` *before* bundling your application:

1. Add these routes to `routes/web.php`:
   ```php
   // Run migrations
   Route::get('/deploy/migrate', function () {
       try {
           Artisan::call('migrate', ['--force' => true]);
           return 'Database migrated successfully!';
       } catch (\Exception $e) {
           return 'Error: ' . $e->getMessage();
       }
   });

   // Create storage symlink
   Route::get('/deploy/storage-link', function () {
       try {
           Artisan::call('storage:link');
           return 'Storage symlink created successfully!';
       } catch (\Exception $e) {
           return 'Error: ' . $e->getMessage();
       }
   });
   ```
2. Upload the changes.
3. Access `http://your-domain.infinityfreeapp.com/deploy/migrate` and `http://your-domain.infinityfreeapp.com/deploy/storage-link` in your browser.
4. **CRITICAL SECURITY STEP**: Remove or comment out these routes immediately after use to prevent unauthorized execution.

---

## Step 7: Troubleshooting Common Errors

### 1. 500 Internal Server Error
- Verify that your PHP version is set to 8.2 or 8.3 in the Control Panel.
- Clear the bootstrap cache: delete all files inside `bootstrap/cache/` **except** `gitkeep` if present.
- Ensure the directories `storage/` and `bootstrap/cache/` have write permissions (usually default to `755` or `777` on shared hosts).

### 2. Assets (CSS/JS) Not Loading
- Confirm that you ran `npm run build` locally and that the `public/build` directory was uploaded successfully.
- Verify `APP_URL` in your `.env` matches your exact URL (with or without `www` as configured in the control panel).

### 3. Database Connection Issues
- Make sure the database password matches what is shown in the hosting control panel (not necessarily your account login password).
- Ensure the database hostname is the one starting with `sqlXXX.infinityfree.com` and not `localhost`.
