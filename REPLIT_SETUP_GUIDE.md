# Complete Replit Setup Guide

## Step 1: Create New Replit
1. Go to Replit.com
2. Create new Repl
3. Choose "Import from GitHub" or "Blank Repl"
4. Select Node.js template

## Step 2: Upload Project Files
Upload all files from your ZIP download to the new Replit

## Step 3: Create .replit Configuration File
Create a file named `.replit` in the root directory with this content:

```
modules = ["nodejs-20", "web", "postgresql-16"]
run = "npm run dev"
hidden = [".config", ".git", "generated-icon.png", "node_modules", "dist"]

[nix]
channel = "stable-24_05"

[deployment]
deploymentTarget = "autoscale"
build = ["npm", "run", "build"]
run = ["npm", "run", "start"]

[[ports]]
localPort = 5000
externalPort = 80

[workflows]
runButton = "Project"

[[workflows.workflow]]
name = "Project"
mode = "parallel"
author = "agent"

[[workflows.workflow.tasks]]
task = "workflow.run"
args = "Start application"

[[workflows.workflow]]
name = "Start application"
author = "agent"

[[workflows.workflow.tasks]]
task = "shell.exec"
args = "npm run dev"
waitForPort = 5000
```

## Step 4: Install Dependencies
Run in the Shell:
```bash
npm install
```

## Step 5: Setup Database (if needed)
1. Go to Replit Tools panel
2. Enable PostgreSQL database
3. It will automatically provide DATABASE_URL environment variable

## Step 6: Run the Application
```bash
npm run dev
```

## Key Files That Must Be Present:
- package.json
- package-lock.json
- tsconfig.json
- vite.config.ts
- tailwind.config.ts
- components.json
- drizzle.config.ts
- .replit (create this manually)
- All client/, server/, shared/, attached_assets/ folders

## Troubleshooting:
- If modules don't load: Restart the Repl
- If database errors: Enable PostgreSQL in Tools
- If build fails: Check all dependencies installed with npm install
- If assets missing: Ensure attached_assets folder uploaded correctly