import {Group} from "three";
import * as THREE from "three";
import {FILES} from "../files";

const MAX_SPLATS = 20000;
const RADIUS = 0.75;


export default class SplatScene extends Group {
  constructor(options) {
    super();
    this.options = options;
    this.meshesNorm = [];
    this.meshesLit = [];
    this.file = -1;

  }

  // makePlane(geo, mat, pos, rot) {
  //   let plane = new THREE.Mesh(geo, mat);
  //   plane.position.set(pos.x, pos.y, pos.z);
  //   let normal = this.getNormal(pos, rot);
  //   plane.lookAt(normal);
  //   plane.castShadow = false;
  //   plane.receiveShadow = true;
  //   return plane
  // }

  shortenSplats(splatList, samples) {
    // let newList = [];
    //
    // for (let i = 0; i < splatList.length; i = i+2) {
    //   newList.push(splatList[i]);
    // }
    //
    // return newList;

    const shuffled = splatList.sort(() => .5 - Math.random());
    return shuffled.slice(0, samples);
  }

  normalizeSplats(splatList) {
    let minX = 9999,
      minY = 9999,
      minZ = 9999;
    let maxX = -9999,
      maxY = -9999,
      maxZ = -9999;
    let splats = [];

    if (splatList.length > MAX_SPLATS) {
      splatList = this.shortenSplats(splatList, MAX_SPLATS);
    }

    splatList.forEach((line => {
      if (line.length === 0) {
        return;
      }
      let elements = line.split(" ");
      if (elements.length === 4) {
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

      splatsNormalized.push([newX, newY, newZ, this.normalizeDensity(line[3])]);
    }));

    return splatsNormalized;
  }

  updateSplats(splatList) {
    console.log("loading...");


    this.clearAllSplats();

    let geo = new THREE.Geometry();
    let normalizedSplats = this.normalizeSplats(splatList);

    normalizedSplats.forEach((line => {
        let splat = this.createSplat(
          line[0], line[1], line[2],
          line[3], RADIUS
        );

        geo.merge(splat);
      }
    ));

    let buf = new THREE.BufferGeometry().fromGeometry(geo);
    let matNormal = new THREE.MeshBasicMaterial({side: THREE.DoubleSide, vertexColors: THREE.FaceColors});
    let meshNormal = new THREE.Mesh(buf, matNormal);
    //
    meshNormal.rotateX(-Math.PI/2);
    // meshNormal.rotateZ(Math.PI);


    this.add(meshNormal);
    this.meshesNorm = meshNormal;


    console.log("loaded " + normalizedSplats.length + " splats");
  }

  createSplat(x, y, z, density, scale) {
    let geometry = new THREE.SphereGeometry(0.005 * scale, 6, 6);
    geometry.translate(x, y, z);

    for (let i in geometry.faces) {
      geometry.faces[i].color = this.densityToColor(density);
    }
    return geometry;
  }

  normalizeDensity(d) {
    return (d - FILES[this.file].min) / (FILES[this.file].max - FILES[this.file].min);
  }

  clearAllSplats() {
    this.remove(this.meshesNorm);
    this.meshesNorm = 0;

  }




  heatMapColorforValue(value) {
    let h = (1.0 - value)/1.5;
    return [h, 1, 0.5];
  }

  densityToColor(d) {
    let hsl = this.heatMapColorforValue(d);
    let color = new THREE.Color();
    color.setHSL(hsl[0],hsl[1],hsl[2]);
    return color;
  }

  update(timeStamp) {
    // this.rotation.y = timeStamp / 10000;

  }

}
