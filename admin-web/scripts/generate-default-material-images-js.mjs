import fs from "node:fs";
import path from "node:path";
import { DEFAULT_MATERIAL_IMAGES } from "../src/config/default-material-images.ts";

const out = `(function () {
  var STORAGE_IMAGES = 'material_images';
  var DEFAULT_MATERIAL_IMAGES = ${JSON.stringify(DEFAULT_MATERIAL_IMAGES, null, 2)};

  function readRawImages() {
    try {
      var saved = localStorage.getItem(STORAGE_IMAGES);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  function ensureDefaultMaterialImages() {
    var images = readRawImages();
    if (!Array.isArray(images) || images.length === 0) {
      localStorage.setItem(STORAGE_IMAGES, JSON.stringify(DEFAULT_MATERIAL_IMAGES));
      return;
    }
    var hasValidUrl = images.some(function (img) { return img && img.url; });
    if (!hasValidUrl) {
      localStorage.setItem(STORAGE_IMAGES, JSON.stringify(DEFAULT_MATERIAL_IMAGES));
    }
  }

  window.ensureDefaultMaterialImages = ensureDefaultMaterialImages;
  window.DEFAULT_MATERIAL_IMAGES = DEFAULT_MATERIAL_IMAGES;
})();
`;

const target = path.join("dist", "Configuration center", "assets", "default-material-images.js");
fs.writeFileSync(target, out, "utf8");
console.log(`Wrote ${DEFAULT_MATERIAL_IMAGES.length} default images to ${target}`);
