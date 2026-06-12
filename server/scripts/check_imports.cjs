const fs = require('fs');
const path = require('path');

function checkFile(filePath, packageJsonPath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const importRegex = /from\s+['"]([^'"]+)['"]|require\(['"]([^'"]+)['"]\)|import\s+['"]([^'"]+)['"]/g;
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };

    let match;
    const missing = [];
    while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1] || match[2] || match[3];
        if (!importPath) continue;

        if (importPath.startsWith('.')) {
            // Local file
            const dir = path.dirname(filePath);
            let resolved = path.resolve(dir, importPath);
            // Check extensions
            const exts = ['', '.js', '.jsx', '.ts', '.tsx', '.css', '/index.js', '/index.jsx'];
            let found = false;
            for (let ext of exts) {
                if (fs.existsSync(resolved + ext)) {
                    const stat = fs.statSync(resolved + ext);
                    if (stat.isFile()) {
                        found = true;
                        break;
                    }
                }
            }
            if (!found) {
                missing.push({ type: 'local', path: importPath });
            }
        } else {
            // Package
            const pkgName = importPath.split('/')[0].startsWith('@') ? importPath.split('/').slice(0,2).join('/') : importPath.split('/')[0];
            
            // Allow node built-ins and vite virtual modules
            const builtIns = ['fs', 'path', 'http', 'https', 'crypto', 'events', 'stream', 'util', 'os', 'child_process', 'url', 'zlib', 'querystring', 'readline', 'dns', 'net', 'tls', 'assert', 'buffer', 'module', 'process'];
            if (!deps[pkgName] && !builtIns.includes(pkgName) && !importPath.startsWith('virtual:')) {
                missing.push({ type: 'package', path: importPath, pkgName });
            }
        }
    }
    return missing;
}

function traverse(dir, packageJsonPath) {
    let results = [];
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== 'dist' && file !== 'public') {
                results = results.concat(traverse(fullPath, packageJsonPath));
            }
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            const missing = checkFile(fullPath, packageJsonPath);
            if (missing.length > 0) {
                results.push({ file: fullPath, missing });
            }
        }
    }
    return results;
}

console.log("=== CLIENT ===");
const clientRes = traverse(path.resolve('./client/src'), path.resolve('./client/package.json'));
console.log(JSON.stringify(clientRes, null, 2));

console.log("=== SERVER ===");
const serverRes = traverse(path.resolve('./server'), path.resolve('./server/package.json'));
console.log(JSON.stringify(serverRes, null, 2));
