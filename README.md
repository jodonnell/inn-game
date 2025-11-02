# Commands

```
npm run dev -> http://localhost:5173/
npm run test
npm run test:e2e
npm run test:e2e:headed
npm run lint
npm run prettier
npm run build:electron -> output desktop bundles in release/
npm run deploy -> setup pages on deploy branch
```

The Electron packaging step runs `vite build` first, then emits macOS, Windows, and Linux artifacts into `release/`, keeping the game Steam-ready after every build.

~/Library/Application\ Support/Steam/steamapps/common/Aseprite/Aseprite.app/Contents/MacOS/aseprite  -b assets/raw/stuff/*.png   --sheet assets/spritesheets/sheet.png   --data assets/spritesheets/sheet.json     --sheet-type rows --sheet-columns 32 --color-mode indexed --ignore-empty 



colima start --cpu 4 --memory 8
docker build -t codex-sandbox .
docker run -it --rm --privileged -v "$PWD":/workspace -v codex_home:/root -w /workspace codex-sandbox

docker run -it --rm --privileged -v "$PWD":/workspace -v codex_home:/root -w /workspace -p 1455:1455  -e PUBLIC_URL="http://localhost:1455" codex-sandbox

docker ps
docker cp ~/.codex/auth.json 6951cc39e521:/root/.codex/auth.json

docker run --rm -it \
  -p 3000:3000 \
  -e PUBLIC_URL=http://localhost:3000 \
  -e NEXTAUTH_URL=http://localhost:3000 \   # if using NextAuth
  -e OAUTH_REDIRECT_URI=http://localhost:3000/oauth/callback  # if your app expects this
  codex-image

codex --sandbox danger-full-access --ask-for-approval never


