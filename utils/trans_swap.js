const getTransaction = async (quoteResponse) => {
    try {
        const response = await got.post("https://quote-api.jup.ag/v6/swap", {
            headers: {
                'Content-Type': 'application/json'
            },
            json: {
                quoteResponse,
                userPublicKey: wallet.publicKey.toString(),
                wrapAndUnwrapSol: false,
                prioritizationFeeLamports: 1000
            },
            responseType: 'json'
        });

        return [response.body, "\x1b[90mTransaction fetched \x1b[0m \n"];

    } catch (error) {
        return [null, "\x1b[31mAn error occurred while fetching the transaction: \x1b[0m" + error];
    }
};