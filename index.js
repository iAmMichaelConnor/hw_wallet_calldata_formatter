#!/usr/bin/env node

const { program } = require("commander");

function formatCalldataForLedgerFlex(hex) {
  if (hex.startsWith("0x")) hex = hex.slice(2);
  if (hex.length % 2 !== 0) throw new Error("Hex string must have an even length");

  const bytes = hex.match(/.{2}/g) || [];
  const lines = [];

  lines.push("\n\nLedger Flex Format:\n");
  lines.push(bytes.slice(0, 4).join(""));

  const rest = bytes.slice(4);
  for (let i = 0; i < rest.length; i += 32) {
    const chunk32 = rest.slice(i, i + 32);
    const segments = [];

    for (let j = 0; j < chunk32.length; j += 8) {
      // Slice each 32-byte chunk into four 8-byte chunks:
      const chunk8Str = chunk32.slice(j, j + 8).join("");
      
      // Trim leading zeros, unless the chunk is entirely 0 (in which case leave "00").
      let trimmed = chunk8Str.replace(/^0+/, "") || "00"; 

      // Ensure an even number of hex characters (whole byte)
      if (trimmed.length % 2 !== 0) {
        trimmed = "0" + trimmed; // Prepend '0' if it's odd
      }

      segments.push(trimmed);
    }

    lines.push(segments.join(":"));
  }

  console.log(lines.join("\n"));
}

function formatCalldataForTrezorSafe5(hex) {
  if (hex.startsWith("0x")) hex = hex.slice(2);
  if (hex.length % 2 !== 0) throw new Error("Hex string must have an even length");

  const lines = [];
  let pageCounter = 1;

  const bytes = hex.match(/.{2}/g) || [];
  lines.push("\n\nTrezor Format:\n");
  lines.push(`Size: ${bytes.length} bytes\n`);
  lines.push(`Page ${pageCounter++}:\n`);

  let offset = 0;

  const take = (byteLength) => {
    const hexLength = byteLength * 2;
    const slice = hex.slice(offset, offset + hexLength);
    offset += hexLength;
    return slice;
  };

  for (let i = 0; i < 5 && offset < hex.length; i++) {
    lines.push(take(9));
  }

  if (offset < hex.length) {
    lines.push(take(7));
  }

  while (offset < hex.length) {
    lines.push(`\nPage ${pageCounter++}:\n`);
    lines.push(take(7));

    for (let i = 0; i < 4 && offset < hex.length; i++) {
      lines.push(take(9));
    }

    if (offset < hex.length) {
      lines.push(take(7));
    }
  }

  console.log(lines.join("\n"));
}

// Commander CLI setup
program
  .name("hw_wallet_calldata_formatter")
  .description("Format calldata into a format that reflects what users see on their hw wallet screen.")
  .argument("<calldata>", "An abi-encoded hex string of data")
  .option("--lf, --ledger-flex", "Format for Ledger Flex")
  .option("--ts5, --trezor-safe-5", "Format for Trezor Safe 5")
  .action((calldata, options) => {
    if (!options.ledgerFlex && !options.trezorSafe5) {
      console.error("Specify at least one of --ledger-flex or --trezor-safe-5");
      process.exit(1);
    }

    if (options.ledgerFlex) formatCalldataForLedgerFlex(calldata);
    if (options.trezorSafe5) formatCalldataForTrezorSafe5(calldata);
  });

program.parse();