//legacyshell: basic
import { isClient } from "#constants";
import Comm from "#comm";
//

export const LegacyShellCorePlugin = {
    registerListeners: function (pluginManager) {
        console.log("registering listeners... (LegacyShellCorePlugin)");

        this.plugins = pluginManager;

        this.plugins.on('game:onMapComplete', this.onMapComplete.bind(this));
        this.plugins.on('game:AllItems', this.AllItems.bind(this));
        this.plugins.on('game:GameTypesInit', this.GameTypesInit.bind(this));
    },

    onMapComplete(data) {
        var gameScene = data.gameScene;

        gameScene.getMeshByName("healthpack").material = gameScene.getMaterialByName("standardInstanced");
        gameScene.getMeshByName("healthpack.alt").material = gameScene.getMaterialByName("standardInstanced");
    },

    AllItems(data) {
        var AllItems = data.AllItems;

        AllItems.push({
            codeName: "HEALTH",
            mesh: "healthpack.alt",
            name: "Health Pack",
            actor: data.ItemActor,
            poolSize: 50,
            collect: function (player, applyToWeaponIdx) {
                if (player.hp === 100) return false
                player.setHp(player.hp + 50);
                if (player.actor) {
                    playSoundIndependent2D("ammo");
                };
                return true;
            }
        });
    },

    async GameTypesInit(data) {
        var GameTypes = data.GameTypes;
        var ItemTypes = data.ItemTypes;

        GameTypes[0].shortName = "FFA (Classic)";
        GameTypes[0].longName = "Free For All (Classic)";

        GameTypes[1].shortName = "Teams (Classic)";
        GameTypes[1].longName = "Teams (Classic)";

        GameTypes.push({
            shortName: "FFA (Timed)",
            longName: "Free For All (Timed)",
            codeName: "timedffa",
            mapPool: "FFA",
            options: {
                timedGame: {
                    enabled: true,
                    roundLength: 150, //2.5 mins in seconds
                },
            }
        });

        GameTypes.push({
            shortName: "Teams (Timed)",
            longName: "Teams (Timed)",
            codeName: "timedteams",
            mapPool: "Teams",
            options: {
                teamsEnabled: true,
                timedGame: {
                    enabled: true,
                    roundLength: 150, //2.5 mins in seconds
                },
            }
        });

        // GameTypes.push({
        //     shortName: "Health Pack",
        //     longName: "Health Pack Test",
        //     codeName: "healthpacktest", //used for creation of GameType enum
        //     mapPool: "FFA", //the pool of maps to use. helps with avoiding having to assign game types to maps retroactively when making a new game mode
        //     options: {
        //         itemsEnabled: [ //itemType enum, spawn per how much surface area, minimum
        //             [ItemTypes.AMMO, 35, 4],
        //             [ItemTypes.GRENADE, 75, 5],
        //             [ItemTypes.HEALTH, 55, 5],
        //         ],
        //     }
        // });

        GameTypes.push({
            shortName: "Scale (Classic)",
            longName: "Scale Shift (Classic)",
            codeName: "scale",
            mapPool: "Scale",
            options: {
                teamsEnabled: true,
                scale: [
                    1, //ffa
                    0.4, //team1
                    2, //team2
                ],
                gravityModifier: [
                    1, //ffa
                    1, //team1
                    0.5, //team2
                ],
                regenModifier: [
                    1, //ffa
                    2, //team1
                    0.25, //team2
                ],
                teamSwitchMaximumDifference: 1,
            }
        });

        GameTypes.push({
            shortName: "Scale (Timed)",
            longName: "Scale Shift (Timed)",
            codeName: "scale",
            mapPool: "Scale",
            options: {
                teamsEnabled: true,
                timedGame: {
                    enabled: true,
                    roundLength: 150, //2.5 mins in seconds
                },
                scale: [
                    1, //ffa
                    0.4, //team1
                    2, //team2
                ],
                gravityModifier: [
                    1, //ffa
                    1, //team1
                    0.5, //team2
                ],
                regenModifier: [
                    1, //ffa
                    2, //team1
                    0.25, //team2
                ],
                teamSwitchMaximumDifference: 1,
            }
        });
    },
};

if (isClient) LegacyShellCorePlugin.registerListeners(plugins);