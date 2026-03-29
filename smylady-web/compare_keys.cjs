const fs = require('fs');

// Read code keys
const codeKeysRaw = fs.readFileSync('all_keys.txt', 'utf8').split('\n').filter(k => k.trim());

// Filter out non-translation keys (API paths, special chars, etc)
const codeKeys = codeKeysRaw.filter(k => {
  // Must contain a dot for nested key structure
  return k.includes('.') && !k.startsWith('/');
});

// Read JSON keys
const deFile = require('./src/i18n/locales/de.json');
const enFile = require('./src/i18n/locales/en.json');

function flattenKeys(obj, prefix = '') {
  let keys = [];
  for (const [key, val] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      keys = keys.concat(flattenKeys(val, newKey));
    } else {
      keys.push(newKey);
    }
  }
  return keys;
}

const deKeys = new Set(flattenKeys(deFile));
const enKeys = new Set(flattenKeys(enFile));

// Find missing keys in both JSON files
const missingInDE = codeKeys.filter(k => !deKeys.has(k));
const missingInEN = codeKeys.filter(k => !enKeys.has(k));

console.log('Code keys found:', codeKeys.length);
console.log('DE JSON keys found:', deKeys.size);
console.log('EN JSON keys found:', enKeys.size);
console.log('Missing in DE:', missingInDE.length);
console.log('Missing in EN:', missingInEN.length);
console.log('\nMissing keys in DE:');
missingInDE.sort().forEach(k => console.log(k));
console.log('\nMissing keys in EN:');
missingInEN.sort().forEach(k => console.log(k));

fs.writeFileSync('missing_de.txt', missingInDE.sort().join('\n'));
fs.writeFileSync('missing_en.txt', missingInEN.sort().join('\n'));
