// ==UserScript==
// @name         Phira Web Chart Downloader (PWCD)
// @namespace    https://yuevuwu.github.io
// @version      2.0
// @icon         https://github.com/YuevUwU/pwcd/raw/refs/heads/tampermonkey/res/icon_lowres.svg
// @icon64         https://github.com/YuevUwU/pwcd/raw/refs/heads/tampermonkey/res/icon.svg
// @description  Download charts from Phira Website (phira.moe)
// @author       YuevUwU
// @match        *://phira.moe/*
// @copyright    CC0 1.0 Universal
// @grant        GM_xmlhttpRequest
// ==/UserScript==

const i18n = {
    download: {
        en: "Download",
        "zh-CN": "下载",
        "zh-TW": "下載",
    },
};

const containerSelector =
    "#app > div > div > div.flex.flex-col.items-center.-mt-\\[35vh\\].mb-24 > div";
const infoSelector = `${containerSelector} > div > div`;
const titleSelector = `${infoSelector} > h1.text-5xl.font-black`;
const charterSelector = "div.flex:nth-child(5) > div:nth-child(3) > span:nth-child(2)";
const composerSelector = `${containerSelector} > div > h1`
const unrebornTitleSelector = `${containerSelector} > div > div > h1`
const buttonSelector = `${containerSelector} > div > div.flex.flex-row > button`;
const chartCardSelector =
    "#app > div > div > div.mx-8.lg\\:w-3\\/4 > div.mt-6.grid.gap-4.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3.xl\\:grid-cols-4.min-h-0.min-w-0 a div";

function isButtonExists() {
    return document.querySelector(buttonSelector);
}

const CORS_PROXY = "https://corsproxy.io/?url=";

async function fetchChart(chartId) {
    console.log("Fetching Phira API...");
    try {
        const response = await fetch(
            `https://phira.5wyxi.com/chart/${chartId}`
        );
        if (!response.ok) throw new Error("Failed to fetch chart data");
        const data = await response.json();
        console.log("Phira API Response:", data);

        const filename = data.file.split("/files/")[1];
        const downloadUrl = `https://api.phira.cn/files/${filename}`;
        console.log("Download Link: ", downloadUrl);
        return {
            original_filename: filename,
            chartUrl: downloadUrl
        }
    } catch (error) {
        console.error("Error fetching chart data:", error);
        return null;
    }
}

function getTitle() {
    const titleElement = document.querySelector(unrebornTitleSelector);
    return titleElement ? titleElement.textContent : "Unknown Title";
}

function getCharter() {
    const charterElement = document.querySelector(charterSelector);
    return charterElement ? charterElement.textContent : "Unknown Charter";
}

function getComposer() {
    const composerElement = document.querySelector(composerSelector);
    return composerElement ? composerElement.textContent : "Unknown Composer";
}

async function downloadChart(chartId) {
    const {original_filename, chartUrl} = await fetchChart(chartId);
    if (chartUrl) {
        try {
            GM_xmlhttpRequest({
                method: "GET",
                url: CORS_PROXY + chartUrl,
                responseType: "blob",
                onload: function (response) {
                    const blob = new Blob([response.response], {
                        type: "application/zip",
                    });
                    const filename = `[${chartId}] ${getComposer()} - ${getTitle()} by ${getCharter()} [${original_filename.substring(0,7)}].zip`;

                    // Create a link element
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(blob);
                    a.download = filename;

                    // Trigger the download
                    document.body.appendChild(a);
                    a.click();

                    // Clean up
                    document.body.removeChild(a);
                    URL.revokeObjectURL(a.href);
                },
                onerror: function (error) {
                    console.error("Error during download:", error);
                    alert("Failed to download file. Please try again later.");
                },
            });
        } catch (error) {
            console.error("Error during download:", error);
            alert("Failed to download file. Please try again later.");
        }
    } else {
        alert("Failed to fetch chart data. Please try again later.");
    }
}

function getTranslation(key, locale) {
    const translation = i18n[key][locale] || i18n[key]["en"];
    return translation;
}

function createDownloadButton(chartId) {
    const button = document.createElement("button");
    button.className = "btn btn-secondary base-content";
    button.style.cssText =
        "border-color: hsl(var(--pf)); background-color: hsl(var(--pf)); outline-color: hsl(var(--pf)); color: white;";

    const locale = localStorage.getItem("locale");
    button.textContent = getTranslation("download", locale);

    button.addEventListener("click", async () => {
        downloadChart(chartId);
    });

    return button;
}

function injectDownloadButton(chartId) {
    const downloadButton = createDownloadButton(chartId);

    // TODO: reuse or remove existing flex

    const intervalID = setInterval(() => {
        const infoElement = document.querySelector(infoSelector);
        const titleElement = document.querySelector(titleSelector);
        if (!infoElement) {
            console.debug("Wait for chart info...");
        } else if (isButtonExists()) {
            console.debug("Button have been injected");
            clearInterval(intervalID);
        } else if (!titleElement) {
            console.debug("titleElement not found");
        } else {
            console.debug("Ready to inject button");
            clearInterval(intervalID);
            titleElement.className = "text-5xl font-black grow";

            const flexRowDiv = document.createElement("div");
            flexRowDiv.className = "flex flex-row";

            if (!isButtonExists()) {
                flexRowDiv.appendChild(titleElement);
                flexRowDiv.appendChild(downloadButton);
                infoElement.insertAdjacentElement("beforebegin", flexRowDiv);
                console.debug("Button injected successfully");
            } else {
                console.debug("Button have been injected");
            }
        }
    }, 100);
}

function checkAndInjectButton() {
    const chartId = window.location.pathname.split("/chart/")[1];
    if (!chartId) {
        return;
    }
    if (!isButtonExists()) {
        console.debug("Chart ID:", chartId);
        injectDownloadButton(chartId);
    } else {
        console.debug("Skip because the button exists");
    }
}

function initializeObserver() {
    const observer = new MutationObserver(() => {
        console.debug("DOM changed, checking for chart ID...");
        checkAndInjectButton();
        addCardClickListener();
    });

    const config = { childList: true, subtree: true };
    observer.observe(document.body, config);
}

function addCardClickListener() {
    const elements = document.querySelectorAll(chartCardSelector);

    elements.forEach((element) => {
        if (!element.hasPWCDClickListener) {
            element.addEventListener("click", () => {
                console.debug("Detected Click");
                checkAndInjectButton();
            });
            element.hasPWCDClickListener = true;
            console.debug("Added click Event Listener");
        }
    });
}

console.debug("PWCD: Triggered");
checkAndInjectButton();
initializeObserver();
