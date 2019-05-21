/** @babel */

import path from "path";
import {CompositeDisposable} from "atom";
import MenuItem from "./MenuItem";

export default class Context {

	constructor(name) {
		this._name = name;
		// this._menuItems = new Set();
		this.disposables = new CompositeDisposable();
	}

	/**
	 * Remove items from this context
	 * @returns {void}
	 */
	dispose() {
		this.disposables.dispose();
	}

	/**
	 * Add an item to the context menu
	 * @param {object} item Menu item
	 * @param {string} item.keyPath Period separated submenu list.
	 * @param {string|function} item.command Command or function to call when clicked.
	 * @param {string} [item.selector="atom-workspace, atom-text-editor, .tree-view, .tab-bar"] Selector
	 * @param {boolean} [item.enabled=true] Enable menu item. Disabled menu items typically appear grayed out.
	 * @param {boolean} [item.visible=true] Should appear in the menu.
	 * @param {function} item.created Called on the item each time a context menu is created via a right click. You can assign properties to this to dynamically compute the command, label, etc.
	 * @param {function} item.shouldDisplay Called to determine whether to display this item on a given context menu deployment.
	 * @return {Disposable} Disposable
	 */
	addMenuItem(item) {
		const menuItem = new MenuItem(this._name, item);
		// this._menuItems.add(menuItem);
		this.disposables.add(menuItem.disposables);
		return menuItem.disposables;
	}

	/**
	 * Get the paths of the context target
	 * @param  {Event} event The context event
	 * @return {string[]} The selected paths for the target
	 */
	filesForEvent(event) {
		const target = event && event.target;
		if (!target) {
			return atom.project.getPaths();
		}

		const treeView = target.closest(".tree-view");
		if (treeView) {
			// called from treeview
			const selected = treeView.querySelectorAll(".selected > .list-item > .name, .selected > .name");
			if (selected.length > 0) {
				return [...selected].map(el => el.dataset.path);
			}
			return [];
		}

		const tab = target.closest(".tab-bar > .tab");
		if (tab) {
			// called from tab
			const title = tab.querySelector(".title");
			if (title && title.dataset.path) {
				return [title.dataset.path];
			}
			return [];
		}

		const paneItem = atom.workspace.getActivePaneItem();
		if (paneItem && typeof paneItem.getPath === "function") {
			// called from active pane
			return [paneItem.getPath()];
		}

		const textEditor = atom.workspace.getActiveTextEditor();
		if (textEditor && typeof textEditor.getPath === "function") {
			// fallback to activeTextEditor if activePaneItem is not a file
			return [textEditor.getPath()];
		}

		return [];
	}

	/**
	 * Reduce files to their folder if all files in that folder are selected
	 * @param  {string[]} selectedFiles The selected files to reduce
	 * @param  {string[]} allFiles All files to check for each folder
	 * @return {string[]} The list of files replaced by folders if all files in a folder are selected
	 */
	reduceFilesToCommonFolders(selectedFiles, allFiles) {
		if (selectedFiles.length === 0 || allFiles.length === 0) {
			return [];
		}

		// remove duplicate files
		selectedFiles = [...new Set(selectedFiles)]; // eslint-disable-line no-param-reassign
		allFiles = [...new Set(allFiles)]; // eslint-disable-line no-param-reassign

		// filter out selected files not in all files
		let reducedFiles = selectedFiles.filter(file => allFiles.includes(file));
		if (reducedFiles.length === allFiles.length) {
			if (allFiles[0].startsWith("/")) {
				return ["/"];
			}
			return ["."];
		}

		// count selected files by folder
		const selectedHash = reducedFiles.reduce((prev, file) => {
			let folder = path.dirname(file);
			while (![".", "/"].includes(folder)) {
				if (`${folder}/` in prev) {
					prev[`${folder}/`]++;
				} else {
					prev[`${folder}/`] = 1;
				}
				folder = path.dirname(folder);
			}

			return prev;
		}, {});

		// count all files by folder
		const allHash = allFiles.reduce((prev, file) => {
			let folder = path.dirname(file);
			while (![".", "/"].includes(folder)) {
				if (`${folder}/` in prev) {
					prev[`${folder}/`]++;
				} else {
					prev[`${folder}/`] = 1;
				}
				folder = path.dirname(folder);
			}

			return prev;
		}, {});

		// check each folder for all files selected
		let replaceFolders = Object.keys(selectedHash).reduce((prev, folder) => {
			if (allHash[folder] === selectedHash[folder]) {
				prev.push(folder);
			}

			return prev;
		}, []);

		// remove replaceFolders that are children of replaceFolders
		replaceFolders = replaceFolders.reduce((prev, folder) => {
			const isChildFolder = replaceFolders.some(otherFolder => {
				if (otherFolder === folder) {
					return false;
				}

				return folder.startsWith(otherFolder);
			});

			if (!isChildFolder) {
				prev.push(folder);
			}

			return prev;
		}, []);

		// remove files in replaceFolders
		reducedFiles = reducedFiles.reduce((prev, file) => {
			const shouldReplace = replaceFolders.some(folder => {
				if (file.startsWith(folder)) {
					return true;
				}
			});
			if (!shouldReplace) {
				prev.push(file);
			}
			return prev;
		}, []);

		// add replaceFolders
		reducedFiles = reducedFiles.concat(replaceFolders);

		return reducedFiles;
	}
}
