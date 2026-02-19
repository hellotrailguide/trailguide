# Editor Setup (Private Repository)

The Trailguide Pro Editor has been moved to a private repository to protect your business IP.

## Quick Setup

### 1. Create Private GitHub Repo

```bash
# On GitHub, create a new private repository named: trailguide-editor
```

### 2. Initialize Editor as Separate Git Repo

```bash
cd apps/editor
git init
git add .
git commit -m "Initial commit - Trailguide Pro Editor"
git branch -M main
git remote add origin git@github.com:YOUR_USERNAME/trailguide-editor.git
git push -u origin main
```

### 3. Development Workflow

**Working on open-source packages:**
```bash
cd /Users/branden/projects/trailguide
# Make changes to packages/runtime, packages/recorder, etc.
git add .
git commit -m "Update runtime"
git push
```

**Working on the editor:**
```bash
cd /Users/branden/projects/trailguide/apps/editor
# Make changes to editor
git add .
git commit -m "Update dashboard UI"
git push
```

### 4. Team Members Setup

When onboarding team members:

```bash
# Clone public repo
git clone https://github.com/hellotrailguide/trailguide.git
cd trailguide

# Clone private editor into apps/
cd apps
git clone git@github.com:YOUR_USERNAME/trailguide-editor.git editor
cd ..

# Install dependencies
pnpm install
```

## File Structure

```
trailguide/                  ← Public repo (MIT)
├── packages/
│   ├── runtime/            ← Open source
│   ├── recorder/           ← Open source
│   └── core/               ← Open source
├── examples/               ← Open source
├── docs/                   ← Open source
└── apps/
    └── editor/             ← Private repo (gitignored)
        └── .git/           ← Separate git repository
```

## Important Notes

- **apps/editor** is gitignored in the main repo
- The editor folder still exists locally for development
- All open-source packages remain in the public repo
- The editor outputs standard JSON that works with open packages
- No lock-in: trails are still just JSON files

## Backup Checklist

Before pushing to the private repo, ensure:
- [ ] `.env.local` is in `.gitignore` (never commit secrets)
- [ ] No API keys or credentials in code
- [ ] Private repo is set to "Private" visibility on GitHub
