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
