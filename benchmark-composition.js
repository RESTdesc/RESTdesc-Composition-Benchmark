#!/usr/bin/env node

var print = console.log,
    exec = require('child_process').exec;

// Parse arguments
var args = process.argv.splice(2);
var maxDescriptionCount = parseInt(args[0], 10) || Math.Infinity;
var repeats = 5;

var descriptionCount = 1;
var results = {};

var steps = [nextRound];
executeSteps();

function executeSteps() {
  var step = steps.shift();
  if (!step)
    return;
  
  var result = results[step.name];
  if (!result)
    results[step.name] = result = [];
  
  var time = new Date().getTime();
  step(function () {
    result.push(new Date().getTime() - time);
    executeSteps();
  });
}

function nextRound(callback) {
  descriptionCount *= 2;
  if (descriptionCount > maxDescriptionCount)
    return;
  results = {};
  steps.push(generateDescriptions);
  for (var i = 0; i < repeats; i++)
    steps.push(createComposition);
  steps.push(printResults);
  steps.push(nextRound);
  callback();
}

function generateDescriptions(callback) {
  exec('./generate-descriptions.js ' + descriptionCount + ' > /tmp/descriptions.n3', callback);
}

function createComposition(callback) {
  exec('eye init.ttl /tmp/descriptions.n3 --query goal.n3', callback);
}

function printResults(callback) {
  print([
      descriptionCount,
      round(avg(results.createComposition)),
    ].join('\t'));
  callback();
}

function avg (values) {
  return values.reduce(function(a,b) { return a + b; }, 0) / values.length;
}

function round(value) {
  return (Math.round(value * 10) + '').replace(/(\d)$/, '.$1');
}
