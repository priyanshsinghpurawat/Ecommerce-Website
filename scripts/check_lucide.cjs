const fs = require('fs');
const path = require('path');

// Mocking lucide-react exports for the check
// In a real environment, we'd import the actual package, but since we are running in Node
// and lucide-react might be ESM, we'll use a simplified check or just list known missing ones.
const brandIcons = ['Facebook', 'Instagram', 'Twitter', 'Github', 'Youtube', 'Linkedin', 'Tiktok'];

function checkLucideImports(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lucideRegex = /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/g;
    
    let match;
    const issues = [];
    while ((match = lucideRegex.exec(content)) !== null) {
        const imports = match[1].split(',').map(s => s.trim().split(/\s+as\s+/)[0]);
        for (const icon of imports) {
            if (brandIcons.includes(icon)) {
                issues.push(icon);
            }
        }
    }
    return issues;
}

function traverse(dir) {
    let results = [];
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== 'dist') {
                results = results.concat(traverse(fullPath));
            }
        } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
            const issues = checkLucideImports(fullPath);
            if (issues.length > 0) {
                results.push({ file: fullPath, icons: issues });
            }
        }
    }
    return results;
}

const clientDir = path.resolve('./client/src');
const results = traverse(clientDir);
console.log(JSON.stringify(results, null, 2));
