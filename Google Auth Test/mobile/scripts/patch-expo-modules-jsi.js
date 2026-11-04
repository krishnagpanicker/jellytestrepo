const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.dirname(path.dirname(require.main.filename));
const scriptPath = path.join(
  projectRoot,
  'node_modules',
  'expo-modules-jsi',
  'apple',
  'scripts',
  'build-xcframework.sh'
);

const signingSetting = '    CODE_SIGNING_ALLOWED=NO \\\n';
const insertionPoint = '    BUILD_LIBRARY_FOR_DISTRIBUTION=YES \\\n';
const script = fs.readFileSync(scriptPath, 'utf8');

if (script.includes(signingSetting)) {
  console.log('ExpoModulesJSI intermediate framework signing is already disabled.');
  process.exit(0);
}

if (!script.includes(insertionPoint)) {
  throw new Error(`Unable to patch unexpected ExpoModulesJSI build script: ${scriptPath}`);
}

fs.writeFileSync(
  scriptPath,
  script.replace(insertionPoint, insertionPoint + signingSetting)
);

console.log('Disabled signing for the ExpoModulesJSI intermediate framework.');
