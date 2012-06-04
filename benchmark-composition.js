#!/usr/bin/env node

var print = console.log,
    exec = require('child_process').exec;

// Parse arguments
var args = process.argv.splice(2);
if (args.length < 1)
  return console.error('Insufficient arguments.');
var runCount = parseInt(args[0], 10);
var averageCount = 5;

var runs = 1;
nextRound();

function nextRound() {
  runs *= 2;
  if (runs > runCount)
    return;
  
  exec('./generate-descriptions.js ' + runs + ' > /tmp/descriptions.n3', runReasoner);
}

function runReasoner(times) {
  times = times || [];
  var time = new Date().getTime();
  exec('eye init.ttl /tmp/descriptions.n3 --query goal.n3', function () {
    times.push(new Date().getTime() - time);
    if (times.length < averageCount) {
      runReasoner(times);
    }
    else {
      var average = times.reduce(function(a,b) { return a + b; }) / times.length;
      console.log(runs + '\t' +  average);
      nextRound();
    }
  });
}
