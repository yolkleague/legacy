//basic
import fs from 'node:fs';
import path from 'node:path';
//legacyshell: preparing modified
import crypto from 'node:crypto';
import UglifyJS from 'uglify-js';
//

let ss;

function setSS(newSS) {
    ss = newSS;
};

function prepareModified(ss) {
    const sourceShellJsPath = path.join(ss.currentDir, 'src', 'client-static', 'src', 'shellshock.min.js');
    const destinationShellJsPath = path.join(ss.currentDir, 'store', 'client-modified', 'src', 'shellshock.min.js');

    const sourceServersJsPath = path.join(ss.currentDir, 'src', 'client-static', 'src', 'servers.js');
    const destinationServersJsPath = path.join(ss.currentDir, 'store', 'client-modified', 'src', 'servers.js');

    const sourceHtmlPath = path.join(ss.currentDir, 'src', 'client-static', 'index.html');
    const destinationHtmlPath = path.join(ss.currentDir, 'store', 'client-modified', 'index.html');

    const hashes = {};

    const destinationJsDir = path.dirname(destinationShellJsPath);
    if (!fs.existsSync(destinationJsDir)) {
        fs.mkdirSync(destinationJsDir, { recursive: true });
    };

    try {
        let sourceCode = fs.readFileSync(sourceShellJsPath, 'utf8');

        ss.log.italic("Inserting version into shellshock.min.js...");
        sourceCode = sourceCode.replace(/LEGACYSHELLVERSION/g, ss.packageJson.version);
        ss.log.italic("Inserting item jsons into shellshock.min.js...");
        sourceCode = sourceCode.replace(/LEGACYSHELLITEMS/g, ss.cache.items); //akshually
        ss.log.italic("Inserting map jsons into shellshock.min.js...");
        sourceCode = sourceCode.replace(/LEGACYSHELLMINMAPS/g, ss.cache.maps); //akshually
        ss.log.italic("Inserting babylon into shellshock.min.js...");
        sourceCode = sourceCode.replace(/LEGACYSHELLBABYLON/g, fs.readFileSync(path.join(ss.currentDir, 'src', 'data', 'babylon.js')));
        ss.log.italic("Inserting devmode into shellshock.min.js...");
        sourceCode = sourceCode.replace(/LEGACYSHELLDEVMODE/g, "true"); //drop in later

        ss.log.italic("Inserting comm.js into shellshock.min.js...");
        sourceCode = sourceCode.replace(/LEGACYSHELLCOMM/g, ss.misc.hashtagToString("#comm"));
        ss.log.italic("Inserting player.js into shellshock.min.js...");
        sourceCode = sourceCode.replace(/LEGACYSHELLPLAYERCONSTRUCTOR/g, ss.misc.hashtagToString("#player"));
        ss.log.italic("Inserting catalog.js into shellshock.min.js...");
        sourceCode = sourceCode.replace(/LEGACYSHELLCATALOG/g, ss.misc.hashtagToString("#catalog"));
        ss.log.italic("Inserting constants.js into shellshock.min.js...");
        sourceCode = sourceCode.replace(/LEGACYSHELLCONSTANTS/g, ss.misc.hashtagToString("#constants"));
        ss.log.italic("Inserting collider.js into shellshock.min.js...");
        sourceCode = sourceCode.replace(/LEGACYSHELLCOLLIDER/g, ss.misc.hashtagToString("#collider"));
        ss.log.italic("Inserting math.js into shellshock.min.js...");
        sourceCode = sourceCode.replace(/LEGACYSHELLMATHEXTENSIONS/g, ss.misc.hashtagToString("#math"));
        ss.log.italic("Inserting bullets.js into shellshock.min.js...");
        sourceCode = sourceCode.replace(/LEGACYSHELLBULLETS/g, ss.misc.hashtagToString("#bullets"));
        ss.log.italic("Inserting grenade.js into shellshock.min.js...");
        sourceCode = sourceCode.replace(/LEGACYSHELLGRENADE/g, ss.misc.hashtagToString("#grenade"));
        ss.log.italic("Inserting guns.js into shellshock.min.js...");
        sourceCode = sourceCode.replace(/LEGACYSHELLGUNS/g, ss.misc.hashtagToString("#guns"));

        if (ss.config.client.minify) {
            ss.log.italic("Minifying/obfuscating shellshock.min.js...");
            const result = UglifyJS.minify(sourceCode);

            if (result.error) {
                throw new Error(`Minification failed: ${result.error}`);
            };

            if (result.code === undefined) {
                throw new Error("Minification resulted in undefined code.");
            };

            fs.writeFileSync(destinationShellJsPath, result.code, 'utf8');
            console.log(`Minified file saved to ${destinationShellJsPath}`);
        } else {
            fs.writeFileSync(destinationShellJsPath, sourceCode, 'utf8');
            console.log(`Skipped minification (config set). Saved to ${destinationShellJsPath}`);
        };

        let fileBuffer = fs.readFileSync(destinationShellJsPath);
        let hashSum = crypto.createHash('sha256');
        hashSum.update(fileBuffer);
        hashes.SHELLSHOCKMINJSHASH = hashSum.digest('hex');
        ss.log.italic(`SHA-256 hash of the minified SHELLSHOCKMINJS: ${hashes.SHELLSHOCKMINJSHASH}`);

        let serversJs = fs.readFileSync(sourceServersJsPath, 'utf8');
        serversJs = serversJs.replace(/LEGACYSHELLSERVICESPORT/g, ss.config.services.port || "13371");
        serversJs = serversJs.replace(/LEGACYSHELLWEBSOCKETPORT/g, ss.config.game.port || "13372");
        serversJs = serversJs.replace(/LEGACYSHELLSERVICESSERVER/g, ss.config.client.servicesURL || "wss://services.legacy.onlypuppy7.online:443");
        serversJs = serversJs.replace(/LEGACYSHELLSERVERS/g, ss.cache.servers || "[{ name: 'LegacyShell', address: 'matchmaker.legacy.onlypuppy7.online:443' }]");

        fs.writeFileSync(destinationServersJsPath, serversJs, 'utf8');
        console.log(`servers.js copied and modified to ${destinationServersJsPath}`);

        fileBuffer = fs.readFileSync(destinationServersJsPath);
        hashSum = crypto.createHash('sha256');
        hashSum.update(fileBuffer);
        hashes.SERVERJSHASH = hashSum.digest('hex');
        ss.log.italic(`SHA-256 hash of the modified SERVERJS: ${hashes.SERVERJSHASH}`);

        let htmlContent = fs.readFileSync(sourceHtmlPath, 'utf8');
        htmlContent = htmlContent.replace(/SHELLSHOCKMINJSHASH/g, hashes.SHELLSHOCKMINJSHASH);
        htmlContent = htmlContent.replace(/LEGACYSHELLVERSION/g, ss.packageJson.version);
        htmlContent = htmlContent.replace(/LEGACYSHELLDISCORDSERVER/g, ss.config.client.discordServer);
        htmlContent = htmlContent.replace(/LEGACYSHELLGITHUB/g, ss.config.client.githubURL);
        htmlContent = htmlContent.replace(/LEGACYSHELLSYNCURL/g, ss.config.client.sync_server);
        htmlContent = htmlContent.replace(/LEGACYSHELLCONFIG/g, ss.distributed_config.replace(/\n/g, '<br>'));

        fs.writeFileSync(destinationHtmlPath, htmlContent, 'utf8');
        console.log(`index.html copied and modified to ${destinationHtmlPath}`);

        delete ss.cache; //MEMORY LEAK FUCKING MI-Mi-mi-MITIGATED!!!
    } catch (error) {
        console.error('An error occurred during the file processing:', error);
    }
}

export default prepareModified;