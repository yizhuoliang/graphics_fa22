
rooms.scene2 = function() {

lib3D2();

description = `<b>Scene 2</b>
               <p>
               Hierarchic 3D scene
               <br>
               with triangle meshes.
	       <p> <input type=range id=arm_length value=28> arm length
	       <br><input type=range id=leg_length value=40> leg length
	       <br><input type=range id=rate> rate
	       <br><input type=range id=hole_size> hole size
	       `;

code = {
'init':`























   // TWO TRIANGLES THAT ARE NOT A TRIANGLE STRIP

   S.twoTrianglesMesh = [
      0,0,0,   0,0,1,  0,0,
      1,0,0,   0,0,1,  1,0,
      0,1,0,   0,0,1,  0,1,

      0,0,0,   0,1,0,  0,0,
      0,0,1,   0,1,0,  1,0,
      1,0,0,   0,1,0,  0,1,
   ];

   S.twoTrianglesMesh.isTriangles = true;

   // A SQUARE IS A TRIANGLE MESH WITH JUST TWO TRIANGLES

   S.squareMesh = [ -1, 1, 0,  0,0,1,  0,1,
                     1, 1, 0,  0,0,1,  1,1,
		    -1,-1, 0,  0,0,1,  0,0,
		     1,-1, 0,  0,0,1,  1,0 ];

   // GLUE TOGETHER TWO MESHES TO CREATE A SINGLE MESH

   let glueMeshes = (a,b) => {
      let mesh = a.slice();
      mesh.push(a.slice(a.length - S.VERTEX_SIZE, a.length));
      mesh.push(b.slice(0, S.VERTEX_SIZE));
      mesh.push(b);
      return mesh.flat();
   }

   // GIVEN A FUNCTION THAT MAPS (u,v) TO point AND normal,
   // AND GIVEN A MESH RESOLUTION, CREATE A PARAMETRIC MESH

   let uvMesh = (f,nu,nv,data) => {
      let mesh = [];
      for (let iv = 0 ; iv < nv ; iv++) {
         let v = iv / nv;
	 let strip = [];
         for (let iu = 0 ; iu <= nu ; iu++) {
	    let u = iu / nu;
	    strip = strip.concat(f(u,v,data));
	    strip = strip.concat(f(u,v+1/nv,data));
	 }
	 mesh = glueMeshes(mesh, strip);
      }
      return mesh;
   }

   S.uvMesh = uvMesh;

   // CREATE A UNIT SPHERE PARAMETRIC MESH

   S.sphereMesh = uvMesh((u,v) => {
      let theta = 2 * Math.PI * u;
      let phi = Math.PI * v - Math.PI/2;
      let cu = Math.cos(theta);
      let su = Math.sin(theta);
      let cv = Math.cos(phi);
      let sv = Math.sin(phi);
      return [cu * cv, su * cv, sv,
              cu * cv, su * cv, sv,
	      u, v];
   }, 20, 10);

   // CREATE A UNIT TORUS PARAMETRIC MESH

   S.torusMesh = uvMesh((u,v,r) => {
      let theta = 2 * Math.PI * u;
      let phi   = 2 * Math.PI * v;
      let cu = Math.cos(theta);
      let su = Math.sin(theta);
      let cv = Math.cos(phi);
      let sv = Math.sin(phi);
      return [cu * (1 + r * cv), su * (1 + r * cv), r * sv,
              cu * cv, su * cv, sv,
	      u, v];
   }, 20, 10, .4);

   // CREATE A UNIT DISK PARAMETRIC MESH

   S.diskMesh = uvMesh((u,v) => {
      let theta = 2 * Math.PI * u;
      let phi   = 2 * Math.PI * v;
      let cu = Math.cos(theta);
      let su = Math.sin(theta);
      return [v * cu, v * su, 0,  0, 0, 1,   u, v];
   }, 20, 2);

   // CREATE A UNIT OPEN TUBE PARAMETRIC MESH

   S.tubeMesh = uvMesh((u,v) => {
      let theta = 2 * Math.PI * u;
      let phi   = 2 * Math.PI * v;
      let cu = Math.cos(theta);
      let su = Math.sin(theta);
      return [cu, su, 2 * v - 1,   cu, su, 0,   u, v];
   }, 20, 2);

   // TRANSFORM A MESH BY A MATRIX ON THE CPU

   let transformMesh = (mesh, matrix) => {
      let result = [];
      let IMT = matrixTranspose(matrixInverse(matrix));
      for (let n = 0 ; n < mesh.length ; n += S.VERTEX_SIZE) {
         let V = mesh.slice(n, n + S.VERTEX_SIZE);
	 let P  = V.slice(0, 3);
	 let N  = V.slice(3, 6);
	 let UV = V.slice(6, 8);
	 P = matrixTransform(matrix, [P[0], P[1], P[2], 1]);
	 N = matrixTransform(IMT,    [N[0], N[1], N[2], 0]);
         result.push(P[0],P[1],P[2], N[0],N[1],N[2], UV);
      }
      return result.flat();
   }

   // A CYLINDER MESH IS A TUBE WITH TWO DISK END-CAPS GLUED TOGETHER

   let end0 = transformMesh(S.diskMesh, matrixTranslate([0,0,1]));
   let end1 = transformMesh(end0      , matrixRotx(Math.PI));
   S.cylinderMesh = glueMeshes(S.tubeMesh, glueMeshes(end0, end1));

   // A CUBE MESH IS SIX TRANSFORMED SQUARE MESHES GLUED TOGETHER

   let face0 = transformMesh(S.squareMesh, matrixTranslate([0,0,1]));
   let face1 = transformMesh(face0,        matrixRotx( Math.PI/2));
   let face2 = transformMesh(face0,        matrixRotx( Math.PI  ));
   let face3 = transformMesh(face0,        matrixRotx(-Math.PI/2));
   let face4 = transformMesh(face0,        matrixRoty(-Math.PI/2));
   let face5 = transformMesh(face0,        matrixRoty( Math.PI/2));
   S.cubeMesh = glueMeshes(face0,
                glueMeshes(face1,
                glueMeshes(face2,
                glueMeshes(face3,
                glueMeshes(face4,
		           face5)))));

   // DRAW A SINGLE MESH. WE STILL NEED TO ADD MATERIAL PROPERTIES!

   S.drawMesh = (mesh, matrix) => {
      let gl = S.gl;
      S.setUniform('Matrix4fv', 'uMatrix', false, matrix);
      S.setUniform('Matrix4fv', 'uInvMatrix', false, matrixInverse(matrix));
      S.gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh), gl.STATIC_DRAW);
      S.gl.drawArrays(mesh.isTriangles ? S.gl.TRIANGLES
                                       : S.gl.TRIANGLE_STRIP, 0, mesh.length / S.VERTEX_SIZE);
   }

`,
fragment: `
S.setFragmentShader(\`
   varying vec3 vPos, vNor;
   void main() {
      float c = .2 + .8 * max(0.,dot(vNor,vec3(.57)));
      gl_FragColor = vec4(c,c,c,1.);
   }
\`);
`,
vertex: `
S.setVertexShader(\`

   attribute vec3 aPos, aNor;
   varying   vec3 vPos, vNor;
   uniform   mat4 uMatrix, uInvMatrix, uProject;

   void main() {
      vec4 pos = uProject * uMatrix * vec4(aPos, 1.);
      vec4 nor = vec4(aNor, 0.) * uInvMatrix;
      vPos = pos.xyz;
      vNor = normalize(nor.xyz);
      gl_Position = pos * vec4(1.,1.,-.01,1.);
   }
\`)
`,
render: `

   S.torusMesh = S.uvMesh((u,v,r) => {
      let theta = 2 * Math.PI * u;
      let phi   = 2 * Math.PI * v;
      let cu = Math.cos(theta);
      let su = Math.sin(theta);
      let cv = Math.cos(phi);
      let sv = Math.sin(phi);
      return [cu * (1 + r * cv), su * (1 + r * cv), r * sv,
              cu * cv, su * cv, sv,
	      u, v];
   }, 20, 10, hole_size.value / 100);

   // SET THE PROJECTION MATRIX BASED ON CAMERA FOCAL LENGTH

   let fl = 5.0;
   S.setUniform('Matrix4fv', 'uProject', false,
      [1,0,0,0, 0,1,0,0, 0,0,1,-1/fl, 0,0,0,1]);

   let m = new Matrix();

   // GET VALUES FROM THE HTML SLIDERS

   let T = 2 * time * rate.value / 100;
   let AL = .1 + .9 * arm_length.value / 100;
   let LL = .1 + .9 * leg_length.value / 100;

   // RENDER THE SCENE

   m.identity();
   m.roty(Math.sin(.5 * T));
   m.save();

      // HEAD

      m.save();
        m.translate(0,.75,0);
	m.rotz(.3 * Math.cos(2 * T));
	m.save();
           m.translate(0,.1,0);
           m.scale(.1);
           S.drawMesh(S.cubeMesh, m.get());
        m.restore();
      m.restore();

      // ARMS

      for (let s = -1 ; s <= 1 ; s += 2) {
         let t = T + s * Math.PI/2;
         m.save();
           m.translate(s*.2,.6 - .03 * Math.cos(t),0);
           m.rotx(Math.cos(t));
           m.save();
              m.translate(0,-AL/2,0);
              m.scale(.035,AL/2,.035);
              S.drawMesh(S.sphereMesh, m.get());
           m.restore();
           m.translate(0,-AL,0);
           m.rotx(-1 + .7 * Math.sin(t));
           m.save();
              m.translate(0,-AL/2,0);
              m.scale(.035,AL/2,.035);
              S.drawMesh(S.sphereMesh, m.get());
           m.restore();
         m.restore();
      }

      // LEGS

      for (let s = -1 ; s <= 1 ; s += 2) {
         let t = T - s * Math.PI/2;
         m.save();
           m.translate(s*.1,.1 - .03 * Math.cos(t),0);
           m.rotx(Math.cos(t));
           m.save();
              m.translate(0,-LL/2,0);
              m.scale(.05,LL/2,.05);
              S.drawMesh(S.sphereMesh, m.get());
           m.restore();
           m.translate(0,-LL,0);
           m.rotx(1 + Math.sin(t));
           m.save();
              m.translate(0,-LL/2,0);
              m.scale(.05,LL/2,.05);
              S.drawMesh(S.sphereMesh, m.get());
           m.restore();
         m.restore();
      }
   m.restore();
`,
events: `
   ;
`
};

}

