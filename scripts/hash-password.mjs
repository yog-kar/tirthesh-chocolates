
import bcrypt from "bcryptjs";
import { stdin, stdout } from "node:process";

if (!stdin.isTTY || !stdout.isTTY) {
  console.error("Run this script directly in the VS Code terminal.");
  process.exit(1);
}

stdin.setRawMode(true);
stdin.setEncoding("utf8");
stdin.resume();

let password = "";

stdout.write("Enter your admin password (input hidden): ");

stdin.on("data", async (key) => {
  if (key === "\u0003") {
    stdout.write("\nCancelled.\n");
    process.exit(1);
  }

  if (key === "\r" || key === "\n") {
    stdin.setRawMode(false);
    stdin.pause();

    if (password.length < 12) {
      stdout.write("\nUse at least 12 characters. Run the script again.\n");
      process.exit(1);
    }

    const hash = await bcrypt.hash(password, 12);
    password = "";

    stdout.write(`\nYour password hash:\n${hash}\n`);
    process.exit(0);
  }

  if (key === "\u007f" || key === "\b") {
    password = password.slice(0, -1);
  } else if (key >= " ") {
    password += key;
  }
});
