
rooms.spline2D = function() {

lib2D();

description = 'Example of 2D<br>spline animation.';

code = {
'explanation': `
  S.html(\`
     A 2D canvas lets you create paths.
     <p>
     You can either
     draw <i>strokes</i> along those paths or else
     create solid shapes by <i>filling</i> those paths.
  \`);
`,
init: `
  S.x = 400;
  S.y = 400;

  S.keys = [
     {x:100, y:100, z:100},
     {x:200, y:100, z:0},
     {x:100, y:200, z:0},
     {x:200, y:200, z:0},
  ];
`,
assets: `
  S.line = (ax,ay,bx,by) => {
     S.context.beginPath();
     S.context.moveTo(ax,ay);
     S.context.lineTo(bx,by);
     S.context.stroke();
  }

  S.rect = (x,y,w,h) => {
     S.context.beginPath();
     S.context.rect(x,y,w,h);

     S.context.strokeStyle = 'white';
     S.context.stroke();

     if (S.isSpace) {
        S.context.fillStyle = 'gray';
        S.context.fill();
     }
  }

  let BezierMatrix = [
     -1, 3,-3, 1,
      3,-6, 3, 0,
     -3, 3, 0, 0,
      1, 0, 0, 0,
  ];

  let HermiteMatrix = [
      2,-3, 0, 1,
     -2, 3, 0, 0,
      1,-2, 1, 0,
      1,-1, 0, 0,
  ];

  let CatmullRomMatrix = [
     -1/2,  1  , -1/2, 0,
      3/2, -5/2,  0  , 1,
     -3/2,  2  ,  1/2, 0,
      1/2, -1/2,  0  , 0,
  ];

  let BSplineMatrix = [
     -1/6, 3/6,-3/6, 1/6,
      3/6,-6/6, 0/6, 4/6,
     -3/6, 3/6, 3/6, 1/6,
      1/6, 0/6, 0/6, 0/6,
  ];

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
	                   // eg:  a.x      b.x      c.x      d.x
     return value;
  }

  S.CatmullRomFunction = (keys, n, t) => {
     let mm = n => Math.max(0, Math.min(keys.length - 1, n));
     let a = keys[mm(n-1)];
     let b = keys[mm(n  )];
     let c = keys[mm(n+1)];
     let d = keys[mm(n+2)];
     return evalCubicSpline(CatmullRomMatrix, [a,b,c,d], t);
  }

  S.BSplineFunction = (keys, n, t) => {
     let mm = n => Math.max(0, Math.min(keys.length - 1, n));
     let a = keys[mm(n-1)];
     let b = keys[mm(n  )];
     let c = keys[mm(n+1)];
     let d = keys[mm(n+2)];
     return evalCubicSpline(BSplineMatrix, [a,b,c,d], t);
  }

  S.evalSpline = (keys, f, splineFunction) => {
     let T = Math.max(0, Math.min(.999, f)) * (keys.length - 1);
     let n = T >> 0;
     let t = T % 1;
     return splineFunction(keys, n, t);
  }
`,
render: `

  let c = S.context;

  c.lineWidth = 3;
  c.lineCap = 'round'; 

  // DRAW THE KEYS

  for (let n = 0 ; n < S.keys.length ; n++)
     S.rect(S.keys[n].x - 3, S.keys[n].y - 3, 6, 6);

  // DRAW THE SPLINE CURVE

  c.beginPath();
  for (let f = 0 ; f <= 1 ; f += 1/100) {
     let p = S.evalSpline(S.keys, f, S.BSplineFunction);
     c.lineTo(p.x, p.y);
  }
  c.stroke();

  // ANIMATE ALONG THE SPLINE CURVE

  let f = (time / 3) % 1;
  let p = S.evalSpline(S.keys, f, S.BSplineFunction);
  S.rect(p.x - 15, p.y - 15, 30, 30);
`,
events: `
  onPress = (x,y) => {

     // FIND WHAT KEY, IF ANY, IS AT THE CURSOR

     S.n = -1;
     S.dragged = false;
     for (let n = 0 ; n < S.keys.length ; n++)
        if ( x >= S.keys[n].x - 10 && x < S.keys[n].x + 10 &&
             y >= S.keys[n].y - 10 && y < S.keys[n].y + 10 )
           S.n = n; 
  }

  onDrag = (x,y) => {

     // DRAG ON A KEY TO MOVE IT

     S.dragged = true;
     if (S.n >= 0) {
        S.keys[S.n].x = x;
        S.keys[S.n].y = y;
     }
  }

  onRelease = (x,y) => {
     if (! S.dragged)

        // CLICK ON A KEY TO DELETE IT

        if (S.n >= 0)
           S.keys.splice(S.n, 1);

        // CLICK ON BACKGROUND TO APPEND A KEY

        else
           S.keys.push({x:x, y:y});
  }

  onKeyPress   = key => S.isSpace = key == 32;
  onKeyRelease = key => S.isSpace = false;
`
};

}

