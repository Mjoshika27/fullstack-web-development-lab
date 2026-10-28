Deploy all experiment frontends in the existing repository

1. Copy the .github folder from this package into the root of your local fullstack folder, so the file path is:
   fullstack/.github/workflows/deploy.yml

2. From PowerShell at C:\Users\JOSHIKA\OneDrive\Desktop\fullstack, run:
   git add .github/workflows/deploy.yml
   git commit -m "Add GitHub Pages deployment for all frontends"
   git push origin main

3. On GitHub, open Settings > Pages and set Build and deployment > Source to GitHub Actions.

4. Open the Actions tab and wait for the workflow named "Deploy all experiment frontends to GitHub Pages" to succeed.

5. If you're using GitHub Free, GitHub Pages requires a public repository. The current repository screenshot showed it as Private. Only make it public if you're comfortable making all files in the repository public and have checked that no secrets/personal files should stay private.

Expected site links after deployment:
https://mjoshika27.github.io/fullstack-web-development-lab/
https://mjoshika27.github.io/fullstack-web-development-lab/ex1a/
https://mjoshika27.github.io/fullstack-web-development-lab/ex1b/
https://mjoshika27.github.io/fullstack-web-development-lab/ex2a/
https://mjoshika27.github.io/fullstack-web-development-lab/ex2b/
https://mjoshika27.github.io/fullstack-web-development-lab/ex3/
https://mjoshika27.github.io/fullstack-web-development-lab/ex4/
https://mjoshika27.github.io/fullstack-web-development-lab/ex5/

Important limitation:
GitHub Pages is static hosting. It can display the frontends, but APIs pointed at localhost and MongoDB-backed features will not work online unless the backend and database are separately deployed and the frontend API URLs are changed to their public backend URL. EX2(a) and EX2(b) have browser demo fallbacks; EX1(b), EX3 and EX5 depend more directly on their APIs.
