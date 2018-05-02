install:
	npm install

start:
	npm run babel-node -- src/bin/pageloader.js

lint:
	npm run eslint .

publish:
	npm publish

test:
	npm test

test-coverage:
	npm test -- --coverage

build:
	npm run build