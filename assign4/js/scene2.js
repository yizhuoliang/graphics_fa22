
rooms.scene2 = function() {

lib3D2();

description = `<b>Assignment 4</b>
               <p>
               Hierarchic 3D scene
               <br>
               with triangle meshes.
	       <p> <input type=range id=arm_length value=28> arm length
	       <br><input type=range id=leg_length value=40> leg length
          <br><input type=range id=shoulder_length value=40> shoulder length
          <br><input type=range id=pelvis_length value=40> pelvis length
	       <br><input type=range id=rate> rate
          <br><input type=range id=tempo value = 15> MUSIC TEMPO
	       `;

code = {
'init':`

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

   let uvMesh = (f,nu,nv) => {
      let mesh = [];
      for (let iv = 0 ; iv < nv ; iv++) {
         let v = iv / nv;
	      let strip = [];
         for (let iu = 0 ; iu <= nu ; iu++) {
	         let u = iu / nu;
	         strip = strip.concat(f(u,v));
	         strip = strip.concat(f(u,v+1/nv));
	      }
	       mesh = glueMeshes(mesh, strip);
      }
      return mesh;
   }

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

   S.torusMesh = uvMesh((u, v) => {
      let theta = 2 * Math.PI * u;
      let phi = Math.PI * v - Math.PI/2;
      let cu = Math.cos(theta);
      let su = Math.sin(theta);
      let cv = Math.cos(phi);
      let sv = Math.sin(phi);
      return [cu * (1 + 0.2 * cv), su * (1 + 0.2 * cv), 0.2 * sv,
              cu * cv, su * cv, sv,
              u, v]
   }, 20, 10);

   S.coneMesh = uvMesh((u,v) => {
      let theta = 2 * Math.PI * u;
      let phi = Math.PI * v - Math.PI/2;
      let cu = Math.cos(theta);
      let su = Math.sin(theta);
      let cv = Math.cos(phi);
      let sv = Math.sin(phi);
      return [v * cu * Math.atan(1), v * su * Math.atan(1), v,
              cu, su, 1,
	      u, v];
   }, 20, 10);

   S.coneCap = uvMesh((u, v) => {
      let theta = 2 * Math.PI * u;
      let phi = Math.PI * v - Math.PI/2;
      let cu = Math.cos(theta);
      let su = Math.sin(theta);
      let cv = Math.cos(phi);
      let sv = Math.sin(phi);
      return [v * cu * Math.atan(1), v * su * Math.atan(1), 1,
              0, 0, 1,
	      u, v];
   }, 20, 10);

   S.coneWithCap = glueMeshes(S.coneMesh, S.coneCap)
   
   S.octahedronMeshTriangle = [ 0, 0, 1, 1, 1, -1, 0, 0,      1, 0, 0, 1, 1, -1, 0, 0,      0, -1, 0, 1, 1, -1, 0, 0,
                                0, 0, 1, 1, 1, 1, 0, 0,       0, 1, 0, 1, 1, 1, 0, 0,       1, 0, 0, 1, 1, 1, 0, 0,
                                0, 0, 1, -1, 1, 1, 0, 0,      0, 1, 0, -1, 1, 1, 0, 0,      -1, 0, 0, -1, 1, 1, 0, 0,
                                0, 0, 1, -1, 1, -1, 0, 0,     -1, 0, 0, -1, 1, -1, 0, 0,    0, -1, 0, -1, 1, -1, 0, 0,
                                0, 0, -1, 1, -1, -1, 0, 0,    1, 0, 0, 1, -1, -1, 0, 0,     0, -1, 0, 1, -1, -1, 0, 0,
                                0, 0, -1, 1, -1, 1, 0, 0,     0, 1, 0, 1, -1, 1, 0, 0,      1, 0, 0, 1, -1, 1, 0, 0,
                                0, 0, -1, -1, -1, 1, 0, 0,    0, 1, 0, -1, -1, 1, 0, 0,     -1, 0, 0, -1, -1, 1, 0, 0,
                                0, 0, -1, -1, -1, -1, 0, 0,   -1, 0, 0, -1, -1, -1, 0, 0,   0, -1, 0, -1, -1, -1, 0, 0 ];

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
      S.gl.drawArrays(S.gl.TRIANGLE_STRIP, 0, mesh.length / S.VERTEX_SIZE);
   }

   S.drawMeshTriangle = (mesh, matrix) => {
      let gl = S.gl;
      S.setUniform('Matrix4fv', 'uMatrix', false, matrix);
      S.setUniform('Matrix4fv', 'uInvMatrix', false, matrixInverse(matrix));
      S.gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh), gl.STATIC_DRAW);
      S.gl.drawArrays(S.gl.TRIANGLES, 0, mesh.length / S.VERTEX_SIZE);
   }

`,
fragment: `
S.setFragmentShader(\`
   varying vec3 vPos, vNor;
   uniform float uOpacity;
   const int nL = \` + S.nL + \`;
   uniform vec3 uLd[nL];
   uniform vec3 uLc[nL];
   uniform mat4 uPhong;
    
   vec3 shadeSurface(vec3 P, vec3 N, mat4 M){

      // EXTRACT PHONG PARAMETERS FROM MATERIAL MATRIX

      vec3  ambient  = M[0].rgb;
      vec3  diffuse  = M[1].rgb;
      vec3  specular = M[2].rgb;
      float p        = M[2].a;

      // COMPUTE NORMAL, INIT COLOR, APPROXIMATE VECTOR TO EYE

      vec3 c = ambient;
      vec3 E = vec3(0.,0.,1.);

      // LOOP THROUGH LIGHT SOURCES

      for (int l = 0 ; l < nL ; l++) {
         // COMPUTE DIFFUSE AND SPECULAR FOR THIS LIGHT SOURCE(reflection of light)
        vec3 R = 2. * dot(N, uLd[l]) * N - uLd[l];
        c += uLc[l] * (diffuse * max(0.,dot(N, uLd[l]))
                        + specular * pow(max(0., dot(R, E)), p));
      }
      return c;    
   }

   void main() {
      vec3 c = shadeSurface(vPos, vNor, uPhong); // vec3 c = shadeSurface(vPos, vNor, uPhong);
      gl_FragColor = vec4(c,1.);
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

   // SET THE PROJECTION MATRIX BASED ON CAMERA FOCAL LENGTH

   let fl = 5.0;
   S.setUniform('Matrix4fv', 'uProject', false,
      [1,0,0,0, 0,1,0,0, 0,0,1,-1/fl, 0,0,0,1]);

   let dot = (a,b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
   let norm = v => Math.sqrt(dot(v,v));
   let normalize = v => { let s = norm(v); return [ v[0]/s, v[1]/s, v[2]/s ]; }
   // PASS IN LIGHT SOURCES
   let ldData = [ normalize([1,1,1]),
                  normalize([-1,-1,-1]) ];
   S.setUniform('3fv', 'uLd', ldData.flat());
   S.setUniform('3fv', 'uLc', [ 1,1,1, .8,.3,.1 ]);
    
   // DEFINE NUMBER OF LIGHTS FOR GPU
   S.nL = ldData.length;

   phong = [.2,.2,.2,0,  .5,.5,.5,0,  2,2,2,20,  0,0,0,0];

   S.setUniform('Matrix4fv', 'uPhong', false, phong.flat());

   let m = new Matrix();

   // GET VALUES FROM THE HTML SLIDERS

   let T = 2 * time * rate.value / 100;
   let AL = .1 + .9 * arm_length.value / 100;
   let LL = .1 + .9 * leg_length.value / 100;
   let SL = .1 + .12 * shoulder_length.value / 100;
   let PL = .1 + .18 * pelvis_length.value / 100;
   let TP = .1 + .9 * tempo.value / 15;

   // RENDER THE SCENE

   m.identity();
   m.roty(Math.sin(.3 * T));

   // PELVIS
   m.save();
      m.scale(PL, 0.1, 0.1);
      S.drawMeshTriangle(S.octahedronMeshTriangle, m.get());
   m.restore();

      // CHEST
      m.save();
         m.translate(0, 0.1, 0);
         // chest bottom
         m.rotz(0.12 * Math.cos(T + Math.PI));
         m.translate(0, 0.2, 0);
         m.save();
            m.rotx(1.5 * Math.PI);
            m.scale(0.12, 0.12, 0.3);
            S.drawMesh(S.sphereMesh, m.get());
         m.restore();

         // NECK
         m.save();
            m.translate(0, 0.27, 0);
            // neck bottom
            m.rotx(0.3 * Math.cos(T * TP));
            m.translate(0, 0.06, 0);
            m.save();
               m.scale(0.04, 0.06, 0.04);
               S.drawMesh(S.sphereMesh, m.get());
            m.restore();
            m.translate(0, 0.06, 0);
            // neck top
            m.roty(0.2 * Math.cos(T * TP));

            // HEAD
            m.save();
               m.translate(0,.01,0);
               m.rotz(.8 * Math.cos(0.7 * TP * T));
               m.save();
                  m.translate(0,.1,0);
                  m.scale(.08,.1,.08);
                  S.drawMesh(S.sphereMesh, m.get());
                  m.save();
                     // HAT
                     m.rotx(4.1);
                     m.rotz(0.1 * Math.cos(TP * T));
                     m.translate(0, 0, 0.8);
                     m.scale(1.2,1.2,1);
                     S.drawMesh(S.coneWithCap, m.get());
                     m.save();
                        m.scale(1.2, 1.2, 1.2);
                        S.drawMesh(S.torusMesh, m.get());
                     m.restore();
                  m.restore();
               m.restore();
            m.restore();
         m.restore();

         // LEFT SHOULDER
         m.save();
            m.roty(.3 * Math.cos(T));
            m.translate(SL, 0.3, 0);
            m.save();
               m.scale(SL, 0.04, 0.04);
               S.drawMesh(S.sphereMesh, m.get());
            m.restore();

            // LEFT UPPER ARM
            m.save();
               m.rotx(.3 * Math.cos(T + Math.PI));
               m.translate(SL, -AL/2, 0);
               m.save();
                  m.scale(0.04, AL/2, 0.04);
                  S.drawMesh(S.sphereMesh, m.get());
               m.restore();

               // LEFT LOWER ARM
               m.save();
                  m.translate(0, -AL / 2, 0);
                  m.rotx(-0.4 + .3 * Math.cos(T + Math.PI));
                  m.translate(0, -AL / 2, 0);
                  m.save();
                     m.scale(0.04, AL/2, 0.04);
                     S.drawMesh(S.sphereMesh, m.get());
                  m.restore();
                  
                  // LEFT HAND
                  m.save();
                     m.translate(0, -AL/2, 0);
                     m.scale(0.05, 0.05, 0.05);
                     S.drawMesh(S.sphereMesh, m.get());
                  m.restore();
               m.restore();
            m.restore();
         m.restore();

         // RIGHT SHOULDER
         m.save();
            m.roty(.28 * Math.cos(T));
            m.translate(-SL, 0.3, 0);
            m.save();
               m.scale(-SL, 0.04, 0.04);
               S.drawMesh(S.sphereMesh, m.get());
            m.restore();

            // RIGHT UPPER ARM
            m.save();
               m.rotx(.18 * Math.cos(T));
               m.translate(-SL, -AL/2, 0);
               m.save();
                  m.scale(0.04, AL/2, 0.04);
                  S.drawMesh(S.sphereMesh, m.get());
               m.restore();

               // RIGHT LOWER ARM
               m.save();
                  m.translate(0, -AL / 2, 0);
                  m.rotx(-1.6 + .08 * Math.cos(T));
                  m.translate(0, -AL / 2, 0);
                  m.save();
                     m.scale(0.04, AL/2, 0.04);
                     S.drawMesh(S.sphereMesh, m.get());
                  m.restore();

                  // RIGHT HAND
                  m.save();
                     m.translate(0, -AL/2, 0);
                     m.save();
                        m.scale(0.05, 0.05, 0.05);
                        S.drawMesh(S.sphereMesh, m.get());
                     m.restore();

                     // Magic shapes
                     m.save();
                        m.translate(0, 0, 0.2);
                        m.rotz(T / 0.8);
                        m.save();
                           m.translate(0, 0.1, 0);
                           m.scale(0.04 * (1 - 0.32 * Math.cos(T)), 0.04 * (1 - 0.32 * Math.cos(T)), 0.09 * (1 - 0.32 * Math.cos(T)));
                           S.drawMeshTriangle(S.octahedronMeshTriangle, m.get());
                        m.restore();
                        m.save();
                           m.translate(0, -0.1, 0);
                           m.scale(0.04 * (1 - 0.32 * Math.cos(T + Math.PI)), 0.04 * (1 - 0.32 * Math.cos(T + Math.PI)), 0.09 * (1 - 0.32 * Math.cos(T + Math.PI)));
                           S.drawMeshTriangle(S.octahedronMeshTriangle, m.get());
                        m.restore();
                     m.restore();
                  m.restore();
               m.restore();
            m.restore();
         m.restore();

      m.restore();

      // LEFT THIGH
      m.save();
         m.translate(PL, 0, 0);
         m.rotx(.3 * Math.cos(T));
         m.translate(0, -LL / 2, 0);
         m.save();
            m.scale(0.05, LL / 2, 0.05);
            S.drawMesh(S.sphereMesh, m.get());
         m.restore();

         // LEFT LOWER LEG
         m.save();
            m.translate(0, -LL / 2, 0);
            m.rotx(0.4 + .3 * Math.cos(T));
            m.translate(0, -LL / 2, 0);
            m.save();
               m.scale(0.05, LL / 2, 0.05);
               S.drawMesh(S.sphereMesh, m.get());
            m.restore();

            // LEFT FOOT
            m.save();
               m.translate(0, -LL / 2, 0);
               // left ankle
               m.rotx(.3 * Math.cos(T));
               m.translate(0, 0, 0.07);
               m.scale(0.05, 0.05, 0.08);
               S.drawMesh(S.sphereMesh, m.get());
            m.restore();
         m.restore();
      m.restore();

      // RIGHT THIGH
      m.save();
         m.translate(-PL, 0, 0)
         m.rotx(.3 * Math.cos(T + Math.PI));
         m.translate(0, -LL / 2, 0);
         m.save();
            m.scale(0.05, LL / 2, 0.05);
            S.drawMesh(S.sphereMesh, m.get());
         m.restore();

         // RIGHT LOWER LEG
         m.save();
            m.translate(0, -LL / 2, 0);
            m.rotx(0.4 + .3 * Math.cos(T + Math.PI));
            m.translate(0, -LL / 2, 0);
            m.save();
               m.scale(0.05, LL / 2, 0.05);
               S.drawMesh(S.sphereMesh, m.get());
            m.restore();

            // RIGHT FOOT
            m.save();
               m.translate(0, -LL / 2, 0);
               // right ankle
               m.rotx(.3 * Math.cos(T + Math.PI));
               m.translate(0, 0, 0.07);
               m.scale(0.05, 0.05, 0.08);
               S.drawMesh(S.sphereMesh, m.get());
            m.restore();
         m.restore();
      m.restore();
`,
events: `
   ;
`
};

}

