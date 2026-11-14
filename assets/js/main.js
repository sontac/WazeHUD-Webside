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

  // type="flash" = firmware gộp để nạp USB tại 0x0; type="ota" = file cập nhật OTA.
  const variants = [
    { id: "cyd-usb", board: "CYD", channel: "USB", chip: "ESP32", type: "flash" },
    { id: "cyd-ble", board: "CYD", channel: "BLE", chip: "ESP32", type: "flash" },
    { id: "s3-usb", board: "S3", channel: "USB", chip: "ESP32-S3", type: "flash" },
    { id: "s3-ble", board: "S3", channel: "BLE", chip: "ESP32-S3", type: "flash" },
    { id: "cyd-usb-ota", board: "CYD", channel: "USB", type: "ota" },
    { id: "cyd-ble-ota", board: "CYD", channel: "BLE", type: "ota" },
    { id: "s3-usb-ota", board: "S3", channel: "USB", type: "ota" },
    { id: "s3-ble-ota", board: "S3", channel: "BLE", type: "ota" }
  ];
  const flashVariants = variants.filter(v => v.type === "flash");
  const flashUrls = {};

  function matches(asset, v) {
    const n = asset?.name || "";
    const prefix = v.board === "S3" ? "WazeHUD-S3" : "WazeHUD-CYD";
    const base = new RegExp(`^${prefix}-${v.channel}-v\\d+(?:\\.\\d+){1,3}(?:[-+][A-Za-z0-9.-]+)?\\.bin$`, "i");
    const hasBase = new RegExp(`^${prefix}-${v.channel}-`, "i").test(n) && /\\.bin$/i.test(n);
    const isOta = /(^|[-_.])ota([-. _]|$)/i.test(n) || /-ota\.bin$/i.test(n);
    // OTA files are deliberately excluded from web flashing.
    return v.type === "ota" ? hasBase && isOta : base.test(n) && !isOta;
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
    if (!name || !button || !note) return;
    if (!match) {
      name.textContent = v.type === "ota" ? "Chưa tìm thấy firmware OTA phù hợp." : "Chưa tìm thấy firmware gộp phù hợp trong các bản phát hành gần đây.";
      button.href = releasesUrl;
      button.textContent = "Mở GitHub Releases ↗";
      note.textContent = v.type === "ota" ? "Kiểm tra tên file OTA và loại phần cứng trước khi tải." : "Kiểm tra tên file và loại phần cứng trước khi tải.";
      return;
    }
    name.textContent = match.asset.name;
    button.href = match.asset.browser_download_url;
    button.textContent = v.type === "ota"
      ? `Tải OTA · ${match.release.tag_name || "Release"} ↓`
      : `Tải nạp mới · ${match.release.tag_name || "Release"} ↓`;
    note.textContent = `Bản phát hành: ${match.release.name || match.release.tag_name}.`;
  }

  async function setFlasher(v, match) {
    const assetLabel = $(`${v.id}-flash-asset`), install = $(`${v.id}-flash-button`);
    const activate = install?.querySelector('[slot="activate"]');
    if (!assetLabel || !install || !activate) return false;
    if (!match) {
      assetLabel.textContent = "Chưa tìm thấy file BIN gộp đúng tên (không dùng file OTA).";
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
        builds: [{ chipFamily: v.chip, parts: [{ path: match.asset.browser_download_url, offset: 0 }] }]
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
      variants.forEach(v => setDownload(v, findLatest(published, v)));
      const results = [];
      for (const v of flashVariants) results.push(await setFlasher(v, findLatest(published, v)));
      const ready = results.filter(Boolean).length;
      $("flasher-status").textContent = ready
        ? `Đã chuẩn bị ${ready}/4 lựa chọn nạp trực tiếp. Chỉ sử dụng firmware gộp, không sử dụng file OTA.`
        : "Chưa tìm thấy firmware gộp phù hợp để nạp trực tiếp. Bạn vẫn có thể tải firmware từ GitHub Releases.";
    })
    .catch(() => {
      $("release-status-text").textContent = "Không thể kết nối GitHub API lúc này. Bạn vẫn có thể mở Releases để kiểm tra.";
      variants.forEach(v => {
        const b = $(`${v.id}-download`); if (b) { b.href = releasesUrl; b.textContent = "Mở GitHub Releases ↗"; }
        const a = $(`${v.id}-asset-name`); if (a) a.textContent = "Chưa tải được danh sách firmware.";
      });
      flashVariants.forEach(v => { const f = $(`${v.id}-flash-asset`); if (f) f.textContent = "Không đọc được GitHub Releases."; });
      $("flasher-status").textContent = "Không thể kiểm tra firmware. Hãy tải lại trang hoặc mở GitHub Releases.";
    });
})();
