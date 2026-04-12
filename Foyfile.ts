import { task, $, fs, logger } from "foy";

task("build", async (ctx) => {
    const $ = ctx.$;
    logger.info("Running build task");
    // Your build tasks
    await $`tsc -b && vite build`;
    await fs.rmrf("./browser-extension/public/dist");
    await $`cp -r docs ./browser-extension/public/dist`;
    const indexFile = "./browser-extension/public/dist/index.html";
    let data = await fs.readFile(indexFile, "utf8");
    data = data.replace(/"\/breathing\//g, '"');
    await fs.writeFile(indexFile, data, "utf8");
});
