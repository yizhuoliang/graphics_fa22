
rooms.scene3 = function() {

lib3D2();

description = `<b>Assignment 4</b> <br>
               <p> Revolution and Extrusion of Splines </p>
               <p> by (triangle meshes of course) </p>
               <br><input type=range id=length value=50> scale
              `;

code = {
'init':`


































   // finally know why we need this space....
   S.material = [
      [.1,.1,.1,0,     .1,.1,.1,0,  1,1,1,5,    0,0,0,0], // SILVER
      [.25,0,0,0,      .5,0,0,0,    2,2,2,20,   0,0,0,0], // PLASTIC
      [.15,.05,.025,0, .3,.1,.05,0, .6,.2,.1,3, 0,0,0,0], // COPPER
      [.25,.15,.025,0, .5,.3,.05,0, 1,.6,.1,6,  0,0,0,0], // GOLD
      [.05,.05,.05,0,  .1,.1,.1,0,  1,1,1,5,    0,0,0,0], // LEAD
   ];
   S.nM = S.material.length;

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

   let add      = (a,b) => [ a[0]+b[0], a[1]+b[1], a[2]+b[2] ];
   let subtract = (a,b) => [ b[0]-a[0], b[1]-a[1], b[2]-a[2] ];
   let cross    = (a,b) => [ a[1] * b[2] - a[2] * b[1],
                             a[2] * b[0] - a[0] * b[2],
                             a[0] * b[1] - a[1] * b[0] ];
   let norm = a => Math.sqrt(a[0]*a[0] + a[1]*a[1] + a[2]*a[2]);
   let normalize = a => {
      let s = norm(a);
      return s < .00001 ? [0,0,0] : [ a[0] / s, a[1] / s, a[2] / s ];
   }

   // GIVEN A FUNCTION THAT MAPS (u,v) TO point AND normal,
   // AND GIVEN A MESH RESOLUTION, CREATE A PARAMETRIC MESH

   let uvMesh = (f, nu,nv, data) => {

      let mesh = [];

/////// YOU NEED TO IMPLEMENT THE FOLLOWING SECTIONS ///////

      // CREATE AN ARRAY OF nu+1 X nv+1 VERTICES

      let vertices = [];
      for (let i = 0; i < nu + 1; i++) {
         let row = [];
         for (let j = 0; j < nv + 1; j++) {
            row.push( f(i / nu, j / nv, data) );
         }
         vertices.push(row);
      }
      
/*
           v---v---v
           |   |   |
           v---v---v
           |   |   |
           v---v---v
           |   |   |
           v---v---v
*/
      // CREATE AN ARRAY OF nu X nv FACE NORMALS
      // APPROXIMATE FACE NORMALS BEFORE HAVING VERTEX NORMALS, smart!
      let f_normals = [];
      for (let i = 0; i < nu; i++) {
         let row = [];
         for (let j = 0; j < nv; j++) {
            let a = vertices[i + 1][j].slice(0, 3),
                b = vertices[i + 1][j + 1].slice(0, 3),
                c = vertices[i][j + 1].slice(0, 3),
                d = vertices[i][j].slice(0, 3),
                b_a = subtract(b, a),
                c_b = subtract(c, b),
                d_c = subtract(d, c),
                a_d = subtract(a, d);

            row.push(add(cross(b_a, c_b),
               add(cross(c_b, d_c),
               add(cross(d_c, a_d),
               cross(a_d, b_a)))));
         }
         f_normals.push(row);
      }


/*
           D---C---v
           | f |   |
           A---B---v  f = (B-A) X (C-B) +
           |   |   |      (C-B) X (D-C) +
           v---v---v      (D-C) X (A-D) +
           |   |   |      (A-D) X (B-A)
           v---v---v
*/
      // SUM THE 4 ADJOINING FACE NORMALS TO COMPUTE EACH VERTEX NORMAL
      // Use a helper function to handle the vertices on the edges
      function index(t, n) {
         if (t < 0) t += n;
         return t % n;
      }

      for (let i = 0; i < nu; i++) {
         for (let j = 0; j < nv; j++) {
            v_normal =  add(f_normals[index(i - 1, nu)][index(j - 1, nv)],
                        add(f_normals[index(i - 1, nu)][index(j, nv)],
                        add(f_normals[index(i, nu)][index(j - 1, nv)],
                            f_normals[index(i, nu)][index(j, nv)])));
            v_normal = normalize(v_normal);
            vertices[i][j].splice(3, 3, v_normal[0], v_normal[1], v_normal[2]);
         }
      }

/*
           d---c---v
           |f2 |f3 |
           a---N---v   N = normalize(f0 + f1 + f2 + f3)
           |f0 |f1 |
           v---v---v
           | f | f |
           v---v---v
*/
      // BUILD THE MESH BY GLUEING TOGETHER ROWS OF TRIANGLE STRIPS

      for (let j = 0; j < nv - 1; j++) {
         for (let i = 0; i <= nu; i++) {
            mesh.push(vertices[i][j]);
            mesh.push(vertices[i][j+1]);
	      }
         mesh.push(vertices[nu][j+1]);
         mesh.push(vertices[0][j+1]);
      }

      for (let i = 0; i <= nu; i++) {
         mesh.push(vertices[i][nv - 1]);
         mesh.push(vertices[i][nv]);
      }
      mesh.push(vertices[nu][nv]);

/*
        Don't try to build a flat array here.
        Make this an array of arrays, where each vertex is its own array.
        In particular, use mesh.push() rather than mesh.concat().
*/
      // RETURN THE FLATTENED ARRAY
/*
        Finally, just flatten everything using the .flat() method.
*/
        return mesh.flat();
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

   // DRAW A SINGLE MESH.

   S.drawMesh = (mesh, matrix, materialIndex) => {
      let gl = S.gl;
      if (! S.gl.bufferData)
         return;
      S.setUniform('Matrix4fv', 'uMatrix', false, matrix);
      S.setUniform('Matrix4fv', 'uInvMatrix', false, matrixInverse(matrix));
      S.setUniform('Matrix4fv', 'uMaterial', false, S.material[materialIndex]);
      S.gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh), gl.STATIC_DRAW);
      S.gl.drawArrays(mesh.isTriangles ? S.gl.TRIANGLES
                                       : S.gl.TRIANGLE_STRIP, 0, mesh.length / S.VERTEX_SIZE);
   }

   let evalCubicSpline = (splineMatrix, P, t) => {
      let splineValue = P => {
         let C = matrixTransform(splineMatrix, P);
         return t*t*t * C[0] + t*t * C[1] + t * C[2] + C[3];
      }

      // THE VALUE AT A KEY CAN BE EITHER A NUMBER OR AN OBJECT

      if (Number.isFinite(P[0]))    // SPECIAL CASE: THE VALUE
         return splineValue(P);     // AT THE KEY IS A NUMBER.

      let value = {};
      for (let k in P[0])
         value[k] = splineValue([ P[0][k], P[1][k], P[2][k], P[3][k] ]);
      return value;
   }

   let CatmullRomMatrix = [
     -1/2,  1  , -1/2, 0,
      3/2, -5/2,  0  , 1,
     -3/2,  2  ,  1/2, 0,
      1/2, -1/2,  0  , 0,
   ];

   S.CatmullRomFunction = (keys, n, t) => {
      let mm = n => Math.max(0, Math.min(keys.length - 1, n));
      let a = keys[mm(n-1)];
      let b = keys[mm(n  )];
      let c = keys[mm(n+1)];
      let d = keys[mm(n+2)];
      return evalCubicSpline(CatmullRomMatrix, [a,b,c,d], t);
   }

   S.evalSpline = (keys, f, splineFunction) => {
      let T = Math.max(0, Math.min(.9999, f)) * (keys.length - 1);
      return splineFunction(keys, T >> 0, T % 1);
   }
 
   // CREATE A SURFACE OF REVOLUTION MESH

   S.createRevolutionMesh = (nu,nv,keys) => S.uvMesh((u,v,keys) => {
      let theta = 2 * Math.PI * u;
      let cos = Math.cos(theta);
      let sin = Math.sin(theta);

      let zr  = S.evalSpline(keys, v, S.CatmullRomFunction);

      return [
         zr.r * cos, zr.r * sin, zr.z,
         0,0,0,                // NORMAL WILL BE COMPUTED LATER IN uvMesh().
         u, v
      ];
   }, nu, nv, keys);

   S.createExtrusionMesh = (nu,nv,data) => {

      let radius   = data.radius;
      let profile  = data.profile;
      let path     = data.path;
      let profileSpline = u => S.evalSpline(profile, u, S.CatmullRomFunction);
      let pathSpline    = v => S.evalSpline(path   , v, S.CatmullRomFunction);

      let m = new Matrix(),
          p = pathSpline(0),
          q = pathSpline(0.001);
/*
      /////// YOU NEED TO IMPLEMENT THE FOLLOWING SECTION ///////

      Z = NORMALIZE(q - p)
      X = A VECTOR NOT ALIGNED WITH Z

      // TO FIND A REASONABLE INITIAL VALUE FOR X:

         xx = Z[0]*Z[0]
         yy = Z[1]*Z[1]
         zz = Z[2]*Z[2]

         if xx < yy && xx < zz then X = [1,0,0]
         if yy < xx && yy < zz then X = [0,1,0]
         if zz < xx && zz < yy then X = [0,0,1]
*/

      let Z = normalize([q.x - p.x, q.y - p.y, q.z - p.z]);
      let X = [1, 0, 0]; // OH QUESTION 1: why this matters?
      
      let xx = Z[0] * Z[0];
      let yy = Z[1] * Z[1];
      let zz = Z[2] * Z[2];

      if (xx < yy && xx < zz) X = [1, 0, 0];
      else if (yy < xx && yy < zz) X = [0, 1, 0];
      else X = [0, 0, 1];

      return S.uvMesh((u,v) => {
         p = pathSpline(v - .001);
         q = pathSpline(v + .001);
/*
         /////// YOU NEED TO IMPLEMENT THE FOLLOWING SECTION ///////

         Z = NORMALIZE(q - p)
         Y = NORMALIZE( CROSS (Z, X) )
         X = NORMALIZE( CROSS (Y, Z) )
         m = X Y Z p
*/

         Z = normalize([q.x - p.x, q.y - p.y, q.z - p.z]);
         let Y = normalize(cross(Z, X));
         X = normalize(cross(Y, Z));
         
         let m = new Matrix();
         m.multiply([X[0], X[1], X[2], 0,
                     Y[0], Y[1], Y[2], 0,
                     Z[0], Z[1], Z[2], 0,
                     p.x, p.y, p.z, 0]);

         p = profileSpline(u);
         let P = m.transform([ radius * p.x, radius * p.y, radius * p.z ]);
         return [
            P[0],P[1],P[2],
            0,0,0,            // NORMAL WILL BE COMPUTED LATER IN uvMesh().
            u,v
         ];

      }, nu, nv);
   };
`,
fragment: `
S.setFragmentShader(\`
   const int nL = \` + S.nL + \`;
   const int nM = \` + S.nM + \`;
   uniform vec3 uBgColor;
   uniform vec3 uLd[nL];
   uniform vec3 uLc[nL];
   uniform mat4 uMaterial;
   varying vec3 vPos, vNor;

   void main() {
      vec3 N = normalize(vNor);
      vec3  ambient  = uMaterial[0].rgb;
      vec3  diffuse  = uMaterial[1].rgb;
      vec3  specular = uMaterial[2].rgb;
      float p        = uMaterial[2].a;
      vec3 c = mix(ambient, uBgColor, .3);
      for (int l = 0 ; l < nL ; l++) {
         vec3 R = 2. * dot(N, uLd[l]) * N - uLd[l];
         c += uLc[l] * (diffuse * max(0.,dot(N, uLd[l]))
                      + specular * pow(max(0., R.z), p));
      }
      gl_FragColor = vec4(c, 1.);
   }
\`);
`,
vertex: `
S.setVertexShader(\`
   attribute vec3 aPos, aNor;
   uniform   mat4 uMatrix, uInvMatrix, uProject;
   varying   vec3 vPos, vNor;

   void main() {
      vPos = (uProject * uMatrix * vec4(aPos, 1.)).xyz;
      vNor = (vec4(aNor, 0.) * uInvMatrix).xyz;
      gl_Position = vec4(vPos.xy, -.01 * vPos.z, 1.);
   }
\`)
`,
render: `

   let length = document.getElementById("length").value
   let L = .1 + .9 * length / 50;
   // console.log(L);

   S.revolutionMesh = S.createRevolutionMesh(16, 32, [
      {z:-1  , r:0  },
      {z:-.99, r:.1  * Math.sin(time / 1.2)},
      {z:-.7 - 0.2 *  Math.sin(time / 1.2), r:.5  * Math.sin(time / 1.2)},
      {z: .3 + 0.2 *  Math.sin(time / 1.2), r:.1},
      {z: .8 + 0.2 *  Math.sin(time / 1.2), r:.2 },
      {z: 1  , r:0  },
   ]);

   let extrusionData = {
      radius: 0.2,
      profile: [
         {x:-1 , y:-1 , z: 0},
         {x: 1 , y:-1 , z: 0},
         {x: 1 , y: 1 , z: 0},
         {x:-1 , y: 1 , z: 0},
         {x:-1 , y:-1 , z: 0},
      ],
      path: [
         {x:-1, y:-1, z: 0},
         {x: 1, y:-1, z: 0},
         {x: 1, y: 1, z: 0},
         {x:-1, y: 1, z: 0},
         {x:-1, y:-1, z: 0}
      ]
   };

   let extrusionThinData = {
      radius: 0.05,
      profile: [
         {x:-1 , y:-1 , z: 0},
         {x: 1 , y:-1 , z: 0},
         {x: 1 , y: 1 , z: 0},
         {x:-1 , y: 1 , z: 0},
      ],
      path: [
         {x:-1, y:-2, z: 0},
         {x: 1, y:-1, z: 0},
         {x: 1, y: 2, z: 0},
         {x:-1, y: 2, z: 1},
      ]
   };

   S.extrusionMesh = S.createExtrusionMesh(24, 8, extrusionData);

   // SET THE PROJECTION MATRIX BASED ON CAMERA FOCAL LENGTH

   let fl = 5.0;
   S.setUniform('Matrix4fv', 'uProject', false,
      [1,0,0,0, 0,1,0,0, 0,0,1,-1/fl, 0,0,0,1]);

   // SPECIFY SCENE LIGHTING

   S.nL = 2;
   S.setUniform('3fv', 'uLd', [ .57,.57,.57, -.57,-.57,-.57 ]);
   S.setUniform('3fv', 'uLc', [ 1,1,1, .5,.3,.1 ]);
   S.setUniform('3fv', 'uBgColor', [ .89,.81,.75 ]);

   // RENDER THE SCENE

   let m = new Matrix();
   m.save();
      m.scale(.5);
      m.rotx(Math.PI/8 * Math.sin(time));
      m.roty(Math.PI/8 * Math.cos(time));
      m.save();
         m.scale(L);
         S.drawMesh(S.revolutionMesh, m.get(), 0);
      m.restore();
      S.drawMesh(S.extrusionMesh, m.get(), 1);
      m.save();
         m.scale(1.3); 
         S.extrusionMesh = S.createExtrusionMesh(24, 8, extrusionThinData);
         S.drawMesh(S.extrusionMesh, m.get(), 1);
      m.restore();
   m.restore();
`,
events: `
   ;
`
};

}

