#!/usr/bin/env node

import { Command } from 'commander';
import path from 'path';
import pageLoader from '../src/page-loader.js';

const program = new Command();

program
  .version('1.0.0')
  .description('Page loader utility')
  .option('-o, --output [dir]', 'output dir', process.cwd())
  .arguments('<url>')
  .action((url, options) => {
    const outputDir = path.resolve(options.output);
    pageLoader(url, outputDir)
      .then(({ filePath }) => {
        console.log(`Page was successfully downloaded into '${filePath}'`);
      })
      .catch((error) => {
        console.error(`Error: ${error.message}`);
        process.exit(1);
      });
  });

program.on('--help', () => {
  console.log('\nExample usage:');
  console.log('  $ page-loader -o ./output https://page-loader.hexlet.repl.co');
  console.log('');
});

program.parse(process.argv);
