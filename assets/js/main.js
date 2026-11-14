(() => {
  const repo = "sontac/WazeHUD-CYD-2.8";
  const releasesUrl = `https://github.com/${repo}/releases`;
  const apiUrl = `https://api.github.com/repos/${repo}/releases?per_page=30`;
  const $ = (id) => document.getElementById(id);
  $("year").textContent = new Date().getFullYear();

  const menuToggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav");
  menuToggle?.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(open));
  });
  nav?.querySelectorAll("a").forEach(a => a.addEventListener("click", () => nav.classList.remove("open")));

  const variants = [
    { id: "cyd-usb", board: "CYD", channel: "USB", chip: "ESP32" },
    { id: "cyd-ble", board: "CYD", channel: "BLE", chip: "ESP32" },
    { id: "s3-usb", board: "S3", channel: "USB", chip: "ESP32-S3" },
    { id: "s3-ble", board: "S3", channel: "BLE", chip: "ESP32-S3" }
  ];
  const flashUrls = {};

  function matches(asset, v) {
    const n = asset?.name || "";
    const prefix = v.board === "S3" ? "WazeHUD-S3" : "WazeHUD-CYD";
    return new RegExp(`^${prefix}-${v.channel}-v\\d+\\.\\d+\\.\\d+(?:[-+][A-Za-z0-9.-]+)?\\.bin$`, "i").test(n);
  }
  function findLatest(releases, v) {
    for (const release of releases) {
      const asset = (release.assets || []).find(a => matches(a, v));
      if (asset) return { release, asset };
    }
    return null;
  }

  function setDownload(v, match) {
    const name = $(`${v.id}-asset-name`), button = $(`${v.id}-download`), note = $(`${v.id}-note`);
    if (!match) {
      name.textContent = "Chưa tìm thấy firmware phù hợp trong các bản phát hành gần đây.";
      button.href = releasesUrl;
      button.textContent = "Mở GitHub Releases ↗";
      note.textContent = "Kiểm tra tên file và loại phần cứng trước khi tải.";
      return;
    }
    name.textContent = match.asset.name;
    button.href = match.asset.browser_download_url;
    button.textContent = `Tải ${v.board} ${v.channel} · ${match.release.tag_name || "Release"} ↓`;
    note.textContent = `Bản phát hành: ${match.release.name || match.release.tag_name}.`;
  }

  async function setFlasher(v, match) {
    const assetLabel = $(`${v.id}-flash-asset`), install = $(`${v.id}-flash-button`);
    const activate = install?.querySelector('[slot="activate"]');
    if (!assetLabel || !install || !activate) return false;
    if (!match) {
      assetLabel.textContent = "Chưa tìm thấy file BIN gộp đúng tên.";
      activate.disabled = true;
      return false;
    }
    assetLabel.textContent = match.asset.name;
    try {
      await import("https://unpkg.com/esp-web-tools@10/dist/web/install-button.js?module");
      await customElements.whenDefined("esp-web-install-button");
      const manifest = {
        name: `WazeHUD ${v.board} ${v.channel}`,
        version: String(match.release.tag_name || match.release.name || "latest").replace(/^v/i, ""),
        new_install_prompt_erase: true,
        builds: [{
          chipFamily: v.chip,
          parts: [{ path: new URL(`firmware/${match.asset.name}`, document.baseURI).href, offset: 0 }]
        }]
      };
      if (flashUrls[v.id]) URL.revokeObjectURL(flashUrls[v.id]);
      flashUrls[v.id] = URL.createObjectURL(new Blob([JSON.stringify(manifest)], {type:"application/json"}));
      install.manifest = flashUrls[v.id];
      activate.disabled = false;
      return true;
    } catch (err) {
      assetLabel.textContent += " · Không tải được trình nạp.";
      return false;
    }
  }

  fetch(apiUrl, {headers:{Accept:"application/vnd.github+json"}})
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(async releases => {
      const published = releases.filter(r => !r.draft && !r.prerelease);
      const latest = published[0];
      if (latest) $("release-status-text").textContent = `Bản phát hành mới nhất: ${latest.name || latest.tag_name} · ${new Date(latest.published_at).toLocaleDateString("vi-VN")}`;
      const results = [];
      for (const v of variants) {
        const match = findLatest(published, v);
        setDownload(v, match);
        results.push(await setFlasher(v, match));
      }
      const ready = results.filter(Boolean).length;
      $("flasher-status").textContent = ready
        ? `Đã chuẩn bị ${ready}/4 lựa chọn nạp trực tiếp. Hãy chọn đúng loại main và đúng kênh USB/BLE.`
        : "Chưa tìm thấy firmware phù hợp để nạp trực tiếp. Bạn vẫn có thể tải firmware từ GitHub Releases.";
    })
    .catch(() => {
      $("release-status-text").textContent = "Không thể kết nối GitHub API lúc này. Bạn vẫn có thể mở Releases để kiểm tra.";
      variants.forEach(v => {
        const b = $(`${v.id}-download`); if (b) { b.href = releasesUrl; b.textContent = "Mở GitHub Releases ↗"; }
        const a = $(`${v.id}-asset-name`); if (a) a.textContent = "Chưa tải được danh sách firmware.";
        const f = $(`${v.id}-flash-asset`); if (f) f.textContent = "Không đọc được GitHub Releases.";
      });
      $("flasher-status").textContent = "Không thể kiểm tra firmware. Hãy tải lại trang hoặc mở GitHub Releases.";
    });
})();
