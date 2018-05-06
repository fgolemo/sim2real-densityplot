import {Group} from "three";
import * as THREE from "three";

export default class LightScene extends Group {
  constructor(options) {
    super();
    this.options = options;

    this.light = new THREE.PointLight(0xffffff, 1, 100);

    // ENABLE SHADOWS
    // this.light.shadow.camera.near = 0.01;
    // this.light.shadow.camera.far = 10;
    // this.light.castShadow = true;

    this.add(this.light);

    let geometry = new THREE.SphereGeometry( 0.05, 6, 6 );
    let material = new THREE.MeshBasicMaterial( {color: 0xffffff} );
    this.sphere = new THREE.Mesh( geometry, material );
    this.add( this.sphere );

    this.oldPos = 0; // wrong init so that on first update the light is positioned correctly
  }

  update(timeStamp) {
    if (this.oldPos !== this.options.light) {
      this.light.position.set(this.options.light.x, this.options.light.y, this.options.light.z);
      this.sphere.position.set(this.options.light.x, this.options.light.y, this.options.light.z);
      this.oldRadius = this.options.disk.radius;
    }
  }

}
