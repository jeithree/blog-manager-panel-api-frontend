export type SessionResponse = {
	isAuthenticated: boolean;
	user: {
		id: string;
		username: string;
		email: string;
		role: string;
	} | null;
};
