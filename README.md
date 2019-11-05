[![Build Status](https://travis-ci.com/UziTech/context.svg?branch=master)](https://travis-ci.com/UziTech/context)
[![Build status](https://ci.appveyor.com/api/projects/status/al1i62866nj16e6m/branch/master?svg=true)](https://ci.appveyor.com/project/UziTech/context)
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

## `.addMenuItem`

```js
const disposable = this.context.addMenuItem({
	keyPath: "My Package.My Command", // An array or `.` separated string of labels.
	command: (event) => { /* do something */}, // A command or function to call when the menu item is clicked.
	enabled: true // (optional) A Boolean indicating whether the menu item should be clickable. Disabled menu items typically appear grayed out. Defaults to true.
	visible: true // (optional) A Boolean indicating whether the menu item should appear in the menu. Defaults to true.
	created: (event) => { this.label = "Make Label Dynamic" } // (optional) A Function that is called on the item each time a context menu is created via a right click. You can assign properties to this to dynamically compute the command, label, etc.
	shouldDisplay: (event) => true // (optional) A Function that is called to determine whether to display this item on a given context menu deployment.
});
```

## `.filesForEvent`

Get selected files based on context.
1. If the context menu was opened on the tree-view this will return all selected file paths in the tree-view.
2. If it was opened on a tab it will return the file path for that tab.
3. If no event is passed it will return the project paths.
4. Otherwise it will return the file path for the active pane or text editor.

```js
atom.commands.add("atom-workspace", "my-package:my-command", (event) => {
	const files = this.context.filesForEvent(event);
	// do something with files
});
```

## `.reduceFilesToCommonFolders`

Reduce the selected files to their common folder when all files in a folder are selected.

```js
const allFiles = [
	"/dir1/filea.txt",
	"/dir1/fileb.txt",
	"/dir1/filec.txt",

	"/dir2/filea.txt",
	"/dir2/fileb.txt",
];
const selectedFiles = [
	"/dir1/filea.txt",
	"/dir1/fileb.txt",
	// "/dir1/filec.txt", not selected

	"/dir2/filea.txt",
	"/dir2/fileb.txt",
];

const reducedFiles = this.context.reduceFilesToCommonFolders(selectedFiles, allFiles);

// reducedFiles === [
// 	"/dir1/filea.txt",
// 	"/dir1/fileb.txt",
// 	"/dir2/",
// ]

// The files in /dir2/ were reduced to just the folder
// because all files in that folder were selected.
```
