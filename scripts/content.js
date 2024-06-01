async function fetchChart(id) {
  console.log("Fetching Phira API...");
  try {
    const response = await fetch(`https://api.phira.cn/chart/${id}`);
    if (!response.ok) {
      throw new Error("Failed to fetch chart data");
    }
    const data = await response.json();
    console.log("Phira API Response:", data);

    filename = data.file.split("/files/")[1];
    downloadUrl = `https://files-cf.phira.cn/${filename}`;
    console.log("Download Link: ", downloadUrl)
    return downloadUrl;
  } catch (error) {
    console.error("Error fetching chart data:", error);
    return null;
  }
}

function createDownloadButton(chartId) {
  const downloadButton = document.createElement("button");
  downloadButton.textContent = "下载";
  downloadButton.className = "btn btn-secondary base-content";
  downloadButton.style.borderColor = "hsl(var(--pf))";
  downloadButton.style.backgroundColor = "hsl(var(--pf))";
  downloadButton.style.outlineColor = "hsl(var(--pf))";
  downloadButton.style.color = "white";

  downloadButton.addEventListener("click", async () => {
    const chartUrl = await fetchChart(chartId);
    if (chartUrl) {
      window.open(chartUrl, "_blank");
    } else {
      alert("Failed to fetch chart data. Please try again later.");
    }
  });

  return downloadButton;
}

function injectDownloadButton(downloadButton) {
  const DIV_LOCATION =
    "#app > div > div > div.flex.flex-col.items-center.-mt-\\[35vh\\].mb-24 > div > ";

  var intervalID = setInterval(function () {
    let titleElement = document.querySelector(
      DIV_LOCATION + "div > h1.text-5xl.font-black"
    );
    console.debug("Searching titleElement...")
    if (titleElement != null) {
      console.debug("titleElement found");
      titleElement.className = "text-5xl font-black grow"

      let flexRowDiv = document.createElement("div");
      flexRowDiv.className = "flex flex-row";

      flexRowDiv.appendChild(titleElement);
      flexRowDiv.appendChild(downloadButton);

      let infoElement = document.querySelector(DIV_LOCATION + "div > div");
      if (infoElement !== null) {
        console.debug("infoElement found");
      } else {
        console.error("infoElement not found");
      }

      infoElement.insertAdjacentElement("beforebegin", flexRowDiv);

      clearInterval(intervalID);
    }
  });
}

// FIXME: Should be triggered while directly browsing chart. (Only work on refresh now)
console.debug("PWCD: Triggered");

const chartId = window.location.pathname.split("/chart/")[1];
console.debug("Chart ID:", chartId);
if (chartId) {
  const downloadButton = createDownloadButton(chartId);
  injectDownloadButton(downloadButton);
}
