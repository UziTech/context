/** @babel */

import {CompositeDisposable} from "atom";
import {splitKeyPath, pushKeyPath} from "key-path-helpers";

const DEFAULT_SELECTOR = "atom-workspace, atom-text-editor, .tree-view, .tab-bar";
function keyPathToArray(keyPath) {
	if (typeof keyPath === "string") {
		return splitKeyPath(keyPath);
	}
	return keyPath;
}

function keyPathToString(keyPath) {
	if (Array.isArray(keyPath)) {
		return keyPath.reduce(pushKeyPath, "");
	}
	return keyPath;
}

function getSchema(path) {
	const schema = atom.config.getSchema(path);
	return (!schema || schema.type === "any" ? null : schema);
}

export default class MenuItem {
	constructor(name, item) {
		this.configCheckboxes = {};
		this.disposables = new CompositeDisposable();
		if (typeof item.command === "function") {
			const command = `context:${name}.${keyPathToString(item.keyPath)}`;
			this.disposables.add(this.addCommand(command, item.command));
			item.command = command;
		}
		this.disposables.add(this.addContextMenu(name, item));
		this.disposables.add(this.addConfig(name, item));
	}

	isVisible(name, path) {
		return this.configCheckboxes[path] && this.configCheckboxes[`context.${name}`];
	}

	addContextMenu(name, item) {
		const keyPath = keyPathToArray(item.keyPath);

		const contextMenuItem = {};
		let contextItem = contextMenuItem;
		let configPath = `context.${name}`;
		keyPath.forEach((key, i) => {
			configPath = pushKeyPath(configPath, key);
			const isSubmenu = i < keyPath.length - 1;
			contextItem.label = item.title || key;
			if (isSubmenu) {
				const newItem = {};
				contextItem.submenu = [newItem];
				contextItem.shouldDisplay = () => this.isVisible(name, configPath);
				contextItem = newItem;
			} else {
				contextItem.command = item.command;
				contextItem.enabled = item.enabled;
				contextItem.visible = item.visible;
				contextItem.created = item.created;
				contextItem.shouldDisplay = (event) => {
					if (!this.isVisible(name, configPath)) {
						return false;
					}

					if (typeof item.shouldDisplay === "function") {
						return item.shouldDisplay(event);
					}

					return true;
				};
			}
		});

		return atom.contextMenu.add({
			[item.selector || DEFAULT_SELECTOR]: [contextMenuItem],
		});
	}

	addCommand(command, func) {
		return atom.commands.add(atom.views.getView(atom.workspace), command, {
			didDispatch: func,
			hiddenInCommandPalette: true,
		});
	}

	addConfig(name, item) {
		const disposables = new CompositeDisposable();
		const configPath = [
			name,
			...keyPathToArray(item.keyPath),
		];

		let path = "context";
		configPath.forEach((p, i) => {
			const isSubmenu = i < configPath.length - 1;
			path = pushKeyPath(path, p);
			if (isSubmenu) {
				const checkboxPath = `${path}Submenu`;
				atom.config.setSchema(checkboxPath, {title: `Show ${path}`, type: "boolean", default: true});
				atom.config.observe(checkboxPath, (value) => {
					this.configCheckboxes[path] = value;
				});
				if (!getSchema(path)) {
					atom.config.setSchema(path, {title: path, type: "object", properties: {}, collapsed: true});
				}
			} else {
				atom.config.setSchema(path, {title: item.title || p, description: item.description, type: "boolean", default: true});
				atom.config.observe(path, (value) => {
					this.configCheckboxes[path] = value;
				});
			}
		});

		return disposables;
	}
}
