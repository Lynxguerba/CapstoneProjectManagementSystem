### 1. Start the Database & phpMyAdmin (Run Once per session)

  Because GitHub Codespaces puts background services to sleep, you'll need to start MySQL and
  the phpMyAdmin Docker container first:

    sudo service mysql start && docker compose up -d phpmyadmin

  ### 2. Start the Laravel App & Vite (Run this to code)

  Once the database is up, you start your actual application using this command. It will run
  Laravel ( artisan serve ), the Queue worker, and Vite all at the same time:

    composer run dev

### 3. Stop the server
    
    sudo service mysql stop && docker compose down