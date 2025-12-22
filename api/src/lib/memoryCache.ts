class MemoryCache {
	store;

	constructor() {
		this.store = new Map();
	}

	set(key: string, value: string, ttl = null) {
		this.store.set(key, value);

		if (ttl) {
			setTimeout(() => {
				this.store.delete(key);
			}, ttl * 1000); // ttl is in seconds
		}
	}

	get(key: string) {
		return this.store.get(key);
	}

	has(key: string) {
		return this.store.has(key);
	}

	delete(key: string) {
		this.store.delete(key);
	}
}

export default MemoryCache;
