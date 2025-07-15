const greet = require('../src/index');

const result = greet("World");
if (result !== "Hello, World!") {
  throw new Error(`Expected "Hello, World!" but got "${result}"`);
} else {
  console.log("Test passed.");
}
