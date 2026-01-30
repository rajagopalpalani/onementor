# Security Guide - Environment Variables

## ⚠️ IMPORTANT: Never Commit Secrets to Git!

This guide explains how to properly handle sensitive information in your project.

## What Happened?

GitHub blocked your push because you accidentally committed sensitive API keys and secrets in `.env.local` files. This is a security risk because:

1. **API Keys can be stolen** - Anyone with access to your repository can use your API keys
2. **Costs money** - Stolen OpenAI/Google API keys can rack up charges on your account
3. **Security breach** - OAuth secrets can be used to impersonate your application

## What We Fixed

1. ✅ Removed `.env.local` from Git tracking
2. ✅ Updated `.gitignore` to prevent future commits
3. ✅ Removed secrets from Git history using `git filter-branch`
4. ✅ Force pushed clean history to GitHub
5. ✅ Created `.env.example` template files

## How to Set Up Environment Variables

### Step 1: Copy Example Files

```bash
# For API
cd onementor/api
cp .env.example .env.local

# For UI
cd onementor/ui
cp .env.example .env.local
```

### Step 2: Fill in Your Actual Values

Edit the `.env.local` files and replace placeholder values with your actual secrets:

```env
# DON'T use these placeholders - use your real values!
OPENAI_API_KEY=sk-proj-your-actual-key-here
GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-actual-secret-here
```

### Step 3: Verify Files Are Ignored

```bash
# Check that .env.local is in .gitignore
cat .gitignore | grep env

# Verify Git is not tracking these files
git status
# Should NOT show .env.local files
```

## Files That Should NEVER Be Committed

❌ **Never commit these files:**
- `.env`
- `.env.local`
- `.env.development.local`
- `.env.production.local`
- Any file containing API keys, passwords, or secrets

✅ **Safe to commit:**
- `.env.example` (template with placeholder values)
- `.gitignore`
- Configuration files without secrets

## What's in .gitignore

### API (.gitignore)
```
node_modules/
.env
.env.local
.env.*.local
package-lock.json
```

### UI (.gitignore)
```
.env*  # Covers all .env files
```

## If You Accidentally Commit Secrets

### Option 1: Remove from Latest Commit (if not pushed yet)
```bash
# Remove file from Git tracking
git rm --cached path/to/.env.local

# Commit the removal
git commit -m "Remove sensitive file"
```

### Option 2: Remove from History (if already pushed)
```bash
# Remove file from entire Git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch path/to/.env.local" \
  --prune-empty --tag-name-filter cat -- --all

# Force push to update remote
git push origin branch-name --force
```

### Option 3: Rotate Your Secrets (RECOMMENDED)
If secrets were exposed:
1. **Immediately revoke/regenerate** all exposed API keys
2. Update your `.env.local` with new keys
3. Remove the file from Git history (as shown above)

## How to Rotate Compromised Secrets

### OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Revoke the exposed key
3. Create a new key
4. Update your `.env.local`

### Google OAuth Credentials
1. Go to https://console.cloud.google.com/apis/credentials
2. Delete the exposed OAuth client
3. Create a new OAuth 2.0 Client ID
4. Update your `.env.local`

### JWT/Session Secrets
1. Generate new random strings:
   ```bash
   # On Linux/Mac
   openssl rand -hex 32
   
   # On Windows (PowerShell)
   -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
   ```
2. Update your `.env.local`

## Best Practices

### ✅ DO:
- Use `.env.example` files with placeholder values
- Add all `.env*` files to `.gitignore`
- Store secrets in environment variables
- Use different secrets for development and production
- Rotate secrets regularly
- Use secret management tools (AWS Secrets Manager, HashiCorp Vault, etc.)

### ❌ DON'T:
- Commit `.env` or `.env.local` files
- Share secrets in chat, email, or documentation
- Use the same secrets across environments
- Hardcode secrets in source code
- Push secrets to public repositories

## GitHub Secret Scanning

GitHub automatically scans for exposed secrets and will:
- Block pushes containing secrets (Push Protection)
- Alert you if secrets are found in your repository
- Notify the secret provider (e.g., OpenAI, Google)

If you see this error:
```
remote: error: GH013: Repository rule violations found
remote: - Push cannot contain secrets
```

Follow the steps in this guide to remove the secrets.

## Environment Variables Checklist

Before committing:
- [ ] All `.env*` files are in `.gitignore`
- [ ] No secrets in source code
- [ ] `.env.example` files have placeholder values only
- [ ] Actual secrets are only in `.env.local` (not tracked by Git)
- [ ] `git status` doesn't show any `.env` files

## Additional Resources

- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [Managing Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [12-Factor App: Config](https://12factor.net/config)

## Summary

**The golden rule:** If it's a secret, it should never be in Git. Use environment variables and keep them local!
