const PHASE_KEYWORDS = [
	["define", "identify", "research", "analyze", "gather", "assess"],
	["design", "draft", "create", "plan", "outline", "propose"],
	["build", "develop", "implement", "configure", "integrate", "write"],
	["test", "validate", "verify", "review", "check", "evaluate"],
	["finalize", "polish", "refine", "complete", "approve"],
	["deploy", "launch", "release", "publish", "announce", "ship"],
];

const JOIN_KEYWORDS = new Set(["launch", "deploy", "release", "announce", "ship", "publish"]);
const PHASE_WORDS = new Set(PHASE_KEYWORDS.flat());

const STOP_WORDS = new Set([
	"a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
	"of", "with", "by", "from", "as", "is", "was", "are", "were", "be",
	"been", "being", "have", "has", "had", "do", "does", "did", "will",
	"would", "could", "should", "may", "might", "shall", "can", "need",
	"must", "that", "this", "these", "those", "it", "its", "all", "each",
	"every", "both", "few", "more", "most", "other", "some", "such", "no",
	"not", "only", "own", "same", "so", "than", "too", "very", "just",
	"into", "out", "up", "new",
]);

function tokenize(label) {
	return label
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, " ")
		.split(/\s+/)
		.filter(Boolean);
}

function classifyPhase(words) {
	for (let phase = 0; phase < PHASE_KEYWORDS.length; phase += 1) {
		const keywords = PHASE_KEYWORDS[phase];
		for (const word of words) {
			if (keywords.includes(word)) {
				return phase;
			}
		}
	}
	return -1;
}

function extractSubjectWords(words) {
	return words.filter((word) => !PHASE_WORDS.has(word) && !STOP_WORDS.has(word));
}

function hasSubjectOverlap(subjectA, subjectB) {
	if (subjectA.length === 0 || subjectB.length === 0) {
		return false;
	}
	const setB = new Set(subjectB);
	return subjectA.some((word) => setB.has(word));
}

function isJoinNode(words) {
	return words.some((word) => JOIN_KEYWORDS.has(word));
}

function transitiveReduce(tasks) {
	const idToIndex = new Map();
	for (let i = 0; i < tasks.length; i += 1) {
		idToIndex.set(tasks[i].id, i);
	}

	const reachable = new Array(tasks.length);
	for (let i = 0; i < tasks.length; i += 1) {
		reachable[i] = new Set();
	}

	// Build direct adjacency: parent -> children
	const children = new Array(tasks.length);
	for (let i = 0; i < tasks.length; i += 1) {
		children[i] = [];
	}
	for (const task of tasks) {
		const childIdx = idToIndex.get(task.id);
		for (const depId of task.blockedBy) {
			const parentIdx = idToIndex.get(depId);
			if (parentIdx !== undefined) {
				children[parentIdx].push(childIdx);
			}
		}
	}

	// Compute transitive reachability for each node via BFS
	for (let i = 0; i < tasks.length; i += 1) {
		const queue = [...children[i]];
		const visited = new Set();
		while (queue.length > 0) {
			const node = queue.pop();
			if (visited.has(node)) {
				continue;
			}
			visited.add(node);
			reachable[i].add(node);
			for (const child of children[node]) {
				queue.push(child);
			}
		}
	}

	// Remove redundant edges
	return tasks.map((task) => {
		if (task.blockedBy.length <= 1) {
			return task;
		}

		const reduced = task.blockedBy.filter((depId) => {
			const depIdx = idToIndex.get(depId);
			if (depIdx === undefined) {
				return true;
			}
			// dep→task is redundant if dep can reach another dependency of task
			// via the graph (i.e., there's already a longer path dep→...→otherDep→task)
			for (const otherDepId of task.blockedBy) {
				if (otherDepId === depId) {
					continue;
				}
				const otherIdx = idToIndex.get(otherDepId);
				if (otherIdx === undefined) {
					continue;
				}
				if (reachable[depIdx].has(otherIdx)) {
					return false;
				}
			}
			return true;
		});

		return { ...task, blockedBy: reduced };
	});
}

function hasCycle(tasks) {
	const idToIndex = new Map();
	for (let i = 0; i < tasks.length; i += 1) {
		idToIndex.set(tasks[i].id, i);
	}

	const visited = new Set();
	const inStack = new Set();

	function dfs(idx) {
		if (inStack.has(idx)) {
			return true;
		}
		if (visited.has(idx)) {
			return false;
		}
		visited.add(idx);
		inStack.add(idx);
		for (const depId of tasks[idx].blockedBy) {
			const depIdx = idToIndex.get(depId);
			if (depIdx !== undefined && dfs(depIdx)) {
				return true;
			}
		}
		inStack.delete(idx);
		return false;
	}

	for (let i = 0; i < tasks.length; i += 1) {
		if (dfs(i)) {
			return true;
		}
	}
	return false;
}

function breakCycles(tasks) {
	let result = tasks;
	let maxIterations = tasks.length * tasks.length;
	while (hasCycle(result) && maxIterations > 0) {
		maxIterations -= 1;
		// Remove the last edge from the task with the most dependencies
		let maxDeps = 0;
		let targetIdx = -1;
		for (let i = 0; i < result.length; i += 1) {
			if (result[i].blockedBy.length > maxDeps) {
				maxDeps = result[i].blockedBy.length;
				targetIdx = i;
			}
		}
		if (targetIdx === -1) {
			break;
		}
		result = result.map((task, i) => {
			if (i !== targetIdx) {
				return task;
			}
			return { ...task, blockedBy: task.blockedBy.slice(0, -1) };
		});
	}
	return result;
}

/**
 * Infers DAG dependencies for a flat list of tasks based on label heuristics.
 *
 * @param {Array<{id: string, label: string, blockedBy: string[]}>} tasks
 * @returns {Array<{id: string, label: string, blockedBy: string[]}>} New array with inferred blockedBy
 */
function inferTaskDependencies(tasks) {
	if (!Array.isArray(tasks) || tasks.length <= 1) {
		return tasks;
	}

	if (tasks.length > 15) {
		return tasks;
	}

	// Skip if any task already has non-empty blockedBy
	if (tasks.some((task) => task.blockedBy && task.blockedBy.length > 0)) {
		return tasks;
	}

	// Step 1: Tokenize and classify
	const analyzed = tasks.map((task) => {
		const words = tokenize(task.label);
		const phase = classifyPhase(words);
		const subjectWords = extractSubjectWords(words);
		const isJoin = isJoinNode(words);
		return { task, words, phase, subjectWords, isJoin };
	});

	// Step 2: Build dependencies
	let result = analyzed.map((entry) => {
		const deps = [];

		if (entry.phase === -1) {
			// Unclassified tasks remain independent
			return { ...entry.task, blockedBy: [] };
		}

		if (entry.isJoin) {
			// Join nodes depend on ALL earlier-phase tasks
			for (const other of analyzed) {
				if (other.task.id === entry.task.id) {
					continue;
				}
				if (other.phase !== -1 && other.phase < entry.phase) {
					deps.push(other.task.id);
				}
			}
		} else {
			// Phase + overlap: depend on earlier-phase tasks with shared subject
			for (const other of analyzed) {
				if (other.task.id === entry.task.id) {
					continue;
				}
				if (other.phase === -1) {
					continue;
				}
				if (other.phase < entry.phase && hasSubjectOverlap(entry.subjectWords, other.subjectWords)) {
					deps.push(other.task.id);
				}
			}
		}

		return { ...entry.task, blockedBy: deps };
	});

	// Step 3: Transitive reduction
	result = transitiveReduce(result);

	// Step 4: Cycle prevention
	if (hasCycle(result)) {
		result = breakCycles(result);
	}

	return result;
}

/**
 * Detects if tasks form a fully linear chain (each depends on the previous).
 *
 * @param {Array<{id: string, blockedBy: string[]}>} tasks
 * @returns {boolean}
 */
function isLinearChain(tasks) {
	if (tasks.length < 3) {
		return false;
	}

	let independentCount = 0;
	for (const task of tasks) {
		if (!task.blockedBy || task.blockedBy.length === 0) {
			independentCount += 1;
		}
	}

	if (independentCount !== 1) {
		return false;
	}

	for (let i = 1; i < tasks.length; i += 1) {
		if (
			!tasks[i].blockedBy ||
			tasks[i].blockedBy.length !== 1 ||
			tasks[i].blockedBy[0] !== tasks[i - 1].id
		) {
			return false;
		}
	}

	return true;
}

module.exports = {
	inferTaskDependencies,
	isLinearChain,
};
