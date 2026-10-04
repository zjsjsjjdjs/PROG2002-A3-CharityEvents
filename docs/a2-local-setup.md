# A2 Local Setup Guide

This guide explains how to run the PROG2002 A2 charity events website on a local Windows computer.

Author: Tianyi Li <id_09188388@foxmail.com>.

## 0. Extract the two archives

On a different computer, choose any working directory and create sibling `api/` and `clientside/` folders. Extract each zip's contents into the matching folder. The zip files contain files at their root, so do not accidentally add another nested `api/api` directory. Keep the SQL file separately. Replace the example paths below with your chosen directory.

Use Node.js/npm and MySQL/MariaDB. This project uses locked dependency versions through `npm ci`. Keep the API at PORT=3000 and configure your own database credentials in `.env`. If 3000 is occupied, stop the known instance of this project before starting another; do not terminate unknown processes.

## 1. Start MySQL

1. Open XAMPP Control Panel.
2. Start the MySQL service.
3. Keep XAMPP open while testing the website.

The current local setup uses the XAMPP MySQL client at:

```text
D:\user_tools\XAMPP\mysql\bin\mysql.exe
```

## 2. Import the Database

The database name must be:

```text
charityevents_db
```

WARNING: this SQL drops and recreates `charityevents_db`. Use a fresh/disposable database instance, or back up existing data and explicitly choose to replace it. If the existing database is already correct, skip import.

Import the SQL file:

```powershell
& 'D:\user_tools\XAMPP\mysql\bin\mysql.exe' -u root -p --protocol=tcp --port=3306 -e "SOURCE E:/workplace/user2/database/charityevents_db.sql"
```

The SQL file creates:

- `organisations`
- `categories`
- `events`

It also inserts:

- 1 charity organisation
- 5 event categories
- 8 sample events

The sample data includes active upcoming events, active past events, and one suspended event for filtering tests.

The client path below is this machine's XAMPP installation; use your own mysql.exe path on another computer. The import command prompts for the database password (press Enter only if your local password is empty).

## 3. Install API Dependencies

Open PowerShell:

```powershell
cd E:\workplace\user2\api
if (-not (Test-Path -LiteralPath '.env')) { Copy-Item -LiteralPath '.env.example' -Destination '.env' }
notepad .env
npm.cmd ci
```

## 4. Start the API

Run:

```powershell
cd E:\workplace\user2\api
npm start
```

Keep this PowerShell window open while testing.

The API runs at:

```text
http://localhost:3000
```

Check the database connection:

```text
http://localhost:3000/api/health
```

Expected response:

```json
{"status":"ok","database":"connected"}
```

## 5. Open the Client Website

Preferred: open http://localhost:3000/ after starting the API.

Alternatively, open this file in a browser:

```text
E:\workplace\user2\clientside\index.html
```

The frontend calls the API at:

```text
http://localhost:3000/api
```

If the event cards do not load, check that:

- XAMPP MySQL is running.
- The database has been imported.
- The API PowerShell window is still running.
- `http://localhost:3000/api/health` returns `database: connected`.

## 6. Useful Test URLs

```text
http://localhost:3000/api/categories
http://localhost:3000/api/events/upcoming
http://localhost:3000/api/events/search?location=Brisbane
http://localhost:3000/api/events/search?date=2026-10-04&categoryId=2
http://localhost:3000/api/events/1
```
