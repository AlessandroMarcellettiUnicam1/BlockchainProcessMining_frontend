export const normalizeCallKey = (key) => (key === "internalTxs" ? "calls" : key);

export const normalizeCallsPath = (path) => {
	const result = [];
	let seenCalls = false;

	path.forEach((pathPart) => {
		const key = normalizeCallKey(pathPart);

		if (key === "calls") {
			if (!seenCalls) {
				result.push(key);
				seenCalls = true;
			}
			return;
		}

		result.push(key);
	});

	return result;
};

export const isPrimitive = (value) =>
	value === null ||
	value === undefined ||
	["string", "number", "boolean"].includes(typeof value);

export const getUniqueKeys = (log) => {
	const keys = new Set();
	const rows = Array.isArray(log) ? log : [];

	const traverse = (value, path = []) => {
		if (Array.isArray(value)) {
			value.forEach((item) => traverse(item, path));
			return;
		}

		if (value && typeof value === "object") {
			Object.entries(value).forEach(([key, child]) => {
				if (key === "_id" || key === "__v") return;
				traverse(child, [...path, key]);
			});
			return;
		}

		if (path.length > 0 && isPrimitive(value)) {
			keys.add(normalizeCallsPath(path).join("."));
		}
	};

	rows.forEach((row) => traverse(row));
	return Array.from(keys).sort();
};

export const getValuesByPath = (source, path) => {
	const parts = path.split(".");

	const getCalls = (value) => {
		if (!value || typeof value !== "object") return [];
		return [value.calls, value.internalTxs].flatMap((calls) => {
			if (!calls) return [];
			return Array.isArray(calls) ? calls : [calls];
		});
	};

	const collect = (value, index, insideCalls = false) => {
		if (index >= parts.length) {
			if (value === null || value === undefined || value === "") return [];
			return Array.isArray(value) ? value : [value];
		}

		if (Array.isArray(value)) {
			return value.flatMap((item) => collect(item, index));
		}

		if (!value || typeof value !== "object") return [];

		const key = parts[index];

		if (key === "calls") {
			return getCalls(value).flatMap((call) => collect(call, index + 1, true));
		}

		const directValues = collect(value[key], index + 1, insideCalls);

		if (!insideCalls) return directValues;

		const nestedCallValues = getCalls(value).flatMap((call) =>
			collect(call, index, true)
		);

		return [...directValues, ...nestedCallValues];
	};

	return collect(source, 0)
		.filter(isPrimitive)
		.map((value) => String(value))
		.filter((value) => value !== "");
};

export const getCallRecords = (source) => {
	const records = [];

	const getCalls = (value) => {
		if (!value || typeof value !== "object") return [];
		return [value.calls, value.internalTxs].flatMap((calls) => {
			if (!calls) return [];
			return Array.isArray(calls) ? calls : [calls];
		});
	};

	const visit = (value) => {
		getCalls(value).forEach((call) => {
			if (!call || typeof call !== "object") return;
			records.push(call);
			visit(call);
		});
	};

	visit(source);
	return records;
};

export const stripCallsPrefix = (path) =>
	path?.startsWith("calls.") ? path.slice("calls.".length) : path;

export const applyLogFilters = (log, query = {}) => {
	let rows = Array.isArray(log) ? log : [];
	const {
		contractAddress,
		dateFrom,
		dateTo,
		fromBlock,
		toBlock,
		funName,
		sender,
		txHash,
		minGasUsed,
		maxGasUsed,
		dynamicFilters = [],
	} = query;

	if (contractAddress && Array.isArray(contractAddress) && contractAddress.length > 0) {
		rows = rows.filter((tx) => contractAddress.includes(tx.contractAddress));
	}
	if (funName) rows = rows.filter((tx) => tx.functionName === funName);
	if (txHash) rows = rows.filter((tx) => tx.transactionHash === txHash);
	if (sender) rows = rows.filter((tx) => tx.sender === sender);
	if (dateFrom) rows = rows.filter((tx) => new Date(tx.timestamp?.$date) >= new Date(dateFrom));
	if (dateTo) rows = rows.filter((tx) => new Date(tx.timestamp?.$date) <= new Date(dateTo));
	if (fromBlock) rows = rows.filter((tx) => tx.blockNumber >= fromBlock);
	if (toBlock) rows = rows.filter((tx) => tx.blockNumber <= toBlock);
	if (minGasUsed) rows = rows.filter((tx) => tx.gasUsed >= minGasUsed);
	if (maxGasUsed) rows = rows.filter((tx) => tx.gasUsed <= maxGasUsed);

	dynamicFilters
		.filter((filter) => filter.path && filter.value)
		.forEach((filter) => {
			const expected = String(filter.value).toLowerCase();
			rows = rows.filter((tx) =>
				getValuesByPath(tx, filter.path).some((value) =>
					String(value).toLowerCase().includes(expected)
				)
			);
		});

	return rows;
};
