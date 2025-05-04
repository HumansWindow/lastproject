class ResponseHandler {
    static handleMintResponse(response) {
        if (!response.success) {
            return {
                ...CONFIG.responseFormats.mint.error,
                message: response.error
            };
        }

        return {
            ...CONFIG.responseFormats.mint.success,
            details: {
                txHash: response.data.txHash,
                amount: response.data.amount,
                timestamp: new Date().toISOString()
            }
        };
    }

    static handleSessionResponse(response) {
        if (!response.success) {
            throw new Error(response.error);
        }
        return response.data;
    }

    static handleReferralResponse(response) {
        if (!response.success) {
            return {
                status: 'error',
                message: response.error
            };
        }

        return {
            status: 'success',
            data: response.data
        };
    }

    static formatError(error) {
        return {
            status: 'error',
            message: error.message || 'Unknown error occurred',
            code: error.code || 500
        };
    }
}

window.ResponseHandler = ResponseHandler;
