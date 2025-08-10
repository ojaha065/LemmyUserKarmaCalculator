// ==UserScript==
// @name Lemmy User Karma Calculator
// @namespace kissakala.fi
// @version 1.0.0
// @description Adds a badge displaying the user's karma (total number of upvotes received) to the lemmy-ui profile page
// @author JHaiko
// @match *://*/u/*
// @run-at document-idle
// @run-in normal-tabs
// @sandbox DOM
// @connect *
// @updateURL https://raw.githubusercontent.com/ojaha065/LemmyUserKarmaCalculator/refs/heads/main/lemmyUserKarmaCalculator.js
// @downloadURL https://raw.githubusercontent.com/ojaha065/LemmyUserKarmaCalculator/refs/heads/main/lemmyUserKarmaCalculator.js
// @supportURL https://github.com/ojaha065/LemmyUserKarmaCalculator/issues
// ==/UserScript==

(function() {
    "use strict";
    calculateKarma();

    async function calculateKarma() {
        const match = /^(https?:\/\/.+)\/u\/([^?#]+)/.exec(location.href);
        if (match) {
            const badgeDiv = document.querySelector(".person-profile ul:has(.list-inline-item.badge)");
            if (badgeDiv && !badgeDiv.querySelector(".lemmy-user-karma-calculator")) {
                const badge = badgeDiv.lastElementChild.cloneNode();
                badge.classList.add("lemmy-user-karma-calculator");
                badge.innerText = "Karma: Loading...";
                badgeDiv.appendChild(badge);

                try {
                    const username = match[2];

                    let externalDomain = null;
                    if (username.includes("@")) {
                        const domain = username.substring(username.lastIndexOf("@") + 1);
                        if (!["piefed", "mbin"].some(excluded => domain.toLowerCase().includes(excluded))) {
                            externalDomain = domain;
                        }
                    }
                    const lemmyHost = externalDomain ? `https://${externalDomain}` : match[1];
                    console.debug(`Fetching user karma from ${lemmyHost}`);

                    let karma = 0;
                    for (let i = 1; i <= 10; i++) {
                        const response = await fetch(`${lemmyHost}/api/v3/user?username=${username}&sort=TopAll&limit=50&page=${i}`, {
                            method: "GET",
                            headers: {
                                accept: "application/json"
                            }
                        });

                        if (!response.ok) {
                            console.debug(response);
                            throw new Error(`HTTP ${response.status}`);
                        }

                        const json = await response.json();
                        if (json.posts.length === 0 && json.comments.length === 0) {
                            break;
                        }
                        karma += [...json.posts, ...json.comments].reduce((sum, o) => sum + o.counts.score, 0);
                    }
                    badge.innerText = `Karma: ${new Intl.NumberFormat().format(karma)}`;
                } catch (error) {
                    badge.innerText = "Karma: Error";
                    console.error(error);
                }
            }
        }

        setTimeout(calculateKarma, 1000);
    }
})();