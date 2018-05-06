import * as THREE from "three";

export default class Dragdropper {
  constructor(scene, splatScene) {
    this.scene = scene;
    this.splatScene = splatScene;

    // check if filereader is available
    if (typeof window.FileReader === 'undefined') {
      console.error("Filereader not supported");
    }

    this.drop = this.drop.bind(this);

    document.addEventListener("drop", this.drop);

    document.addEventListener("dragover", (event => {
      // prevent default to allow drop
      event.preventDefault();
    }), false);

  }

  drop(e) {
    e.preventDefault();
    let file = e.dataTransfer.files[0];
    let reader = new FileReader();

    reader.onload = (event => {
      let lines = event.target.result.split("\n");
      this.splatScene.updateSplats(lines);
    });
    reader.readAsText(file);
    return false;
  }
}
