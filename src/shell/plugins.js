//legacyshell: basic
import fs from 'fs';
import path from 'path';
//legacyshell: plugins
import { fileURLToPath, pathToFileURL } from 'url';
import { isServer } from '#constants';
import { execSync } from 'child_process';
//

//(server-only-start)
var ss; //trollage. access it later.
//(server-only-end)

export class PluginManager {
    constructor(type) {
        this.plugins = new Map();
        this.listeners = {};
        this.type = type || 'game';
    };

    async loadPlugins(type, newSS) {
        this.type = type;

        ss = newSS;
        var pluginsDir = ss.pluginsDir;

        if (!fs.existsSync(pluginsDir)) fs.mkdirSync(pluginsDir, { recursive: true });

        ss.log.info(`####################\nLoading plugins for ${type}...`);

        const pluginFolders = fs.readdirSync(pluginsDir);
        for (const pluginFolder of pluginFolders) {
            try {
                const pluginPath = path.join(pluginsDir, pluginFolder, 'index.js');
                if (fs.existsSync(pluginPath)) {
                    const dependenciesPath = path.join(pluginsDir, pluginFolder, 'dependencies.js');

                    if (fs.existsSync(dependenciesPath)) {
                        const { dependencies } = await import(pathToFileURL(dependenciesPath).href);
                        for (const [dependency, version] of Object.entries(dependencies)) {
                            try {
                                const modulePath = path.join(ss.rootDir, 'node_modules', dependency);
                                if (!fs.existsSync(modulePath)) {
                                    await import(dependency);
                                };
                                // ss.log.dim(`${dependency} is already installed.`);
                            } catch (error) {
                                ss.log.warning(`${dependency} is not installed. Attempting to install (${version})...`);
                                execSync(`npm install ${dependency}@${version} --no-save`, (error, stdout, stderr) => {
                                    if (error) {
                                        console.error(`exec error: ${error}`);
                                        return;
                                    };
                                    console.log(`stdout: ${stdout}`);
                                    console.error(`stderr: ${stderr}`);
                                });
                            };
                        };
                    };

                    const pluginURL = pathToFileURL(pluginPath).href;
                    
                    const { PluginMeta, Plugin } = await import(pluginURL);

                    // console.log(PluginMeta);

                    const pluginInstance = new Plugin(this, path.join(pluginsDir, pluginFolder));
                    this.plugins.set(pluginFolder, pluginInstance);
                    ss.log.success(`Loaded plugin -> ${PluginMeta.name} v${PluginMeta.version} by ${PluginMeta.author}: ${PluginMeta.descriptionShort}`);
                };
            } catch (error) {
                ss.log.error(`Failed to load plugin ${pluginFolder}:`, error);
            };
        };

        ss.log.info('Finished loading plugins.\n####################');
    };

    on(event, listener) { //when a plugin registers a listener
        console.log("registering emitter", event);

        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(listener);
    };

    emit(event, ...args) { //when the main program emits an event
        this.cancel = false;

        event = `${this.type}:${event}`;

        // console.log("emitting event", event);

        if (this.listeners[event]) {
            for (const listener of this.listeners[event]) {
                listener(...args, this);
            };
        };
    };

    // unloadPlugins() {
    //     this.plugins.forEach((plugin, name) => {
    //         if (typeof plugin.onUnload === 'function') plugin.onUnload();
    //         this.plugins.delete(name);
    //         console.log(`Unloaded plugin: ${name}`);
    //     });
    //     this.listeners = {};
    // };
};

export const plugins = new PluginManager();