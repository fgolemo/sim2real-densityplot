import {Group} from "three";
import * as THREE from "three";

export default class SplatScene extends Group {
  constructor(options, renderMode) {
    super();
    this.options = options;
    this.meshesNorm = [];
    this.meshesLit = [];

    this.oldRadius = this.options.disk.radius;
    this.oldRendermode = this.options.rendering.mode;
    this.oldBackground = this.options.rendering.background;

    this.addBackground();
    this.changeBackground();
  }

  makePlane(geo, mat, pos, rot) {
    let plane = new THREE.Mesh(geo, mat);
    plane.position.set(pos.x, pos.y, pos.z);
    let normal = this.getNormal(pos, rot);
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

  changeVisibility(scale, mode) {
    this.turnAllOff();
    if (mode === "normal") {
      this.meshesNorm[scale].visible = true;
    } else {
      this.meshesLit[scale].visible = true;
    }
  }

  changeBackground() {
    this.background.forEach((bg => {
      bg.visible = this.options.rendering.background;
    }));
  }

  turnAllOff() {
    for (let i in this.meshesNorm) {
      this.meshesNorm[i].visible = false;
      this.meshesLit[i].visible = false;
    }
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

    let geo = new THREE.Geometry();
    let normalizedSplats = this.normalizeSplats(splatList);

    for (let i in this.options.splatSizes) {
      normalizedSplats.forEach((line => {
          let splat = this.createSplat(
            line[0], line[1], line[2],
            line[3], line[4], line[5],
            this.options.splatSizes[i]
          );

          geo.merge(splat);
        }
      ));

      let buf = new THREE.BufferGeometry().fromGeometry(geo);
      let matNormal = new THREE.MeshBasicMaterial({side: THREE.DoubleSide, vertexColors: THREE.FaceColors});
      let matLit = new THREE.MeshLambertMaterial({color: 0x888888, side: THREE.DoubleSide});

      let meshNormal = new THREE.Mesh(buf, matNormal);
      let meshLit = new THREE.Mesh(buf, matLit);

      this.add(meshNormal);
      this.add(meshLit);

      this.meshesNorm[this.options.splatSizes[i].toString()] = meshNormal;
      this.meshesLit[this.options.splatSizes[i].toString()] = meshLit;
    }


    console.log("loaded " + normalizedSplats.length + " splats");
    this.changeVisibility(this.options.disk.radius, this.options.rendering.mode);
  }

  createSplat(x, y, z, normX, normY, normZ, scale) {
    let geometry = new THREE.CircleGeometry(0.005 * scale, 6);
    geometry.lookAt(new THREE.Vector3(normX, normY, normZ));
    geometry.translate(x, y, z);

    for (let i in geometry.faces) {
      geometry.faces[i].color = this.normalToColor2(normX, normY, normZ);
    }
    // splat.castShadow = true;
    // splat.receiveShadow = false;
    return geometry;
  }

  clearAllSplats() {
    this.meshesNorm.forEach((mesh => this.remove(mesh)));
    this.meshesLit.forEach((mesh => this.remove(mesh)));
    this.meshesNorm = [];
    this.meshesLit = [];
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

  normalToColor2(x, y, z) {
    return new THREE.Color(Math.abs(x), Math.abs(y), Math.abs(z));
  }

  update(timeStamp) {
    // this.rotation.y = timeStamp / 10000;

    if (this.oldRadius !== this.options.disk.radius || this.oldRendermode !== this.options.rendering.mode) {
      this.changeVisibility(this.options.disk.radius, this.options.rendering.mode);
      this.oldRadius = this.options.disk.radius;
      this.oldRendermode = this.options.rendering.mode;
    }

    if (this.oldBackground !== this.options.rendering.background) {
      this.changeBackground();
      this.oldBackground = this.options.rendering.background;
    }

  }

  getNormal(pos, normal) {
    return new THREE.Vector3(
      pos.x + normal.x,
      pos.y + normal.y,
      pos.z + normal.z)
  }

  rotate180() {
    for (let i in this.meshesNorm) {
      this.rotateMesh180(this.meshesNorm[i]);
      this.rotateMesh180(this.meshesLit[i]);
    }
  }

  rotateMesh180(mesh){
    mesh.rotateZ(Math.PI);
  }
}
