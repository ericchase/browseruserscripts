## About

https://github.com/ericchase/browseruserscripts

[Static Listing](https://ericchase.github.io/browseruserscripts/out)

Userscripts for use with the Greasemonkey, Violentmonkey, Tampermonkey, and alternative browser extensions to modify existing websites. These scripts are written in TypeScript and compiled into JavaScript using a custom build tool.

To quickly install scripts, visit the Static Listing and click the link for a userscript you want. If you have an extension (like Violentmonkey) installed, the page should be recognized as a userscript and, and you should get a prompt to install it.

[Violentmonkey for Chrome](https://addons.mozilla.org/en-US/firefox/addon/styl-us/)
[Violentmonkey for Firefox](https://addons.mozilla.org/en-US/firefox/addon/violentmonkey/)

## TypeScript Library and Template Project

For information about my TypeScript library and template projects, please visit:

- https://github.com/ericchase-library/ts-library
- https://github.com/ericchase-library/ts-template

## Developer Environment Setup

I generally recommend VSCode for web development.

**Install the Bun runtime**

- https://bun.sh/

**Install npm dependencies**

```
bun install
```

**Build the project**

For continuous building as you work:

```
bun run dev
```

For final builds:

```
bun run build
```

**Run the Biome linter**

```
bun run lint
```

## Copyright & License

**TL;DR:**

> This code is truly free and open source, licensed under the Apache 2.0 License. If you make a copy, _I humbly ask_ that you include the text from the `NOTICE` file somewhere in your project. **_You are not required to!_** You are also not required to include the original `LICENSE-APACHE` or `NOTICE` files, and I would prefer just a copy of the `NOTICE` file text or a link to this repository instead. You can use and modify this code however you like, including using a proprietary license for your changes. The only restriction I maintain is under clause 3 of the Apache 2.0 License regarding patents. If you find any potential license violations within any of my projects, please contact me so that I may resolve them.

A longer explanation can be found in the `README.md` file at https://github.com/ericchase-library/ts-library.
