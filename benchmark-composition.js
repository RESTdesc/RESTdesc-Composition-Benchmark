#!/usr/bin/env node

var print = console.log,
    child_process = require('child_process'),
    fs = require('fs'),
    os = require('os');

// Parse arguments
var args = process.argv.splice(2);
if (args[0] === '--help')
  return print('usage: benchmark-composition [reasoner] [repeats] [max_descriptions]');

var reasoner = args[0] || "eye";
var repeats = parseInt(args[1], 10) || 5;
var maxDescriptionCount = parseInt(args[2], 10) || Infinity;
var path = os.tmpDir() + "/benchmark-composition-" + process.pid + '/';
var descriptionCount = 1;

print(reasoner, 'maximum', maxDescriptionCount, 'descriptions with', repeats, 'repeats');

// Reasoner configuration
var reasonerOptions = {
  eye: {
    goal: '--query ',
    proof: ''
  },
  cwm: {
    goal: '--think --filter=',
    proof: '--why'
  }
}
fs.mkdirSync(path);

// Asynchronous step executor
var results = {};
var steps = [dryRun, nextRound];
executeSteps();

// Execute the next step, measuring its duration
function executeSteps() {
  // Get the next step
  var step = steps.shift();
  if (!step)
    return;

  // Get the current results for this step
  var result = results[step.name];
  if (!result)
    results[step.name] = result = [];

  // Start the step and measure its duration
  step(function (error, duration) {
    if (error)
      throw error;
    // Store the result and continue with the next step
    result.push(duration);
    executeSteps();
  });
}

// Execute the command in a new process, returning its duration
function exec(command, callback) {
  // Set options according to platform, and ignore output
  var shell, args, options = {};
  if (process.platform === 'win32') {
    shell = 'cmd.exe';
    args = ['/s', '/c', '"' + command + '"'];
    options.windowsVerbatimArguments = true;
  }
  else {
    shell = '/bin/sh';
    args = ['-c', command];
  }

  // Start the process
  var err = '',
      limit = 4096,
      length = 0,
      startTime = new Date().getTime(),
      child = child_process.spawn(shell, args, options);
  // Log duration on exit
  child.addListener('exit', function (error) {
    callback(error ? err : null, new Date().getTime() - startTime);
  });
  // Stop if stdout has sufficient characters to prove termination
  child.stdout.setEncoding('utf8');
  child.stdout.addListener('data', function (chunk) {
    length += chunk.length;
    if (length > limit)
      child.kill();
  });
  // Log possible errors
  child.stderr.setEncoding('utf8');
  child.stderr.addListener('data', function (chunk) {
    err += chunk;
  });
}


/***
          STEPS
                      ***/

var benchmarkSteps = [parseDescriptions, createComposition,
                      parseDescriptionsTwoConditions, createCompositionTwoConditions,
                      parseDescriptionsThreeConditions, createCompositionThreeConditions,
                      parseDescriptionsWithDummies, createCompositionWithDummies];

// Generates steps for the next benchmark round
function nextRound(callback) {
  descriptionCount *= 2;
  if (descriptionCount > maxDescriptionCount)
    return;

  // Reset the results.
  results = {};

  // Create new steps
  steps.push(generateDescriptions);
  for (var step = 0; step < benchmarkSteps.length; step++)
    for (var i = 0; i < repeats; i++)
      steps.push(benchmarkSteps[step]);
  steps.push(printResults);
  steps.push(nextRound);

  // Execute the steps
  callback();
}

// Generates `descriptionCount` descriptions
function generateDescriptions(callback) {
  var descriptions = [
    descriptionCount + ' 1 > ' + path + 'descriptions1.n3',
    descriptionCount + ' 2 > ' + path + 'descriptions2.n3',
    descriptionCount + ' 3 > ' + path + 'descriptions3.n3',
    '32 > ' + path + '32descriptions.n3',
    descriptionCount + ' 1 dummy > ' + path + 'dummy.n3',
  ];

  function next() {
    if (!descriptions.length)
      return callback();
    exec(process.argv[0] + ' generate-descriptions.js ' + descriptions.pop(), next);
  }
  next();
}

// Dry reasoner run (to calibrate)
function dryRun(callback) {
  exec(reasoner + ' --help', callback);
}

// Parses `descriptionCount` descriptions
function parseDescriptions(callback) {
  exec(reasoner + ' ' + path + 'descriptions1.n3', callback);
}

// Creates a composition chain of `descriptionCount` descriptions
function createComposition(callback) {
  exec(reasoner + ' initial.ttl ' + path + 'descriptions1.n3 '
       + reasonerOptions[reasoner].goal + 'goal.n3 '
       + reasonerOptions[reasoner].proof, callback);
}

// Parses `descriptionCount` descriptions (two conditions)
function parseDescriptionsTwoConditions(callback) {
  exec(reasoner + ' ' + path + 'descriptions2.n3', callback);
}

// Creates a composition chain of `descriptionCount` descriptions (two conditions)
function createCompositionTwoConditions(callback) {
  exec(reasoner + ' initial.ttl ' + path + 'descriptions2.n3 '
       + reasonerOptions[reasoner].goal + 'goal.n3 '
       + reasonerOptions[reasoner].proof, callback);
}

// Parses `descriptionCount` descriptions (three conditions)
function parseDescriptionsThreeConditions(callback) {
  exec(reasoner + ' ' + path + 'descriptions3.n3', callback);
}

// Creates a composition chain of `descriptionCount` descriptions (three conditions)
function createCompositionThreeConditions(callback) {
  exec(reasoner + ' initial.ttl ' + path + 'descriptions3.n3 '
       + reasonerOptions[reasoner].goal + 'goal.n3 '
       + reasonerOptions[reasoner].proof, callback);
}

// Parses descriptions in presence of `descriptionCount` dummies
function parseDescriptionsWithDummies(callback) {
  exec(reasoner + ' ' + path + '32descriptions.n3 ' + path + 'dummy.n3', callback);
}

// Creates a composition chain in presence of `descriptionCount` dummies
function createCompositionWithDummies(callback) {
  exec(reasoner + ' initial.ttl ' + path + '32descriptions.n3 ' + path + 'dummy.n3 '
       + reasonerOptions[reasoner].goal + 'goal.n3 '
       + reasonerOptions[reasoner].proof, callback);
}

// Prints the results of a benchmark round
function printResults(callback) {
  // Prepend averages to numerical data
  for (var type in results)
    if (typeof results[type][0] === 'number')
      results[type].unshift(avg(results[type]));

  // Print averages, followed by individual runs
  for (var i = 0, l = results.createComposition.length; i < l; i++)
    print([
        i === 0 ? descriptionCount + ' (AVG)' : '-',
        round(results.parseDescriptions[i]),
        round(results.createComposition[i] - results.parseDescriptions[i]),
        round(results.createComposition[i]),
        round(results.parseDescriptionsTwoConditions[i]),
        round(results.createCompositionTwoConditions[i] - results.parseDescriptionsTwoConditions[i]),
        round(results.createCompositionTwoConditions[i]),
        round(results.parseDescriptionsThreeConditions[i]),
        round(results.createCompositionThreeConditions[i] - results.parseDescriptionsThreeConditions[i]),
        round(results.createCompositionThreeConditions[i]),
        round(results.parseDescriptionsWithDummies[i]),
        round(results.createCompositionWithDummies[i] - results.parseDescriptionsWithDummies[i]),
        round(results.createCompositionWithDummies[i]),
      ].join('\t'));
  callback();
}

// Returns the average of the values in the array
function avg (values) {
  return values.reduce(function(a,b) { return a + b; }, 0) / values.length;
}

// Rounds the value to exactly one decimal place, converting it to a string
function round(value) {
  return (Math.round(value * 10) + '').replace(/(\d)$/, '.$1');
}
