[![Build Status](https://travis-ci.com/UziTech/context.svg?branch=master)](https://travis-ci.com/UziTech/context)
[![Build status](https://ci.appveyor.com/api/projects/status/al1i62866nj16e6m?svg=true)](https://ci.appveyor.com/project/UziTech/context)
[![dependencies Status](https://david-dm.org/UziTech/context/status.svg)](https://david-dm.org/UziTech/context)

# context

Provides a service for interacting with Atom context menu

# Usage

```js
// in package.json
{
	...
	"consumedServices": {
		"context": {
			"versions": {
				"^0.1.0": "consumeContext"
			}
		}
	},
	...
}
```

```js
// in index.js
	activate() {
		...
	},

	consumeContext(context) {
		// Create a context with your package name
		this.context = context.getContext("my-package");
	},
```
