// ==UserScript==
// @name         TORN: Bazaar Filter
// @version      1.0.0
// @author       DeKleineKobini
// @description  Filter items in a bazaar!
// @namespace    dekleinekobini.bazaarfilter
// @require      https://ajax.googleapis.com/ajax/libs/jquery/2.1.0/jquery.min.js
// @require      https://openuserjs.org/src/libs/DeKleineKobini/DKK_Torn_Utilities.js
// @match        https://www.torn.com/bazaar.php*
// @match        https://www.torn.com/imarket.php*
// @license      MIT
// @updateURL    https://openuserjs.org/meta/DeKleineKobini/TORN_Stat_Estimate.meta.js
// @connect      api.torn.com
// ==/UserScript==

setDebug(true);

/* --------------------
CODE - EDIT ON OWN RISK
-------------------- */
setPrefixEasy("BF");

var filter = [];

(function() {
    'use strict';

    let path = window.location.pathname;

    var specialParams = new URLSearchParams(getSpecialSearch());
    if (path == "/bazaar.php") {
        if (specialParams.get("p") != "bazaar") return;
        log("Loading the bazaar function.")

        let params = new URL(window.location.href).searchParams;
        if (!params.has("filter")) return;

        log("Found filter: " + params.get("filter"));

        params.get("filter").split(",").forEach(function(f) {
            if (!isNaN(f)) filter.push(f * 1);
        });

        if (filter.length) {
            xhrIntercept(function(page, json, uri){
                if (page != "bazaar" || !uri) return;

                debug("Detected bazaar load!");
                if ( $(".items-list").length) observeMutations($(".items-list").last()[0], ".items-list > li", true, filterItems);
                else observeMutations(document, ".items-list > li", true, filterItems, { childList: true, subtree: true });
            });
        }
    } else if (path == "/imarket.php") {
        log("Loading the market function.")
        xhrIntercept(function(page, json, uri){
            if (page != "imarket" || !uri) return;

            if (specialParams.get("p") == "shop"){
                // No place to add it.
            } else {
                if ($(".buy-item-info-wrap").length == 0) return;

                observeMutations($(".buy-item-info-wrap").get(0), ".private-bazaar", false, addFilterLink);
            }
        });
    }
})();

function filterItems() {
    debug("Filtering the items!");
    $(".items-list > li").not(".empty").filter(function() {
        return !filter.includes($(this).find(".img-wrap").attr("itemid") * 1);
    }).each(function() {
        $(this).remove();
    });
}

function addFilterLink() {
    debug("Adding the filter link!");
    $(".buy-item-info-wrap .items > .private-bazaar").slice(0, 3).each(function() {
        let row = $(this);
        let link = row.find(".view-link").attr("href");
        var id = $(".act .hover").attr("itemid");

        link = link.replace("bazaar.php", "bazaar.php?filter=" + id)

        row.find(".cost").prepend("<a href='" + link + "' class='left'>Filter</a>");
    });
}
