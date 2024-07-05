/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 638:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const core = __nccwpck_require__(838)
const notionWorkspace = core.getInput('notionWorkspace') || process.env.JIRA_HOST
/**
 * Strips referenced jira tickets that are already surrounded by brackets.
 * Assumes tickets are uppercase.
 * @param {String} changelog
 * @returns Modified changelog
 */
function stripBrackets(changelog) {
  let revisedChangelog

  try {
    // remove any matched or unmatched bracket adjacent to a JIRA ticket number
    const regex = /(?:\[?)([A-Z][A-Z0-9]+-\d+)(?:\]?)/g
    revisedChangelog = changelog.replace(regex, '$1')
  } catch (error) {
    console.log(error)
    core.setFailed(error.message)
  }

  return revisedChangelog
}

/**
 * Formats referenced jira tickets to uppercase.
 * @param {String} changelog
 * @returns {String} Modified changelog
 */
function toUpperJiraTickets(changelog) {
  let revisedChangelog

  try {
    const regex = /([a-zA-Z][a-zA-Z0-9]+-\d+)/g
    revisedChangelog = changelog.replace(regex, p1 => p1.toUpperCase())
  } catch (error) {
    console.log(error)
    core.setFailed(error.message)
  }

  return revisedChangelog
}

/**
 * Separates referenced Jira Tickets with a comma space format.
 * Assumes tickets are uppercase and brackets have been removed.
 * @param {String} changelog
 * @returns Modified changelog
 */
function addCommaSpaceBetweenJiraTickets(changelog) {
  let revisedChangelog

  try {
    const regex = /([A-Z][A-Z0-9]+-\d+)[, ]*(?=[A-Z][A-Z0-9]+-\d+)/g

    revisedChangelog = changelog.replace(regex, '$1, ')
  } catch (error) {
    console.log(error)
    core.setFailed(error.message)
  }

  return revisedChangelog
}

/**
 * Surrounds jira ticket list with brackets.
 * Assumes tickets are uppercase and separated by a comma and space, and brackets have been removed
 * @param {String} changelog
 * @returns Modified changelog
 */
function surroundTicketListWithBrackets(changelog) {
  let revisedChangelog

  try {
    const regex = /((?:[A-Z][A-Z0-9]+-\d+\, )*(?:[A-Z][A-Z0-9]+-\d+))/g
    revisedChangelog = changelog.replace(regex, '[$1]')
  } catch (error) {
    console.log(error)
    core.setFailed(error.message)
  }

  return revisedChangelog
}

/**
 * Adds Jira markdown links to a given changelog for referenced Jira Tickets.
 * @param {String} changelog
 * @returns {String} Modified changelog
 */
function addJiraLinksToChangelog(changelog) {
  let revisedChangelog

  try {
    const regex = /([A-Z][A-Z0-9]+-\d+)/g
    revisedChangelog = changelog.replace(regex, `[\`$1\`](https://notion.so/${notionWorkspace}/$1)`)
  } catch (error) {
    console.log(error)
    core.setFailed(error.message)
  }

  return revisedChangelog
}

/**
 * Formats a changelog and adds Jira markdown links for referenced Jira Tickets
 * @param {String} changelog
 * @returns {String} Modified changelog
 */
function jirafyChangelog(changelog) {
  let revisedChangelog = toUpperJiraTickets(changelog)
  revisedChangelog = stripBrackets(revisedChangelog)
  revisedChangelog = addCommaSpaceBetweenJiraTickets(revisedChangelog)
  revisedChangelog = surroundTicketListWithBrackets(revisedChangelog)
  return addJiraLinksToChangelog(revisedChangelog)
}

module.exports = {
  jirafyChangelog,
  addJiraLinksToChangelog,
  toUpperJiraTickets,
  stripBrackets,
  addCommaSpaceBetweenJiraTickets,
  surroundTicketListWithBrackets
}


/***/ }),

/***/ 838:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 766:
/***/ ((module) => {

module.exports = eval("require")("@actions/github");


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
const core = __nccwpck_require__(838);
const github = __nccwpck_require__(766);
const { jirafyChangelog } = __nccwpck_require__(638);

var headRef = core.getInput("head-ref");
var baseRef = core.getInput("base-ref");
const githubToken = core.getInput("githubToken");
const changelog = core.getInput("changelog");
const octokit = new github.getOctokit(githubToken);
const { owner, repo } = github.context.repo;
const gitRefRegexp = /^[.A-Za-z0-9_\-\/]+$/;

async function run() {
	try {
		if (!headRef) {
			headRef = github.context.sha;
		}

		if (!baseRef) {
			const latestRelease = await octokit.rest.repos.getLatestRelease({
				owner: owner,
				repo: repo,
			});

			if (latestRelease) {
				baseRef = latestRelease.data.tag_name;
			} else {
				core.setFailed(
					`There are no releases on ${owner}/${repo}. Tags are not releases.`,
				);
			}
		}

		if (
			!!headRef &&
			!!baseRef &&
			gitRefRegexp.test(headRef) &&
			gitRefRegexp.test(baseRef)
		) {
			let resp;
			let baseChangelog;
			if (changelog === "") {
				try {
					resp = await octokit.rest.repos.generateReleaseNotes({
						owner: owner,
						repo: repo,
						tag_name: headRef,
						previous_tag_name: baseRef,
					});
					baseChangelog = resp.data.body;
				} catch (err) {
					core.setFailed(
						`Could not generate changelog between references because: ${err.message}`,
					);
					process.exit(1);
				}
			} else {
				baseChangelog = changelog;
			}
			console.log(
				"\x1b[32m%s\x1b[0m",
				`Base changelog between ${baseRef} and ${headRef}:\n${baseChangelog}\n`,
			);

			const jirafiedChangelog = jirafyChangelog(baseChangelog);
			console.log(
				"\x1b[32m%s\x1b[0m",
				`Jirafied Changelog:\n${jirafiedChangelog}\n`,
			);

			core.setOutput("changelog", jirafiedChangelog);
		} else {
			core.setFailed(
				"Git ref names must contain one or more numbers, strings, underscores, periods, slashes and dashes.",
			);
		}
	} catch (error) {
		core.setFailed(error.message);
	}
}

try {
	run();
} catch (error) {
	core.setFailed(error.message);
}

})();

module.exports = __webpack_exports__;
/******/ })()
;