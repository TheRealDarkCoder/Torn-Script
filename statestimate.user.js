// ==UserScript==
// @name         TORN: Stat Estimate
// @version      2.3.0
// @author       DeKleineKobini
// @description  Estimate the stats of a player based on their rank.
// @namespace    dekleinekobini.statestimate
// @run-at       document-start
// @require      https://ajax.googleapis.com/ajax/libs/jquery/2.1.0/jquery.min.js
// @require      https://openuserjs.org/src/libs/DeKleineKobini/DKK_Torn_Utilities.js
// @match        https://www.torn.com/index.php*
// @match        https://www.torn.com/profiles.php*
// @match        https://www.torn.com/userlist.php*
// @match        https://www.torn.com/halloffame.php*
// @match        https://www.torn.com/bounties.php*
// @match        https://www.torn.com/blacklist.php*
// @match        https://www.torn.com/factions.php?*
// @license      MIT
// @updateURL    https://openuserjs.org/meta/DeKleineKobini/TORN_Stat_Estimate.meta.js
// @connect      api.torn.com
// @grant        GM_xmlhttpRequest
// ==/UserScript==

var settings = {
    apiDelay: 1000, // in milliseconds
    pages: {
        profile: true,
        search: true,
        searchAdvanced: true,
        abroad: true,
        hallOfFame: true,
        bounties: true,
        blacklist: true,
        factionWall: true
    },
    ignore: {
        enabled: false,
        level: 50, // only show stats below this level
        showEmpty: true
    }
}

setDebug(true);

/* --------------------
CODE - EDIT ON OWN RISK
-------------------- */
requireAPI();
setPrefixEasy("SE");

var ranks = {
    'Absolute beginner': 1,
    'Beginner': 2,
    'Inexperienced': 3,
    'Rookie': 4,
    'Novice': 5,
    'Below average': 6,
    'Average': 7,
    'Reasonable': 8,
    'Above average': 9,
    'Competent': 10,
    'Highly competent': 11,
    'Veteran': 12,
    'Distinguished': 13,
    'Highly distinguished': 14,
    'Professional': 15,
    'Star': 16,
    'Master': 17,
    'Outstanding': 18,
    'Celebrity': 19,
    'Supreme': 20,
    'Idolised': 21,
    'Champion': 22,
    'Heroic': 23,
    'Legendary': 24,
    'Elite': 25,
    'Invincible': 26
}

const EMPTY_CHAR = " ";
const triggerLevel = [ 2, 6, 11, 26, 31, 50, 71, 100 ];
const triggerCrime = [ 100, 5000, 10000, 20000, 30000, 50000 ];
const triggerNetworth = [ 5000000, 50000000, 500000000, 5000000000, 50000000000 ];

var estimatedStats = [
    "under 2k",
    "2k - 25k",
    "20k - 250k",
    "200k - 2.5m",
    "2m - 25m",
    "20m - 250m",
    "over 200m",
];

(function() {
    'use strict';

    var page = getCurrentPage();

    debug("Current page is '" + page + "' with step '" + new URL(window.location.href).searchParams.get("step") + "'");
    if (!shouldLoad(page)) return;

    log("Starting listeners.");
    startListeners(page);
})();

function startListeners(page){
    var run = true;
    var ignore = 0;

    switch(page) {
        case "profiles":
            xhrIntercept(function(page, json, uri){
                if(page != "profiles" || !json) return;

                if (run) {
                    run = false;
                    updateUser(json.user.userID, json.userInformation.level, function(result) {
                        if (result === EMPTY_CHAR) return;

                        $(".content-title > h4").append("<div>" + result + "</div>");
                    });
                }
            });
            break;
        case "userlist":
            xhrIntercept(function(page, json, uri){
                if(page != "userlist" || !json) return;
                ignore = 0;

                $("<div class='level t-hide left' style='border-left: 0px solid transparent; width: 75px;'>Stats</div>").insertAfter($(".level").eq(0));
                $(".user-icons").eq(0).css("width", "initial");
                json.list.forEach(function(player, index) {
                    let delay = settings.apiDelay * (index - ignore);

                    if (shouldIgnore(player.level * 1)){
                        ignore++;

                        if (!settings.ignore.showEmpty) return;
                        else delay = 0;
                    }

                    setTimeout(function(){
                        updateUser(player.userID, player.level * 1, function(result) {
                            if (result === EMPTY_CHAR) return;
                            var row = $(".user-info-list-wrap > li").eq(index);
                            var iconWrap = row.find(".icons-wrap");

                            $("<span class='level' style='border-left: 0px solid transparent; width: 75px;'>" + result + "</p>").insertAfter(row.find(".level"));
                            row.find(".user-icons").css("width", "initial");
                            iconWrap.css("width", "initial");
                            iconWrap.find("ul").css("width", "initial");
                        });
                    }, delay);
                });
            });
            break;
        case "halloffame":
            observeMutations(document, ".hall-of-fame-list-wrap", true, function(obs){
                observeMutations($(".hall-of-fame-list-wrap")[0], ".players-list", false, function(obs){
                    ignore = 0;

                    $(".rank").eq(1).html("Stats");
                    $(".players-list > li").each(function(index) {
                        var row = $(this);
                        let id = row.find(".player > .name").attr("href");
                        id = id.substring(id.indexOf("=") + 1);
                        let level = stripHtml(row.find(".player-info > li").eq(6).html());
                        level = level.substring(level.indexOf(":") + 1) * 1;

                        let delay = settings.apiDelay * (index - ignore);

                        if (shouldIgnore(level)){
                            ignore++;

                            if (!settings.ignore.showEmpty) return;
                            else delay = 0;
                        }

                        setTimeout(function(){
                            updateUser(id, level, function(result) {
                                row.find(".rank").html(result);
                                let iconWrap = row.find(".icons-wrap");

                                row.find(".user-icons").css("width", "initial");
                                iconWrap.css("width", "initial");
                                iconWrap.find("ul").css("width", "initial");
                            });
                        }, delay);
                    });
                });
            }, { childList: true, subtree: true });
            break;
        case "index":
            observeMutations(document, ".users-list", true, function(obs){
                ignore = 0;

                $(".users-list > li").each(function(index) {
                    var row = $(this);
                    let id = row.find(".name").attr("href");
                    id = id.substring(id.indexOf("=") + 1);
                    let level = stripHtml(row.find(".level").html());
                    level = level.substring(level.indexOf(":") + 1) * 1;

                    let delay = settings.apiDelay * (index - ignore);

                    if (shouldIgnore(level)){
                        ignore++;

                        if (!settings.ignore.showEmpty) return;
                        else delay = 0;
                    }

                    setTimeout(function(){
                        updateUser(id, level, function(result) {
                            row.find(".rank").html(result);
                            let iconWrap = row.find(".icons-wrap");

                            $("<span class='level' style='width: 75px;'>" + result + "</p>").insertAfter(row.find(".status"));
                            row.find(".center-side-bottom").css("width", "initial");
                            iconWrap.css("width", "initial");
                            iconWrap.find("ul").css("width", "initial");
                        });
                    }, delay);
                });
            }, { childList: true, subtree: true });
            break;
        case "bounties":
            xhrIntercept(function(page, json, uri){
                if(page != "bounties") return;

                observeMutations($(".content-wrapper")[0], ".bounties-list", true, function(obs){
                    let names = [];
                    ignore = 0;

                    $(".bounties-list-title .listed").html("STATS");
                    $(".bounties-list > li[data-id]").slice(0, 20).each(function(index) {
                        let row = $(this);

                        let id = row.find(".target > a").attr("href");
                        id = id.substring(id.indexOf("XID=") + 4);
                        let level = row.find(".level").html().split("\n")[2];
                        let name = row.find(".target > a").html();

                        let delay = settings.apiDelay * (index - ignore);
                        if (names.includes(name)) {
                            ignore++;
                            return;
                        } else if (shouldIgnore(level)){
                            ignore++;

                            if (!settings.ignore.showEmpty) return;
                            else delay = 0;
                        }

                        names.push(name);
                        setTimeout(function(){
                            updateUser(id, level, function(result) {
                                $("li:has(a[href='profiles.php?XID=" + id + "'])").each(function(){
                                    $(this).find(".listed").html(result);
                                });
                            });
                        }, delay);

                    });
                });
            });
            break;
        case "blacklist":
            xhrIntercept(function(page, json, uri){
                if(page != "userlist" || !uri) return;

                observeMutations($(".blacklist")[0], ".user-info-blacklist-wrap", true, function(obs){
                    ignore = 0;

                    $(".user-info-blacklist-wrap > li").each(function(index) {
                        var row = $(this);
                        let id = row.find(".name").attr("href");
                        id = id.substring(id.indexOf("XID=") + 4);
                        let level = stripHtml(row.find(".level").html());
                        level = level.substring(level.indexOf(":") + 1) * 1;

                        let delay = settings.apiDelay * (index - ignore);

                        if (shouldIgnore(level)){
                            ignore++;

                            if (!settings.ignore.showEmpty) return;
                            else delay = 0;
                        }

                        setTimeout(function(){
                            updateUser(id, level, function(result) {
                                //if (result === EMPTY_CHAR) return;
                                var iconWrap = row.find(".description-editor");

                                var ele = $("<span class='level right' style='width: 75px;'>" + result + "</p>");
                                ele.insertAfter(row.find(".edit"));
                                //ele.insertAfter(row.find(".description"));
                                ele.css("float", "right");
                                //row.find(".user-icons").css("width", "initial");
                                row.find(".description .text").css("width", "initial");
                                //iconWrap.find("*").not(".edit").css("width", "initial");
                            });
                        }, delay);
                    });
                });
            });
            break;
        case "factions":
            loadWall();

            $(window).bind('hashchange', function() {
                loadWall();
            });
            break;
    }
}

function loadWall() {
    var hashSplit = window.location.hash.split("/");
    if (hashSplit[1] != "war" || isNaN(hashSplit[2])) return;

    observeMutations(document, ".members-list", true, function(){
        $(".user-icons").eq(0).html("Stats");

        updateWall();
        observeMutations($(".members-list")[0], ".members-list > .enemy", false, function(){
            debug("Member list got updated.")
            updateWall();
        });
    }, { childList: true, subtree: true });
}

function updateWall() {
    let ignore = 0;
    $(".members-list > .enemy:not(:has(.estimate))").each(function(index) {
        var row = $(this);
        let id = row.find(".name").attr("href");
        id = id.substring(id.indexOf("XID=") + 4);
        let level = row.find(".level").html();
        debug(`Found ${id} at level ${level}`);

        row.find(".member").addClass("estimate");

        let delay = settings.apiDelay * (index - ignore);

        if (shouldIgnore(level)){
            ignore++;

            if (!settings.ignore.showEmpty) return;
            else delay = 0;
        }

        setTimeout(function(){
            updateUser(id, level, function(result) {
                if (result === EMPTY_CHAR) return;

                var iconWrap = row.find(".user-icons");

                $("<span class='level left' style='border-left: 0px solid transparent; width: 70px;'>" + result + "</p>").insertAfter(row.find(".level"));
                iconWrap.css("width", "175px");
                iconWrap.find("ul").css("width", "initial");
            });
        }, delay);
    });
}

function shouldLoad(page) {
    if (settings.pages.profile && page == "profiles") return true;
    if (settings.pages.search && page == "userlist" && hasSearchTag("step", "search")) return true;
    if (settings.pages.searchAdvanced && page == "userlist" && hasSearchTag("step", "adv")) return true;
    if (settings.pages.abroad && page == "index" && hasSearchTag("page", "people")) return true;
    if (settings.pages.hallOfFame && page == "halloffame") return true;
    if (settings.pages.bounties && page == "bounties") return true;
    if (settings.pages.blacklist && page == "blacklist") return true;
    if (settings.pages.factionWall && page == "factions" && hasSearchTag("step", "your")) return true;

    return false;
}

function shouldIgnore(level) {
    return settings.ignore.enabled && (settings.ignore.level <= level);
}

function getCurrentPage() {
    var path = window.location.pathname;
    return path.substring(1, path.length - 4);
}

function hasSearchTag(tag, value) {
    var params = new URL(window.location.href).searchParams;

    return !value ? params.has(tag) : params.get(tag) == value;
}

function updateUser(id, level, callback) {
    if (shouldIgnore(level)){
        if (settings.ignore.showEmpty) callback(EMPTY_CHAR);
        return;
    }

    sendAPIRequest("user", id, "profile,personalstats,crimes").then(function(oData) {
        if (!oData.rank) return callback("ERROR API");
        debug("Loaded information from the api!");

        var rankSpl = oData.rank.split(" ");
        var rankStr = rankSpl[0];
        if (rankSpl[1][0] === rankSpl[1][0].toLowerCase()) rankStr += " " + rankSpl[1];

        var rank = ranks[rankStr];
        var crimes = oData.criminalrecord.total;
        var networth = oData.personalstats.networth;

        var trLevel = 0, trCrime = 0, trNetworth = 0;
        for (let l in triggerLevel) {
            if (triggerLevel[l] <= level) trLevel++;
        }
        for (let c in triggerCrime) {
            if (triggerCrime[c] <= crimes) trCrime++;
        }
        for (let nw in triggerNetworth) {
            if (triggerNetworth[nw] <= networth) trNetworth++;
        }

        var statLevel = rank - trLevel - trCrime - trNetworth - 1;

        var estimated = estimatedStats[statLevel];
        if (!estimated) estimated = "N/A";

        debug("Estimated stats!");
        callback(estimated);
    });
}
