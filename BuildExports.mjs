import fs from 'fs';
import path from 'path';
import glob from 'glob';
import { PowerHelper as helper, Utility as utils } from '@knighttower/js-utility-functions/index.mjs';
import { getFlagValue } from '@knighttower/js-utility-functions/node.mjs';

/**
 * Reads a file and returns the names of the exported modules.
 * @param {string} filePath
 * @returns {Object} Object containing arrays of named exports and the default export
 */
function getExports(filePath) {
    // get the whole file content
    const content = fs.readFileSync(filePath, 'utf-8');
    // Example matches: export const myVar, export function myFunc, export class MyClass
    // Example matches: export myVar, export myFunc
    const matchSingleExps = content.match(/export\s+(const|let|var|function|class)\s+(\w+)|export\s+(\w+)/g) || [];
    // Example matches: export default class MyClass, export default function myFunc,
    const matchDefClasses = content.match(/export\s+default\s+(class|function)\s*(\b(?!(\{|\())\w+\b)/) || [];
    // Example matches: export default Name, Name as default
    const matchDefSingles =
        content.match(
            /export\s+default\s+(\b(?!(\{|\(|(class|function)))\w+\b)|(?<=\{[^}]*)\w+\s+as\s+default(?=[^}]*\})/,
        ) || [];
    // Example matches: export { myVar, myFunc }
    const matchAliasesExps = content.match(/export\s*{([^}]+)}/g) || [];

    // Storages
    const singleExports = [];
    const defaultExport = utils.emptyOrValue(
        helper.cleanStr(
            matchDefClasses[0] || matchDefSingles[0] || '',
            'export',
            'default',
            'function',
            'class',
            /\bas\b/,
        ),
    );
    const aliasExports = [];
    let namedExports = [];

    // =========================================
    // --> Process the arrays to clean and pick the export
    // --------------------------
    // Handle single exports
    matchSingleExps.forEach((exp) => {
        const parts = helper.cleanStr(exp, 'export').match(/\b\w+\b/g);
        if (parts.length === 1) {
            singleExports.push(parts[0]);
        } else if (parts.length === 2) {
            singleExports.push(parts[1]);
        }
    });

    // Handle aliases
    matchAliasesExps.forEach((aliasLine) => {
        helper
            // cleanup and create an array of aliases
            .getChunks(helper.cleanStr(aliasLine, 'export', '{', '}'))
            // exclude default export
            .filter((chunk) => !chunk.includes('default'))
            // iterate to pick the correct alias;
            .forEach((chunk) => {
                if (chunk.includes(' as ')) {
                    const alias = helper.getChunks(chunk, ' as ');
                    if (alias[1]) {
                        aliasExports.push(alias[1]);
                    }
                } else {
                    aliasExports.push(chunk);
                }
            });
    });

    // Merge all named exports and filter
    namedExports = [...aliasExports, ...singleExports].filter((name) => name !== 'default' && name !== defaultExport);

    return {
        named: Array.from(new Set(namedExports)), // Remove duplicates
        default: defaultExport,
    };
}

/**
 * Generates the content for the index.js file.
 * @param {Object} allExports - An object containing information about all exports
 * @returns {string} - The content for the index.js file
 */
function generateIndexContent(allExports) {
    let imports = '';
    let exports = '';

    for (const [filePath, { named, default: defaultExport }] of Object.entries(allExports)) {
        const moduleName = path.basename(filePath).replace(/\.js|\.mjs/, '');
        const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
        const commentSingle = `// Single Modules and Aliases from: ${moduleName}\n`;
        const commentDefault = `// Default Module from: ${moduleName}\n`;
        if (named.length > 0) {
            const namedModules = named.join(', ');

            imports += commentSingle;
            imports += `import { ${namedModules} } from './${relativePath}';\n`;
            exports += commentSingle;
            exports += `export { ${namedModules} };\n`;
        }

        if (defaultExport) {
            imports += commentDefault;
            imports += `import ${defaultExport} from './${relativePath}';\n`;
            exports += commentDefault;
            exports += `export { ${defaultExport} };\n`;
        }
    }

    return `${imports}\n${exports}`;
}

/**
 * Main function to generate the index.js file.
 */
(function generateIndex() {
    const directory = getFlagValue('dir') ?? './src';
    const destination = getFlagValue('out') ?? './index.mjs';
    // Synchronously fetch all file paths within a directory and its subdirectories
    // that have a .js or .mjs extension
    const filePaths = glob.sync(`${directory}/**/*.{js,mjs}`);
    const allExports = {};

    filePaths.forEach((filePath) => {
        if (!path.basename(filePath).includes('index')) {
            allExports[filePath] = getExports(filePath);
        }
    });

    const indexContent = generateIndexContent(allExports);
    fs.writeFileSync(path.join(process.cwd(), destination), indexContent);
    console.log('index generated');
})();
