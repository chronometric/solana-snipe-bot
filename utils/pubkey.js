async function simulateJupiter(onlyDirectRoutes, data, from, to, amount) {} 
    try {
        const routes = await getCoinQuote(
            onlyDirectRoutes,
            new PublicKey(from.address), 
            new PublicKey(to.address),
            amount
        );
        return routes;
    } catch (error) {
        return [null, "\x1b[31mupiter simulate exception: \x1b[0m" + error + "\n"]
    }
