async function fetchChart(id) {
    console.log("Fetching Phira API...");
    try {
        const response = await fetch(`https://api.phira.cn/chart/${id}`);
        if (!response.ok) throw new Error("Failed to fetch chart data");
        const data = await response.json();
        console.log("Phira API Response:", data);

        const filename = data.file.split("/files/")[1];
        const downloadUrl = `https://files-cf.phira.cn/${filename}`;
        console.log("Download Link: ", downloadUrl);
        return downloadUrl;
    } catch (error) {
        console.error("Error fetching chart data:", error);
        return null;
    }
}

function createDownloadButton(chartId) {
    const button = document.createElement("button");
    button.textContent = "下载";
    button.className = "btn btn-secondary base-content";
    button.style.cssText =
        "border-color: hsl(var(--pf)); background-color: hsl(var(--pf)); outline-color: hsl(var(--pf)); color: white;";

    button.addEventListener("click", async () => {
        const chartUrl = await fetchChart(chartId);
        if (chartUrl) window.open(chartUrl, "_blank");
        else alert("Failed to fetch chart data. Please try again later.");
    });

    return button;
}

function injectDownloadButton(chartId) {
    const downloadButton = createDownloadButton(chartId);
    const containerSelector =
        "#app > div > div > div.flex.flex-col.items-center.-mt-\\[35vh\\].mb-24 > div";
    const titleSelector = `${containerSelector} > div > h1.text-5xl.font-black`;

    const intervalID = setInterval(() => {
        const titleElement = document.querySelector(titleSelector);
        const infoElement = document.querySelector(
            `${containerSelector} > div > div`
        );
        if (infoElement) {
            clearInterval(intervalID);
            if (titleElement) {
                titleElement.className = "text-5xl font-black grow";

                const flexRowDiv = document.createElement("div");
                flexRowDiv.className = "flex flex-row";
                flexRowDiv.appendChild(titleElement);
                flexRowDiv.appendChild(downloadButton);

                infoElement.insertAdjacentElement("beforebegin", flexRowDiv);

                console.debug("Button injected successfully");
            } else {
                console.debug("Button have been injected or titleElement not found")
            }
        } else {
            console.debug("Wait for chart info...");
        }
    }, 100);
}

function checkAndInjectButton() {
    const chartId = window.location.pathname.split("/chart/")[1];
    if (chartId) {
        const buttonExists = document.querySelector(
            "#app > div > div > div.flex.flex-col.items-center.-mt-\\[35vh\\].mb-24 > div > div > div.flex.flex-row > button"
        );
        if (!buttonExists) {
            console.debug("Chart ID:", chartId);
            injectDownloadButton(chartId);
        } else {
            console.debug("Skip because the button exists");
        }
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
    const chartCardSelector =
        "#app > div > div > div.mx-8.lg\\:w-3\\/4 > div.mt-6.grid.gap-4.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3.xl\\:grid-cols-4.min-h-0.min-w-0 a div";
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
