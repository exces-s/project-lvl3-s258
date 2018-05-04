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

debug:
	DEBUG=pa* npm test

q:
	DEBUG=pa* npm run babel-node -- src/bin/pageloader.js https://github.com/ --output __tests__/__fixtures__/