export type ApiResponse<T = any> = {
	success: boolean;
	message?: string;
	data?: T;
	error?: {
		code: string;
		message: string;
	};
};

export const successResponse = <T = any>(message?: string, data?: T): ApiResponse<T> => {
	const response: ApiResponse<T> = {success: true};
	if (message) response.message = message;
	if (data !== undefined) response.data = data;
	return response;
};

export const errorResponse = (code: string, message: string): ApiResponse => {
	return {
		success: false,
		error: {code, message},
	};
};
