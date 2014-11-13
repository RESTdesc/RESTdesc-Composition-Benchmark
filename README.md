# Benchmarks for RESTdesc composition
## About
[RESTdesc](http://restdesc.org/) is a description format for hypermedia APIs.<br>
This suite benchmarks how generic Semantic Reasoners perform
when creating compositions of RESTdesc descriptions.

## Instructions
To start the benchmark for the [EYE](http://eulersharp.sourceforge.net/) reasoner
with up to 1024 descriptions and 10 trials each,
run the following command (with [Node.js](http://nodejs.org/) >= 0.10):

```bash
$ node benchmark-composition eye 10 1024
```

Currently supported reasoners are [EYE](http://eulersharp.sourceforge.net/)
and [cwm](http://www.w3.org/2000/10/swap/doc/cwm).
