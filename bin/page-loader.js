#!/usr/bin/env node
import { Command } from 'commander';
import pageLoader from '../src/page-loader.js';

const program = new Command();

program
  .version('1.0.0')
  .description('Page loader utility')
  .option('-o, --output [dir]', 'output dir', process.cwd())
  .arguments('<url>')
  .action(async (url, options) => {
    const outputDir = path.resolve(options.output);
    downloadPage(url, outputDir)
      .then((filePath) => console.log(`Page was successfully downloaded into '${filePath}'`))
      .catch((err) => console.error(`Error: ${err.message}`));
  });

  program.on('--help', () => {
    console.log('');
    console.log('Example usage:');
    console.log('  $ page-loader -o ./output https://example.com');
    console.log('');
  });
  
program.parse(process.argv);
