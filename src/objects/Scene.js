import {Group} from "three";
import * as THREE from "three";

export default class SplatScene extends Group {
  constructor(options, renderMode) {
    super();
    this.options = options;
    this.splats = [];

    this.oldRadius = this.options.disk.radius;
    this.oldBackground = this.options.rendering.background;

    this.changeRenderMode = this.changeRenderMode.bind(this);
    renderMode.onFinishChange(this.changeRenderMode);

    this.addBackground();
    this.changeBackground();
  }

  makePlane(geo, mat, pos, rot) {
    let plane = new THREE.Mesh(geo, mat);
    plane.position.set(pos.x, pos.y, pos.z);
    let normal = this.getNormal(plane, {x: rot.x, y: rot.y, z: rot.z});
    plane.lookAt(normal);
    plane.castShadow = false;
    plane.receiveShadow = true;
    return plane
  }

  addBackground() {
    let geometry = new THREE.PlaneGeometry(1, 1, 32, 32);
    let material = new THREE.MeshLambertMaterial({color: 0xffffff, side: THREE.FrontSide});

    let planeX = this.makePlane(geometry, material, {x: -0.5, y: 0, z: 0}, {x: 1, y: 0, z: 0});
    this.add(planeX);

    let planeY = this.makePlane(geometry, material, {x: 0, y: -0.5, z: 0}, {x: 0, y: 1, z: 0});
    this.add(planeY);

    let planeZ = this.makePlane(geometry, material, {x: 0, y: 0, z: -0.5}, {x: 0, y: 0, z: 1});
    this.add(planeZ);

    this.background = [planeX, planeY, planeZ];

  }

  changeRenderMode(mode) {
    if (mode == "normal") {
      this.changeMatIndex(0);
    } else {
      this.changeMatIndex(1);
    }
  }

  changeBackground() {
    this.background.forEach((bg => {
      bg.visible = this.options.rendering.background;
    }));
  }

  changeMatIndex(matIndex) {
    this.splats.forEach((splat => {
      for (let i = 0; i < splat.geometry.faces.length; i++) {
        splat.geometry.faces[i].materialIndex = matIndex;
      }
      splat.geometry.groupsNeedUpdate = true;
    }));
  }

  normalizeSplats(splatList) {
    let minX = 9999,
      minY = 9999,
      minZ = 9999;
    let maxX = -9999,
      maxY = -9999,
      maxZ = -9999;
    let splats = [];
    splatList.forEach((line => {
      if (line.length === 0) {
        return;
      }
      let elements = line.split(" ");
      if (elements.length === 6) {
        let elementsNum = [];
        for (let i in elements) {
          elementsNum.push(parseFloat(elements[i]));
        }
        if (elementsNum[0] < minX) {
          minX = elementsNum[0]
        }
        if (elementsNum[1] < minY) {
          minY = elementsNum[1]
        }
        if (elementsNum[2] < minZ) {
          minZ = elementsNum[2]
        }
        if (elementsNum[0] > maxX) {
          maxX = elementsNum[0]
        }
        if (elementsNum[1] > maxY) {
          maxY = elementsNum[1]
        }
        if (elementsNum[2] > maxZ) {
          maxZ = elementsNum[2]
        }
        splats.push(elementsNum);
      }
    }));

    let diffX = maxX - minX,
      diffY = maxY - minY,
      diffZ = maxZ - minZ;

    let splatsNormalized = [];
    splats.forEach((line => {
      let newX = ((line[0] - minX) / diffX) - 0.5,
        newY = ((line[1] - minY) / diffY) - 0.5,
        newZ = ((line[2] - minZ) / diffZ) - 0.5;

      newY = -1 * newY;
      newX = -1 * newX;

      splatsNormalized.push([newX, newY, newZ, line[3], line[4], line[5]]);
    }));

    return splatsNormalized;
  }

  updateSplats(splatList) {
    this.clearAllSplats();

    this.normalizeSplats(splatList).forEach((line => {
        this.createSplat(
          line[0],
          line[1],
          line[2],
          line[3],
          line[4],
          line[5]
        );
      }
    ));
    console.log("loaded " + splatList.length + " splats");
    this.changeRenderMode(this.options.rendering.mode);
  }

  createSplat(x, y, z, normX, normY, normZ) {
    this.geometry = new THREE.CircleGeometry(0.005, 6);
    let color = this.normalToColor(normX, normY, normZ);
    // console.log(color);
    let materials = [
      new THREE.MeshBasicMaterial({color: color, side: THREE.DoubleSide}),
      new THREE.MeshLambertMaterial({color: 0x888888, side: THREE.DoubleSide})
    ];
    let splat = new THREE.Mesh(this.geometry, materials);
    splat.position.set(x, y, z);
    let normal = this.getNormal(splat, {x: normX, y: normY, z: normZ});
    splat.lookAt(normal);
    splat.castShadow = true;
    splat.receiveShadow = false;
    this.add(splat);
    this.splats.push(splat);
  }

  clearAllSplats() {
    this.splats.forEach((splat => this.remove(splat)));
    this.splats = [];
  }

  rgb2hex(red, green, blue) {
    let rgb = blue | (green << 8) | (red << 16);
    return (0x1000000 + rgb)
  }

  normalToColor(normX, normY, normZ) {
    return this.rgb2hex(
      Math.round(Math.abs(normX) * 255),
      Math.round(Math.abs(normY) * 255),
      Math.round(Math.abs(normZ) * 255)
    )
  }

  update(timeStamp) {
    // this.rotation.y = timeStamp / 10000;

    if (this.oldRadius !== this.options.disk.radius) {
      this.splats.forEach((splat => {
        splat.scale.set(this.options.disk.radius, this.options.disk.radius, this.options.disk.radius);
      }));
      this.oldRadius = this.options.disk.radius;
    }

    if (this.oldBackground !== this.options.rendering.background) {
      this.changeBackground();
      this.oldBackground = this.options.rendering.background;
    }

  }

  getNormal(splat, normal) {
    return new THREE.Vector3(
      splat.position.x + normal.x,
      splat.position.y + normal.y,
      splat.position.z + normal.z)
  }
}
