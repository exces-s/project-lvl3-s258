install:
	npm install

start:
	npm run babel-node -- src/bin/binfile.js

lint:
	npm run eslint .

publish:
	npm publish

test:
	npm test