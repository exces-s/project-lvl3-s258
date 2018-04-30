#!/usr/bin/env node
import commander from 'commander';
import pageLoad from '..';
import { version } from '../../package.json';


const program = commander;

program
  .version(version)
  .arguments('<url> [options] [path]')
  .description('Download the page from web to specified folder(to the program\'s start directory by default )')
  .option('--output', 'Output folder')
  .action((url, option, path) => pageLoad(url, option, path))
  .parse(process.argv);

console.log('Page was downloaded');
