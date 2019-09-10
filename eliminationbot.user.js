// ==UserScript==
// @name           Elimination Bot
// @version        1.0.0
// @namespace      http://darkcoder.xyz
// @match          https://www.torn.com/profiles.php*
// @require        http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js
// @require        https://gist.github.com/raw/2625891/waitForKeyElements.js
// @grant          GM_xmlhttpRequest
// ==/UserScript==



waitForKeyElements ("#competition-profile-wrapper > div > div.cont.bottom-round > div > span > div.block-info > div.score", actionFunction);

function actionFunction (jNode) {
    score = document.querySelector("#competition-profile-wrapper > div > div.cont.bottom-round > div > span > div.block-info > div.score").innerText;
    position = document.querySelector("#competition-profile-wrapper > div > div.cont.bottom-round > div > span > div.block-info > div.position").innerText;
    last_updated = document.querySelector("#sidebar > div:nth-child(4) > div > div.footer-menu___24_mz.left___3fJFS > div.date___1fSgP > span:nth-child(2)").innerText;
    team = document.querySelector("#competition-profile-wrapper > div > div.cont.bottom-round > div > span > div.block-info > div.sigil.trolls").className;
    scores = {score : score, position: position, last_updated: last_updated};
    console.log(scores);
    if(team == "sigil trolls") {
        GM_xmlhttpRequest ( {
        method:     "POST",
        url:        "http://darkcoder.pythonanywhere.com",
        data:       JSON.stringify ( scores ),
        headers:    {
            "Content-Type": "application/json"
        },
        onload:     function (response) {
            console.log ("POSTED");
        }
    }
  );
}
}
