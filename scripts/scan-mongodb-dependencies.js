/**
 * Script to scan for MongoDB dependencies in the codebase
 * Identifies files that still use MongoDB imports or database calls
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Files and directories to exclude
const excludePaths = [
    'node_modules',
    '.next',
    'dist',
    'build',
    '.git',
    'scripts',
    'tmp'
];

// MongoDB-related patterns to search for
const mongodbPatterns = [
    // Import patterns
    /import.*mongoose/i,
    /import.*mongodb/i,
    /import.*connectDB/i,
    /require.*mongoose/i,
    /require.*mongodb/i,
    /require.*connectDB/i,

    // Database connection patterns
    /connectDB\(\)/i,
    /mongoose\.connect/i,
    /mongodb:\/\/\w+/i,

    // Model usage patterns
    /\w+\.find\(/i,
    /\w+\.findOne\(/i,
    /\w+\.findById\(/i,
    /\w+\.create\(/i,
    /\w+\.save\(/i,
    /\w+\.update\(/i,
    /\w+\.delete\(/i,
    /\w+\.aggregate\(/i,

    // MongoDB ObjectId patterns
    /ObjectId\(/i,
    /mongoose\.Types\.ObjectId/i,

    // Collection access patterns
    /db\.collection/i,
    /\.collection\(/i
];

function shouldExcludePath(filePath) {
    return excludePaths.some(excludePath =>
        filePath.includes(excludePath) ||
        filePath.includes('node_modules')
    );
}

function scanFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const issues = [];

        mongodbPatterns.forEach(pattern => {
            const matches = content.match(new RegExp(pattern, 'g'));
            if (matches) {
                matches.forEach(match => {
                    // Get line number
                    const lines = content.split('\n');
                    const lineNumber = lines.findIndex(line => line.includes(match)) + 1;

                    issues.push({
                        pattern: pattern.source,
                        match: match.trim(),
                        line: lineNumber,
                        context: lines[lineNumber - 1]?.trim() || 'N/A'
                    });
                });
            }
        });

        return issues;
    } catch (error) {
        return [];
    }
}

function scanDirectory(dirPath, results = {}) {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const relativePath = path.relative(projectRoot, fullPath);

        if (shouldExcludePath(relativePath)) {
            continue;
        }

        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            scanDirectory(fullPath, results);
        } else if (stat.isFile() && (item.endsWith('.js') || item.endsWith('.ts') || item.endsWith('.tsx'))) {
            const issues = scanFile(fullPath);
            if (issues.length > 0) {
                results[relativePath] = issues;
            }
        }
    }

    return results;
}

function generateReport(results) {
    console.log('🔍 MongoDB Dependency Scan Results\n');
    console.log('='.repeat(50));

    const totalFiles = Object.keys(results).length;
    let totalIssues = 0;

    Object.entries(results).forEach(([filePath, issues]) => {
        console.log(`\n📁 ${filePath}`);
        issues.forEach(issue => {
            totalIssues++;
            console.log(`  🔸 Line ${issue.line}: ${issue.match}`);
            console.log(`     Pattern: ${issue.pattern}`);
            console.log(`     Context: ${issue.context}`);
        });
    });

    console.log('\n' + '='.repeat(50));
    console.log(`📊 Summary: ${totalIssues} MongoDB dependencies found in ${totalFiles} files`);

    // Save detailed report
    const reportPath = path.join(projectRoot, 'mongodb-scan-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`📄 Detailed report saved to: ${reportPath}`);

    return { totalFiles, totalIssues };
}

// Main execution
console.log('🔍 Scanning for MongoDB dependencies...\n');

const results = scanDirectory(path.join(projectRoot, 'src'));
const summary = generateReport(results);

// Exit with code based on findings
if (summary.totalIssues > 0) {
    console.log(`\n⚠️  Found ${summary.totalIssues} MongoDB dependencies that need migration`);
    process.exit(1);
} else {
    console.log('\n✅ No MongoDB dependencies found!');
    process.exit(0);
}