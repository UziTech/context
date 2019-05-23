/** @babel */

import {CompositeDisposable} from "atom";
import {splitKeyPath} from "key-path-helpers";

const DEFAULT_SELECTOR = "atom-workspace, atom-text-editor, .tree-view, .tab-bar";

export default class MenuItem {
	constructor(name, item) {
		this.visible = true;
		this.disposables = new CompositeDisposable();
		if (typeof item.command === "function") {
			const command = `context:${name}.${item.keyPath}`;
			this.disposables.add(this.addCommand(command, item.command));
			item.command = command;
		}
		this.disposables.add(this.addContextMenu(item));
		this.disposables.add(this.addConfig(name, item));
	}

	addContextMenu(item) {
		const keyPath = typeof item.keyPath === "string" ? splitKeyPath(item.keyPath) : item.keyPath;

		const contextMenuItem = {};
		let contextItem = contextMenuItem;
		keyPath.forEach((key, i) => {
			contextItem.label = key;
			if (i < keyPath.length - 1) {
				const newItem = {};
				contextItem.submenu = [newItem];
				contextItem = newItem;
			} else {
				contextItem.command = item.command;
				contextItem.enabled = item.enabled;
				contextItem.visible = item.visible;
				contextItem.created = item.created;
				contextItem.shouldDisplay = (event) => {
					if (!this.visible) {
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
		const configPath = `context.${name}.${item.keyPath}`;
		const checked = atom.config.get(configPath);
		if (checked !== null) {
			atom.config.set(configPath, true);
		}

		return atom.config.observe(configPath, (value) => {
			this.visible = value;
		});
	}
}
