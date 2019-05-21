/** @babel */

import path from "path";

function attachHtml(html) {
	const div = document.createElement("div");
	div.innerHTML = html;
	jasmine.attachToDOM(div);
	return div;
}

describe("context", () => {
	beforeEach(async function () {
		this.context = (await atom.packages.activatePackage("context")).mainModule;
		// console.log(this.context);
		this.workspace = atom.views.getView(atom.workspace);
	});

	afterEach(async function () {
		await atom.packages.deactivatePackage("context", true);
	});

	it("should return an object", function () {
		const ctx = this.context.provideContext().getContext("test");
		expect(typeof ctx).toBe("object");
	});

	it("should return same context for same name", function () {
		const ctx1 = this.context.provideContext().getContext("test");
		const ctx2 = this.context.provideContext().getContext("test");
		expect(ctx1).toBe(ctx2);
	});

	it("should return different context for different name", function () {
		const ctx1 = this.context.provideContext().getContext("test1");
		const ctx2 = this.context.provideContext().getContext("test2");
		expect(ctx1).not.toBe(ctx2);
	});

	it("should throw for no name", function () {
		expect(() => this.context.provideContext().getContext("")).toThrow();
	});

	describe("addMenuItem", () => {
		beforeEach(function () {
			this.ctx = this.context.provideContext().getContext("test");
		});

		it("should add menu item", function () {
			const spy = jasmine.createSpy();
			atom.commands.add(this.workspace, "test:command", spy);

			spyOn(atom.commands, "add").and.callThrough();
			spyOn(atom.contextMenu, "add").and.callThrough();
			spyOn(atom.config, "set").and.callThrough();

			this.ctx.addMenuItem({
				keyPath: "test",
				command: "test:command",
			});

			expect(atom.commands.add).not.toHaveBeenCalled();
			expect(atom.contextMenu.add).toHaveBeenCalled();
			expect(atom.config.set).toHaveBeenCalled();
		});

		it("should add command given function", function () {
			const spy = jasmine.createSpy();

			spyOn(atom.commands, "add").and.callThrough();

			this.ctx.addMenuItem({
				keyPath: "test",
				command: spy,
			});

			expect(atom.commands.add).toHaveBeenCalled();
		});

		it("should add menu item to template", function () {
			// TODO:
		});

		it("should add config", function () {
			// TODO:
		});

		it("should remove menuItem on config change", function () {
			// TODO:
		});

		it("should return disposable", function () {
			const ret = this.ctx.addMenuItem({
				keyPath: "test",
				command: "test:command",
			});

			expect(typeof ret.dispose).toBe("function");
		});
	});

	describe("filesForEvent", () => {
		beforeEach(function () {
			this.ctx = this.context.provideContext().getContext("test");
		});

		it("should get paths for treeview", async function () {
			const folder = path.resolve(__dirname, "./fixtures");
			atom.project.setPaths([folder]);
			const file = path.resolve(__dirname, "./fixtures/text.txt");
			await atom.workspace.open(file);
			const element = attachHtml(`
				<ul class="tree-view">
					<li class="selected"><span class="name" data-path="/a/file1">file1</span></li>
					<li ><span class="name" data-path="/a/file2">file2</span></li>
					<li class="selected"><span class="name" data-path="/a/file3">file3</span></li>
				</ul>
			`);

			const files = this.ctx.filesForEvent({target: element.querySelector(".name[data-path='/a/file2']")});
			expect(files).toEqual(["/a/file1", "/a/file3"]);
		});

		it("should get path for tab", async function () {
			const folder = path.resolve(__dirname, "./fixtures");
			atom.project.setPaths([folder]);
			const file = path.resolve(__dirname, "./fixtures/text.txt");
			await atom.workspace.open(file);
			const element = attachHtml(`
				<ul class="tab-bar">
					<li class="tab"><span class="title" data-path="/a/file1">file1</span></li>
					<li class="tab"><span class="title" data-path="/a/file3">file3</span></li>
				</ul>
			`);

			const files = this.ctx.filesForEvent({target: element.querySelector(".title[data-path='/a/file3']")});
			expect(files).toEqual(["/a/file3"]);
		});

		it("should get project paths", async function () {
			const folder = path.resolve(__dirname, "./fixtures");
			atom.project.setPaths([folder]);

			const files = this.ctx.filesForEvent();

			expect(files).toEqual([folder]);
		});

		it("should get path for active textEditor", async function () {
			const file = path.resolve(__dirname, "./fixtures/text.txt");
			await atom.workspace.open(file);

			const files = this.ctx.filesForEvent({
				target: this.workspace,
			});

			expect(files).toEqual([file]);
		});

		it("should return no paths if none open", function () {
			const files = this.ctx.filesForEvent({
				target: this.workspace,
			});

			expect(files).toEqual([]);
		});
	});

	describe("reduceFilesToCommonFolders", () => {
		beforeEach(function () {
			this.ctx = this.context.provideContext().getContext("test");
		});

		it("should remove selected files not in all files", function () {
			const selectedFiles = [
				"/a/1",
				"/a/3",
			];
			const allFiles = [
				"/a/1",
				"/a/2",
			];
			const files = this.ctx.reduceFilesToCommonFolders(selectedFiles, allFiles);

			expect(files).toEqual([
				"/a/1",
			]);
		});

		it("should reduce files", function () {
			const selectedFiles = [
				"/a/1",
				"/a/2",
				"/b/1",
			];
			const allFiles = [
				"/a/1",
				"/a/2",
				"/b/1",
				"/b/2",
			];
			const files = this.ctx.reduceFilesToCommonFolders(selectedFiles, allFiles);
			files.sort();

			expect(files).toEqual([
				"/a/",
				"/b/1",
			]);
		});

		it("should reduce all files", function () {
			const selectedFiles = [
				"/a/1",
				"/a/2",
				"/b/1",
				"/b/2",
			];
			const allFiles = [
				"/a/1",
				"/a/2",
				"/b/1",
				"/b/2",
			];
			const files = this.ctx.reduceFilesToCommonFolders(selectedFiles, allFiles);
			files.sort();

			expect(files).toEqual([
				"/",
			]);
		});
	});
});
