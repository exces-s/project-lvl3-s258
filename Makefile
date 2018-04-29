install:
	npm install

start:
	npm run babel-node -- src/bin/binfile.js

lint:
	npm run eslint .