/** @babel */

import {createRunner} from "atom-jasmine3-test-runner";

export default createRunner({
	specHelper: {
		attachToDom: true,
		ci: true
	},
});
