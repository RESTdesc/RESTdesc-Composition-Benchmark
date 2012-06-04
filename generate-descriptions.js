#!/usr/bin/env node

var print = console.log;

// Parse arguments
var args = process.argv.splice(2);
if (args.length < 1)
  return console.error('Usage: generate-descriptions.js ' +
                       'number_of_descriptions> [number_of_conditions]');
var chainLength = parseInt(args[0], 10);
var conditionCount = parseInt(args[1], 10) || 1;

// Output prefixes
var prefixes = {
  'ex': 'http://example.org/#'
};
for (var prefix in prefixes)
  print('@prefix ' + prefix + ': <' + prefixes[prefix] + '>.');
print();

// Output descriptions
var descriptions = generateDescriptionChain(chainLength);
print(descriptions.join('\n\n'));

// Generates a chain of descriptions
function generateDescriptionChain(length) {
  var descriptions = [];
  for (var i = 1, j; i <= length; i++) {
    var inTriples = [],
        outTriples = [];
    for (j = 1; j <= (i > 1 ? conditionCount : 1); j++)
      inTriples.push('?a' + j + ' ex:rel' + i + ' ?b' + j + '.');
    for (j = 1; j <= conditionCount; j++)
      outTriples.push('?a' + j + ' ex:rel' + (i + 1) + ' ?b' + j + '.');
    if (i === length)
      outTriples.push('?a ex:relGoal ?b.');
    descriptions.push(generateDescription(inTriples, outTriples));
  }
  return descriptions;
}

// Generates a single description
function generateDescription(inTriples, outTriples) {
  var parts = ['{'];
  inTriples.forEach(function (triple) {
    parts.push('  ' + triple);
  });
  parts.push('}\n=>\n{');
  outTriples.forEach(function (triple) {
    parts.push('  ' + triple);
  });
  parts.push('}.');
  return parts.join('\n');
}
