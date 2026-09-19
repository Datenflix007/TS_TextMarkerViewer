set windows-shell := ["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command"]

install:
    npm install

dev:
    npm run dev

build:
    npm run build

test:
    npm test

check:
    npm run build
    npm test

screenshots:
    npm run screenshots

clean:
    Remove-Item -LiteralPath "dist", "node_modules/.vite" -Recurse -Force -ErrorAction SilentlyContinue
