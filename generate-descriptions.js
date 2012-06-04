#!/usr/bin/env node

var print = console.log;

// Parse arguments
var args = process.argv.splice(2);
if (args.length < 1)
  return console.error('Insufficient arguments.');
var chainLength = parseInt(args[0], 10);

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
  for (var i = 1; i <= length; i++) {
    var inTriples = [],
        outTriples = [];
    inTriples.push('?a ex:rel' + i + ' ?b.');
    outTriples.push('?a ex:rel' + (i + 1) + ' ?b.');
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
