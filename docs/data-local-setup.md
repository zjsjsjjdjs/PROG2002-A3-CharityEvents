# Data and Local Runtime

This guide covers the MySQL schema, sample data, Node dependencies, database connection and Express health endpoint. For the public homepage, also see homepage-browsing.md.

## Prerequisites

- Node.js and npm.
- XAMPP MySQL running on port 3306.
- Database name: charityevents_db.
- Required connection file: api/event_db.js.

## Database

The SQL creates organisations, categories and events, with 1 organisation, 5 categories and 8 activities. It includes past and suspended events for later filtering checks.

WARNING: database/charityevents_db.sql drops the existing charityevents_db database. Back up existing data before importing. If the required database is already present, skip import.

```powershell
& 'D:\user_tools\XAMPP\mysql\bin\mysql.exe' -u root -p --protocol=tcp --port=3306 -e "SOURCE E:/workplace/user2/database/charityevents_db.sql"
```

Enter the local MySQL password when prompted; press Enter if the account uses an empty password.

## Run

```powershell
Set-Location 'E:\workplace\user2\api'
if (-not (Test-Path -LiteralPath '.env')) { Copy-Item -LiteralPath '.env.example' -Destination '.env' }
notepad .env
npm.cmd ci
npm.cmd start
```

Save the local database settings before starting the server. If port 3000 is in use, set PORT=3001 in .env and use that port in the health URL. Keep .env and node_modules out of Git.

In another terminal:

```powershell
Invoke-RestMethod 'http://localhost:3000/api/health'
```

Expected: status=ok and database=connected. Database unavailability returns HTTP 500 with a generic message; unknown routes return HTTP 404. Open the public homepage at http://localhost:3000/ after the health check succeeds. The homepage list is available at /api/events/upcoming; search is a later module.

## Identity

Git commit author: Tianyi Li <id_09188388@foxmail.com>.
Repository: https://github.com/zjsjsjjdjs/prog2002-charity-events.git
