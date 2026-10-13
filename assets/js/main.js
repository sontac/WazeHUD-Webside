(() => {
  const repo = "sontac/WazeHUD-CYD-2.8";
  const releasesUrl = `https://github.com/${repo}/releases`;
  const apiUrl = `https://api.github.com/repos/${repo}/releases?per_page=20`;
  const $ = (id) => document.getElementById(id);

  $("year").textContent = new Date().getFullYear();

  const menuToggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav");
  menuToggle?.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Đóng menu" : "Mở menu");
  });
  nav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuToggle?.setAttribute("aria-expanded", "false");
  }));

  const isFirmwareAsset = (asset) => {
    const name = (asset.name || "").toLowerCase();
    return !name.includes("source code") &&
      (name.endsWith(".bin") || name.endsWith(".zip") || name.endsWith(".uf2"));
  };
  const channelMatches = (asset, channel) => {
    const name = (asset.name || "").toLowerCase();
    if (!isFirmwareAsset(asset)) return false;
    if (channel === "usb") return /(^|[^a-z])usb([^a-z]|$)/.test(name);
    return /(^|[^a-z])ble([^a-z]|$)|bluetooth/.test(name);
  };
  const chooseLatest = (releases, channel) => {
    for (const release of releases) {
      const assets = (release.assets || []).filter((a) => channelMatches(a, channel));
      if (assets.length) {
        // Prefer a .bin when both a raw binary and an archive are published.
        assets.sort((a, b) => Number(b.name.toLowerCase().endsWith(".bin")) - Number(a.name.toLowerCase().endsWith(".bin")));
        return { release, asset: assets[0] };
      }
    }
    return null;
  };
  const setChannel = (channel, match) => {
    const prefix = channel === "usb" ? "usb" : "ble";
    const button = $(`${prefix}-download`);
    const name = $(`${prefix}-asset-name`);
    const note = $(`${prefix}-note`);
    if (match) {
      button.href = match.asset.browser_download_url;
      button.textContent = `Tải ${channel.toUpperCase()} · ${match.release.tag_name || "Release"} ↓`;
      button.classList.toggle("button-primary", channel === "usb");
      button.classList.toggle("button-secondary", channel === "ble");
      name.textContent = match.asset.name;
      note.textContent = `Bản phát hành: ${match.release.name || match.release.tag_name}. Mở trang release để xem hướng dẫn và ghi chú.`;
      button.setAttribute("download", "");
      button.setAttribute("aria-label", `Tải firmware ${channel.toUpperCase()} ${match.asset.name}`);
      button.dataset.releaseUrl = match.release.html_url || releasesUrl;
      button.addEventListener("contextmenu", () => {});
      // Keep a visible path to the release notes, without guessing asset URLs.
      const releaseLink = document.createElement("a");
      releaseLink.className = "asset-release-link";
      releaseLink.href = match.release.html_url || releasesUrl;
      releaseLink.target = "_blank";
      releaseLink.rel = "noopener";
      releaseLink.textContent = "Ghi chú bản phát hành ↗";
      note.appendChild(document.createTextNode(" "));
      note.appendChild(releaseLink);
    } else {
      button.href = releasesUrl;
      button.textContent = `Tìm bản ${channel.toUpperCase()} trên GitHub ↗`;
      name.textContent = `Chưa tìm thấy asset ${channel.toUpperCase()} khớp tên trong 20 bản phát hành gần nhất.`;
      note.textContent = "Mở Releases và kiểm tra tên tệp/ghi chú thủ công. Website không tự tạo đường dẫn tải.";
    }
  };

  fetch(apiUrl, { headers: { Accept: "application/vnd.github+json" } })
    .then((response) => {
      if (!response.ok) throw new Error(`GitHub API ${response.status}`);
      return response.json();
    })
    .then((releases) => {
      const published = releases.filter((r) => !r.draft && !r.prerelease);
      const latest = published[0];
      const status = $("release-status-text");
      if (latest) {
        status.textContent = `Bản phát hành mới nhất: ${latest.name || latest.tag_name} · ${new Date(latest.published_at).toLocaleDateString("vi-VN")}`;
      } else {
        status.textContent = "Chưa đọc được thông tin phát hành.";
      }
      setChannel("usb", chooseLatest(published, "usb"));
      setChannel("ble", chooseLatest(published, "ble"));
    })
    .catch(() => {
      $("release-status-text").textContent = "Không thể kết nối GitHub API lúc này. Bạn vẫn có thể mở Releases để kiểm tra.";
      for (const channel of ["usb", "ble"]) {
        $(`${channel}-asset-name`).textContent = "Chưa tải được danh sách asset từ GitHub.";
        $(`${channel}-download`).href = releasesUrl;
        $(`${channel}-download`).textContent = `Mở Releases · kiểm tra ${channel.toUpperCase()} ↗`;
        $(`${channel}-note`).textContent = "Liên kết dự phòng mở trang phát hành chính thức.";
      }
    });
})();
