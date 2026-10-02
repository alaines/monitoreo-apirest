const fs = require('fs');
const newVersion = '1.5.1';

fs.writeFileSync('VERSION', newVersion + '\n');

let pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.version = newVersion;
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');

let frontendPkg = JSON.parse(fs.readFileSync('apps/frontend/package.json', 'utf8'));
frontendPkg.version = newVersion;
fs.writeFileSync('apps/frontend/package.json', JSON.stringify(frontendPkg, null, 2) + '\n');

let backendPkg = JSON.parse(fs.readFileSync('apps/backend/package.json', 'utf8'));
backendPkg.version = newVersion;
fs.writeFileSync('apps/backend/package.json', JSON.stringify(backendPkg, null, 2) + '\n');

let layout = fs.readFileSync('apps/frontend/src/components/Layout.tsx', 'utf8');
layout = layout.replace(/v1\.\d+\.\d+/, 'v' + newVersion);
fs.writeFileSync('apps/frontend/src/components/Layout.tsx', layout);

let readme = fs.readFileSync('README.md', 'utf8');
readme = readme.replace(/version-1\.\d+\.\d+/, 'version-' + newVersion);
fs.writeFileSync('README.md', readme);

let changelog = fs.readFileSync('CHANGELOG.md', 'utf8');
const date = new Date().toISOString().split('T')[0];
const newEntry = `
## [1.5.1] - ${date}
### Agregado
- Se agregó la información del Distrito junto al nombre de la intersección/semáforo en los detalles de "Ver Incidencia".
`;
changelog = changelog.replace(/# Changelog\n/, '# Changelog\n' + newEntry);
fs.writeFileSync('CHANGELOG.md', changelog);

console.log('All files updated to ' + newVersion);
