#!/usr/bin/env node

import commander from 'commander';
import pageLoad from '..';
import { version } from '../../package.json';


commander
  .version(version)
  .description('Download the page from web to specified folder(to the program\'s start directory by default)')
  .arguments('<url>')
  .option('-o, --output [path]', 'Output path', '.')
  .action(async (url) => {
    try {
      const result = await pageLoad(url, commander.output);
      return console.log(result);
    } catch (error) {
      console.log(error.message);
      return process.exit(1);
    }
  })
  .parse(process.argv);
