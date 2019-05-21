/** @babel */

import Context from "./Context";

export default {

	/**
	 * Activate package
	 * @return {void}
	 */
	activate() {
		this.contexts = new Map();
	},

	/**
	 * Deactivate package
	 * @return {void}
	 */
	deactivate() {
		this.contexts.forEach(ctx => ctx.dispose());
		this.contexts.clear();
	},

	/**
	 * Provider
	 * @return {object} Context service
	 */
	provideContext() {
		return {

			/**
			 * [getContext description]
			 * @param  {string} name Name of the package consuming the service
			 * @return {Context} Context service
			 */
			getContext: (name) => {
				if (!name || typeof name !== "string") {
					throw new Error("Must provide a name for the context object");
				}
				if (this.contexts.has(name)) {
					return this.contexts.get(name);
				}
				const ctx = new Context(name);
				this.contexts.set(name, ctx);
				return ctx;
			},
		};
	},
};
