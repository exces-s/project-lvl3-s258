#!/usr/bin/env node

import commander from 'commander';
import pageLoad from '..';
import { version } from '../../package.json';


commander
  .version(version)
  .description('Download the page from web to specified folder(to the program\'s start directory by default)')
  .arguments('<url>')
  .option('-o, --output [path]', 'Output path', '.')
  .action(url => pageLoad(url, commander.output)
    .then(result => console.log(result))
    .catch(async (err) => {
      console.log(err);
      process.exit(1);
    }))
  .parse(process.argv);
