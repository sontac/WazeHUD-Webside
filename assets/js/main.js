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
  const mergedBinMatches = (asset, channel) => {
    const name = asset?.name || "";
    const escapedChannel = channel.toUpperCase();
    return new RegExp(`^WazeHUD-CYD-${escapedChannel}-v\\d+\\.\\d+\\.\\d+(?:[-+][A-Za-z0-9.-]+)?\\.bin$`, "i").test(name);
  };

  const chooseMergedBin = (releases, channel) => {
    for (const release of releases) {
      const assets = (release.assets || []).filter((asset) => mergedBinMatches(asset, channel));
      if (assets.length) return { release, asset: assets[0] };
    }
    return null;
  };

  const flashObjectUrls = { usb: null, ble: null };
  const configureFlasher = async (channel, match) => {
    const prefix = channel === "usb" ? "usb" : "ble";
    const assetLabel = $(`${prefix}-flash-asset`);
    const installButton = $(`${prefix}-flash-button`);
    const activateButton = installButton?.querySelector('[slot="activate"]');
    if (!assetLabel || !installButton || !activateButton) return false;

    if (!match) {
      assetLabel.textContent = `Không tìm thấy file BIN gộp đúng tên cho kênh ${channel.toUpperCase()}.`;
      activateButton.disabled = true;
      activateButton.textContent = `Chưa có BIN ${channel.toUpperCase()}`;
      return false;
    }

    assetLabel.textContent = `${match.asset.name} · ${match.release.tag_name || match.release.name || "release"}`;
    activateButton.disabled = true;
    activateButton.textContent = `Chuẩn bị nạp bản ${channel.toUpperCase()}…`;
    try {
      // ESP Web Tools speaks Web Serial. Import only after a compatible merged BIN was found.
      await import("https://unpkg.com/esp-web-tools@10/dist/web/install-button.js?module");
      await customElements.whenDefined("esp-web-install-button");
      const manifest = {
        name: `WazeHUD-CYD ${channel.toUpperCase()}`,
        version: String(match.release.tag_name || match.release.name || "latest").replace(/^v/i, ""),
        new_install_prompt_erase: true,
        builds: [{
          chipFamily: "ESP32",
          parts: [{ path: match.asset.browser_download_url, offset: 0 }]
        }]
      };
      if (flashObjectUrls[channel]) URL.revokeObjectURL(flashObjectUrls[channel]);
      flashObjectUrls[channel] = URL.createObjectURL(new Blob([JSON.stringify(manifest)], { type: "application/json" }));
      installButton.manifest = flashObjectUrls[channel];
      activateButton.disabled = false;
      activateButton.textContent = `Nạp firmware ${channel.toUpperCase()}`;
      return true;
    } catch (error) {
      assetLabel.textContent += " · Không tải được mô-đun trình nạp.";
      activateButton.disabled = true;
      activateButton.textContent = "Trình nạp chưa sẵn sàng";
      return false;
    }
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
      Promise.all([
        configureFlasher("usb", chooseMergedBin(published, "usb")),
        configureFlasher("ble", chooseMergedBin(published, "ble"))
      ]).then((results) => {
        const status = $("flasher-status");
        const ready = results.filter(Boolean).length;
        if (status) {
          status.textContent = ready === 2
            ? "Đã tìm thấy BIN gộp cho cả USB và BLE. Chọn đúng kênh, kết nối HUD và làm theo hộp thoại nạp."
            : ready === 1
              ? "Đã chuẩn bị trình nạp cho một kênh. Kênh còn lại chưa có file BIN gộp đúng quy ước tên."
              : "Chưa có file BIN gộp đúng quy ước tên để bật nạp trực tiếp. Bạn vẫn có thể tải firmware từ mục phía trên.";
        }
      });
    })
    .catch(() => {
      $("release-status-text").textContent = "Không thể kết nối GitHub API lúc này. Bạn vẫn có thể mở Releases để kiểm tra.";
      for (const channel of ["usb", "ble"]) {
        $(`${channel}-asset-name`).textContent = "Chưa tải được danh sách asset từ GitHub.";
        $(`${channel}-download`).href = releasesUrl;
        $(`${channel}-download`).textContent = `Mở Releases · kiểm tra ${channel.toUpperCase()} ↗`;
        $(`${channel}-note`).textContent = "Liên kết dự phòng mở trang phát hành chính thức.";
        const flashAsset = $(`${channel}-flash-asset`);
        const flashButton = $(`${channel}-flash-button`);
        const activate = flashButton?.querySelector('[slot="activate"]');
        if (flashAsset) flashAsset.textContent = "Không đọc được GitHub Releases. Hãy thử tải lại trang.";
        if (activate) { activate.disabled = true; activate.textContent = "Chưa thể nạp"; }
      }
      $("flasher-status").textContent = "Không thể kiểm tra các BIN trên GitHub. Tải lại trang hoặc mở Releases để kiểm tra.";
    });
})();
