
rooms.raytrace5 = function() {

lib3D();

description = `Raytrace to quadrics<br>in a fragment shader
<small>
    <p>  <input type=range id=red   value= 5> bg red
    <br> <input type=range id=green value=10> bg green
    <br> <input type=range id=blue  value=50> bg blue
    <br> <input type=range id=refract value=10> refract
         <div id=iorInfo>&nbsp;</div>
</small>
`;

code = {
'init':`

   // DEFINE MATERIALS TO BE RENDERED VIA PHONG REFLECTANCE MODEL

   S.redPlastic    = [.2,.1,.1,0,  .5,.2,.2,0,  2,2,2,20,  0,0,0,0];
   S.greenPlastic  = [.1,.2,.1,0,  .2,.5,.2,0,  2,2,2,20,  0,0,0,0];
   S.bluePlastic   = [.1,.1,.2,0,  .2,.2,.5,0,  2,2,2,20,  0,0,0,0];
   S.whitePlastic  = [.2,.2,.2,0,  .5,.5,.5,0,  2,2,2,20,  0,0,0,0];
`,

fragment: `
S.setFragmentShader(\`

   // DECLARE CONSTANTS, UNIFORMS, VARYING VARIABLES

   const int nQ = \` + S.nQ + \`;
   const int nL = \` + S.nL + \`;
   uniform vec3 uBgColor;
   uniform vec3 uLd[nL];
   uniform vec3 uLc[nL];
   uniform mat4 uQ[nQ];
   uniform mat4 uPhong[nQ];
   uniform int  uShape[nQ];
   uniform float uIor;

   varying vec3 vPos;
   float fl = 3.;

   // Coulson implemented normalQ
   vec3 normalQ(vec3 P, mat4 Q) {
      float a = Q[0][0];
      float b = Q[0][1];
      float c = Q[0][2];
      float d = Q[0][3];
      float e = Q[1][0];
      float f = Q[1][1];
      float g = Q[1][2];
      float h = Q[1][3];
      float i = Q[2][0];
      float j = Q[2][1];
      float k = Q[2][2];
      float l = Q[2][3];
      float m = Q[3][0];
      float n = Q[3][1];
      float o = Q[3][2];
      float p = Q[3][3];
      float x = P.x;
      float y = P.y;
      float z = P.z;
      float fx = 2. * a * x + (b + e) * y + (c + i) * z + (d + m);
      float fy = (b + e) * x + 2. * f * y + (g + j) * z + (h + n);
      float fz = (c + i) * x + (g + j) * y + 2. * k * z + (l + o);
      return normalize(vec3(fx, fy, fz));
   }

   vec2 rayQ(vec3 V, vec3 W, mat4 Q) {
      vec4 V1 = vec4(V, 1.);
      vec4 W0 = vec4(W, 0.);
      
      float a = dot(W0, Q * W0);
      float b = dot(V1, Q * W0) + dot(W0, Q * V1);
      float c = dot(V1, Q * V1);

      float insideDet = b * b - 4. * a * c;
      if (insideDet > 0.) {
         return vec2((-b - sqrt(insideDet)) / (a * 2.), (-b + sqrt(insideDet)) / (a * 2.));
      } else {
         return vec2(-1., -1.);
      }
   }

   vec3 ray1QI(vec3 T, int n, vec2 t) {
      float tIn = t.x;
      float tOut = t.y;
      if (tIn > 0. && tIn < tOut && tIn < T.y) {
         T = vec3(n, t); //Question, about this T
      }
      return T;
   }

   vec3 ray2QI(vec3 T, int n, vec2 t0, vec2 t1) {
      float tIn = max(t0.x,t1.x);
      float tOut = min(t0.y,t1.y);
      if (tIn > 0. && tIn < tOut && tIn < T.y) {
         int i = t0.x == tIn ? 0 : 1;
         T = vec3(n + i, tIn, tOut);
      }
      return T;
   }

   vec3 ray3QI(vec3 T, int n, vec2 t0, vec2 t1, vec2 t2) {
      float tIn = max(t0.x, max(t1.x, t2.x));
      float tOut = min(t0.y, min(t1.y, t2.y));
      if (tIn > 0. && tIn < tOut && tIn < T.y) {
         int i = t0.x == tIn ? 0 : t1.x == tIn ? 1 : 2;
         T = vec3(n + i, tIn, tOut);
      }
      return T;
   }

   vec3 ray4QI(vec3 T, int n, vec2 t0, vec2 t1, vec2 t2, vec2 t3) {
      float tIn = max(t0.x, max(t1.x, max(t2.x, t3.x)));
      float tOut = min(t0.y, min(t1.y, min(t2.y, t3.y)));
      if (tIn > 0. && tIn < tOut && tIn < T.y) {
         int i = t0.x == tIn ? 0 : t1.x == tIn ? 1 : t2.x==tIn ? 2 : 3;
         T = vec3(n + i, tIn, tOut);
      }
      return T;
   }

   vec3 rayScene(vec3 V, vec3 W) {
      vec3 T = vec3(-1, 1000, 0);
      // loop through all quadrics n
      for (int n = 0; n < nQ; n++) {
         // Coulson: note that 0s are automatically ignored
         int shape = uShape[n];
         if (shape == 1) T = ray1QI(T, n, rayQ(V, W, uQ[n]));
         if (shape == 2) T = ray2QI(T, n, rayQ(V, W, uQ[n]), rayQ(V, W, uQ[n + 1]));
         if (shape == 3) T = ray3QI(T, n, rayQ(V, W, uQ[n]), rayQ(V, W, uQ[n + 1]), rayQ(V, W, uQ[n + 2]));
         if (shape == 4) T = ray4QI(T, n, rayQ(V, W, uQ[n]), rayQ(V, W, uQ[n + 1]), rayQ(V, W, uQ[n + 2]), rayQ(V, W, uQ[n + 3]));
      }
      return T;
   }

   vec3 shadeSurface(vec3 P, vec3 N, mat4 phong) {
      // extract Phong parameters
      vec3  ambient  = phong[0].rgb;
      vec3  diffuse  = phong[1].rgb;
      vec3  specular = phong[2].rgb;
      float p        = phong[2].a;

      // INIT COLOR, APPROXIMATE VECTOR TO EYE
      // Coulson Question: what is this eye direction mean?
      vec3 c = mix(ambient, uBgColor, .3);
      vec3 E = vec3(0.,0.,1.);

      // loop through light sources
      for (int l = 0; l < nL; l++) {
         // Coulson:use Ray Secene to test if we are in shadow here
         vec3 T = rayScene(P, uLd[l]);
         

         // Compute difuse and specular for this light source
         if (T.x < 0.) {
            vec3 R = 2. * dot(N, uLd[l]) * N - uLd[l];
            c += uLc[l] * (diffuse * max(0.,dot(N, uLd[l]))
                           + specular * pow(max(0., dot(R, E)), p));
         }
      }
      return c;
   }

   vec3 refractRay(vec3 W, vec3 N, float n) {
      // yeah, just like in the course notes
      vec3 C1 = N * dot(W, N);
      vec3 S1 = W - C1;
      float SinIn = length(S1);
      float SinOut = SinIn * n;
      float AngleIn = asin(SinIn);
      float AngleOut = asin(SinOut);
      vec3 C2 = C1 * cos(AngleOut) / cos(AngleIn);
      vec3 S2 = S1 * SinOut / SinIn;
      return C2 + S2;
   }

/********* PSEUDO-CODE IMPLEMENTATION OF FRAGMENT SHADER **********

Compute surface normal: P, Q => N

   vec3 normalQ(vec3 P, mat4 Q)

      Just like in the course notes.

Trace a ray to a quadric: V, W, Q => [ tIn, tOut ]

   vec2 rayQ(vec3 V, vec3 W, mat4 Q)

      Just like in the course notes:

         First add homogeneous coordinates:

            V1 = vec4(V,1)
            W0 = vec4(W,0)

         Then compute quadratic equation:

            a: W0 . Q*W0
            b: V1 . Q*W0 + W0 . Q*V1
            c: V1 . Q*V1

         Then solve quadratic equation.

         Return both roots as a vec2

Trace a ray to an intersection of quadric surfaces:

   Q1: T=[n,tIn,tOut], n, t.xy => T
   
      tIn  = t.x
      tOut = t.y
      if tIn > 0 and tIn < tOut and tIn < T.y
         T = [n,t]
      return T
   
   Q2: T=[n,tIn,tOut], n, t0.xy, t1.xy => T
   
      tIn  = max(t0.x,t1.x)
      tOut = min(t0.y,t1.y)
      if tIn > 0 and tIn < tOut and tIn < T.y
         i = t0.x==tIn ? 0 : 1
         T = [n+i,t]
      return T
   
   Q3: T=[n,tIn,tOut], n, t0.xy, t1.xy, t2.xy => T
   
      tIn  = max(t0.x,t1.x,t2.x)
      tOut = min(t0.y,t1.y,t2.y)
      if tIn > 0 and tIn < tOut and tIn < T.y
         i = t0.x==tIn ? 0 : t1.x==tIn ? 1 : 2
         T = [n+i,t]
      return T
   
   Q4: T=[n,tIn,tOut], n, t0.xy, t1.xy, t2.xy, t3.xy => T
   
      tIn  = max(t0.x,t1.x,t2.x,t3.x)
      tOut = min(t0.y,t1.y,t2.y,t3.y)
      if tIn > 0 and tIn < tOut and tIn < T.y
         i = t0.x==tIn ? 0 : t1.x==tIn ? 1 : t2.x==tIn ? 2 : 3
         T = [n+i,t]
      return T
   
Trace a ray to the scene:

   vec3 rayScene(vec3 V, vec3 W):

      T = [-1,1000,0]
      loop though all quadrics n
         if shape_type == 1: T = Q1(T, n, ray to Q[n])
         if shape_type == 2: T = Q2(T, n, ray to Q[n], Q[n+1])
         if shape_type == 3: T = Q3(T, n, ray to Q[n], Q[n+1], Q[n+2])
         if shape_type == 4: T = Q4(T, n, ray to Q[n], Q[n+1], Q[n+2], Q[n+3])
      return T

A note on using array subscripts that you computed within a function:

   Array subscripts need to be constant. So if you compute an array subscript
   within a function, then you need to make use of the resulting int value
   in the proper way, as follows:

   WRONG:

      vec3 T = rayScene(V, W);
      int n = int(T.x);
      mat4 Q = uQ[n];                 // This line produces a compiler error.
      ...

   CORRECT:

      vec3 T = rayScene(V, W);
      for (int n = 0 ; n < nQ ; n++)
         if (n == int(T.x)) {
            mat4 Q = uQ[n];          // This line works, because n is constant.
            ...
         }

Shade surface: P, N, phong => color

   vec3 shadeSurface(vec3 P, vec3 N, mat4 phong)

      The same algorithm you use when shading a sphere.

Refract ray: W, N, index_of_refraction => W

   vec3 refractRay(vec3 W, vec3 N, float n)

      Just like in the course notes.

Main loop

   T=[n,tIn,tOut] = rayScene(T, V, W)
   
   n = int(T.x) // REMEMBER, YOU NEED TO MAKE A LOOP HERE, AS SHOWN ABOVE.

   if n >= 0:

      Compute surface point P = V + T.y * W

      Shade with Phong, using:

         N = normalQ(P, Q[n])

      Do reflection:

         compute R

         T=[n,tIn,tOut] = rayScene ( P , R )

         n = int(T.x)

         if n >= 0:

            M = P + T.y * W        // POINT ON SURFACE OF OTHER OBJECT

               because T.y is tIn

            color += shadeSurface(M, normalQ(M,Q[n]), phong[n]) / 2.

      Do refraction:

         (1) SHOOT RAY TO FIND REAR OF THIS OBJECT (USE 2nd ROOT):

         W = refractRay(W, N, index_of_refraction)

         T=[n,tIn,tOut] = rayScene ( P-.01*W , W )

         n = int(T.x)

         P = P + T.z * W            // FIND POINT AT REAR OF OBJECT

            because T.z is tOut

         N = normalQ(P, Q[n])

         (2) SHOOT RAY FROM REAR OF THIS OBJECT TO FIND ANOTHER OBJECT:

         W = refract ray (W, N, 1 / index_of_refraction)

         T=[n,tIn,tOut] = rayScene( P , W )

         n = int(T.x)

         if n >= 0:

            M = P + T.y * W        // POINT ON SURFACE OF OTHER OBJECT

               because T.y is tIn

            color += diffuse_color_of_this_object *
                     shadeSurface(M, normalQ(M,Q[n]), phong[n])

******************************************************************/

   void main() {
      // BACKGROUND COLOR IS THE DEFAULT COLOR
      vec3 color = uBgColor;

      // DEFINE RAY INTO SCENE FOR THIS PIXEL
      vec3 V = vec3(0.,0.,fl);
      vec3 W = normalize(vec3(vPos.xy, -fl));
      mat4 Q, phong, Qr, phongR, Qrear, Qrefract, phongRefract;
      vec3 T = rayScene(V, W);
      for (int n = 0; n < nQ ; n++) {
         if (n == int(T.x)) {
            Q = uQ[n];
            phong = uPhong[n];
         }
      }

      if (T.x >= 0.) {
         vec3 P = V + T.y * W; // surface point
         vec3 N = normalQ(P, Q);
         color += shadeSurface(P, N, phong);
   
         // do reflection
         vec3 R = 2. * dot(N, -W) * N + W;
         T = rayScene(P, R);
         for (int n = 0 ; n < nQ ; n++) {
            if (n == int(T.x)) {
               Qr = uQ[n];
               phongR = uPhong[n];
            }
         }

         if (T.x >= 0.) {
            vec3 M = P + T.y * W;
            color += shadeSurface(M, normalQ(M, Qr), phongR);
         }

         // do refraction
         W = refractRay(W, N, uIor);
         T = rayScene(P - .01 * W, W);
         for (int n = 0 ; n < nQ ; n++) {
            if (n == int(T.x)) {
               Qrear = uQ[n];
            }
         }
         P = P + T.z * W; // point at the rear of object
         N = normalQ(P, Qrear);
         // shoot ray from rear of this object to find another object
         W = refractRay(W, N, 1. / uIor);
         T = rayScene(P, W); // Question: why not use the trick, move forward a little bit?
         for (int n = 0 ; n < nQ ; n++) {
            if (n == int(T.x)) {
               Qrefract = uQ[n];
               phongRefract = uPhong[n];
            }
         }

         if (T.x >= 0.) {
            vec3 M = P + T.y * W;
            vec3  diffuse  = phong[1].rgb;
            color += shadeSurface(M, normalQ(M, Qrefract), phongRefract);
         }
         
      }

      gl_FragColor = vec4(sqrt(color), 1.);
   }
\`);
`,
vertex: `
S.setVertexShader(\`

   attribute vec3 aPos;
   varying   vec3 vPos;

   void main() {
      vPos = aPos;
      gl_Position = vec4(aPos, 1.);
   }

\`)

`,
render: `

   // USEFUL VECTOR FUNCTIONS

   let add = (a,b) => [ a[0]+b[0], a[1]+b[1], a[2]+b[2] ];
   let dot = (a,b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
   let norm = v => Math.sqrt(dot(v,v));
   let normalize = v => { let s = norm(v); return [ v[0]/s, v[1]/s, v[2]/s ]; }
   let scale = (v,s) => [ s * v[0], s * v[1], s * v[2] ];
   let subtract = (a,b) => [ a[0]-b[0], a[1]-b[1], a[2]-b[2] ];

   // SEND LIGHT SOURCE DATA TO GPU

   let ldData = [ normalize([1,1,1]),
                  normalize([-1,-1,-1]) ];
   S.setUniform('3fv', 'uLd', ldData.flat());
   S.setUniform('3fv', 'uLc', [ 1,1,1, .5,.3,.1 ]);

   // DEFINE NUMBER OF LIGHTS FOR GPU

   S.nL = ldData.length;

   // SEND BACKGROUND COLOR TO GPU

   S.setUniform('3fv', 'uBgColor', [ red.value   / 100,
                                     green.value / 100,
                                     blue.value  / 100 ]);

   // SEND INDEX OF REFRACTION TO GPU

   let ior = refract.value / 100 + 1;
   S.setUniform('1f', 'uIor', ior);

   // DIFFERENT QUADRIC SURFACES

//                xx        yy         zz           c

   let qSlabX  = [1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,-1]; // x*x - 1 <= 0
   let qSlabY  = [0,0,0,0, 0,1,0,0, 0,0,0,0, 0,0,0,-1]; // y*y - 1 <= 0
   let qSlabZ  = [0,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,-1]; // z*z - 1 <= 0
   let qNarrowSlabZ  = [0,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,-0.4]; // z*z - 1 <= 0
   let qSphere = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,-1]; // x*x + y*y + z*z - 1 <= 0
   let qSmallSphere = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,-0.8];
   let qTubeX  = [0,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,-1]; // y*y + z*z - 1 <= 0
   let qTubeY  = [1,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,-1]; // x*x + z*z - 1 <= 0
   let qTubeZ  = [1,0,0,0, 0,1,0,0, 0,0,0,0, 0,0,0,-1]; // x*x + y*y - 1 <= 0
   let qSmallTubeZ  = [-1,0,0,0, 0,-1,0,0, 0,0,0,0, 0,0,0, 0.2];
   let qMediumSlabZ  = [0,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,-0.6];
   let qHyperboloid = [1,0,0,0, 0,1,0,0, 0,0,-1,0, 0,0,0,-1]

   // SHAPES ARE INTERSECTIONS OF QUADRIC SURFACES

   let shape = [], coefs = [], xform = [], phong = [], M;

   let sphere = (m, M) => {
      shape.push(1);
      phong.push(m);
      xform.push(M);
      coefs.push(qSphere);
   }

   let tubeX = (m, M) => {
      shape.push(2, 0);
      phong.push(m, m);
      xform.push(M, M);
      coefs.push(qTubeX, qSlabX);
   }

   let tubeY = (m, M) => {
      shape.push(2, 0);
      phong.push(m, m);
      xform.push(M, M);
      coefs.push(qTubeY, qSlabY);
   }

   let tubeZ = (m, M) => {
      shape.push(2, 0);
      phong.push(m, m);
      xform.push(M, M);
      coefs.push(qTubeZ, qSlabZ);
   }

   let cube = (m, M) => {
      shape.push(3, 0, 0);
      phong.push(m, m, m);
      xform.push(M, M, M);
      coefs.push(qSlabX, qSlabY, qSlabZ);
   }

   let octahedron = (m, M) => {
      shape.push(4, 0, 0, 0);
      phong.push(m, m, m, m);
      xform.push(M, M, M, M);
      coefs.push([1, 2, 2, 0,  0, 1, 2, 0,  0,0,1,0,  0,0,0,-1]);
      coefs.push([1,-2,-2, 0,  0, 1, 2, 0,  0,0,1,0,  0,0,0,-1]);
      coefs.push([1,-2, 2, 0,  0, 1,-2, 0,  0,0,1,0,  0,0,0,-1]);
      coefs.push([1, 2,-2, 0,  0, 1,-2, 0,  0,0,1,0,  0,0,0,-1]);
   }

   let slabSphere = (m, M) => {
      shape.push(2, 0);
      phong.push(m, m);
      xform.push(M, M);
      coefs.push(qSphere, qNarrowSlabZ);
   }

   let hyperboloid = (m, M) => {
      shape.push(2, 0);
      phong.push(m, m);
      xform.push(M, M);
      coefs.push(qHyperboloid, qSlabZ);
   }

   // CREATE THE SCENE

   tubeY(S.redPlastic,
         mScale(.2,.03,.2,
         mRoty(time * 1.1,
         mRotz(time * 1.2,
         mRotx(time * 1.3,
         matrixTranslate(-Math.sin(time)*.5,0,Math.cos(time)*.5+.5 ))))));
   
   octahedron(S.greenPlastic,
       mScale(.18,.18,.18,
       mRoty(time * 1.2,
       mRotz(time * 1.3,
       mRotx(time * 1.1,
       matrixTranslate(0,-Math.cos(time)*.4,Math.sin(time)*.4+.5 ))))));

   hyperboloid(S.whitePlastic,
       mScale(.12,.12,.12,
       mRoty(Math.cos(time) * 0.2 + 1,
       mRotx(Math.sin(time) * 0.2 + 2,
       matrixTranslate(0,Math.cos(time)*.2,.5 )))));

   slabSphere(S.bluePlastic,
          mScale(.2,.15,.18,
          mRoty(time * 1.3,
          mRotz(time * 1.1,
          mRotx(time * 1.2,
          matrixTranslate(Math.sin(time)*.5,0,-Math.cos(time)*.5+.5 ))))));
   
   octahedron(S. whitePlastic, mRoty(time * 0.4, mRotx(time * 0.5, mScale(0.2, 0.2, 0.2, matrixTranslate(3, 0, -8)))));
   tubeY(S. redPlastic, mRoty(time * 0.4, mRotx(time * 0.5, mScale(0.2, 0.2, 0.2, matrixTranslate(-3, 0, -8)))));
   tubeX(S. greenPlastic, mRoty(time * 0.4, mRotx(time * 0.5, mScale(0.2, 0.2, 0.2, matrixTranslate(0, 3, -8)))));
   slabSphere(S. whitePlastic, mRoty(time * 0.4, mRotx(time * 0.5, mScale(0.2, 0.2, 0.2, matrixTranslate(0, -3, -8)))));
   sphere(S. greenPlastic, mRoty(time * 0.4, mRotx(time * 0.5, mScale(0.2, 0.2, 0.2, matrixTranslate(3, 3, -8)))));
   hyperboloid(S. whitePlastic, mRoty(Math.cos(time) * 0.2 + 1, mRotx(Math.sin(time) * 0.2 + 2, mScale(0.2, 0.2, 0.2, matrixTranslate(3, -3, -8)))));
   cube(S. redPlastic, mRoty(time * 0.4, mRotx(time * 0.5, mScale(0.2, 0.2, 0.2, matrixTranslate(-3, 3, -8)))));
   cube(S. whitePlastic, mRoty(time * 0.4, mRotx(time * 0.5, mScale(0.2, 0.2, 0.2, matrixTranslate(-3, -3, -8)))));

   octahedron(S. whitePlastic, mRoty(time * 0.4, mRotx(time * 0.5, mScale(0.2, 0.2, 0.2, matrixTranslate(3, 0, -15)))));
   tubeY(S. whitePlastic, mRoty(time * 0.4, mRotx(time * 0.5, mScale(0.2, 0.2, 0.2, matrixTranslate(-3, 0, -15)))));
   tubeX(S. greenPlastic, mRoty(time * 0.4, mRotx(time * 0.5, mScale(0.2, 0.2, 0.2, matrixTranslate(0, 3, -15)))));
   slabSphere(S. redPlastic, mRoty(time * 0.4, mRotx(time * 0.5, mScale(0.2, 0.2, 0.2, matrixTranslate(0, -3, -15)))));
   sphere(S. whitePlastic, mRoty(time * 0.4, mRotx(time * 0.5, mScale(0.2, 0.2, 0.2, matrixTranslate(3, 3, -15)))));
   hyperboloid(S. whitePlastic, mRoty(Math.cos(time) * 0.2 + 1, mRotx(Math.sin(time) * 0.2 + 2, mScale(0.2, 0.2, 0.2, matrixTranslate(3, -3, -15)))));
   cube(S. redPlastic, mRoty(time * 0.4, mRotx(time * 0.5, mScale(0.2, 0.2, 0.2, matrixTranslate(-3, 3, -15)))));
   cube(S. greenPlastic, mRoty(time * 0.4, mRotx(time * 0.5, mScale(0.2, 0.2, 0.2, matrixTranslate(-3, -3, -15)))));

   cube(S.redPlastic, mScale(40, 40, 40, matrixTranslate(0, 0, -60)));

   // SEND SCENE DATA TO GPU

   for (let n = 0 ; n < coefs.length ; n++) {
      let IM = matrixInverse(xform[n]);
      coefs[n] = matrixMultiply(matrixTranspose(IM), matrixMultiply(coefs[n], IM));
   }
   S.setUniform('1iv', 'uShape', shape);
   S.setUniform('Matrix4fv', 'uQ', false, coefs.flat());
   S.setUniform('Matrix4fv', 'uPhong', false, phong.flat());

   // DEFINE NUMBER OF QUADRIC SURFACES FOR GPU

   S.nQ = coefs.length;

   // RENDER THIS ANIMATION FRAME

   S.gl.drawArrays(S.gl.TRIANGLE_STRIP, 0, 4);

   // SET ANY HTML INFO

   iorInfo.innerHTML = 'index of refraction = ' + (ior * 100 >> 0) / 100;
`,
events: `
   ;
`
};

}


